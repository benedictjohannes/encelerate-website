/**
 * Worker-safe HTML processing using native HTMLRewriter.
 * Optimized for Cloudflare (workerd runtime).
 */

/**
 * Strips all tags and attributes not in the whitelist.
 */
export async function sanitizeHTML(html: string) {
    const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'mention', 'a'];
    const ALLOWED_ATTRS: Record<string, string[]> = {
        'mention': ['userid', 'username'],
        'a': ['href', 'target', 'rel'],
    };

    const rewriter = new HTMLRewriter().on('*', {
        element(el) {
            const tag = el.tagName.toLowerCase();
            if (!ALLOWED_TAGS.includes(tag)) {
                // Remove unknown/dangerous tags but keep their inner text
                el.removeAndKeepContent();
                return;
            }

            // Scrub attributes
            const allowed = ALLOWED_ATTRS[tag] || [];
            const attributes = Array.from(el.attributes as any) as [string, string][];
            
            const toRemove: string[] = [];
            for (const [name] of attributes) {
                if (!allowed.includes(name.toLowerCase())) {
                    toRemove.push(name);
                }
            }
            toRemove.forEach(attrName => el.removeAttribute(attrName));

            // Enforce security for links
            if (tag === 'a') {
                el.setAttribute('rel', 'nofollow noopener noreferrer');
                el.setAttribute('target', '_blank');
            }
        },
    });

    const response = new Response(html, { headers: { 'Content-Type': 'text/html' } });
    const transformed = rewriter.transform(response);
    return await transformed.text();
}

/**
 * Rewrites relative links and image sources to absolute URLs.
 * Essential for RSS feeds and email clients.
 */
export async function makeAbsoluteUrls(html: string, siteUrl: string) {
    const rewriter = new HTMLRewriter()
        .on('a', {
            element(el) {
                const href = el.getAttribute('href');
                if (href?.startsWith('/')) {
                    el.setAttribute('href', `${siteUrl}${href}`);
                }
            },
        })
        .on('img', {
            element(el) {
                const src = el.getAttribute('src');
                if (src?.startsWith('/')) {
                    el.setAttribute('src', `${siteUrl}${src}`);
                }
            },
        });

    const response = new Response(html, { headers: { 'Content-Type': 'text/html' } });
    const transformed = rewriter.transform(response);
    return await transformed.text();
}

/**
 * Robustly renders deterministic <mention> tags into @username for text/html emails.
 * Matches logic in CommentItem.svelte but simplified for SSR.
 */
export function renderMentionsForEmail(content: string): string {
    const mentionRegex = /<mention\s+([^>]*?)\s*\/?>(?:.*?<\/mention>)?/gi;
    return content.replace(mentionRegex, (match, attrs) => {
        // Match name from either username or userName, supporting both " and &quot;
        const nameMatch = attrs.match(/username=(?:"|&quot;)([^"&]+)(?:"|&quot;)/i) || 
                          attrs.match(/userName=(?:"|&quot;)([^"&]+)(?:"|&quot;)/i);
        
        if (nameMatch) {
            const displayName = nameMatch[1].replace(/&amp;/g, '&');
            return `@${displayName}`;
        }
        return match;
    });
}
