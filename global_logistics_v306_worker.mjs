const {runGlobalLogisticsExecution}=await import('../modules/platform/global-logistics-v306/runtime.ts');
const limit=Number(process.argv[2]??25);
console.log(JSON.stringify(await runGlobalLogisticsExecution(limit),null,2));
