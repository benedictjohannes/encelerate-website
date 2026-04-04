<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor, mergeAttributes } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Mention from '@tiptap/extension-mention';
	import Placeholder from '@tiptap/extension-placeholder';

	let { 
		value = $bindable(), 
		placeholder = "", 
		disabled = false, 
		threadUsers = [],
		onInteraction = () => {},
		autofocus = false,
        currentUserId = null,
		className = "",
		mentionsEnabled = true
	}: {
		value: string,
		placeholder?: string,
		disabled?: boolean,
		threadUsers?: any[],
		onInteraction?: () => void,
		autofocus?: boolean,
        currentUserId?: string | null,
		className?: string,
		mentionsEnabled?: boolean
	} = $props();

	let editorElement: HTMLDivElement | null = $state(null);
	let editor: Editor | null = $state(null);

	// Suggestion Dropdown State
	let showMentionsPool = $state(false);
	let mentionSearch = $state("");
	let selectedUserIdx = $state(0);
	let dropdownPosition = $state({ top: 0, left: 0 });
	let range: any = null; // Tiptap range for the current mention being typed

	// Filtered candidates for the dropdown
	let mentionCandidates = $derived.by(() => {
		if (!mentionsEnabled) return [];
		const searchLower = mentionSearch.toLowerCase();
		return threadUsers
			.filter(user => {
				// Prevent double mentioning the same user
				const isAlreadyMentioned = new RegExp(`<mention[^>]+userid="${user.id}"`, 'i').test(value);
                const isSelf = user.id === currentUserId;
				const matchesSearch = user.name.toLowerCase().includes(searchLower);
				return !isAlreadyMentioned && !isSelf && matchesSearch;
			})
			.slice(0, 5);
	});

	// Custom Mention Extension to handle our specific tag format
	const CustomMention = Mention.extend({
        name: 'mention',

        addAttributes() {
            return {
                id: {
                    default: null,
                    parseHTML: element => element.getAttribute('userId') || element.getAttribute('userid'),
                    renderHTML: attributes => {
                        if (!attributes.id) return {}
                        return { userid: attributes.id }
                    },
                },
                label: {
                    default: null,
                    parseHTML: element => element.getAttribute('userName') || element.getAttribute('username'),
                    renderHTML: attributes => {
                        if (!attributes.label) return {}
                        return { username: attributes.label }
                    },
                },
            }
        },

		parseHTML() {
			return [
				{
					tag: 'mention',
				},
			];
		},

        renderHTML({ node, HTMLAttributes }) {
            return [
                'mention',
                mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                    class: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-sm font-bold border border-amber-200 dark:border-amber-500/30'
                }),
                `@${node.attrs.label}`,
            ]
        },
	});

	onMount(() => {
		editor = new Editor({
			element: editorElement!,
			extensions: [
				StarterKit.configure({
					bold: false,
					italic: false,
				}),
				Placeholder.configure({
					placeholder,
				}),
				CustomMention.configure({
					HTMLAttributes: {
						class: 'mention-chip',
					},
					suggestion: {
                        char: '@',
						items: ({ query }) => {
							if (!mentionsEnabled) return [];
							mentionSearch = query;
                            // Returning the current matches to Tiptap
							return threadUsers
								.filter(user => {
									const isAlreadyMentioned = new RegExp(`<mention[^>]+userid="${user.id}"`, 'i').test(value);
                                    const isSelf = user.id === currentUserId;
									const matchesSearch = user.name.toLowerCase().includes(query.toLowerCase());
									return !isAlreadyMentioned && !isSelf && matchesSearch;
								})
								.slice(0, 5);
						},
						render: () => {
							return {
								onStart: (props) => {
									showMentionsPool = true;
									mentionSearch = props.query;
									range = props.range;
									const coords = props.clientRect?.();
									if (coords) {
										dropdownPosition = { top: coords.top + 25, left: coords.left };
									} else {
                                        // Fallback to avoid hidden dropdown
                                        dropdownPosition = { top: window.innerHeight / 2, left: window.innerWidth / 2 };
                                    }
									selectedUserIdx = 0;
								},
								onUpdate: (props) => {
									mentionSearch = props.query;
									range = props.range;
									const coords = props.clientRect?.();
									if (coords) {
										dropdownPosition = { top: coords.top + 25, left: coords.left };
									}
								},
								onKeyDown: (props) => {
									if (props.event.key === 'Escape') {
										showMentionsPool = false;
										return true;
									}
									if (props.event.key === 'Enter') {
										if (mentionCandidates.length > 0) {
											selectUser(mentionCandidates[selectedUserIdx]);
											return true;
										}
									}
									if (props.event.key === 'ArrowUp') {
										const count = mentionCandidates.length;
                                        if (count === 0) return false;
										selectedUserIdx = (selectedUserIdx - 1 + count) % count;
										return true;
									}
									if (props.event.key === 'ArrowDown') {
										const count = mentionCandidates.length;
                                        if (count === 0) return false;
										selectedUserIdx = (selectedUserIdx + 1) % count;
										return true;
									}
									return false;
								},
								onExit: () => {
									showMentionsPool = false;
								},
							};
						},
					},
				}),
			],
			content: value,
			onUpdate({ editor }) {
				let html = editor.getHTML();
				// Convert <mention ...>@Name</mention> -> <mention ... />
				// Robust regex that handles attribute order and case
				html = html.replace(/<mention([^>]+)>(.*?)<\/mention>/gi, (match, attrs) => {
					const idMatch = attrs.match(/userid="([^"]+)"/i) || attrs.match(/userId="([^"]+)"/i);
					const nameMatch = attrs.match(/username="([^"]+)"/i) || attrs.match(/userName="([^"]+)"/i);
					if (idMatch && nameMatch) {
						return `<mention userid="${idMatch[1]}" username="${nameMatch[1]}" />`;
					}
					return match;
				});
                
                if (html.startsWith('<p>') && html.endsWith('</p>') && (html.match(/<p>/g) || []).length === 1) {
                    html = html.slice(3, -4);
                }
				value = html;
			},
			onCreate({ editor }) {
				if (autofocus) {
					setTimeout(() => editor.commands.focus('end'), 10);
				}
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	function selectUser(user: any) {
		if (editor && range) {
			editor
				.chain()
				.focus()
				.insertContentAt(range, {
					type: 'mention',
					attrs: { id: user.id, label: user.name },
				})
				.insertContent(' ')
				.run();
		}
		showMentionsPool = false;
	}

	$effect(() => {
		if (editor) {
            const currentHTML = editor.getHTML();
            if (value !== currentHTML) {
                // Determine if this is a pre-fill (e.g. from a Reply action)
                const isInitialPrefill = (value.startsWith('<mention') || value.startsWith('@')) && (currentHTML === '<p></p>' || currentHTML === '' || !editor.isFocused);
                
                if (isInitialPrefill) {
                    const mentionRegex = /<mention userid="([^"]+)" username="([^"]+)"/i;
                    const match = value.match(mentionRegex);
                    if (match) {
                        editor.chain()
                            .setContent('', { emitUpdate: false })
                            .insertContent({
                                type: 'mention',
                                attrs: { id: match[1], label: match[2] },
                            })
                            .insertContent(' ')
                            .focus('end')
                            .run();
                        return;
                    } else if (value.startsWith('@')) {
                        // For fallback mentions (@username )
                        editor.chain()
                            .setContent('', { emitUpdate: false })
                            .insertContent(value.trim())
                            .insertContent(' ')
                            .focus('end')
                            .run();
                        return;
                    }
                }

                if (!editor.isFocused || value === "") {
                    editor.commands.setContent(value, { emitUpdate: false, parseOptions: { preserveWhitespace: "full" } });
                }
            }
		}
	});
</script>

<div class="relative w-full">
	<div 
		bind:this={editorElement}
		onfocus={onInteraction}
		class="{className} w-full min-h-24 p-4 rounded-none bg-stone-50 dark:bg-stone-950 border border-black/5 dark:border-white/5 focus-within:border-amber-500/50 outline-none transition-all text-[0.95rem] font-medium leading-relaxed shadow-inner tiptap-editor"
	></div>

	{#if showMentionsPool && mentionCandidates.length > 0}
		<div 
			class="fixed z-9999 bg-stone-950 border border-amber-500/50 shadow-2xl backdrop-blur-md rounded-none overflow-hidden min-w-56 animate-in fade-in zoom-in-95 duration-100"
			style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
		>
			{#each mentionCandidates as user, i}
				<button 
					type="button"
					class="w-full text-left px-4 py-3 text-sm flex items-center gap-3 {selectedUserIdx === i ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-white/5'}"
					onclick={() => selectUser(user)}
					onmouseenter={() => selectedUserIdx = i}
				>
					<div class="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center text-[11px] font-black border border-white/10 uppercase">
						{user.name.charAt(0)}
					</div>
					<div class="flex flex-col">
						<span class="font-bold leading-none">{user.name}</span>
						<span class="text-[10px] opacity-50 mt-1 uppercase tracking-tighter">Enter to insert</span>
					</div>
					{#if selectedUserIdx === i}
						<span class="ml-auto text-[9px] font-black uppercase tracking-tighter opacity-70">SELECT</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	:global(.tiptap-editor .ProseMirror) {
		outline: none;
		min-height: 5rem;
		white-space: pre-wrap;
	}

	:global(.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: #94a3b8;
		pointer-events: none;
		height: 0;
	}

    :global(.mention-chip) {
        display: inline-block;
    }
</style>
