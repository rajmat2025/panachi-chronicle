import { PrismaClient } from "@prisma/client";

/**
 * READ-ONLY Prisma client for the shared `panachi` database.
 *
 * This app is a display-only chronicle. We never mutate the source data.
 * As a defensive guard, this client blocks any write-style Prisma operation
 * at runtime so an accidental `create`/`update`/`delete` can never reach the DB.
 */

const WRITE_ACTIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
  "executeRaw",
  "executeRawUnsafe",
  "$executeRaw",
  "$executeRawUnsafe",
]);

/**
 * Hostinger quirks (same as the tree app): hPanel may wrap values in quotes,
 * `localhost` resolves to IPv6 ::1 (the MySQL user is @localhost only), and an
 * `@` in the password must be URL-encoded. DATABASE_PASSWORD (plain text) plus
 * the optional DATABASE_USER/HOST/PORT/NAME avoids the encoding problem.
 */
function normalizeDatabaseUrl(): string | undefined {
  const password = process.env.DATABASE_PASSWORD?.trim();
  if (password) {
    const user = process.env.DATABASE_USER?.trim() || "u627857774_admin";
    const host = process.env.DATABASE_HOST?.trim() || "127.0.0.1";
    const port = process.env.DATABASE_PORT?.trim() || "3306";
    const db = process.env.DATABASE_NAME?.trim() || "u627857774_panachi";
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  }

  let url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;
  if (
    (url.startsWith("'") && url.endsWith("'")) ||
    (url.startsWith('"') && url.endsWith('"'))
  ) {
    url = url.slice(1, -1);
  }
  // Force IPv4 to avoid ::1 resolution issues with @localhost MySQL users.
  url = url.replace(/@localhost(?=[:/]|$)/, "@127.0.0.1");
  return url;
}

const globalForPrisma = globalThis as unknown as {
  chroniclePrisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const databaseUrl = normalizeDatabaseUrl();
  // The schema reads env("DATABASE_URL"), so it must be set even when the URL
  // was assembled from the DATABASE_* parts.
  if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
  const client = new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        if (WRITE_ACTIONS.has(operation)) {
          throw new Error(
            `[chronicle] Blocked write operation "${operation}"${
              model ? ` on ${model}` : ""
            }: this app is strictly read-only.`
          );
        }
        return query(args);
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.chroniclePrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.chroniclePrisma = prisma;
}
