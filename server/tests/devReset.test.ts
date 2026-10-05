import { PrismaClient } from '@prisma/client';
import {
  DEV_RESET_CONFIRM_VALUE,
  DevResetRefused,
  adminSnapshot,
  assertIntendedAdmin,
  assertSafeToReset,
  preservedCounts,
  verifyAfterReset,
  wipeDevData,
} from '../scripts/lib/devReset.js';

const prisma = new PrismaClient();
jest.setTimeout(180000);

const LOCAL_URL = 'postgresql://postgres:secret@localhost:5432/zobra_db?schema=public';
const devEnv = (over: Record<string, string | undefined> = {}) =>
  ({ NODE_ENV: 'development', DEV_RESET_CONFIRM: DEV_RESET_CONFIRM_VALUE, DATABASE_URL: LOCAL_URL, ...over }) as NodeJS.ProcessEnv;

function refusal(env: NodeJS.ProcessEnv): string[] {
  try {
    assertSafeToReset(env);
  } catch (err) {
    if (err instanceof DevResetRefused) return err.problems;
    throw err;
  }
  return [];
}

afterAll(() => prisma.$disconnect());

describe('dev reset safety guards', () => {
  it('accepts the local development database', () => {
    expect(assertSafeToReset(devEnv())).toEqual({ host: 'localhost', port: '5432', database: 'zobra_db' });
    expect(assertSafeToReset(devEnv({ DATABASE_URL: 'postgresql://p:x@127.0.0.1:5433/zobra_dev' })).host).toBe('127.0.0.1');
  });

  it.each([
    ['production NODE_ENV', { NODE_ENV: 'production' }],
    ['staging NODE_ENV', { NODE_ENV: 'staging' }],
    ['test NODE_ENV', { NODE_ENV: 'test' }],
    ['missing confirmation', { DEV_RESET_CONFIRM: undefined }],
    ['wrong confirmation', { DEV_RESET_CONFIRM: 'yes' }],
    ['Railway database host', { DATABASE_URL: 'postgresql://u:p@containers-us-west-7.railway.app:6543/railway' }],
    ['Railway proxy host', { DATABASE_URL: 'postgresql://u:p@monorail.proxy.rlwy.net:12345/railway' }],
    ['Hostinger host', { DATABASE_URL: 'postgresql://u:p@srv123.hstgr.hostinger.com:5432/zobbra' }],
    ['api.zobbra.com host', { DATABASE_URL: 'postgresql://u:p@api.zobbra.com:5432/zobra_db' }],
    ['remote IP', { DATABASE_URL: 'postgresql://u:p@10.0.0.5:5432/zobra_db' }],
    ['local tunnel to a production DB', { DATABASE_URL: 'postgresql://u:p@localhost:5432/zobra_prod' }],
    ['local tunnel to a staging DB', { DATABASE_URL: 'postgresql://u:p@localhost:5432/zobra_staging' }],
    ['Railway environment variables', { RAILWAY_ENVIRONMENT: 'production' }],
    ['missing DATABASE_URL', { DATABASE_URL: undefined }],
    ['non-postgres URL', { DATABASE_URL: 'mysql://u:p@localhost:3306/zobra_db' }],
  ])('refuses: %s', (_label, over) => {
    expect(refusal(devEnv(over as Record<string, string | undefined>)).length).toBeGreaterThan(0);
  });

  it('does not treat the password as a host marker', () => {
    expect(refusal(devEnv({ DATABASE_URL: 'postgresql://postgres:prod-railway-pw@localhost:5432/zobra_db' }))).toEqual([]);
  });
});

describe('intended admin check', () => {
  it('stops when the intended admin is missing', async () => {
    await expect(assertIntendedAdmin(prisma, 'no-such-admin@zobra.test')).rejects.toThrow(/does not exist/);
  });

  it('stops when the account is not an admin or has no valid password hash', async () => {
    const email = `not-admin-${Date.now()}@reset.test`;
    const user = await prisma.user.create({ data: { email, name: 'Not admin', role: 'CUSTOMER' } });
    await expect(assertIntendedAdmin(prisma, email)).rejects.toThrow(/not an ADMIN/);
    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN', passwordHash: 'hash' } });
    await expect(assertIntendedAdmin(prisma, email)).rejects.toThrow(/no valid bcrypt password hash/);
    await prisma.user.delete({ where: { id: user.id } });
  });
});

describe('wipe (run inside a transaction that is always rolled back)', () => {
  it('removes customers and journey data, keeps ADMIN and master data', async () => {
    // Make sure there is something to wipe
    const email = `wipe-customer-${Date.now()}@reset.test`;
    const customer = await prisma.user.create({ data: { email, name: 'Wipe Me', role: 'CUSTOMER', phone: '+919811100000' } });
    await prisma.quote.create({
      data: {
        quoteNumber: `ZQB-RESET-${Date.now()}`,
        customerId: customer.id,
        validUntil: new Date(Date.now() + 86400000),
        subtotal: 100,
        gstTotal: 5,
        totalAmount: 105,
      },
    });

    const admins = await adminSnapshot(prisma);
    const preserved = await preservedCounts(prisma);
    const customersBefore = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    expect(admins.length).toBeGreaterThan(0);

    const ROLLBACK = new Error('rollback');
    let inside: any;
    await expect(
      prisma.$transaction(
        async (tx) => {
          const deleted = await wipeDevData(tx);
          const adminEmail = admins.find((a) => a.email)!.email!;
          await verifyAfterReset(tx, { admins, preserved }, adminEmail); // throws on any mismatch
          inside = {
            deleted,
            customers: await tx.user.count({ where: { role: 'CUSTOMER' } }),
            staff: await tx.user.count({ where: { role: { in: ['SALES', 'PRODUCTION'] } } }),
            quotes: await tx.quote.count(),
            admins: await adminSnapshot(tx),
            preserved: await preservedCounts(tx),
          };
          throw ROLLBACK;
        },
        { timeout: 120000, maxWait: 20000 }
      )
    ).rejects.toBe(ROLLBACK);

    // Customer wipe
    expect(inside.customers).toBe(0);
    expect(inside.staff).toBe(0);
    expect(inside.quotes).toBe(0);
    expect(inside.deleted['users (non-ADMIN)']).toBeGreaterThanOrEqual(customersBefore);
    // Admin preservation: same ids, emails and password hashes
    expect(inside.admins).toEqual(admins);
    // Catalog / master data untouched
    expect(inside.preserved).toEqual(preserved);

    // Rolled back: nothing actually deleted by this test
    expect(await prisma.user.count({ where: { role: 'CUSTOMER' } })).toBe(customersBefore);

    await prisma.quote.deleteMany({ where: { customerId: customer.id } });
    await prisma.user.delete({ where: { id: customer.id } });
  });
});
