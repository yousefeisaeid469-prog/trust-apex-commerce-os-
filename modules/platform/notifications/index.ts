export type NotificationChannel='IN_APP'|'EMAIL'|'SMS'|'PUSH';
export type NotificationPreference={customerId:string;channel:NotificationChannel;topic:string;enabled:boolean};
export type Notification={id:string;recipientId:string;channel:NotificationChannel;topic:string;title:string;body:string;dedupeKey:string;status:'QUEUED'|'SENT'|'SUPPRESSED';createdAt:string};
const notifications:Notification[]=[];const preferences:NotificationPreference[]=[];const id=()=>globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function setPreference(p:NotificationPreference){const i=preferences.findIndex(x=>x.customerId===p.customerId&&x.channel===p.channel&&x.topic===p.topic);if(i>=0)preferences[i]=p;else preferences.push(p);return p}
export function queueNotification(input:Omit<Notification,'id'|'createdAt'|'status'>){if(notifications.some(n=>n.dedupeKey===input.dedupeKey))return notifications.find(n=>n.dedupeKey===input.dedupeKey)!;const n:Notification={...input,id:id(),createdAt:new Date().toISOString(),status:'QUEUED'};notifications.unshift(n);return n}
export function notificationSnapshot(){return {notifications:notifications.slice(0,100),preferences}}
