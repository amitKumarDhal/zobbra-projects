import { defineConfig } from "cypress";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

/**
 * E2E session adapter (test runner only — nothing here ships in the app).
 *
 * Only ADMIN signs in with email + password; CUSTOMER uses WhatsApp OTP,
 * which cannot be completed in an automated run. Many specs still create or sign
 * in customers with email/password fixtures, so these tasks issue the same
 * JWT the API issues after OTP, signed with the LOCAL server JWT_SECRET — exactly
 * what server/tests do with jwt.sign(). Refuses to run against a non-local database.
 */
function readEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const repoRoot = path.resolve(__dirname, "../..");
const serverEnv = {
  ...readEnvFile(path.join(repoRoot, ".env")),
  ...readEnvFile(path.join(repoRoot, "server/.env")),
};

let prisma: PrismaClient | null = null;
function db(): PrismaClient {
  const url = serverEnv.DATABASE_URL || "";
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
    throw new Error("E2E session adapter only runs against a local database.");
  }
  if (!serverEnv.JWT_SECRET) throw new Error("JWT_SECRET missing from server/.env");
  prisma ??= new PrismaClient({ datasources: { db: { url } } });
  return prisma;
}

function signJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ ...payload, iat: now, exp: now + 8 * 3600 })}`;
  const sig = crypto.createHmac("sha256", serverEnv.JWT_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

interface SessionUser {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  role: string;
  companyId: string | null;
  company?: unknown;
}

function sessionFor(user: SessionUser) {
  return {
    token: signJwt({ id: user.id, email: user.email, role: user.role, companyId: user.companyId }),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      company: user.company ?? null,
    },
  };
}

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    chromeWebSecurity: false,
    setupNodeEvents(on) {
      on("task", {
        /** Session for an existing CUSTOMER (stands in for a completed OTP sign-in). */
        async e2eSessionForEmail({ email }: { email?: string }) {
          if (!email) return null;
          const user = await db().user.findUnique({
            where: { email: String(email).trim().toLowerCase() },
            include: { company: true },
          });
          // Only CUSTOMER can sign in by OTP (SALES/PRODUCTION are disabled roles)
          if (!user || user.role !== "CUSTOMER" || !user.isActive) return null;
          return sessionFor(user);
        },

        /**
         * Latest development OTP for a phone, read from the API server's console log
         * (DEV_AUTH_OTP_MODE=console). Pass the log path via CYPRESS_DEV_API_LOG.
         */
        devOtpFromServerLog({ phone, logFile }: { phone: string; logFile: string }) {
          if (!logFile || !fs.existsSync(logFile)) return null;
          const escaped = phone.replace(/[+]/g, "\\+");
          const pattern = new RegExp(`\\[DEV OTP\\] ${escaped} -> (\\d{6})`, "g");
          const log = fs.readFileSync(logFile, "utf8");
          let code: string | null = null;
          for (let m = pattern.exec(log); m; m = pattern.exec(log)) code = m[1]; // keep the latest
          return code;
        },

        /** Stand-in for the retired POST /auth/register: creates a CUSTOMER (no password). */
        async e2eCreateCustomer(body: Record<string, any> = {}) {
          const email = body.email ? String(body.email).trim().toLowerCase() : null;
          if (email && (await db().user.findUnique({ where: { email } }))) {
            return { status: 400, body: { success: false, message: "User already exists with this email" } };
          }
          const company = body.companyName
            ? await db().company.create({
                data: {
                  name: String(body.companyName),
                  address: "Main Office",
                  city: body.city || "Bhubaneswar",
                  state: body.state || "Odisha",
                  pincode: "751012",
                },
              })
            : null;
          const user = await db().user.create({
            data: {
              email,
              name: String(body.name || ""),
              phone: body.phone ? String(body.phone) : null,
              role: "CUSTOMER",
              companyId: company?.id ?? null,
            },
            include: { company: true },
          });
          return { status: 201, body: { success: true, ...sessionFor(user) } };
        },

        /**
         * Removes a throwaway product created by a spec, with the quotes raised against it.
         * Only products whose name starts with "E2E " are ever touched.
         */
        async e2eDeleteTestProduct({ productId }: { productId?: string }) {
          if (!productId) return 0;
          const product = await db().product.findFirst({ where: { id: productId, name: { startsWith: "E2E " } } });
          if (!product) return 0;
          await db().quote.deleteMany({ where: { items: { some: { productId } } } });
          await db().product.delete({ where: { id: productId } });
          return 1;
        },

        /** Removes a throwaway CUSTOMER created by e2eCreateCustomer (never touches other roles). */
        async e2eDeleteCustomer({ email }: { email?: string }) {
          if (!email) return 0;
          const { count } = await db().user.deleteMany({
            where: { email: String(email).trim().toLowerCase(), role: "CUSTOMER" },
          });
          return count;
        },
      });
    },
  },
});
