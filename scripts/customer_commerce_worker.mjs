import { runPrivacyWorker } from '../modules/customer-experience/worker.ts';
const limit=Number(process.env.CUSTOMER_WORKER_LIMIT??10);
runPrivacyWorker(limit).then(result=>{console.log(JSON.stringify({ok:true,surfaceStatus:'LIVE',result}));}).catch(error=>{console.error(JSON.stringify({ok:false,surfaceStatus:'ERROR',error:error instanceof Error?error.message:'WORKER_FAILURE'}));process.exit(1);});
