import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * LOCAL DEVELOPMENT data reset — guards, wipe and verification.
 *
 * Wipes every user-generated / customer-journey record and every non-ADMIN user,
 * and keeps ADMIN users, the catalog, pricing, coupons (definitions), CMS content,
 * system settings, the schema and migrations. Never uses `prisma migrate reset`.
 *
 * Order follows the actual database foreign keys (inspected, not guessed), including
 * three legacy tables present in the local DB but not in schema.prisma.
 */

export const DEV_RESET_CONFIRM_VALUE = 'RESET_ZOBBRA_DEV';
export const DEFAULT_ADMIN_EMAIL = 'admin@zobra.test';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
// Any of these in host / database / user means "not my laptop" → refuse.
const FORBIDDEN_MARKERS = [
  'railway', 'rlwy', 'hostinger', 'zobbra.com', 'zobra.com', 'prod', 'staging',
  'amazonaws', 'neon.tech', 'supabase', 'render.com', 'azure', 'gcp', 'cloudsql',
];
const RAILWAY_ENV_KEYS = ['RAILWAY_ENVIRONMENT', 'RAILWAY_ENVIRONMENT_NAME', 'RAILWAY_PROJECT_ID', 'RAILWAY_SERVICE_ID'];

export interface ResetTarget {
  host: string;
  port: string;
  database: string;
}

export class DevResetRefused extends Error {
  constructor(public readonly problems: string[]) {
    super(`Refusing to reset:\n  - ${problems.join('\n  - ')}`);
    this.name = 'DevResetRefused';
  }
}

/** Throws DevResetRefused unless this is clearly the local development database. */
export function assertSafeToReset(env: NodeJS.ProcessEnv): ResetTarget {
  const problems: string[] = [];

  if (env.NODE_ENV !== 'development') {
    problems.push(`NODE_ENV must be "development" (got "${env.NODE_ENV ?? ''}")`);
  }
  if (env.DEV_RESET_CONFIRM !== DEV_RESET_CONFIRM_VALUE) {
    problems.push(`DEV_RESET_CONFIRM must be set to ${DEV_RESET_CONFIRM_VALUE}`);
  }
  for (const key of RAILWAY_ENV_KEYS) {
    if (env[key]) problems.push(`${key} is set — refusing to run on Railway`);
  }

  let target: ResetTarget = { host: '', port: '', database: '' };
  const raw = env.DATABASE_URL;
  if (!raw) {
    problems.push('DATABASE_URL is not set');
  } else {
    try {
      const url = new URL(raw);
      target = {
        host: url.hostname.toLowerCase(),
        port: url.port || '5432',
        database: decodeURIComponent(url.pathname.replace(/^\//, '')),
      };
      if (!/^postgres(ql)?:$/.test(url.protocol)) problems.push(`unexpected database protocol ${url.protocol}`);
      if (!LOCAL_HOSTS.has(target.host)) problems.push(`database host "${target.host}" is not local`);
      // Inspect everything except the password
      const inspected = `${url.hostname} ${url.username} ${target.database} ${url.search}`.toLowerCase();
      for (const marker of FORBIDDEN_MARKERS) {
        if (inspected.includes(marker)) problems.push(`database URL mentions "${marker}"`);
      }
    } catch {
      problems.push('DATABASE_URL is not a valid URL');
    }
  }

  if (problems.length) throw new DevResetRefused(problems);
  return target;
}

type Db = PrismaClient | Prisma.TransactionClient;

/** The admin that must survive; stop if it is missing or cannot log in. */
export async function assertIntendedAdmin(db: Db, email: string, password?: string) {
  const admin = await db.user.findUnique({ where: { email } });
  if (!admin) throw new Error(`Intended admin ${email} does not exist — stopping.`);
  if (admin.role !== 'ADMIN') throw new Error(`${email} is not an ADMIN (role ${admin.role}) — stopping.`);
  if (!admin.isActive) throw new Error(`Admin ${email} is deactivated — stopping.`);
  if (!admin.passwordHash || !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(admin.passwordHash)) {
    throw new Error(`Admin ${email} has no valid bcrypt password hash — stopping (it could not log in).`);
  }
  if (password !== undefined && !(await bcrypt.compare(password, admin.passwordHash))) {
    throw new Error(`DEV_RESET_ADMIN_PASSWORD does not match ${email} — stopping.`);
  }
  return admin;
}

/** Master data that must be identical before and after. */
export async function preservedCounts(db: Db) {
  return {
    categories: await db.category.count(),
    products: await db.product.count(),
    productVariants: await db.productVariant.count(),
    bulkPricings: await db.bulkPricing.count(),
    coupons: await db.coupon.count(),
    cmsContents: await db.cMSContent.count(),
    systemSettings: await db.systemSetting.count(),
  };
}

export async function adminSnapshot(db: Db) {
  return db.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, passwordHash: true, isActive: true },
    orderBy: { id: 'asc' },
  });
}

