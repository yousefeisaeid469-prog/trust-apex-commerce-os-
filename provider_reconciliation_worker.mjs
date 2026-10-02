import {runReconciliationWorker,recoverExpiredGuardianActions} from '../modules/platform/provider-reconciliation/core.ts';
import {query} from '../modules/platform/db/postgres';
const limit=Number(process.env.PROVIDER_RECONCILIATION_BATCH||50);
const jobs=await runReconciliationWorker({query},limit);
const recovered=await recoverExpiredGuardianActions({query},limit);
console.log(JSON.stringify({ok:true,reconciled:jobs.length,recoveredGuardianActions:recovered.length},null,2));
