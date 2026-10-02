import { runExecutionMeshOnce } from '../modules/platform/global-commerce-automation/execution-mesh.ts';
const workerId=process.env.TRUST_EXECUTION_MESH_WORKER_ID||`mesh-worker-${process.pid}`;
const once=await runExecutionMeshOnce(workerId);
console.log(JSON.stringify(once));
