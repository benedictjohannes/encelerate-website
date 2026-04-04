import { sqliteTable, text, integer, index, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Better Auth - Extended User Table
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
	role: text('role'),
	// Notification Preferences
	emailNotificationsEnabled: integer('emailNotificationsEnabled', { mode: 'boolean' }).notNull().default(true),
	notificationRateLimitHours: integer('notificationRateLimitHours').notNull().default(24),
	lastNotifiedAt: integer('lastNotifiedAt', { mode: 'timestamp' }),
});

export const userRelations = relations(user, ({ many }) => ({
	comments: many(comments),
}));

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId').notNull().references(() => user.id),
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId').notNull().references(() => user.id),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }),
});

// Posts lookup table (efficient storage for indexing)
export const posts = sqliteTable('posts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
});

export const postsRelations = relations(posts, ({ many }) => ({
	comments: many(comments),
}));

// Optimized Comments Table
export const comments = sqliteTable('comments', {
    id: text('id').primaryKey(), // Generated UUID or ULID
    userId: text('userId').notNull().references(() => user.id),
    postId: integer('postId').notNull().references(() => posts.id),
    content: text('content').notNull(),
    // The top-level root comment of the thread (for UI grouping)
    parentId: text('parentId').references((): AnySQLiteColumn => comments.id, { onDelete: 'cascade' }),
    // The immediate comment being replied to (for direct notifications)
    replyId: text('replyId').references((): AnySQLiteColumn => comments.id, { onDelete: 'cascade' }),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
    deletedAt: integer('deletedAt', { mode: 'timestamp' }),
}, (table) => ({
    // Optimized for fetching threads chronologically within a post
    postThreadIdx: index('post_thread_idx').on(table.postId, table.parentId, table.createdAt),
}));



export const commentsRelations = relations(comments, ({ one, many }) => ({
	user: one(user, {
		fields: [comments.userId],
		references: [user.id],
	}),
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id],
	}),
    // Thread-level relation (UI grouping)
	parent: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: 'threadReplies',
	}),
	replies: many(comments, { relationName: 'threadReplies' }),
    // Direct reply relation (for notifications/UI mentions)
    replyTo: one(comments, {
        fields: [comments.replyId],
        references: [comments.id],
        relationName: 'directReplies',
    }),
    repliesDirect: many(comments, { relationName: 'directReplies' }),
}));



