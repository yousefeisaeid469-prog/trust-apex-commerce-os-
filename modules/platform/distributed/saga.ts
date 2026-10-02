export type SagaStep = { id:string; execute:()=>Promise<void>|void; compensate?:()=>Promise<void>|void };
export type SagaResult = { ok:true; completed:string[] } | { ok:false; failed:string; compensated:string[] };

export async function runSaga(steps:readonly SagaStep[]): Promise<SagaResult> {
  const completed: SagaStep[] = [];
  try {
    for (const step of steps) { await step.execute(); completed.push(step); }
    return { ok:true, completed:completed.map(s=>s.id) };
  } catch (error) {
    const compensated:string[]=[];
    for (const step of completed.slice().reverse()) { if (!step.compensate) continue; await step.compensate(); compensated.push(step.id); }
    return { ok:false, failed:error instanceof Error ? error.message : 'UNKNOWN_FAILURE', compensated };
  }
}
