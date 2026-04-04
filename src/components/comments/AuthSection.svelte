<script lang="ts">
	import { authClient } from "../../lib/auth.client";
	import { actions } from "astro:actions";

	let session = authClient.useSession();
	let showDropdown = $state(false);

	// Preferences state synced with session when it loads
	let emailEnabled = $state(true);
	let limitEnabled = $state(true);
	let unit = $state("days");
	let displayValue = $state(1);

	// Sync logic
	$effect(() => {
		if ($session.data?.user) {
			const user = $session.data.user as any;
			emailEnabled = user.emailNotificationsEnabled ?? true;
			const rateLimit = user.notificationRateLimitHours ?? 24;
			limitEnabled = rateLimit > 0;
			unit = rateLimit >= 24 ? "days" : "hours";
			displayValue = unit === "days" ? Math.max(1, Math.round(rateLimit / 24)) : Math.max(1, rateLimit);
		}
	});

	async function updatePrefs() {
		const finalRateLimit = limitEnabled ? (unit === "days" ? displayValue * 24 : displayValue) : 0;
		await actions.updateUserPreferences({
			emailNotificationsEnabled: emailEnabled,
			notificationRateLimitHours: finalRateLimit,
		});
		await $session.refetch?.();
	}

	async function signIn() {
		const { data, error } = await authClient.signIn.social({ 
			provider: "google",
			callbackURL: "/auth/callback",
			disableRedirect: true
		});

		if (error) {
			console.error("Sign-in error:", error);
			return;
		}

		if (data?.url) {
			const popup = window.open(
				data.url,
				"better_auth_popup",
				"width=480,height=640"
			);

			const handleMessage = async (event: MessageEvent) => {
				if (event.origin !== window.location.origin) return;

				if (event.data === "better-auth-callback-success") {
					window.removeEventListener("message", handleMessage);
					popup?.close();
					await $session.refetch?.();
				}
			};

			window.addEventListener("message", handleMessage);

			const checkPopup = setInterval(() => {
				if (popup?.closed) {
					clearInterval(checkPopup);
					window.removeEventListener("message", handleMessage);
				}
			}, 1000);
		}
	}

	async function signOut() {
		await authClient.signOut();
		showDropdown = false;
	}
</script>

<div class="relative">
	{#if $session.isPending}
		<div class="animate-pulse h-10 w-40 bg-stone-100 dark:bg-stone-800 rounded-none border border-black/5 dark:border-white/5"></div>
	{:else if $session.data}
		<div class="flex items-center gap-3">
			<button 
				onclick={() => (showDropdown = !showDropdown)}
				class="group flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 p-1 pr-3 rounded-none transition-all border border-transparent hover:border-black/10 dark:hover:border-white/10"
			>
				{#if $session.data?.user?.image}
					<img src={$session.data.user.image} alt={$session.data.user.name} class="w-8 h-8 rounded-full border border-black/5 dark:border-white/5 shadow-sm" />
				{:else}
					<div class="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/20">
						{$session.data?.user?.name.charAt(0)}
					</div>
				{/if}
				<span class="text-sm font-black text-stone-900 dark:text-stone-100 leading-tight hidden sm:inline">{$session.data?.user?.name}</span>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					width="14" 
					height="14" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="3" 
					stroke-linecap="round" 
					stroke-linejoin="round" 
					class="text-stone-400 transition-transform duration-200 {showDropdown ? 'rotate-180' : ''}"
				>
					<path d="m6 9 6 6 6-6"/>
				</svg>
			</button>

			{#if showDropdown}
				<!-- Overlays click-away -->
				<button 
					class="fixed inset-0 z-40 cursor-default" 
					onclick={() => (showDropdown = false)}
					aria-label="Close dropdown"
				></button>

				<div class="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-stone-950 border border-black/10 dark:border-white/10 rounded-none shadow-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
					<div class="space-y-4">
						<header class="pb-1">
							<h3 class="text-[0.65rem] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.15em]">Notification Settings</h3>
						</header>
						
						<div class="space-y-4">
							<!-- Main Toggle -->
							<label class="flex items-center justify-between cursor-pointer group">
								<span class="text-sm font-medium text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors">Email notifications</span>
								<div class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" bind:checked={emailEnabled} onchange={updatePrefs} class="sr-only peer">
									<div class="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-none peer dark:bg-stone-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
								</div>
							</label>

							{#if emailEnabled}
								<div class="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
									<!-- Rate Limit Toggle -->
									<label class="flex items-center justify-between cursor-pointer group">
										<div class="flex flex-col">
											<span class="text-sm font-medium text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors">Limit frequency</span>
											<span class="text-[0.6rem] text-stone-400">Prevents notification spam</span>
										</div>
										<div class="relative inline-flex items-center cursor-pointer">
											<input type="checkbox" bind:checked={limitEnabled} onchange={updatePrefs} class="sr-only peer">
											<div class="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-none peer dark:bg-stone-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-gray-300 after:border after:rounded-none after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
										</div>
									</label>

									{#if limitEnabled}
										<div class="flex items-center gap-2 p-3 bg-stone-50 dark:bg-white/5 rounded-none border border-black/5 dark:border-white/5 animate-in fade-in slide-in-from-top-2">
											<input 
												type="number" 
												bind:value={displayValue} 
												onchange={updatePrefs}
												min="1" 
												max={unit === "days" ? 30 : 720}
												class="w-14 px-2 py-1 text-sm font-bold border border-stone-200 dark:border-stone-800 rounded-none bg-white dark:bg-stone-900 focus:border-amber-500 outline-none"
											/>
											<select 
												bind:value={unit} 
												onchange={updatePrefs}
												class="flex-1 text-sm font-semibold border border-stone-200 dark:border-stone-800 rounded-none bg-white dark:bg-stone-900 px-2 py-1 focus:border-amber-500 outline-none"
											>
												<option value="hours">Hours</option>
												<option value="days">Days</option>
											</select>
										</div>
									{/if}
								</div>
							{/if}
						</div>

						<footer class="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
							<button 
								onclick={signOut}
								class="w-full text-left text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-none transition-all flex items-center gap-2 group"
							>
								<div class="w-8 h-8 rounded-none bg-red-50 dark:bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
								</div>
								Sign out
							</button>
						</footer>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<button 
			onclick={signIn}
			class="flex items-center gap-3 bg-white dark:bg-stone-900 border border-black/10 dark:border-white/10 px-5 py-2.5 rounded-none font-bold text-sm shadow-sm hover:shadow-md hover:border-black/20 dark:hover:border-white/20 transition-all active:scale-95 group"
		>
			<svg width="18" height="18" viewBox="0 0 18 18" class="group-hover:scale-110 transition-transform">
				<path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
				<path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
				<path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.171.282-1.712V4.957H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.043l3.007-2.331z" fill="#FBBC05"/>
				<path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
			</svg>
			Sign in with Google
		</button>
	{/if}
</div>
