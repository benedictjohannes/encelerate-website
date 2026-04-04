<script lang="ts">
	import { actions } from "astro:actions";
	import { authClient } from "../../lib/auth.client";
	const MIN_COMMENT_LENGTH = 3;
	const MAX_COMMENT_LENGTH = 2000;
	let { 
		slug, 
		replyToId = null, 
		onSubmitted = (newComment: any) => {}, 
		onInteraction = () => {},
		autofocus = false
	}: {
		slug: string,
		replyToId?: string | null,
		onSubmitted?: (newComment: any) => void,
		onInteraction?: () => void,
		autofocus?: boolean
	} = $props();
	
	let session = authClient.useSession();
	let content = $state("");
	let isSubmitting = $state(false);
	let error = $state("");

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!content.trim()) return;

		isSubmitting = true;
		error = "";

		try {
			const { data, error: actionError } = await actions.postComment({
				slug,
				content,
				replyId: replyToId,
			});

			if (actionError) {
				error = actionError.message;
			} else {
				content = "";
				onSubmitted(data);
			}
		} catch (e) {
			error = "An unexpected error occurred.";
		} finally {
			isSubmitting = false;
		}
	}
	function focusOnMount(node: HTMLTextAreaElement) {
		if (autofocus) {
			node.focus();
		}
	}
</script>

<div class="comment-form-container">
	{#if $session.data}
		<form onsubmit={handleSubmit} class="group space-y-4">
			<div class="relative">
				<textarea
					bind:value={content}
					onfocus={onInteraction}
					use:focusOnMount
					placeholder={replyToId ? "Write a thoughtful reply..." : "Share your thoughts on this article..."}
					class="w-full min-h-24 p-4 rounded-none bg-stone-50 dark:bg-stone-950 border border-black/5 dark:border-white/5 focus:border-amber-500 dark:focus:border-amber-500/50 outline-none transition-all resize-none text-[0.95rem] font-medium leading-relaxed placeholder:text-stone-400 dark:placeholder:text-stone-600 block shadow-inner"
					disabled={isSubmitting}
				></textarea>
				
				<div class="absolute bottom-4 right-6 flex items-center gap-4">
					{#if content.length > 1500}
						<span class="text-[10px] font-black {content.length > 2000 ? 'text-red-500' : 'text-stone-400'}">
							{content.length}/2000
						</span>
					{/if}
				</div>
			</div>
			
			{#if error}
				<div class="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-none animate-in fade-in slide-in-from-left-2">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
					<p class="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
				</div>
			{/if}

			<div class="flex items-center justify-end gap-4">
				{#if replyToId && !isSubmitting}
					<button 
						type="button"
						onclick={() => onSubmitted(null)}
						class="text-xs font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
					>
						Cancel
					</button>
				{/if}

				<button
					type="submit"
					disabled={isSubmitting || !content.trim() || content.length < MIN_COMMENT_LENGTH || content.length > MAX_COMMENT_LENGTH}
					class="relative overflow-hidden bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 px-8 py-3 rounded-none font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-black/10 dark:shadow-amber-500/10 hover:shadow-xl hover:scale-102 active:scale-98 disabled:opacity-50 disabled:grayscale disabled:scale-100 transition-all flex items-center gap-2 group"
				>
					{#if isSubmitting}
						<svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span>Sending...</span>
					{:else}
						<span>{replyToId ? 'Post Reply' : 'Post Comment'}</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="group-hover:translate-x-1 transition-transform"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
					{/if}
				</button>
			</div>
		</form>
	{:else}
		<div class="group relative overflow-hidden p-8 text-center bg-stone-50 dark:bg-stone-900/40 border-2 border-dashed border-black/5 dark:border-white/5 rounded-none hover:border-amber-500/20 transition-all">
			<div class="relative z-10 flex flex-col items-center gap-2">
				<div class="w-12 h-12 bg-white dark:bg-stone-800 rounded-none shadow-sm border border-black/5 dark:border-white/5 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500"><path d="M21 15a2 2 0 0 1-2 2H7l4-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
				</div>
				<p class="text-[0.95rem] font-bold text-stone-700 dark:text-stone-300">Join the conversation</p>
				<p class="text-xs font-medium text-stone-400 dark:text-stone-500 max-w-50">Sign in with your Google account to post comments and replies.</p>
			</div>
		</div>
	{/if}
</div>
