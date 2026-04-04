/**
 * Simple notification utilities for signed tokens (unsubscribe links).
 * Uses Web Crypto API for compatibility with Cloudflare Workers.
 */

/**
 * Generates a HMAC-SHA256 signature for a user ID.
 */
export async function generateUnsubscribeToken(userId: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(userId);

    const key = await crypto.subtle.importKey(
        'raw', 
        keyData, 
        { name: 'HMAC', hash: 'SHA-256' }, 
        false, 
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    
    // Convert signature to hex string
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Verifies if a token matches the user ID.
 */
export async function verifyUnsubscribeToken(userId: string, token: string, secret: string): Promise<boolean> {
    const expectedToken = await generateUnsubscribeToken(userId, secret);
    return expectedToken === token;
}
