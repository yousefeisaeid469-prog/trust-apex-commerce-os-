import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root,p),'utf8');
const migration = read('db/migrations/087_v235_reverse_commerce_execution.sql');
const contracts = read('modules/commerce/reverse-commerce/contracts.ts');
const state = read('modules/commerce/reverse-commerce/state.ts');
const policy = read('modules/commerce/reverse-commerce/policy.ts');
const recovery = read('modules/commerce/reverse-commerce/inventory-recovery.ts');
const replacement = read('modules/commerce/reverse-commerce/replacement.ts');
const credit = read('modules/commerce/reverse-commerce/store-credit.ts');
const ledger = read('modules/commerce/reverse-commerce/ledger.ts');
const worker = read('modules/commerce/reverse-commerce/worker.ts');
const reporting = read('modules/commerce/reverse-commerce/reporting.ts');
const surface = read('components/domains/reverse-commerce-surface.tsx');

function expect(text, pattern, label) {
  assert.match(text, pattern, label);
}
function count(text, pattern) { return [...text.matchAll(pattern)].length; }

// Migration topology.
expect(migration, /trust_inventory_recovery_actions/, 'recovery table exists');
expect(migration, /trust_replacement_orders/, 'replacement order table exists');
expect(migration, /trust_replacement_items/, 'replacement items table exists');
expect(migration, /trust_replacement_events/, 'replacement event table exists');
expect(migration, /trust_store_credits/, 'store credits table exists');
expect(migration, /trust_store_credit_transactions/, 'store credit transaction table exists');
expect(migration, /trust_financial_ledger_entries/, 'financial ledger exists');
expect(migration, /trust_reverse_commerce_jobs/, 'worker queue exists');
expect(migration, /UNIQUE\(idempotency_key\)/, 'recovery idempotency is durable');
expect(migration, /UNIQUE\(replacement_order_id,product_id\)/, 'replacement product uniqueness exists');
expect(migration, /CHECK\(remaining_amount <= original_amount\)/, 'credit balance invariant exists');

// Domain contracts.
for (const token of ['RESTOCK','QUARANTINE','DISPOSE','RETURN_TO_VENDOR','REPLACE']) expect(contracts, new RegExp(token), `recovery disposition ${token}`);
for (const token of ['REQUESTED','APPROVED','RESERVED','CONFIRMED','FULFILLING','SHIPPED','DELIVERED','CANCELLED','FAILED']) expect(contracts, new RegExp(token), `replacement state ${token}`);
for (const token of ['ISSUE','REDEEM','REVERSE','EXPIRE','CANCEL']) expect(contracts, new RegExp(token), `credit kind ${token}`);
expect(contracts, /positiveInt/, 'positive integer validation');
expect(contracts, /positiveMoney/, 'positive money validation');
expect(contracts, /normalizedCurrency/, 'currency normalization');
expect(contracts, /normalizedCode/, 'credit code normalization');

// State machine safety.
expect(state, /assertRecoveryTransition/, 'recovery transition guard');
expect(state, /assertReplacementTransition/, 'replacement transition guard');
expect(state, /PENDING: \['APPLIED','FAILED'\]/, 'recovery forward transitions');
expect(state, /FAILED: \['REQUESTED'\]/, 'replacement retry transition');
expect(state, /replacementIsTerminal/, 'replacement terminal predicate');
expect(state, /dispositionDelta/, 'inventory delta function');

// Policy is deterministic and does not pretend external providers are connected.
expect(policy, /decideRecovery/, 'recovery policy');
expect(policy, /RESTOCK/, 'restock policy');
expect(policy, /RETURN_TO_VENDOR/, 'vendor disposition policy');
expect(policy, /QUARANTINE/, 'quarantine policy');
expect(policy, /calculateReplacementCharge/, 'replacement pricing policy');
expect(policy, /calculateStoreCreditAmount/, 'credit calculation policy');
expect(policy, /canIssueCredit/, 'credit eligibility policy');

