export * from './contracts';
export * from './core';


export async function queueOrderStatusNotificationsTx(client: any, input: {orderId:string;customerId:string;status:string}) {
  const statuses: Record<string, {topic:string;title:string;body:string}> = {
    confirmed: {topic:'ORDER_STATUS', title:'Order confirmed', body:`Order ${input.orderId} was confirmed.`},
    processing: {topic:'ORDER_STATUS', title:'Order processing', body:`Order ${input.orderId} is being processed.`},
    shipped: {topic:'ORDER_STATUS', title:'Order shipped', body:`Order ${input.orderId} has shipped.`},
    delivered: {topic:'ORDER_STATUS', title:'Order delivered', body:`Order ${input.orderId} was delivered.`},
    cancelled: {topic:'ORDER_STATUS', title:'Order cancelled', body:`Order ${input.orderId} was cancelled.`},
  };
  const spec = statuses[input.status];
  if (!spec) return [];
  const result = await client.query(
    `insert into platform_notifications(id,recipient_id,channel,topic,title,body,dedupe_key,status) values(gen_random_uuid(),$1,'IN_APP',$2,$3,$4,$5,'QUEUED') on conflict(dedupe_key) do nothing returning *`,
    [input.customerId,spec.topic,spec.title,spec.body,`order:${input.orderId}:${spec.topic}:IN_APP`]
  );
  return result.rows;
}
