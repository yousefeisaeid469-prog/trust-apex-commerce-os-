export type RewardEvent='view'|'wishlist'|'poll'|'share'|'referral';
const weights:Record<RewardEvent,number>={view:1,wishlist:8,poll:5,share:4,referral:20};
export function rewardFor(event:RewardEvent,eligible=true){return eligible?weights[event]:0}
export function capDaily(points:number){return Math.max(0,Math.min(points,100))}
