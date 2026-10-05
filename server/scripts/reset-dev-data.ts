/**
 * Reset LOCAL DEVELOPMENT user/business data for a fresh customer journey.
 *
 *   PowerShell:  $env:DEV_RESET_CONFIRM='RESET_ZOBBRA_DEV'; pnpm --filter zobra-server db:reset-dev
 *   bash:        DEV_RESET_CONFIRM=RESET_ZOBBRA_DEV pnpm --filter zobra-server db:reset-dev
 *   Preview:     add `-- --dry-run` (nothing is deleted)
 *
 * Refuses unless NODE_ENV=development, the database host is local, no Railway
 * variables are present and DEV_RESET_CONFIRM=RESET_ZOBBRA_DEV. Keeps ADMIN users,
 * catalog, pricing, coupons, CMS and settings. Optional:
 *   DEV_RESET_ADMIN_EMAIL     admin that must exist and survive (default admin@zobra.test)
 *   DEV_RESET_ADMIN_PASSWORD  also check that admin's password before deleting anything
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_ADMIN_EMAIL,
  DevResetRefused,
  adminSnapshot,
  assertIntendedAdmin,
  assertSafeToReset,
  preservedCounts,
  verifyAfterReset,
  wipeCandidates,
  wipeDevData,
} from './lib/devReset.js';

dotenv.config(); // server/.env (does not override variables already set in the shell)

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const target = assertSafeToReset(
    dryRun ? { ...process.env, DEV_RESET_CONFIRM: process.env.DEV_RESET_CONFIRM || 'RESET_ZOBBRA_DEV' } : process.env
  );
  console.log(`\nTarget database: host=${target.host} port=${target.port} database=${target.database}`);

  const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  try {
    const adminEmail = process.env.DEV_RESET_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
    await assertIntendedAdmin(prisma, adminEmail, process.env.DEV_RESET_ADMIN_PASSWORD);

    const admins = await adminSnapshot(prisma);
    const preserved = await preservedCounts(prisma);
    console.log(`\nPreserved ADMIN users (${admins.length}):`);
    for (const a of admins) console.log(`  - ${a.email ?? '(no email)'}  id=${a.id}${a.email === adminEmail ? '  ← intended admin' : ''}`);
    console.log('\nPreserved master data:', preserved);
    console.log('\nWill delete:', await wipeCandidates(prisma));

    if (dryRun) {
      console.log('\n--dry-run: nothing was deleted.');
      return;
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const deleted = await wipeDevData(tx);
        const verified = await verifyAfterReset(tx, { admins, preserved }, adminEmail);
        return { deleted, verified };
      },
      { timeout: 120_000, maxWait: 10_000 }
    );

    console.log('\nDeleted rows:', result.deleted);
    console.log(`\n✅ Reset complete. ${result.verified.admins} ADMIN user(s) intact, 0 customers, master data unchanged.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof DevResetRefused ? `\n❌ ${err.message}` : `\n❌ Reset failed (nothing was committed): ${err.message}`);
  process.exit(1);
});
