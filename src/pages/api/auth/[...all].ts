import { getAuth } from "../../../lib/auth";
import { env } from 'cloudflare:workers';
import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
	const proto = context.request.headers.get('x-forwarded-proto') || 'https';
	const host = context.request.headers.get('x-forwarded-host') || context.request.headers.get('host');
	const origin = `${proto}://${host}`;
	const auth = getAuth(env.db, { ...env, baseUrl: origin } as any);
	return auth.handler(context.request);
};

export const POST: APIRoute = async (context) => {
	const proto = context.request.headers.get('x-forwarded-proto') || 'https';
	const host = context.request.headers.get('x-forwarded-host') || context.request.headers.get('host');
	const origin = `${proto}://${host}`;
	const auth = getAuth(env.db, { ...env, baseUrl: origin } as any);
	return auth.handler(context.request);
};
