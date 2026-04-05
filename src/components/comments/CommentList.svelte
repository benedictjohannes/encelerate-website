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

	let expandedThreads = $state(new Set<string>());

	function expand(id: string) {
		expandedThreads.add(id);
		// Force reactivity by re-assigning the Set
		expandedThreads = new Set(expandedThreads);
	}

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

{#snippet tree(list: any[] = [], rootThreadUsers: any[] | null = null, parentId: string | null = null)}
	{@const isExpanded = !parentId || expandedThreads.has(parentId)}
	{@const visibleList = isExpanded ? list : list.slice(0, 5)}
	{@const hiddenCount = list.length - visibleList.length}

	{#each visibleList as comment (comment.id)}
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
				onToggleExpand={() => expand(parentId ?? comment.id)}
				{clearHighlight}
			/>
			
			{#if comment.replies && comment.replies.length > 0}
				<div class="ml-4 sm:ml-6 border-l-2 border-amber-200 dark:border-amber-900 pl-3 sm:pl-4 -mt-2 mb-2 space-y-2">
					{@render tree(comment.replies, currentThreadUsers, comment.id)}
				</div>
			{/if}
		</div>
	{/each}

	{#if !isExpanded && hiddenCount > 0 && parentId}
		<div class="ml-4 sm:ml-6 pl-3 sm:pl-4 -mt-2 mb-4">
			<button 
				onclick={() => expand(parentId)}
				class="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 hover:text-amber-500 transition-colors flex items-center gap-1.5 py-2 px-3 rounded-sm"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
				Show {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
			</button>
		</div>
	{/if}
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
