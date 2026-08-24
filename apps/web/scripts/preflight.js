#!/usr/bin/env node
/**
 * ZOBBRA Cypress Preflight Check
 * Verifies that both services are running before Cypress starts.
 *
 * Usage:
 *   node scripts/preflight.js
 */

const http = require('http');

const TIMEOUT_MS = 3000;

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: TIMEOUT_MS }, (res) => {
      resolve({ ok: res.statusCode < 500, status: res.statusCode, url });
    });
    req.on('error', () => resolve({ ok: false, status: 'ECONNREFUSED', url }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 'TIMEOUT', url });
    });
  });
}

async function main() {
  const checks = [
    { label: 'Next.js Frontend', url: 'http://localhost:3000' },
    { label: 'Express API Health', url: 'http://localhost:5000/health' },
  ];

  console.log('\n🔍 ZOBBRA Preflight Check\n');

  let allOk = true;
  for (const check of checks) {
    const result = await checkUrl(check.url);
    const icon = result.ok ? '✅' : '❌';
    console.log(`  ${icon}  ${check.label.padEnd(25)} ${check.url}  [${result.status}]`);
    if (!result.ok) allOk = false;
  }

  console.log('');

  if (allOk) {
    console.log('✅ ZOBBRA TEST ENVIRONMENT READY — you may now run Cypress.\n');
    process.exit(0);
  } else {
    console.log('❌ ZOBBRA TEST ENVIRONMENT NOT READY\n');
    console.log('Fix guide:');
    console.log('  1. Start PostgreSQL    →  docker-compose up -d  (from C:\\Zobra)');
    console.log('  2. Start Express API   →  cd C:\\Zobra\\server && pnpm dev');
    console.log('  3. Start Next.js       →  cd C:\\Zobra\\apps\\web  && pnpm dev');
    console.log('  4. Re-run preflight   →  node apps/web/scripts/preflight.js\n');
    process.exit(1);
  }
}

main();
