import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { drizzle } from 'drizzle-orm/d1';
import { eq, asc } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import * as schema from '../db/schema';
import { getAuth } from '../lib/auth';
import { sendEmail } from '../lib/email';
import { generateUnsubscribeToken } from '../lib/notifications';

const MIN_COMMENT_LENGTH = 3;
const MAX_COMMENT_LENGTH = 2000;

/**
 * Robustly renders deterministic <mention> tags into @username for text/html emails.
 * Matches logic in CommentItem.svelte but simplified for SSR.
 */
function renderMentionsForEmail(content: string): string {
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

export const server = {
    getComments: defineAction({
        input: z.object({
            slug: z.string(),
        }),
        handler: async (input) => {
            const db = drizzle(env.db, { schema });

            // 1. Get postId
            const postRow = await db.query.posts.findFirst({
                where: eq(schema.posts.slug, input.slug),
            });

            if (!postRow) return [];

            // 2. Fetch all comments for this post
            const allComments = await db.query.comments.findMany({
                where: eq(schema.comments.postId, postRow.id),
                orderBy: [asc(schema.comments.createdAt)],
                with: {
                    user: {
                        columns: {
                            id: true,
                            name: true,
                            image: true,
                            role: true,
                        }
                    },
                    // Include the direct target user for UI mentions
                    replyTo: {
                        with: {
                            user: {
                                columns: {
                                    name: true,
                                }
                            }
                        }
                    }
                }
            });

            // 3. Build 2-level tree (parentId groups replies under roots)
            const commentMap = new Map();
            const roots: any[] = [];

            allComments.forEach(comment => {
                commentMap.set(comment.id, { ...comment, replies: [] });
            });

            allComments.forEach(comment => {
                const node = commentMap.get(comment.id);
                if (comment.parentId && commentMap.has(comment.parentId)) {
                    // Group under the thread root
                    commentMap.get(comment.parentId).replies.push(node);
                } else {
                    // It's a root comment
                    roots.push(node);
                }
            });

            return roots;
        }
    }),

    postComment: defineAction({
        input: z.object({
            slug: z.string(),
            content: z.string().min(MIN_COMMENT_LENGTH).max(MAX_COMMENT_LENGTH),
            replyId: z.string().optional().nullable(), // The direct target
        }),
        handler: async (input, context) => {
            const db = drizzle(env.db, { schema });
            const auth = getAuth(env.db, env as any);
            
            const session = await auth.api.getSession({
                headers: context.request.headers,
            });

            if (!session) {
                throw new Error('You must be signed in to comment.');
            }

            // 1. Ensure Post exists
            let postRow = await db.query.posts.findFirst({
                where: eq(schema.posts.slug, input.slug),
            });

            if (!postRow) {
                const results = await db.insert(schema.posts).values({
                    slug: input.slug,
                }).returning();
                postRow = results[0];
            }

            const commentId = crypto.randomUUID();
            let dbParentId: string | null = null;
            let dbReplyId: string | null = null;
            let targetComment = null;

            let threadUsers: any[] = [];
            let commentContent = input.content;

            if (input.replyId) {
                targetComment = await db.query.comments.findFirst({
                    where: eq(schema.comments.id, input.replyId),
                    with: {
                        user: true, 
                    }
                });

                if (!targetComment || targetComment.postId !== postRow.id) {
                    throw new Error('Invalid reply target.');
                }

                dbReplyId = targetComment.id;
                dbParentId = targetComment.parentId ?? targetComment.id;

                // Get all users in this comment thread
                const threadComments = await db.query.comments.findMany({
                    where: eq(schema.comments.parentId, dbParentId),
                    with: {
                        user: {
                            columns: { 
                                id: true, 
                                name: true, 
                                email: true, 
                                emailNotificationsEnabled: true, 
                                lastNotifiedAt: true, 
                                notificationRateLimitHours: true 
                            }
                        }
                    }
                });

                const userSet = new Map();
                threadComments.forEach(c => {
                    if (c.user && !userSet.has(c.user.id)) {
                        userSet.set(c.user.id, c.user);
                    }
                });
                // Ensure target comment user and root user are included (if not already)
                if (targetComment.user) userSet.set(targetComment.userId, targetComment.user);
                
                // If this is a nested reply, also include the top-level root author
                if (targetComment.parentId) {
                    const topLevelComment = await db.query.comments.findFirst({
                        where: eq(schema.comments.id, targetComment.parentId),
                        with: {
                            user: {
                                columns: { 
                                    id: true, 
                                    name: true, 
                                    email: true, 
                                    emailNotificationsEnabled: true, 
                                    lastNotifiedAt: true, 
                                    notificationRateLimitHours: true 
                                }
                            }
                        }
                    });
                    if (topLevelComment?.user) {
                        userSet.set(topLevelComment.userId, topLevelComment.user);
                    }
                }
                
                threadUsers = Array.from(userSet.values());

                // Auto prepend mention of target user if not manually mentioned
                const targetUserId = targetComment.userId;
                const targetUserName = targetComment.user.name;
                
                // Use a more robust check for existing mentions (case-insensitive, attribute order agnostic)
                const isAlreadyMentioned = new RegExp(`<mention[^>]+userid="${targetUserId}"`, 'i').test(commentContent);
                
                if (!isAlreadyMentioned) {
                    const targetMentionTag = `<mention userid="${targetUserId}" username="${targetUserName}" />`;
                    commentContent = `${targetMentionTag} ${commentContent}`.trim();
                }

                // Parse deterministic mentions: <mention userid="ID" username="NAME" />
                // Support both short <mention ... /> and long <mention ...>...</mention> tags, case-insensitive
                const mentionRegex = /<mention[^>]+userid="([^"]+)"/gi;
                const matches = [...commentContent.matchAll(mentionRegex)];
                
                const validMentionIds: string[] = [];
                const threadUserIds = new Set(threadUsers.map(u => u.id));

                for (const match of matches) {
                    const userId = match[1];
                    if (!threadUserIds.has(userId)) {
                        throw new Error(`User in mention tag is not part of this thread.`);
                    }
                    if (!validMentionIds.includes(userId)) {
                        validMentionIds.push(userId);
                    }
                }
                if (validMentionIds.length > 0) {
                    const now = new Date();
                    // Send mention notifications (background)
                    for (const userId of validMentionIds) {
                        if (userId === session.user.id) continue;
                        if (targetComment && userId === targetComment.userId) continue;

                        const mentionedUser = threadUsers.find(u => u.id === userId);
                        if (!mentionedUser?.emailNotificationsEnabled) continue;

                        const lastNotifiedAt = mentionedUser.lastNotifiedAt ? new Date(mentionedUser.lastNotifiedAt) : null;
                        const rateLimitMs = mentionedUser.notificationRateLimitHours * 60 * 60 * 1000;
                        const isWithinRateLimit = !lastNotifiedAt || rateLimitMs === 0 || (now.getTime() - lastNotifiedAt.getTime() > rateLimitMs);
                        
                        if (!isWithinRateLimit) continue;

                        const sendMentionNotification = async () => {
                            try {
                                const unsubscribeToken = await generateUnsubscribeToken(mentionedUser.id, env.betterAuthSecret);
                                const unsubscribeUrl = `https://encelerate.com/api/notifications/unsubscribe?uid=${mentionedUser.id}&token=${unsubscribeToken}`;

                                await sendEmail(env, {
                                    to: mentionedUser.email,
                                    subject: `You were mentioned in a comment on Encelerate: ${input.slug}`,
                                    html: `
                                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                            <h3>Hello ${mentionedUser.name},</h3>
                                            <p><b>${session.user.name}</b> mentioned you in a comment on <b>${input.slug}</b>:</p>
                                             <div style="border-left: 4px solid #28a745; padding: 12px; font-style: italic; background: #f8f9fa; border-radius: 4px;">
                                                ${renderMentionsForEmail(commentContent)}
                                             </div>
                                            <p style="margin-top: 24px;">
                                                <a href="https://encelerate.com/blog/${input.slug}?highlightCommentId=${commentId}" 
                                                   style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                                   View Comment
                                                </a>
                                            </p>
                                            <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
                                            <p style="font-size: 11px; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
                                                You're receiving this because you've enabled mention notifications for your comments.
                                                <br>
                                                <a href="${unsubscribeUrl}" style="color: #28a745; text-decoration: none;">Unsubscribe from all notifications</a>
                                            </p>
                                        </div>
                                    `
                                });
                                // Update lastNotifiedAt
                                await db.update(schema.user)
                                    .set({ lastNotifiedAt: now })
                                    .where(eq(schema.user.id, mentionedUser.id));
                            } catch (e) {
                                console.error('Failed to send mention notification:', e);
                            }
                        };

                        const ctx = context.locals.cfContext || (context.locals as any).runtime?.ctx;
                        if (ctx) ctx.waitUntil(sendMentionNotification());
                    }
                }
            }

            // 3. Insert new comment
            const [newComment] = await db.insert(schema.comments).values({
                id: commentId,
                userId: session.user.id,
                postId: postRow.id,
                content: commentContent,
                parentId: dbParentId,
                replyId: dbReplyId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            // 4. Background Notification (Email for direct replies)
            const targetUser = targetComment?.user;
            if (targetUser && targetUser.emailNotificationsEnabled) {
                const lastNotifiedAt = targetUser.lastNotifiedAt ? new Date(targetUser.lastNotifiedAt) : null;
                const now = new Date();
                const rateLimitMs = targetUser.notificationRateLimitHours * 60 * 60 * 1000;
                
                const isReplyingToSelf = targetUser.id === session.user.id;
                const isWithinRateLimit = !lastNotifiedAt || rateLimitMs === 0 || (now.getTime() - lastNotifiedAt.getTime() > rateLimitMs);
                const shouldBeNotified = !isReplyingToSelf && isWithinRateLimit;

                    if (shouldBeNotified) {
                    const sendNotification = async () => {
                        try {
                            const unsubscribeToken = await generateUnsubscribeToken(targetUser.id, env.betterAuthSecret);
                            const unsubscribeUrl = `https://encelerate.com/api/notifications/unsubscribe?uid=${targetUser.id}&token=${unsubscribeToken}`;

                            await sendEmail(env, {
                                to: targetUser.email,
                                subject: `New reply on Encelerate: ${input.slug}`,
                                html: `
                                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                        <h3>Hello ${targetUser.name},</h3>
                                        <p><b>${session.user.name}</b> replied to your comment on <b>${input.slug}</b>:</p>
                                         <div style="border-left: 4px solid #007bff; padding: 12px; font-style: italic; background: #f8f9fa; border-radius: 4px;">
                                            ${renderMentionsForEmail(commentContent)}
                                         </div>
                                        <p style="margin-top: 24px;">
                                            <a href="https://encelerate.com/blog/${input.slug}?highlightCommentId=${commentId}" 
                                               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                               View and Reply
                                            </a>
                                        </p>
                                        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
                                        <p style="font-size: 11px; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
                                            You're receiving this because you've enabled reply notifications for your comments.
                                            <br>
                                            <a href="${unsubscribeUrl}" style="color: #007bff; text-decoration: none;">Unsubscribe from all notifications</a>
                                        </p>
                                    </div>
                                `
                            });
                            // Update lastNotifiedAt
                            await db.update(schema.user)
                                .set({ lastNotifiedAt: now })
                                .where(eq(schema.user.id, targetUser.id));
                        } catch (e) {
                            console.error('Failed to send reply notification:', e);
                        }
                    };

                    const ctx = context.locals.cfContext || (context.locals as any).runtime?.ctx;
                    if (ctx) {
                        ctx.waitUntil(sendNotification());
                    }
                }
            }
            
            return {
                ...newComment,
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    image: session.user.image,
                    role: (session.user as any).role,
                },
                replyTo: targetComment ? {
                    user: {
                        name: targetComment.user.name
                    }
                } : null,
                replies: []
            };
        }
    }),

    deleteComment: defineAction({
        input: z.object({
            id: z.string(),
        }),
        handler: async (input, context) => {
            const db = drizzle(env.db, { schema });
            const auth = getAuth(env.db, env as any);
            
            const session = await auth.api.getSession({
                headers: context.request.headers,
            });

            if (!session) throw new Error('Unauthorized');

            // Fetch comment to check ownership or admin role
            const comment = await db.query.comments.findFirst({
                where: eq(schema.comments.id, input.id),
            });

            if (!comment) throw new Error('Comment not found');

            const isAdmin = (session.user as any).role === 'admin';
            const isOwner = session.user.id === comment.userId;

            if (!isAdmin && !isOwner) {
                throw new Error('You are not authorized to delete this comment.');
            }

            await db.update(schema.comments)
                .set({
                    content: '',
                    deletedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(schema.comments.id, input.id));

            return { success: true };
        }
    }),

    updateUserPreferences: defineAction({
        input: z.object({
            emailNotificationsEnabled: z.boolean(),
            notificationRateLimitHours: z.number().min(0).max(30*24),
        }),
        handler: async (input, context) => {
            const db = drizzle(env.db, { schema });
            const auth = getAuth(env.db, env as any);
            
            const session = await auth.api.getSession({
                headers: context.request.headers,
            });

            if (!session) throw new Error('Unauthorized');

            await db.update(schema.user)
                .set({
                    emailNotificationsEnabled: input.emailNotificationsEnabled,
                    notificationRateLimitHours: input.notificationRateLimitHours,
                })
                .where(eq(schema.user.id, session.user.id));

            return { success: true };
        }
    })
};