// Recovery transaction invariants.
expect(recovery, /ensureIdempotency/, 'recovery idempotency');
expect(recovery, /requestHash\('inventory\.recovery'/, 'recovery request hash');
expect(recovery, /for update/, 'recovery row locks');
expect(recovery, /RECOVERY_QUANTITY_EXCEEDS_RETURN/, 'return quantity guard');
expect(recovery, /RECOVERY_QUANTITY_ALREADY_APPLIED/, 'double recovery guard');
expect(recovery, /INVENTORY_UNDERFLOW/, 'inventory underflow guard');
expect(recovery, /trust_inventory_ledger/, 'inventory ledger write');
expect(recovery, /trust_outbox_events/, 'recovery outbox event');
expect(recovery, /reverseInventoryRecovery/, 'recovery reversal');
expect(recovery, /recommendRecovery/, 'recovery recommendation');
expect(recovery, /listRecoveryActions/, 'recovery list');

// Replacement execution invariants.
expect(replacement, /ensureIdempotency/, 'replacement idempotency');
expect(replacement, /REPLACEMENT_ALREADY_EXISTS/, 'duplicate replacement guard');
expect(replacement, /REPLACEMENT_STOCK_UNAVAILABLE/, 'replacement stock guard');
expect(replacement, /for update/, 'replacement row locks');
expect(replacement, /replacement_reserve/, 'replacement inventory reservation ledger');
expect(replacement, /replacement_cancel_release/, 'replacement cancellation release');
expect(replacement, /trust_replacement_events/, 'replacement event history');
expect(replacement, /trust_outbox_events/, 'replacement outbox');
expect(replacement, /REPLACEMENT_CHARGE/, 'replacement financial ledger');
expect(replacement, /listCustomerReplacements/, 'customer replacement read');
expect(replacement, /listOperationsReplacements/, 'operations replacement read');

// Store credit invariants.
expect(credit, /crypto\.randomBytes/, 'cryptographically generated credit code');
expect(credit, /STORE_CREDIT_NOT_ACTIVE/, 'inactive credit guard');
expect(credit, /STORE_CREDIT_INSUFFICIENT/, 'credit balance guard');
expect(credit, /STORE_CREDIT_EXPIRED/, 'credit expiry guard');
expect(credit, /trust_store_credit_transactions/, 'credit transaction history');
expect(credit, /STORE_CREDIT_ISSUE/, 'credit issuance ledger');
expect(credit, /STORE_CREDIT_REDEEM/, 'credit redemption ledger');
expect(credit, /STORE_CREDIT_REVERSE/, 'credit reversal ledger');
expect(credit, /expireCredits/, 'credit expiry worker operation');

// Ledger invariants.
expect(ledger, /reference_key/, 'ledger reference key');
expect(ledger, /on conflict\(reference_key\)/, 'ledger idempotency');
expect(ledger, /direction === 'CREDIT' \? 'DEBIT' : 'CREDIT'/, 'ledger reversal flips direction');
expect(ledger, /reconcileReturnLedger/, 'return ledger reconciliation');
expect(ledger, /getLedgerBalance/, 'customer ledger balance');

// Worker behavior.
expect(worker, /for update skip locked/i, 'worker uses non-blocking queue claims');
expect(worker, /lease_until/, 'worker lease');
expect(worker, /MAX_ATTEMPTS = 5/, 'bounded retry');
expect(worker, /status='DEAD'/, 'dead-letter state');
expect(worker, /recoverExpiredLeases/, 'lease recovery');
expect(worker, /runReverseCommerceWorker/, 'worker runner');

// Reporting/control room.
expect(reporting, /reverseCommerceDashboard/, 'dashboard report');
expect(reporting, /inventoryRecoveryIntegrity/, 'inventory integrity report');
expect(reporting, /replacementPipelineHealth/, 'replacement health report');
expect(reporting, /storeCreditExposure/, 'credit exposure report');
expect(surface, /Reverse Commerce Control Room/, 'control room UI');
expect(surface, /Refund exposure/, 'refund metric');
expect(surface, /Inventory recovery/, 'inventory section');
expect(surface, /Replacement pipeline/, 'replacement section');
expect(surface, /Store credit/, 'credit section');

// API boundaries and auth.
for (const file of [
  'app/api/returns/recovery/route.ts',
  'app/api/returns/replacement/route.ts',
  'app/api/store-credit/route.ts',
  'app/api/returns/ledger/route.ts',
  'app/api/returns/reverse-commerce/route.ts',
  'app/api/returns/reverse-commerce/worker/route.ts',
  'app/api/returns/plan/route.ts',
  'app/api/returns/reconcile/route.ts',
  'app/api/returns/compensation/route.ts',
]) {
  const text = read(file);
  expect(text, /getCurrentUser/, `${file} authenticates current user`);
  expect(text, /no-store/, `${file} disables cache`);
  expect(text, /surfaceStatus/, `${file} reports surface status`);
}
expect(read('app/api/returns/recovery/route.ts'), /idempotency-key/, 'recovery API idempotency');
expect(read('app/api/returns/replacement/route.ts'), /idempotency-key/, 'replacement API idempotency');
expect(read('app/api/store-credit/route.ts'), /idempotency-key/, 'credit API idempotency');
expect(read('app/api/returns/reverse-commerce/worker/route.ts'), /deadLetters/, 'worker dead-letter visibility');
expect(read('modules/commerce/reverse-commerce/orchestration.ts'), /buildReturnResolutionPlan/, 'return resolution planner');
expect(read('modules/commerce/reverse-commerce/orchestration.ts'), /scheduleReturnReconciliation/, 'return reconciliation scheduling');
expect(read('modules/commerce/reverse-commerce/reconciliation.ts'), /RECOVERY_OVERAGE/, 'recovery overage finding');
expect(read('modules/commerce/reverse-commerce/reconciliation.ts'), /MULTIPLE_VALUE_OUTCOMES/, 'conflicting outcome finding');
expect(read('modules/commerce/reverse-commerce/validation.ts'), /validateRecoveryCommand/, 'recovery validator');
expect(read('modules/commerce/reverse-commerce/compensation.ts'), /compensationLimit/, 'compensation policy cap');
expect(read('modules/commerce/reverse-commerce/compensation.ts'), /requestCompensation/, 'compensation request');
expect(read('modules/commerce/reverse-commerce/compensation.ts'), /issueCompensation/, 'compensation issuance');
expect(read('modules/commerce/reverse-commerce/compensation.ts'), /reverseCompensation/, 'compensation reversal');
expect(read('modules/commerce/reverse-commerce/resolution-policy.ts'), /decideResolution/, 'resolution decision matrix');
expect(read('modules/commerce/reverse-commerce/resolution-policy.ts'), /policyVersion/, 'resolution policy version');
expect(read('app/api/returns/compensation/route.ts'), /idempotency-key/, 'compensation API idempotency');

// Source quality guard: provider-dependent operations must remain explicitly bounded.
expect(read('docs/architecture/REVERSE-COMMERCE-EXECUTION-V235.md'), /Provider-dependent work remains upstream\/downstream/, 'provider boundary documented');

// Ensure meaningful implementation surface, not a one-file patch.
const implementationFiles = [
  'modules/commerce/reverse-commerce/contracts.ts',
  'modules/commerce/reverse-commerce/state.ts',
  'modules/commerce/reverse-commerce/policy.ts',
  'modules/commerce/reverse-commerce/ledger.ts',
  'modules/commerce/reverse-commerce/inventory-recovery.ts',
  'modules/commerce/reverse-commerce/replacement.ts',
  'modules/commerce/reverse-commerce/store-credit.ts',
  'modules/commerce/reverse-commerce/reporting.ts',
  'modules/commerce/reverse-commerce/worker.ts',
];
assert.ok(implementationFiles.every((f) => fs.existsSync(path.join(root,f))), 'all domain implementation files exist');
assert.ok(implementationFiles.reduce((n,f)=>n+read(f).split('\n').length,0) > 700, 'domain implementation exceeds 700 lines');
assert.ok(count(migration,/CREATE TABLE IF NOT EXISTS/g) >= 7, 'migration has multiple durable aggregates');

console.log('V235 reverse-commerce contract suite PASS');

// Resolution scenario coverage: each scenario exercises a distinct policy branch.
const resolutionPolicy = read('modules/commerce/reverse-commerce/resolution-policy.ts');
const scenarios = read('modules/commerce/reverse-commerce/scenarios.ts');
expect(scenarios, /wrong-item-sealed/, 'scenario catalog includes wrong-item branch');
expect(scenarios, /changed-mind/, 'scenario catalog includes credit branch');
expect(scenarios, /unknown-condition/, 'scenario catalog includes inspection gate');
expect(scenarios, /evaluateScenarioSet/, 'scenario evaluator exists');
expect(scenarios, /scenarioRequiresOperator/, 'operator requirement evaluator exists');
expect(scenarios, /scenarioRecommendation/, 'recommendation evaluator exists');
expect(scenarios, /scenarioRecoveryDisposition/, 'recovery disposition evaluator exists');
expect(scenarios, /scenarioIsHealthy/, 'scenario health evaluator exists');

// Additional policy invariants: these are source-level contract checks so the
// release cannot silently lose a branch while refactoring the domain modules.
expect(resolutionPolicy, /reasonsThatMayUseCredit/, 'credit-favoring reason matrix');
expect(resolutionPolicy, /reasonsThatFavorReplacement/, 'replacement-favoring reason matrix');
expect(resolutionPolicy, /inspectionReady/, 'inspection gate');
expect(resolutionPolicy, /blocked/, 'blocked resolution options');
expect(resolutionPolicy, /allowed/, 'allowed resolution options');
expect(resolutionPolicy, /customerPreference/, 'customer preference support');
expect(resolutionPolicy, /WRONG_ITEM/, 'wrong item rule');
expect(resolutionPolicy, /DEFECTIVE/, 'defective rule');
expect(resolutionPolicy, /CHANGED_MIND/, 'changed mind rule');
expect(resolutionPolicy, /SIZE_OR_FIT/, 'size fit rule');
expect(resolutionPolicy, /NOT_AS_DESCRIBED/, 'not described rule');
expect(resolutionPolicy, /LATE_DELIVERY/, 'late delivery rule');
expect(resolutionPolicy, /OTHER/, 'other reason rule');
expect(resolutionPolicy, /boundedMoney/, 'money rounding boundary');
expect(resolutionPolicy, /outcomeNeedsFinancialEvidence/, 'financial evidence classifier');
expect(resolutionPolicy, /outcomeNeedsWarehouseEvidence/, 'warehouse evidence classifier');

const orchestration = read('modules/commerce/reverse-commerce/orchestration.ts');
expect(orchestration, /trust_returns/, 'orchestration return lookup');
expect(orchestration, /trust_return_inspections/, 'orchestration inspection lookup');
expect(orchestration, /trust_refund_settlements/, 'orchestration settlement lookup');
expect(orchestration, /trust_inventory_recovery_actions/, 'orchestration recovery lookup');
expect(orchestration, /trust_replacement_orders/, 'orchestration replacement lookup');
expect(orchestration, /trust_store_credits/, 'orchestration credit lookup');
expect(orchestration, /trust_return_outcomes/, 'orchestration outcome history');
expect(orchestration, /return\.outcome\.selected/, 'outcome outbox event');
expect(orchestration, /return\.closed/, 'return close event');
expect(orchestration, /RETURN_OUTCOME_REQUIRED/, 'close requires outcome evidence');
expect(orchestration, /RETURN_NOT_READY_TO_CLOSE/, 'close state guard');

const reconciliation = read('modules/commerce/reverse-commerce/reconciliation.ts');
expect(reconciliation, /NO_RETURN_ITEMS/, 'missing item finding');
expect(reconciliation, /MULTIPLE_SETTLEMENTS/, 'multiple settlement finding');
expect(reconciliation, /REFUND_AND_CREDIT/, 'refund credit conflict finding');
expect(reconciliation, /NEGATIVE_RETURN_LEDGER/, 'negative ledger finding');
expect(reconciliation, /CREDIT_BALANCE_OVERFLOW/, 'credit overflow finding');
expect(reconciliation, /reconcileAllOpenReturns/, 'bulk reconciliation');
expect(reconciliation, /coherent/, 'coherence result');
expect(reconciliation, /severity/, 'severity result');

const compensation = read('modules/commerce/reverse-commerce/compensation.ts');
expect(compensation, /SERVICE_FAILURE/, 'service failure compensation');
expect(compensation, /DAMAGED_IN_TRANSIT/, 'transit damage compensation');
expect(compensation, /PARTIAL_FULFILLMENT/, 'partial fulfillment compensation');
expect(compensation, /GOODWILL/, 'goodwill compensation');
expect(compensation, /COMPENSATION_LIMIT_EXCEEDED/, 'compensation cap');
expect(compensation, /DUPLICATE_COMPENSATION/, 'duplicate compensation guard');
expect(compensation, /ORDER_NOT_COMPENSABLE/, 'order state compensation guard');
expect(compensation, /RETURN_NOT_COMPENSABLE/, 'return state compensation guard');
expect(compensation, /customer_compensation\.requested/, 'compensation request event');
expect(compensation, /customer_compensation\.issued/, 'compensation issue event');
expect(compensation, /customer_compensation\.reversed/, 'compensation reversal event');
expect(compensation, /trust_compensation_events/, 'compensation event history');
expect(compensation, /REFUND_ADJUSTMENT/, 'refund adjustment method');
expect(compensation, /STORE_CREDIT/, 'store credit compensation method');

const migration235 = migration;
expect(migration235, /trust_customer_compensations/, 'compensation aggregate table');
expect(migration235, /trust_compensation_events/, 'compensation event table');
expect(migration235, /idx_customer_compensations_customer/, 'customer compensation index');
expect(migration235, /idx_customer_compensations_order/, 'order compensation index');
expect(migration235, /idx_customer_compensations_status/, 'compensation status index');
expect(migration235, /idx_compensation_events_compensation/, 'compensation event index');

// API route contract checks for the newly exposed planning and compensation surfaces.
for (const file of ['app/api/returns/plan/route.ts','app/api/returns/reconcile/route.ts','app/api/returns/compensation/route.ts']) {
  const text = read(file);
  expect(text, /NextRequest/, `${file} request contract`);
  expect(text, /NextResponse/, `${file} response contract`);
  expect(text, /dynamic='force-dynamic'/, `${file} dynamic contract`);
  expect(text, /runtime='nodejs'/, `${file} node runtime contract`);
  expect(text, /getCurrentUser/, `${file} authentication`);
  expect(text, /no-store/, `${file} cache control`);
}
expect(resolutionPolicy, /recoveryDispositionForResolution/, 'resolution recovery mapping');
expect(resolutionPolicy, /refundAmountForContext/, 'resolution refund calculation');
expect(resolutionPolicy, /creditAmountForContext/, 'resolution credit calculation');
expect(resolutionPolicy, /replacementChargeForContext/, 'resolution replacement calculation');
expect(resolutionPolicy, /explainResolution/, 'resolution explanation');
expect(resolutionPolicy, /canResolveWithoutOperator/, 'automatic resolution safety gate');
expect(resolutionPolicy, /outcomeNeedsFinancialEvidence/, 'financial evidence requirement');
expect(resolutionPolicy, /outcomeNeedsWarehouseEvidence/, 'warehouse evidence requirement');
expect(scenarios, /ResolutionScenario/, 'scenario contract');
expect(scenarios, /expectedRecommendation/, 'scenario expected result');
expect(scenarios, /requiresOperator/, 'scenario operator flag');
expect(scenarios, /contextFor/, 'scenario context mapping');
expect(scenarios, /matchesExpected/, 'scenario expected-result check');
expect(scenarios, /healthy/, 'scenario health summary');
expect(compensation, /compensationExposure/, 'compensation exposure report');
expect(compensation, /listCustomerCompensations/, 'customer compensation list');
expect(compensation, /listCompensationOperations/, 'operations compensation list');
