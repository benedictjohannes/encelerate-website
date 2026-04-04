<script lang="ts">
	import { onMount } from "svelte";
	import { actions } from "astro:actions";
	import AuthSection from "./AuthSection.svelte";
	import CommentForm from "./CommentForm.svelte";
	import CommentList from "./CommentList.svelte";

	let { slug } = $props();
	
	let comments = $state<any[]>([]);
	let isLoading = $state(true);
	let highlightedId = $state<string | null>(null);

	function scrollToComment(id: string) {
		highlightedId = id;
		// Wait for DOM
		setTimeout(() => {
			const el = document.getElementById(`comment-${id}`);
			if (el) {
				const yOffset = -100; // Account for sticky headers or breathing room
				const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
				window.scrollTo({ top: y, behavior: "smooth" });
			}
		}, 0);
	}

	function clearHighlight() {
		if (highlightedId) highlightedId = null;
	}

	// Recursive count of all comments
	let totalCommentsCount = $derived.by(() => {
		const count = (list: any[]): number => {
			return list.reduce((acc, c) => acc + (c.deletedAt ? 0 : 1) + count(c.replies || []), 0);
		};
		return count(comments);
	});

	onMount(async () => {
		try {
			const { data, error } = await actions.getComments({ slug });
			if (data) {
				comments = data;
				
				// Handle URL Highlight
				const urlParams = new URLSearchParams(window.location.search);
				const highlightId = urlParams.get("highlightCommentId");
				if (highlightId) {
					scrollToComment(highlightId);
					
					// Clean URL
					const newUrl = new URL(window.location.href);
					newUrl.searchParams.delete("highlightCommentId");
					window.history.replaceState({}, "", newUrl);
				}
			}
		} catch (e) {
			console.error("Failed to load comments:", e);
		} finally {
			isLoading = false;
		}
	});

	function handleCommentAdded(newComment: any) {
		// Remove highlight when interaction happens
		clearHighlight();

		if (newComment.parentId) {
			// Find root parent and add to its replies (Action already groups them under parentId)
			// Our action logic: dbParentId = targetComment.parentId ?? targetComment.id;
			// So we just need to find the comment with id === newComment.parentId
			const updateTree = (list: any[]) => {
				for (let c of list) {
					if (c.id === newComment.parentId) {
						c.replies = [...(c.replies || []), newComment];
						return true;
					}
					if (c.replies && updateTree(c.replies)) return true;
				}
				return false;
			};
			updateTree(comments);
		} else {
			// Top-level comment
			comments = [newComment, ...comments];
		}
	}

	function handleCommentDeleted(id: string) {
		const updateTree = (list: any[]) => {
			for (let c of list) {
				if (c.id === id) {
					c.deletedAt = new Date();
					c.content = "";
					return true;
				}
				if (c.replies && updateTree(c.replies)) return true;
			}
			return false;
		};
		updateTree(comments);
	}
</script>

<div class="comment-board max-w-4xl mx-auto my-12 border-t border-black/5 dark:border-white/5 pt-10 animate-in fade-in duration-700">
	<header class="flex items-center justify-between gap-4 mb-2 flex-wrap">
		<div class="flex items-center gap-4">
			<h2 class="text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">Comments</h2>
			<div class="px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black rounded-none text-xs font-black">
				{totalCommentsCount}
			</div>
		</div>

		<AuthSection />
	</header>

	<div class="space-y-4">
		<!-- Main Post Form -->
		<div class="bg-white dark:bg-stone-950 p-1 sm:p-2 rounded-none border border-black/5 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-none">
			<CommentForm {slug} onSubmitted={handleCommentAdded} onInteraction={clearHighlight} />
		</div>

		<!-- List -->
		{#if isLoading}
			<div class="space-y-8 mt-12 py-10">
				{#each Array(3) as _}
					<div class="flex gap-4 animate-pulse">
						<div class="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-2xl"></div>
						<div class="flex-1 space-y-3">
							<div class="h-4 bg-stone-100 dark:bg-stone-800 rounded-none w-1/4"></div>
							<div class="h-20 bg-stone-100 dark:bg-stone-800 rounded-none w-full"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<CommentList 
				{comments} 
				{slug} 
				{highlightedId}
				onCommentAdded={handleCommentAdded} 
				onCommentDeleted={handleCommentDeleted} 
				onScrollToComment={scrollToComment}
				{clearHighlight}
			/>
		{/if}
	</div>
</div>
