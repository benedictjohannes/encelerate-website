import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import * as schema from '../../../db/schema';
import { verifyUnsubscribeToken } from '../../../lib/notifications';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('uid');
    const token = url.searchParams.get('token');

    if (!userId || !token) {
        return new Response('Missing parameters', { status: 400 });
    }

    const secret = env.betterAuthSecret;
    if (!secret) {
        console.error('betterAuthSecret not found in environment');
        return new Response('Configuration error', { status: 500 });
    }

    // Verify token
    const isValid = await verifyUnsubscribeToken(userId, token, secret);
    if (!isValid) {
        return new Response('Invalid or expired unsubscribe link', { status: 403 });
    }

    const db = drizzle(env.db, { schema });

    try {
        // Disable notifications
        await db.update(schema.user)
            .set({ emailNotificationsEnabled: false })
            .where(eq(schema.user.id, userId));

        // Redirect to a pretty confirmation page
        return new Response(null, {
            status: 302,
            headers: {
                'Location': '/notifications/unsubscribed'
            }
        });
    } catch (e) {
        console.error('Failed to unsubscribe:', e);
        return new Response('Error processing request', { status: 500 });
    }
};