/** Rows that the wipe will remove (for the pre-run summary). */
export async function wipeCandidates(db: Db) {
  return {
    'users (CUSTOMER)': await db.user.count({ where: { role: 'CUSTOMER' } }),
    'users (SALES/PRODUCTION, disabled roles)': await db.user.count({ where: { role: { in: ['SALES', 'PRODUCTION'] } } }),
    companies: await db.company.count(),
    otp_challenges: await db.otpChallenge.count(),
    inquiries: await db.inquiry.count(),
    quotes: await db.quote.count(),
    orders: await db.order.count(),
    invoices: await db.invoice.count(),
    payments: await db.payment.count(),
    tasks: await db.task.count(),
    coupon_usages: await db.couponUsage.count(),
    system_activities: await db.systemActivity.count(),
  };
}

async function tableExists(db: Db, table: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT to_regclass('public."${table}"') IS NOT NULL AS "exists"`
  );
  return Boolean(rows[0]?.exists);
}

/**
 * Delete customer/journey data in foreign-key order. Run inside a transaction.
 * Returns the number of rows removed per table.
 */
export async function wipeDevData(tx: Prisma.TransactionClient): Promise<Record<string, number>> {
  const deleted: Record<string, number> = {};
  const run = async (name: string, op: Promise<{ count: number }>) => {
    deleted[name] = (await op).count;
  };

  // Legacy tables that exist in the local DB but not in schema.prisma
  // (design_versions → design_drafts/orders/quotes; design_drafts → users/products).
  for (const table of ['design_versions', 'design_drafts', 'otp_verifications']) {
    if (await tableExists(tx, table)) {
      deleted[table] = await tx.$executeRawUnsafe(`DELETE FROM "${table}"`);
    }
  }

  await run('otp_challenges', tx.otpChallenge.deleteMany({}));
  await run('tasks', tx.task.deleteMany({})); // createdById → users is RESTRICT
  await run('coupon_usages', tx.couponUsage.deleteMany({}));
  // Coupon definitions are master data; only their usage counters are reset.
  await run('coupons.usageCount reset', tx.coupon.updateMany({ where: { usageCount: { not: 0 } }, data: { usageCount: 0 } }));

  // Orders and everything hanging off them (invoices → orders is RESTRICT)
  await run('invoices', tx.invoice.deleteMany({}));
  await run('dispatches', tx.dispatch.deleteMany({}));
  await run('production_jobs', tx.productionJob.deleteMany({}));
  await run('payments', tx.payment.deleteMany({}));
  await run('order_item_variants', tx.orderItemVariant.deleteMany({}));
  await run('order_items', tx.orderItem.deleteMany({}));
  await run('orders', tx.order.deleteMany({}));

  // Inquiries (inquiries.quoteId → quotes)
  await run('inquiry_activities', tx.inquiryActivity.deleteMany({}));
  await run('inquiry_variants', tx.inquiryVariant.deleteMany({}));
  await run('inquiries', tx.inquiry.deleteMany({}));

  // Quotes (quotes.customerId → users is RESTRICT)
  await run('quote_activities', tx.quoteActivity.deleteMany({}));
  await run('quote_item_variants', tx.quoteItemVariant.deleteMany({}));
  await run('quote_items', tx.quoteItem.deleteMany({}));
  await run('quotes', tx.quote.deleteMany({}));

  // Customer-linked testimonials; standalone (admin-authored) ones are kept
  await run(
    'testimonials (customer-linked)',
    tx.testimonial.deleteMany({ where: { OR: [{ customerId: { not: null } }, { companyId: { not: null } }] } })
  );
  await run('system_activities', tx.systemActivity.deleteMany({}));

  // Every non-ADMIN user (CUSTOMER plus the disabled SALES/PRODUCTION roles)
  await run('users (non-ADMIN)', tx.user.deleteMany({ where: { role: { not: 'ADMIN' } } }));
  // Companies no remaining (admin) user belongs to
  await run('companies', tx.company.deleteMany({ where: { users: { none: {} } } }));

  return deleted;
}

/** Throws (rolling back the transaction) unless the reset left exactly what it should. */
export async function verifyAfterReset(
  db: Db,
  before: { admins: Awaited<ReturnType<typeof adminSnapshot>>; preserved: Awaited<ReturnType<typeof preservedCounts>> },
  adminEmail: string
) {
  const failures: string[] = [];

  const nonAdmins = await db.user.count({ where: { role: { not: 'ADMIN' } } });
  if (nonAdmins !== 0) failures.push(`${nonAdmins} non-ADMIN users remain`);
  for (const [name, count] of Object.entries({
    quotes: await db.quote.count(),
    orders: await db.order.count(),
    inquiries: await db.inquiry.count(),
    otp_challenges: await db.otpChallenge.count(),
  })) {
    if (count !== 0) failures.push(`${count} ${name} remain`);
  }

  const admins = await adminSnapshot(db);
  if (JSON.stringify(admins) !== JSON.stringify(before.admins)) failures.push('ADMIN users changed');
  if (!admins.some((a) => a.email === adminEmail)) failures.push(`intended admin ${adminEmail} missing`);

  const preserved = await preservedCounts(db);
  for (const key of Object.keys(preserved) as (keyof typeof preserved)[]) {
    if (preserved[key] !== before.preserved[key]) {
      failures.push(`${key} changed: ${before.preserved[key]} → ${preserved[key]}`);
    }
  }

  if (failures.length) throw new Error(`Post-reset verification failed:\n  - ${failures.join('\n  - ')}`);
  return { admins: admins.length, preserved };
}
