import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

/**
 * Factory for creating the Better Auth instance within the Cloudflare Workers context.
 * This is necessary because the D1 binding (db) is only available at runtime per-request.
 */
export const getAuth = (db: D1Database, env: Env) => {
	return betterAuth({
		database: drizzleAdapter(drizzle(db), {
			provider: "sqlite",
			schema,
		}),
		baseURL: env.BETTER_AUTH_URL,
		socialProviders: {
			google: {
				clientId: env.authGoogleClientId,
				clientSecret: env.authGoogleClientSecret,
			},
		},
		user: {
			additionalFields: {
				role: { type: "string" },
				emailNotificationsEnabled: { type: "boolean" },
				notificationRateLimitHours: { type: "number" },
				lastNotifiedAt: { type: "string" }, // Stored as timestamp
			}
		},
		secret: env.betterAuthSecret,
		trustedOrigins: ["https://encelerate.com", "https://encelerate.localhost", "https://encelerate.haiyaa.my.id"],
	});
};


export type Auth = ReturnType<typeof getAuth>;
