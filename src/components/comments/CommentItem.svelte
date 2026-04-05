<script lang="ts">
	import DOMPurify from "isomorphic-dompurify";
	import CommentForm from "./CommentForm.svelte";
	import { actions } from "astro:actions";
	import { authClient } from "../../lib/auth.client";

	let { 
		comment, 
		slug, 
		highlightedId,
		threadUsers = [],
		onCommentAdded = (c: any) => {}, 
		onCommentDeleted = (id: string) => {},
		onScrollToComment = (id: string) => {},
		clearHighlight = () => {}
	}: {
		comment: any,
		slug: string,
		highlightedId: string | null,
		threadUsers?: any[],
		onCommentAdded?: (c: any) => void,
		onCommentDeleted?: (id: string) => void,
		onScrollToComment?: (id: string) => void,
		clearHighlight?: () => void
	} = $props();
	
	let session = authClient.useSession();
	let showReplyForm = $state(false);
	let isDeleting = $state(false);

	let isHighlighted = $derived(highlightedId === comment.id);

	const renderedContent = $derived.by(() => {
		if (comment.deletedAt) {
			const d = new Date(comment.deletedAt);
			const dateStr = d.toISOString().split('T')[0];
			const timeStr = d.toTimeString().split(' ')[0];
			return `<div class="italic text-stone-400 font-mono text-[11px] py-1">[ Comment Deleted on ${dateStr} ${timeStr} ]</div>`;
		}
		try {
			// We now store pure HTML from Tiptap, so no Markdown parsing needed.
			let rawHtml = comment.content || "";
			
			// Replace deterministic mentions with styled Spans.
			const mentionRegex = /(?:<|&lt;)mention\s+([^>&]+?)\s*\/?(?:>|&gt;)/gi;
			
			rawHtml = rawHtml.replace(mentionRegex, (match: string, attrs: string) => {
				const idMatch = attrs.match(/userid=(?:"|&quot;)([^"&]+)(?:"|&quot;)/i) || attrs.match(/userId=(?:"|&quot;)([^"&]+)(?:"|&quot;)/i);
				const nameMatch = attrs.match(/username=(?:"|&quot;)([^"&]+)(?:"|&quot;)/i) || attrs.match(/userName=(?:"|&quot;)([^"&]+)(?:"|&quot;)/i);
				
				if (idMatch && nameMatch) {
					const displayName = nameMatch[1].replace(/&amp;/g, '&');
					return `<span class="mention font-extrabold text-amber-600 dark:text-amber-400 group/mention cursor-default" data-user-id="${idMatch[1]}">@${displayName}</span>`;
				}
				return match;
			});

			return DOMPurify.sanitize(rawHtml);
		} catch (e) {
			console.error("Content processing error:", e);
			return comment.content || "";
		}
	});

	const isAdmin = $derived(($session.data?.user as any)?.role === "admin");
	const isOwner = $derived($session.data?.user?.id === comment.userId);
	const canDelete = $derived(isAdmin || isOwner);

	async function handleDelete() {
		if (!confirm("Are you sure you want to delete this comment?")) return;
		
		isDeleting = true;
		const { error } = await actions.deleteComment({ id: comment.id });
		if (error) {
			alert(error.message);
			isDeleting = false;
		} else {
			onCommentDeleted(comment.id);
			isDeleting = false;
		}
	}

	function handleReply(newComment: any) {
		if (newComment) {
			onCommentAdded(newComment);
		}
		showReplyForm = false;
	}

	function formatDate(date: any) {
		const d = new Date(date);
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}
</script>

<div 
	id="comment-{comment.id}"
	class="comment-item group/item relative py-4 flex gap-4 transition-all duration-500 {isDeleting ? 'opacity-50 grayscale pointer-events-none' : ''} {isHighlighted ? 'is-highlighted' : ''}"
>
	<!-- User Avatar -->
	<div class="shrink-0">
		{#if comment.user.image}
			<img src={comment.user.image} alt={comment.user.name} class="w-10 h-10 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm" />
		{:else}
			<div class="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 font-bold flex items-center justify-center text-sm border border-black/5 dark:border-white/5">
				{comment.user.name.charAt(0)}
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="flex-1 min-w-0">
		<header class="flex items-center gap-2 mb-1.5 flex-wrap">
			<span class="text-sm font-black text-stone-900 dark:text-stone-100 leading-none">{comment.user.name}</span>
			{#if comment.user && (comment.user as any).role === 'admin'}
				<span class="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-none border border-amber-500/20">Admin</span>
			{/if}
			{#if comment.replyTo && comment.replyId}
				<div class="flex items-center gap-1 text-[11px] font-bold text-stone-400">
					<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m10 15 5-5-5-5"/><path d="M4 15V9h11"/></svg>
					<button 
						type="button" 
						onclick={() => onScrollToComment(comment.replyId)}
						class="hover:text-amber-500 transition-colors"
					>
						{comment.replyTo.user.name}
					</button>
				</div>
			{/if}
			<span class="text-[11px] font-bold text-stone-400">{formatDate(comment.createdAt)}</span>
		</header>

		<div class="comment-content prose-sm max-w-none">
			<!-- Sanitized HTML -->
			{@html renderedContent}
		</div>

		<footer class="mt-3 flex items-center gap-4">
			{#if $session.data && !showReplyForm && !comment.deletedAt}
				<button 
					onclick={() => {
						showReplyForm = !showReplyForm;
						if (showReplyForm) clearHighlight();
					}}
					class="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-amber-500 transition-colors flex items-center gap-1.5"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
					Reply
				</button>
			{/if}

			{#if canDelete && !comment.deletedAt}
				<button 
					onclick={handleDelete}
					class="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 focus:opacity-100"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
					Delete
				</button>
			{/if}
		</footer>

		{#if showReplyForm}
			<div class="mt-4 p-4 bg-stone-50 dark:bg-black/20 rounded-none border border-black/5 dark:border-white/5 animate-in fade-in slide-in-from-top-2">
				<CommentForm {slug} replyToId={comment.id} replyToUsername={comment.user.name} {threadUsers} onSubmitted={handleReply} onInteraction={clearHighlight} autofocus={true} />
			</div>
		{/if}
	</div>
</div>

<style>
	.is-highlighted {
		background: rgba(245, 159, 11, 0.08);
		border-radius: 0;
		margin-left: -1rem;
		margin-right: -1rem;
		padding-left: 1rem;
		padding-right: 1rem;
		box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.1);
	}

	:global(.dark) .is-highlighted {
		background: rgba(245, 159, 11, 0.1);
		box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
	}
</style>
