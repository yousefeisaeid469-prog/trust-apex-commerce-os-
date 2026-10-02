import { query } from '../db/postgres.ts';
import { captureCommerceOperationsSnapshot, type OperationsIncident, type OperationsState } from './operations-brain.ts';

export type CommandCenterSeverity = 'INFO' | 'DEGRADED' | 'CRITICAL';
export type CommandCenterRootCause = {
  code: string;
  severity: CommandCenterSeverity;
  domain: 'PUBLISHER' | 'CONSUMERS' | 'EXECUTION' | 'DATABASE' | 'UNKNOWN';
  evidence: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  safeNextAction: string;
};

export type CommerceCommandCenter = {
  state: OperationsState;
  observedAt: string;
  pipeline: {
    outboxReady: number;
    durableEvents: number;
    consumerPending: number;
    consumerProcessing: number;
    consumerRetrying: number;
    consumerDead: number;
    executionPending: number;
    executionProcessing: number;
    executionDead: number;
  };
  workers: {
    publisher: { state: string; heartbeatAt: string | null; lastSuccessAt: string | null };
    consumers: { state: string; unhealthy: number };
    execution: { state: string; heartbeatAt: string | null; lastSuccessAt: string | null };
  };
  incidents: OperationsIncident[];
  rootCauses: CommandCenterRootCause[];
  recoveryPlan: Array<{ priority: number; action: string; reason: string; automatic: boolean }>;
  recentFailures: Array<{ domain: string; code: string | null; occurredAt: string; count: number }>;
};

function causeFromIncident(incident: OperationsIncident): CommandCenterRootCause {
  const evidence = [`incident=${incident.code}`, `count=${incident.count}`];
  switch (incident.code) {
    case 'PUBLISHER_NOT_DRAINING':
      return { code: 'PUBLISHER_STALLED', severity: 'CRITICAL', domain: 'PUBLISHER', evidence, confidence: 'HIGH', safeNextAction: 'Start or restore the canonical commerce event publisher worker.' };
    case 'PUBLISHER_DEAD_EVENTS':
      return { code: 'PUBLISHER_POISON_EVENTS', severity: 'CRITICAL', domain: 'PUBLISHER', evidence, confidence: 'HIGH', safeNextAction: 'Inspect dead publisher events before replaying them.' };
    case 'CONSUMER_MESH_DEGRADED':
      return { code: 'CONSUMER_MESH_UNHEALTHY', severity: incident.severity, domain: 'CONSUMERS', evidence, confidence: 'HIGH', safeNextAction: 'Inspect consumer heartbeats/retries and run the canonical consumer worker.' };
    case 'STALE_CONSUMER_DELIVERIES':
      return { code: 'CONSUMER_LEASE_STALE', severity: 'CRITICAL', domain: 'CONSUMERS', evidence, confidence: 'HIGH', safeNextAction: 'Reclaim expired delivery leases, then let the canonical consumer worker retry them.' };
    case 'EXECUTION_NOT_DRAINING':
      return { code: 'EXECUTION_WORKER_STALLED', severity: 'CRITICAL', domain: 'EXECUTION', evidence, confidence: 'HIGH', safeNextAction: 'Start or restore the canonical commerce execution worker.' };
    case 'EXECUTION_DEAD_JOBS':
      return { code: 'EXECUTION_POISON_JOBS', severity: 'CRITICAL', domain: 'EXECUTION', evidence, confidence: 'HIGH', safeNextAction: 'Inspect dead execution jobs and their attempt records before replay.' };
    case 'PUBLISHER_HEARTBEAT_MISSING':
      return { code: 'PUBLISHER_HEARTBEAT_MISSING', severity: 'CRITICAL', domain: 'PUBLISHER', evidence, confidence: 'MEDIUM', safeNextAction: 'Verify database connectivity and start the publisher worker.' };
    case 'EXECUTION_HEARTBEAT_MISSING':
      return { code: 'EXECUTION_HEARTBEAT_MISSING', severity: 'CRITICAL', domain: 'EXECUTION', evidence, confidence: 'MEDIUM', safeNextAction: 'Verify database connectivity and start the execution worker.' };
    default:
      return { code: 'UNCLASSIFIED_COMMERCE_INCIDENT', severity: incident.severity, domain: incident.domain, evidence, confidence: 'LOW', safeNextAction: 'Inspect the incident evidence before taking a destructive action.' };
  }
}

