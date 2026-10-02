import {createServer} from 'node:http';
import {HttpBootstrapProbes} from '../modules/platform/production-bootstrap/probes.ts';
import {ProductionBootstrap} from '../modules/platform/production-bootstrap/bootstrap.ts';
const server=createServer((req,res)=>{res.statusCode=200;res.setHeader('content-type','application/json');res.end(JSON.stringify({healthy:true,ready:true}))});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;const config={databaseUrl:'postgres://trust:local@localhost:5432/trust',kubernetesApi:`http://127.0.0.1:${port}/readyz`,trafficApi:`http://127.0.0.1:${port}/health`,otlpEndpoint:`http://127.0.0.1:${port}/v1/logs`,telemetryHealthUrl:`http://127.0.0.1:${port}/health`,requireTls:false,requiredComponents:['postgres','kubernetes','traffic','telemetry']};
const report=await new ProductionBootstrap(config,new HttpBootstrapProbes(config)).run();await new Promise(r=>server.close(r));console.log(JSON.stringify(report,null,2));if(!report.ready)process.exit(1);
