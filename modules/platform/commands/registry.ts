import { adjustInventoryTransactionTx } from '../../commerce/inventory/transaction-engine.ts';
import { startWorkflowTx, registerWorkflow } from '../workflow-orchestrator.ts';
import { startCapturedOrderExecutionTx, completeDeliveredOrderExecutionTx } from '../../commerce/core/order-execution.ts';
import type { PoolClient } from 'pg';

type Context = { tx: PoolClient; command: { id:string; commandType:string; aggregateId:string; payload:Record<string,unknown>; actorId?:string|null } };
type Handler = (context: Context) => Promise<unknown>;

const inventoryAdjustment: Handler = async ({tx,command}) => {
  const p=command.payload;
  const productId=String(p.productId ?? command.aggregateId);
  const delta=Number(p.delta);
  if (!productId || !Number.isInteger(delta) || delta===0) throw new Error('INVALID_INVENTORY_ADJUSTMENT_COMMAND');
  return adjustInventoryTransactionTx(tx,{
    productId,
    offerId: typeof p.offerId==='string'?p.offerId:undefined,
    locationId: typeof p.locationId==='string'?p.locationId:undefined,
    orderId: typeof p.orderId==='string'?p.orderId:undefined,
    fulfillmentOrderId: typeof p.fulfillmentOrderId==='string'?p.fulfillmentOrderId:undefined,
    quantity: Math.abs(delta),
    delta,
    idempotencyKey:`command:${command.id}`,
    source:'v404-command-bus',
    metadata:{...(typeof p.metadata==='object'&&p.metadata? p.metadata as Record<string,unknown>:{}),actorId:command.actorId ?? null,commandId:command.id},
    transactionType:p.transactionType==='RETURN'?'RETURN':'ADJUSTMENT',
  });
};


const startCommerceWorkflow: Handler = async ({tx,command}) => {
  const p=command.payload; const workflowType=String(p.workflowType??'');
  const aggregateType=String(p.aggregateType??'order'); const aggregateId=String(p.aggregateId??command.aggregateId);
  const input=typeof p.input==='object'&&p.input?p.input as Record<string,unknown>:{};
  let definition:any=null;
  if(workflowType==='inventory-safe-adjustment'){
    definition={type:workflowType,aggregateType:'inventory',steps:[{key:'adjust',commandType:String(p.action==='return'?'inventory.return':'inventory.adjust'),payload:{...(typeof p.commandPayload==='object'&&p.commandPayload?p.commandPayload as Record<string,unknown>:{}),productId:String(input.productId??aggregateId)}}]};
  } else if(workflowType==='order-journey'){
    const orderId=String(input.orderId??aggregateId),paymentId=String(input.paymentId??'');
    if(!paymentId)throw new Error('ORDER_JOURNEY_PAYMENT_ID_REQUIRED');
    definition={type:workflowType,aggregateType:'order',steps:[
      {key:'start-execution',commandType:'commerce.order.start-execution',payload:{orderId,paymentId}},
      {key:'await-delivery',stepType:'WAIT_FOR_EVENT',waitEventType:'commerce.order.delivered',waitEventKey:`order:${orderId}`},
      {key:'complete-delivery',commandType:'commerce.order.complete-delivery',payload:{orderId}}
    ]};
  }
  if(!definition)throw new Error('WORKFLOW_TYPE_NOT_REGISTERED'); registerWorkflow(definition);
  return startWorkflowTx(tx,{tenantId:typeof p.tenantId==='string'?p.tenantId:'default',workflowType,aggregateType,aggregateId,input,correlationId:command.id,causationId:command.id,idempotencyKey:`command:${command.id}`});
};
const startOrderExecution: Handler = async ({tx,command}) => { const p=command.payload; return startCapturedOrderExecutionTx(tx,{orderId:String(p.orderId??command.aggregateId),paymentId:String(p.paymentId??''),idempotencyKey:`workflow-command:${command.id}`}); };
const completeOrderDelivery: Handler = async ({tx,command}) => { const p=command.payload; const orderId=String(p.orderId??command.aggregateId); let shipmentId=String(p.shipmentId??''); if(!shipmentId){ const row=(await tx.query<any>(`select id from trust_shipments where order_id=$1 and status='DELIVERED' order by updated_at desc,id desc limit 1`,[orderId])).rows[0]; shipmentId=row?.id?String(row.id):''; } if(!shipmentId)throw new Error('ORDER_DELIVERY_SHIPMENT_ID_REQUIRED'); return completeDeliveredOrderExecutionTx(tx,{orderId,shipmentId,triggerKey:`workflow-command:${command.id}`}); };


const handlers = new Map<string,Handler>([['inventory.adjust',inventoryAdjustment],['inventory.return',inventoryAdjustment],['workflow.start',startCommerceWorkflow],['commerce.order.start-execution',startOrderExecution],['commerce.order.complete-delivery',completeOrderDelivery]]);
export function commandHandler(commandType:string){ return handlers.get(commandType); }
export function registeredCommandTypes(){ return [...handlers.keys()]; }