async function recentFailureSignals() {
  const [publisher, execution, consumers] = await Promise.all([
    query<any>(`select 'PUBLISHER' domain,last_error code,coalesce(last_failure_at,last_finished_at,updated_at) occurred_at,1 count from trust_commerce_event_publisher_heartbeat where singleton=true and last_error is not null`),
    query<any>(`select 'EXECUTION' domain,last_error_code code,coalesce(last_failure_at,last_finished_at,updated_at) occurred_at,1 count from trust_commerce_worker_heartbeat where singleton=true and last_error_code is not null`),
    query<any>(`select 'CONSUMER' domain,consumer_id code,coalesce(last_failure_at,updated_at) occurred_at,last_failed::int count from trust_commerce_consumer_heartbeat where last_error is not null order by updated_at desc limit 20`),
  ]);
  return [...publisher.rows, ...execution.rows, ...consumers.rows]
    .filter(r => r.occurred_at)
    .map(r => ({ domain: String(r.domain), code: r.code == null ? null : String(r.code), occurredAt: new Date(String(r.occurred_at)).toISOString(), count: Number(r.count || 0) }))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 20);
}

export async function observeCommerceCommandCenter(): Promise<CommerceCommandCenter> {
  const observation = await captureCommerceOperationsSnapshot();
  const [durableEvents, failures] = await Promise.all([
    query<any>(`select count(*)::int count from trust_commerce_events where occurred_at >= now()-interval '24 hours'`),
    recentFailureSignals(),
  ]);

  const rootCauses = observation.incidents.map(causeFromIncident);
  const recoveryPlan = rootCauses
    .map((cause, index) => ({
      priority: index + 1,
      action: cause.safeNextAction,
      reason: cause.evidence.join('; '),
      automatic: cause.code === 'CONSUMER_LEASE_STALE',
    }))
    .slice(0, 10);

  return {
    state: observation.state,
    observedAt: observation.observedAt,
    pipeline: {
      outboxReady: observation.metrics.readyOutboxCount,
      durableEvents: Number(durableEvents.rows[0]?.count || 0),
      consumerPending: observation.metrics.consumerPendingCount,
      consumerProcessing: observation.metrics.consumerProcessingCount,
      consumerRetrying: observation.metrics.consumerRetryingCount,
      consumerDead: observation.metrics.consumerDeadLetterCount,
      executionPending: observation.metrics.executionPendingCount,
      executionProcessing: observation.metrics.executionProcessingCount,
      executionDead: observation.metrics.executionDeadCount,
    },
    workers: {
      publisher: {
        state: observation.publisherState,
        heartbeatAt: observation.publisherHeartbeatAt,
        lastSuccessAt: observation.publisherLastSuccessAt,
      },
      consumers: {
        state: observation.consumerState,
        unhealthy: observation.consumers.filter(c => c.state !== 'HEALTHY').length,
      },
      execution: {
        state: observation.executionState,
        heartbeatAt: observation.executionHeartbeatAt,
        lastSuccessAt: observation.executionLastSuccessAt,
      },
    },
    incidents: observation.incidents,
    rootCauses,
    recoveryPlan,
    recentFailures: failures,
  };
}

export async function captureCommerceCommandCenterSnapshot() {
  const center = await observeCommerceCommandCenter();
  await query(
    `insert into trust_commerce_command_center_snapshots(state,pipeline,workers,incidents,root_causes,recovery_plan,recent_failures)
     values($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb)`,
    [center.state, JSON.stringify(center.pipeline), JSON.stringify(center.workers), JSON.stringify(center.incidents), JSON.stringify(center.rootCauses), JSON.stringify(center.recoveryPlan), JSON.stringify(center.recentFailures)],
  );
  return center;
}
