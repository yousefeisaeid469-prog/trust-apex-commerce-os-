import {ProductionBootstrap} from '../modules/platform/production-bootstrap/bootstrap.ts';
import {HttpBootstrapProbes} from '../modules/platform/production-bootstrap/probes.ts';
const env=process.env;const required=['postgres','kubernetes','traffic','telemetry'];
const config={databaseUrl:env.DATABASE_URL||'postgres://trust:local@localhost:5432/trust',kubernetesApi:env.TRUST_KUBERNETES_API||'http://127.0.0.1:8080/readyz',trafficApi:env.TRUST_TRAFFIC_API||'http://127.0.0.1:8090/health',otlpEndpoint:env.TRUST_OTLP_ENDPOINT||'http://127.0.0.1:4318/v1/logs',telemetryHealthUrl:env.TRUST_TELEMETRY_HEALTH_URL||'http://127.0.0.1:4318',requireTls:env.TRUST_REQUIRE_TLS==='true',requiredComponents:required};
const r=await new ProductionBootstrap(config,new HttpBootstrapProbes(config)).run();console.log(JSON.stringify(r,null,2));if(!r.ready)process.exit(1);
