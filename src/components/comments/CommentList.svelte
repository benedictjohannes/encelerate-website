<script lang="ts">
	import CommentItem from "./CommentItem.svelte";

	let { 
		comments = [], 
		slug, 
		highlightedId,
		onCommentAdded, 
		onCommentDeleted, 
		onScrollToComment,
		clearHighlight
	}: {
		comments: any[],
		slug: string,
		highlightedId: string | null,
		onCommentAdded: (c: any) => void,
		onCommentDeleted: (id: string) => void,
		onScrollToComment: (id: string) => void,
		clearHighlight: () => void
	} = $props();
	function getThreadUsers(root: any) {
		const userSet = new Map();
		const collectUsers = (c: any) => {
			if (c.user) userSet.set(c.user.id, c.user);
			if (c.replies) c.replies.forEach(collectUsers);
		};
		collectUsers(root);
		return Array.from(userSet.values());
	}
</script>

{#snippet tree(list: any[] = [], rootThreadUsers: any[] | null = null)}
	{#each list as comment (comment.id)}
		{@const currentThreadUsers = rootThreadUsers ?? getThreadUsers(comment)}
		<div class="comment-branch animate-in fade-in slide-in-from-bottom-4 duration-500">
			<CommentItem 
				{comment} 
				{slug} 
				{highlightedId}
				threadUsers={currentThreadUsers}
				onCommentAdded={(newComment: any) => onCommentAdded(newComment)}
				onCommentDeleted={(id: string) => onCommentDeleted(id)}
				onScrollToComment={(id: string) => onScrollToComment(id)}
				{clearHighlight}
			/>
			
			{#if comment.replies && comment.replies.length > 0}
				<div class="ml-4 sm:ml-6 border-l-2 border-amber-200 dark:border-amber-900 pl-3 sm:pl-4 -mt-2 mb-2 space-y-2">
					{@render tree(comment.replies, currentThreadUsers)}
				</div>
			{/if}
		</div>
	{/each}
{/snippet}

<div class="comment-list divide-y divide-black/5 dark:divide-white/5 mt-4">
	{#if comments.length > 0}
		{@render tree(comments, null)}
	{:else}
		<div class="py-20 text-center">
			<p class="text-sm font-bold text-stone-400 dark:text-stone-600 uppercase tracking-widest">No comments yet</p>
			<p class="text-xs font-semibold text-stone-300 dark:text-stone-700 mt-1">Be the first to share your thoughts!</p>
		</div>
	{/if}
</div>
