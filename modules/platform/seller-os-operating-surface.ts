import { query, databaseConfigured } from './db/postgres';

export type SellerOperatingSurface = {
  merchantId:string;
  status:string;
  catalog:{products:number;activeProducts:number;outOfStock:number;lowStock:number;stockUnits:number};
  inventory:{skus:number;outOfStock:number;reorderAlerts:number;availableUnits:number;reservedUnits:number};
  orders:{total:number;open:number;shipped:number;delivered:number;exceptions:number;grossValue:number};
  fulfillment:{total:number;open:number;exceptions:number;delivered:number};
  finance:{orders:number;healthy:number;exceptions:number;sellerOrderValue:number;released:number;refunded:number;payoutAllocated:number};
};

const n=(v:unknown)=>Number(v??0);

export async function getSellerOperatingSurface(merchantId:string):Promise<SellerOperatingSurface>{
  if(!databaseConfigured()) throw new Error('DATABASE_NOT_CONFIGURED');
  const r=await query<any>(`select * from trust_global_seller_operating_truth where merchant_id=$1`,[merchantId]);
  const x=r.rows[0];
  if(!x) return {merchantId,status:'NO_DATA',catalog:{products:0,activeProducts:0,outOfStock:0,lowStock:0,stockUnits:0},inventory:{skus:0,outOfStock:0,reorderAlerts:0,availableUnits:0,reservedUnits:0},orders:{total:0,open:0,shipped:0,delivered:0,exceptions:0,grossValue:0},fulfillment:{total:0,open:0,exceptions:0,delivered:0},finance:{orders:0,healthy:0,exceptions:0,sellerOrderValue:0,released:0,refunded:0,payoutAllocated:0}};
  return {
    merchantId,
    status:String(x.operating_status),
    catalog:{products:n(x.product_count),activeProducts:n(x.active_product_count),outOfStock:n(x.catalog_out_of_stock),lowStock:n(x.catalog_low_stock),stockUnits:n(x.catalog_stock_units)},
    inventory:{skus:n(x.inventory_sku_count),outOfStock:n(x.inventory_out_of_stock),reorderAlerts:n(x.inventory_reorder_alerts),availableUnits:n(x.available_inventory_units),reservedUnits:n(x.reserved_inventory_units)},
    orders:{total:n(x.seller_order_count),open:n(x.open_order_count),shipped:n(x.shipped_order_count),delivered:n(x.delivered_order_count),exceptions:n(x.exception_order_count),grossValue:n(x.gross_seller_order_value)},
    fulfillment:{total:n(x.fulfillment_count),open:n(x.fulfillment_open_count),exceptions:n(x.fulfillment_exception_count),delivered:n(x.fulfillment_delivered_count)},
    finance:{orders:n(x.financial_order_count),healthy:n(x.financial_ok_count),exceptions:n(x.financial_exception_count),sellerOrderValue:n(x.financial_seller_order_value),released:n(x.released_amount),refunded:n(x.allocated_refunded_amount),payoutAllocated:n(x.payout_allocated)},
  };
}
