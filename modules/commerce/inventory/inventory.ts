import {getProduct} from '../repository/catalog';
export async function inventoryStatus(productId:string){const p=await getProduct(productId);if(!p)return null;return {productId:p.id,stock:p.stock,lowStock:p.stock<=10,outOfStock:p.stock===0};}
