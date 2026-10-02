import {databaseConfigured} from '../modules/platform/db/postgres.ts';
const configured=databaseConfigured();
console.log(JSON.stringify({version:'V317.0.0',databaseConfigured:configured,liveExecution:configured,note:configured?'PostgreSQL is configured; fixture-backed execution can now be run with valid IDs.':'DATABASE_NOT_CONFIGURED — live PostgreSQL execution is SKIPPED.'},null,2));
