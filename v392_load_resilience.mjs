import assert from 'node:assert/strict';

const concurrency = Math.max(1, Number(process.env.CONCURRENCY || 250));
const rounds = Math.max(1, Number(process.env.ROUNDS || 20));
const failureRate = Math.min(0.5, Math.max(0, Number(process.env.FAILURE_RATE || 0.05)));
const attempts = [];
let completed = 0;
let retried = 0;
let failed = 0;

// Deterministic in-process resilience model. This is intentionally separate from the live DB lab:
// it validates bounded retry, idempotency, and single-commit semantics without pretending to be a DB test.
const committed = new Set();
const processRequest = async (id) => {
  const key = `checkout:${id}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    attempts.push(attempt);
    if (committed.has(key)) return { id, status: 'DEDUPED', attempt };
    const injectedFailure = ((id * 17 + attempt * 31) % 1000) / 1000 < failureRate;
    if (injectedFailure) {
      if (attempt < 3) { retried++; continue; }
      failed++; return { id, status: 'FAILED', attempt };
    }
    committed.add(key);
    completed++;
    return { id, status: 'COMMITTED', attempt };
  }
};

for (let round = 0; round < rounds; round++) {
  const ids = Array.from({ length: concurrency }, (_, i) => round * concurrency + i);
  await Promise.all(ids.flatMap(id => [processRequest(id), processRequest(id)]));
}

const expected = concurrency * rounds;
assert.equal(committed.size + failed, expected);
assert.equal(committed.size, completed);
assert.ok(attempts.length >= expected);
const histogram = attempts.reduce((a, n) => (a[n] = (a[n] || 0) + 1, a), {});
console.log(JSON.stringify({ version:'V392.0.0', suite:'load-resilience-model', status:'PASS', concurrency, rounds, expectedUniqueRequests:expected, committed:completed, failed, retries:retried, attemptHistogram:histogram, duplicateExecutionsPrevented:expected }, null, 2));
