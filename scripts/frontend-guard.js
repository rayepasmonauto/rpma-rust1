#!/usr/bin/env node
/**
 * frontend-guard.js
 *
 * Garde-fou frontend : TypeScript, ESLint (strict) et Jest.
 * Tous les checks tournent ; un résumé clair est affiché en fin.
 *
 * Usage :
 *   node scripts/frontend-guard.js
 *   npm run frontend:guard
 *
 * Exit codes :
 *   0 – tous les checks passent
 *   1 – au moins un check échoue
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

const C = {
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  bold:   '\x1b[1m',
  reset:  '\x1b[0m',
};

function runCheck(label, cmd, args) {
  console.log(`\n${C.bold}── ${label} ${'─'.repeat(Math.max(0, 50 - label.length))}${C.reset}`);

  const result = spawnSync(cmd, args, {
    cwd: FRONTEND_DIR,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const passed = result.status === 0;
  if (passed) {
    console.log(`  ${C.green}✓ PASSED${C.reset}`);
  } else {
    console.log(`  ${C.red}✗ FAILED${C.reset}`);
  }
  return { label, passed };
}

const results = [
  runCheck('TypeScript', 'npx', ['tsc', '--noEmit']),
  runCheck('ESLint (--max-warnings 0)', 'npx', [
    'eslint', '.', '--ext', '.ts,.tsx', '--max-warnings', '0',
  ]),
  runCheck('Jest', 'npx', [
    'jest', '--coverage', '--watchAll=false', '--passWithNoTests',
  ]),
];

console.log(`\n${'═'.repeat(55)}`);

const failed = results.filter((r) => !r.passed);

if (failed.length === 0) {
  console.log(`${C.green}${C.bold}All frontend checks PASSED ✓${C.reset}`);
  process.exit(0);
} else {
  console.log(`${C.red}${C.bold}Frontend guard FAILED ✗${C.reset}`);
  failed.forEach((r) => console.log(`  ${C.red}✗${C.reset} ${r.label}`));
  process.exit(1);
}
