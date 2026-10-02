import type { SqlExecutor } from '../../platform/persistence/postgres-boundary';
import { requiredId } from './contracts';

export type ReconciliationFinding = { code:string; severity:'INFO'|'WARNING'|'CRITICAL'; message:string; referenceId?:string };

export async function reconcileReturn(db: SqlExecutor, returnId: string) {
  const id = requiredId(returnId,'return_id');
  const findings: ReconciliationFinding[] = [];
  const [ret, items, actions, settlements, outcomes, credits, ledger] = await Promise.all([
    db.query<any>('select id,status,customer_id from trust_returns where id=$1',[id]),
    db.query<any>('select id,order_item_id,quantity from trust_return_items where return_id=$1',[id]),
    db.query<any>('select id,return_item_id,product_id,quantity,delta,status from trust_inventory_recovery_actions where return_id=$1',[id]),
    db.query<any>('select id,status,net_amount from trust_refund_settlements where return_id=$1',[id]),
    db.query<any>('select id,outcome,amount from trust_return_outcomes where return_id=$1',[id]),
    db.query<any>('select id,original_amount,remaining_amount,status from trust_store_credits where return_id=$1',[id]),
    db.query<any>(`select id,entry_type,direction,amount,status,reference_key from trust_financial_ledger_entries where return_id=$1`,[id]),
  ]);
  if (!ret.rows[0]) throw new Error('RETURN_NOT_FOUND');
  if (items.rows.length === 0) findings.push({code:'NO_RETURN_ITEMS',severity:'CRITICAL',message:'Return has no return items.'});
  const requested = items.rows.reduce((sum,row)=>sum+Number(row.quantity),0);
  const recovered = actions.filter((row:any)=>row.status==='APPLIED').reduce((sum,row)=>sum+Number(row.quantity),0);
  if (recovered > requested) findings.push({code:'RECOVERY_OVERAGE',severity:'CRITICAL',message:'Recovery quantity exceeds requested return quantity.'});
  const activeSettlements = settlements.filter((row:any)=>['REQUESTED','SETTLED'].includes(row.status));
  if (activeSettlements.length > 1) findings.push({code:'MULTIPLE_SETTLEMENTS',severity:'WARNING',message:'More than one active refund settlement exists.'});
  const refundOutcome = outcomes.find((row:any)=>row.outcome==='REFUND');
  const replacementOutcome = outcomes.find((row:any)=>row.outcome==='REPLACEMENT');
  const creditOutcome = outcomes.find((row:any)=>row.outcome==='STORE_CREDIT');
  if (refundOutcome && replacementOutcome) findings.push({code:'MULTIPLE_VALUE_OUTCOMES',severity:'CRITICAL',message:'Refund and replacement outcomes coexist without a compensating policy record.'});
  if (refundOutcome && creditOutcome) findings.push({code:'REFUND_AND_CREDIT',severity:'CRITICAL',message:'Refund and store-credit outcomes coexist.'});
  const ledgerCredits = ledger.filter((row:any)=>row.direction==='CREDIT' && row.status==='POSTED').reduce((sum,row)=>sum+Number(row.amount),0);
  const ledgerDebits = ledger.filter((row:any)=>row.direction==='DEBIT' && row.status==='POSTED').reduce((sum,row)=>sum+Number(row.amount),0);
  if (ledgerDebits > ledgerCredits && !['CLOSED','REJECTED'].includes(ret.rows[0].status)) findings.push({code:'NEGATIVE_RETURN_LEDGER',severity:'WARNING',message:'Return ledger has more posted debits than credits.'});
  for (const credit of credits) if (Number(credit.remaining_amount) > Number(credit.original_amount)) findings.push({code:'CREDIT_BALANCE_OVERFLOW',severity:'CRITICAL',message:'Store credit remaining balance exceeds original amount.',referenceId:credit.id});
  const critical = findings.filter(x=>x.severity==='CRITICAL').length;
  const warnings = findings.filter(x=>x.severity==='WARNING').length;
  return { returnId:id, status:ret.rows[0].status, requestedUnits:requested, recoveredUnits:recovered, ledgerCredits, ledgerDebits, findings, coherent:critical===0, severity:critical>0?'CRITICAL':warnings>0?'WARNING':'INFO' as const };
}

export async function reconcileAllOpenReturns(db: SqlExecutor, limit=100) {
  const n=Math.min(Math.max(Number(limit)||100,1),500);
  const returns=await db.query<any>(`select id from trust_returns where status not in ('CLOSED','REJECTED') order by updated_at asc limit $1`,[n]);
  const reports=[]; for(const row of returns.rows){try{reports.push(await reconcileReturn(db,row.id));}catch(error){reports.push({returnId:row.id,coherent:false,severity:'CRITICAL',findings:[{code:'RECONCILIATION_FAILED',severity:'CRITICAL',message:error instanceof Error?error.message:String(error)}]});}}
  return {count:reports.length,critical:reports.filter((r:any)=>r.severity==='CRITICAL').length,warnings:reports.filter((r:any)=>r.severity==='WARNING').length,reports};
}
