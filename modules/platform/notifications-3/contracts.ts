export type NotificationChannel = 'IN_APP'|'EMAIL'|'SMS'|'WHATSAPP';
export type NotificationTopic = 'ORDER_CONFIRMED'|'ORDER_PROCESSING'|'ORDER_SHIPPED'|'ORDER_DELIVERED'|'ORDER_CANCELLED'|'ORDER_REFUNDED'|'DELIVERY_ATTENTION';
export type NotificationStatus = 'QUEUED'|'PROCESSING'|'SENT'|'FAILED'|'SUPPRESSED';
export type NotificationPreference = { customerId:string; channel:NotificationChannel; topic:NotificationTopic; enabled:boolean };
export type NotificationRecord = { id:string; recipientId:string; channel:NotificationChannel; topic:NotificationTopic; title:string; body:string; dedupeKey:string; status:NotificationStatus; createdAt:string; sentAt?:string; lastError?:string };
export type DeliveryResult = { status:'SENT'|'FAILED'; providerReference?:string; reason?:string };
export type NotificationAdapter = { channel:Exclude<NotificationChannel,'IN_APP'>; send(input:{notification:NotificationRecord; destination:string}):Promise<DeliveryResult> };

const topicMap:Record<string,{topic:NotificationTopic;title:string;body:(orderId:string)=>string}> = {confirmed:{topic:'ORDER_CONFIRMED',title:'تم تأكيد طلبك',body:id=>`طلبك #${id} اتأكد بنجاح.`},processing:{topic:'ORDER_PROCESSING',title:'طلبك قيد التجهيز',body:id=>`طلبك #${id} دخل مرحلة التجهيز.`},shipped:{topic:'ORDER_SHIPPED',title:'طلبك اتشحن',body:id=>`طلبك #${id} خرج للشحن.`},delivered:{topic:'ORDER_DELIVERED',title:'تم تسليم طلبك',body:id=>`طلبك #${id} اتسلم بنجاح.`},cancelled:{topic:'ORDER_CANCELLED',title:'تم إلغاء الطلب',body:id=>`طلبك #${id} اتلغى.`},refunded:{topic:'ORDER_REFUNDED',title:'تم استرداد المبلغ',body:id=>`تم تسجيل استرداد مبلغ طلب #${id}.`}};
export function notificationForOrderStatus(status:string,orderId:string){return topicMap[status]?{...topicMap[status],orderId}:null;}
export function buildDedupeKey(orderId:string,topic:NotificationTopic,channel:NotificationChannel){return `order:${orderId}:${topic}:${channel}`;}
export function allowedTopic(topic:string):topic is NotificationTopic{return ['ORDER_CONFIRMED','ORDER_PROCESSING','ORDER_SHIPPED','ORDER_DELIVERED','ORDER_CANCELLED','ORDER_REFUNDED','DELIVERY_ATTENTION'].includes(topic);}
