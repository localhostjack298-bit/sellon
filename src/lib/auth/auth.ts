/**
 * Better Auth server instance (authentication only — authorisation lives in `lib/permissions`).
 *
 *  • Email + password (scrypt hashes, rate-limited by Better Auth on the HTTP endpoints).
 *  • Sessions are database rows (`user_sessions`) behind an httpOnly cookie. The cookie cache is OFF so
 *    deactivating / suspending a user or revoking sessions takes effect on the very next request.
 *  • Roles & permissions are NOT embedded in the session — they are loaded fresh from PostgreSQL on every
 *    request in `getActor()`, which is what lets permission changes apply to live sessions.
 */
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma/client";
import { provisionCustomerAccount } from "@/features/auth/provision";

import { AUTH_COOKIE_PREFIX } from "@/lib/auth/cookie-prefix";

export { AUTH_COOKIE_PREFIX };

const secureCookies = process.env.SESSION_COOKIE_SECURE
  ? process.env.SESSION_COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const auth = betterAuth({
  appName: "Stellar Family Salon",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false, // demo: no email provider is wired up (see README → pre-production gaps)
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
    cookieCache: { enabled: false },
  },
  advanced: {
    cookiePrefix: AUTH_COOKIE_PREFIX,
    useSecureCookies: secureCookies,
  },
  trustedOrigins: [baseURL, "https://*.e2b.app", "http://localhost:3000"],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await provisionCustomerAccount({ id: user.id, name: user.name, email: user.email });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
