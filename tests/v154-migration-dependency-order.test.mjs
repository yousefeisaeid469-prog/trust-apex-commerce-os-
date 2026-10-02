import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function migrationFiles() {
  return fs.readdirSync('db/migrations')
    .filter(f => /^\d{3}_.+\.sql$/.test(f))
    .sort();
}

function createdTables() {
  const created = new Set();
  for (const f of migrationFiles()) {
    const text = fs.readFileSync(path.join('db/migrations', f), 'utf8');
    for (const m of text.matchAll(/create table(?: if not exists)?\s+(\w+)/gi)) created.add(m[1]);
  }
  return created;
}

function referencedTables() {
  const used = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(full); }
      else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const text = fs.readFileSync(full, 'utf8');
        for (const m of text.matchAll(/(?:from|into|update|join|table)\s+(trust_\w+)/gi)) used.add(m[1]);
      }
    }
  };
  walk('modules');
  walk('app');
  return used;
}

test('every trust_ table referenced in application code has a CREATE TABLE somewhere in migrations', () => {
  const created = createdTables();
  const used = referencedTables();
  const missing = [...used].filter(t => !created.has(t)).sort();
  assert.deepEqual(missing, [], `tables referenced in code but never created: ${missing.join(', ')}`);
});

test('no migration references a trust_ table before the migration that creates it', () => {
  const files = migrationFiles();
  const createdSoFar = new Set();
  const problems = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join('db/migrations', f), 'utf8');
    const lines = text.split('\n');
    for (const line of lines) {
      const stripped = line.trim();
      if (stripped.startsWith('--') || stripped === '') continue;
      const codeOnly = line.split('--')[0];
      const createMatch = codeOnly.match(/create table(?: if not exists)?\s+(\w+)/i);
      if (createMatch) createdSoFar.add(createMatch[1]);
      for (const m of codeOnly.matchAll(/(?:^|\s)(?:from|into|update|join|table|references)\s+(trust_\w+)\b/gi)) {
        const table = m[1];
        if (createMatch && createMatch[1] === table) continue;
        if (!createdSoFar.has(table)) {
          problems.push(`${f}: references "${table}" before it is created`);
        }
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});
