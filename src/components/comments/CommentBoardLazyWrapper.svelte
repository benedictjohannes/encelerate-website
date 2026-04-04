<script lang="ts">
	import { onMount, type Component } from "svelte";

	let { slug } = $props();
	let isMounted = $state(false);
	let CommentBoard: Component<{ slug: string }> | null = $state(null);

	onMount(async () => {
		const mod = await import("./CommentBoard.svelte");
		CommentBoard = mod.default;
		isMounted = true;
	});
</script>

{#if isMounted && CommentBoard}
	<CommentBoard {slug} />
{:else}
	<!-- Server-side / Pre-hydration placeholder to avoid FOUC and give Astro an element to observe -->
	<div class="comment-board-placeholder max-w-4xl mx-auto my-12 border-t border-black/5 dark:border-white/5 pt-10 min-h-100 flex flex-col items-center justify-center">
		<div class="animate-pulse space-y-6 w-full opacity-30">
			<div class="flex items-center gap-4">
				<div class="h-8 w-32 bg-stone-100 dark:bg-stone-800 rounded-none"></div>
				<div class="h-5 w-8 bg-stone-100 dark:bg-stone-800 rounded-none"></div>
			</div>
			
			<div class="space-y-3">
				<div class="h-32 bg-stone-100 dark:bg-stone-800 rounded-none w-full"></div>
				<div class="h-10 w-24 bg-stone-100 dark:bg-stone-800 rounded-none self-end"></div>
			</div>
			
			<div class="space-y-8 pt-8">
				{#each Array(2) as _}
					<div class="flex gap-4">
						<div class="w-10 h-10 bg-stone-100 dark:bg-stone-800 rounded-2xl"></div>
						<div class="flex-1 space-y-3">
							<div class="h-4 bg-stone-100 dark:bg-stone-800 rounded-none w-1/4"></div>
							<div class="h-20 bg-stone-100 dark:bg-stone-800 rounded-none w-full"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
