export type PerformanceBudget = { firstContentfulPaintMs:number; interactionToNextPaintMs:number; largestContentfulPaintMs:number };

export const DEFAULT_EXPERIENCE_BUDGET: PerformanceBudget = {
  firstContentfulPaintMs: 1800,
  interactionToNextPaintMs: 200,
  largestContentfulPaintMs: 2500,
};

export function withinPerformanceBudget(value:number,budget:number):boolean{
  return Number.isFinite(value) && value >= 0 && value <= budget;
}

export function shouldDeferBelowFold(isIntersecting:boolean):boolean{
  return !isIntersecting;
}
