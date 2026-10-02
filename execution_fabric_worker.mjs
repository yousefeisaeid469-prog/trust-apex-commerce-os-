import { runExecutionFabricOnce } from '../modules/platform/global-commerce-automation/execution-fabric.ts';
const workerId=process.env.EXECUTION_FABRIC_WORKER_ID||`fabric-worker-${process.pid}`;
const result=await runExecutionFabricOnce(workerId);
console.log(JSON.stringify(result));
