export type SellerPerformance = {
  merchantId: string;
  ordersTotal: number;
  ordersOnTime: number;
  cancellations: number;
  returns: number;
  defects: number;
  stockouts: number;
  ratingsCount: number;
  ratingAverage: number | null;
};

export type SellerTrust = SellerPerformance & {
  trustScore: number;
  confidence: number;
  components: { reliability:number; service:number; returns:number; quality:number; inventory:number; rating:number };
};

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const rate=(a:number,b:number,neutral=0.5)=>b>0?clamp(a/b):neutral;

export function calculateSellerTrust(p:SellerPerformance):SellerTrust {
  const sample=Math.max(p.ordersTotal,p.ratingsCount,0);
  const confidence=sample<=0?0:sample/(sample+20);
  const rating=p.ratingsCount>0?clamp((p.ratingAverage??0)/5):0.5;
  const reliability=rate(p.ordersOnTime,p.ordersTotal);
  const service=rate(p.ordersTotal-p.cancellations,p.ordersTotal);
  const returns=rate(p.ordersTotal-p.returns,p.ordersTotal);
  const quality=rate(p.ordersTotal-p.defects,p.ordersTotal);
  const inventory=rate(p.ordersTotal-p.stockouts,p.ordersTotal);
  const raw=rating*.20+reliability*.22+service*.18+returns*.14+quality*.14+inventory*.12;
  const trustScore=Math.round((50+(raw-.5)*100*confidence)*100)/100;
  return {...p,trustScore,confidence:Math.round(confidence*1000)/1000,components:{rating,reliability,service,returns,quality,inventory}};
}
