export type Money={amount:number;currency:'EGP'};
export type Product={id:string;name:string;category:string;price:number;oldPrice?:number;merchantId:string;merchantName:string;rating:number;stock:number;region:string;tags:string[];image:string};
export type CartItem={productId:string;quantity:number;unitPrice:number};
export type Cart={id:string;customerId?:string;items:CartItem[]};
export type OrderStatus='pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled';
export type Order={id:string;customerId?:string;items:CartItem[];subtotal:number;shipping:number;total:number;currency:'EGP';status:OrderStatus;createdAt:string};
