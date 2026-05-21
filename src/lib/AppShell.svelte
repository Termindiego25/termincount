<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		detectLanguage,
		languages,
		translate,
		type Language
	} from '$lib/i18n';
	import type { ResolvedTheme, ThemeMode } from '$lib/voting';

	export let currentLang: Language = 'es';
	export let onHome: (() => void) | undefined = undefined;

	const languageStorageKey = 'termincount.lang';
	const themeStorageKey = 'termincount.theme';

	let mobileMenuOpen = false;
	let themeMenuOpen = false;
	let themeMode: ThemeMode = 'auto';
	let resolvedTheme: ResolvedTheme = 'light';
	let prefersDark: MediaQueryList | null = null;

	$: if (browser) {
		document.documentElement.lang = currentLang;
	}

	function t(lang: Language, key: string, params?: Record<string, string | number>): string {
		return translate(lang, key, params);
	}

	function readStorage(key: string): string | null {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	}

	function writeStorage(key: string, value: string | null) {
		try {
			if (value) localStorage.setItem(key, value);
			else localStorage.removeItem(key);
		} catch {
			// The app still works if persistent storage is unavailable.
		}
	}

	function handleBrandClick(event: MouseEvent) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		if (browser && window.location.pathname === '/') {
			event.preventDefault();
			onHome?.();
		}
		themeMenuOpen = false;
		closeMobileMenu();
	}

	function setLanguage(lang: Language) {
		currentLang = lang;
		writeStorage(languageStorageKey, lang);
	}

	function resolveTheme(mode: ThemeMode): ResolvedTheme {
		if (mode === 'light' || mode === 'dark') return mode;
		return prefersDark?.matches ? 'dark' : 'light';
	}

	function labelForMode(lang: Language, mode: ThemeMode | ResolvedTheme): string {
		if (mode === 'light') return t(lang, 'theme.mode.light');
		if (mode === 'dark') return t(lang, 'theme.mode.dark');
		return t(lang, 'theme.mode.auto');
	}

	function applyTheme(mode: ThemeMode) {
		themeMode = mode;
		resolvedTheme = resolveTheme(mode);
		if (!browser) return;

		document.documentElement.setAttribute('data-theme', resolvedTheme);
		document.documentElement.setAttribute('data-theme-mode', themeMode);
		document.getElementById('meta-theme-color')?.setAttribute(
			'content',
			resolvedTheme === 'dark' ? '#111827' : '#ffffff'
		);
	}

	function setTheme(mode: ThemeMode) {
		writeStorage(themeStorageKey, mode === 'auto' ? null : mode);
		try {
			localStorage.removeItem('ts-theme');
		} catch {
			// Ignore legacy cleanup failures.
		}
		applyTheme(mode);
		themeMenuOpen = false;
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function toggleThemeMenu() {
		themeMenuOpen = !themeMenuOpen;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!(event.target instanceof HTMLElement)) return;
		if (!event.target.closest('.theme-menu')) themeMenuOpen = false;
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		themeMenuOpen = false;
		closeMobileMenu();
	}

	onMount(() => {
		currentLang = detectLanguage(navigator.language, readStorage(languageStorageKey) ?? currentLang);
		prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
		const storedTheme = readStorage(themeStorageKey) || readStorage('ts-theme');
		const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'auto';
		applyTheme(initialTheme);

		const themeListener = () => {
			if (themeMode === 'auto') applyTheme('auto');
		};
		prefersDark.addEventListener('change', themeListener);

		return () => {
			prefersDark?.removeEventListener('change', themeListener);
		};
	});
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleEscape} />

<div class="bg d-flex flex-column min-vh-100">
	<div class="container app-container py-4 flex-grow-1">
		<header class="d-flex align-items-center justify-content-between no-wrap gap-3 border-bottom pb-3 mb-4">
			<a class="brand" href="/" aria-label="Inicio" onclick={handleBrandClick}>
				<div class="d-flex align-items-center gap-3">
					<img src="/images/termincount.png" alt="TerminCount" class="brand-logo flex-shrink-0" />
					<h1 class="h3 mb-0 brand-text">{t(currentLang, 'header.title')}</h1>
				</div>
			</a>

			<nav class="nav" aria-label={t(currentLang, 'nav.primary')}>
				<button
					class="menu-toggle"
					type="button"
					aria-controls="primary-nav"
					aria-expanded={mobileMenuOpen}
					aria-label={mobileMenuOpen ? t(currentLang, 'nav.menu.close') : t(currentLang, 'nav.menu.open')}
					onclick={toggleMobileMenu}
				>
					☰
				</button>

				<button
					id="nav-backdrop"
					class="nav-backdrop"
					class:open={mobileMenuOpen}
					hidden={!mobileMenuOpen}
					type="button"
					aria-label={t(currentLang, 'nav.menu.close')}
					onclick={closeMobileMenu}
				></button>

				<div id="primary-nav" class="nav-links" class:open={mobileMenuOpen}>
					<a
						href="https://github.com/termindiego25/termincount"
						target="_blank"
						rel="noopener noreferrer"
					>
						{t(currentLang, 'nav.github')}
					</a>

					<div class="utility-controls">
						<div class="select-shell">
							<span class="control-icon" aria-hidden="true">
								<svg class="icon" viewBox="0 0 24 24" focusable="false">
									<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 9h-3.25a15.1 15.1 0 0 0-1.19-5.1A8.04 8.04 0 0 1 18.9 11ZM12 4.04c.73 1.05 1.45 3.2 1.63 6.96h-3.26C10.55 7.24 11.27 5.09 12 4.04ZM4.25 13h3.08c.12 2.02.46 3.82.98 5.19A8.02 8.02 0 0 1 4.25 13Zm3.08-2H4.25a8.02 8.02 0 0 1 4.06-5.19A15.87 15.87 0 0 0 7.33 11ZM12 19.96c-.73-1.05-1.45-3.2-1.63-6.96h3.26c-.18 3.76-.9 5.91-1.63 6.96Zm3.69-1.77c.52-1.37.86-3.17.98-5.19h3.08a8.02 8.02 0 0 1-4.06 5.19Z" />
								</svg>
							</span>
							<select
								id="lang-select"
								class="btn btn-ghost small"
								aria-label={t(currentLang, 'label.lang')}
								value={currentLang}
								onchange={(event) => setLanguage(event.currentTarget.value as Language)}
							>
								{#each languages as lang}
									<option value={lang.code} lang={lang.code}>{lang.label}</option>
								{/each}
							</select>
						</div>

						<div class="theme-menu">
							<button
								class="btn btn-ghost small theme-menu-toggle"
								type="button"
								data-action="theme-menu"
								aria-haspopup="true"
								aria-expanded={themeMenuOpen}
								aria-controls="theme-menu-panel"
								aria-label={t(currentLang, 'theme.menu.current', {
									mode: labelForMode(currentLang, themeMode),
									resolved: labelForMode(currentLang, resolvedTheme)
								})}
								onclick={toggleThemeMenu}
							>
								<svg class="icon palette-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
									<path d="M12 3a9 9 0 0 0 0 18h1.15a2.7 2.7 0 0 0 1.62-4.86 1 1 0 0 1 .6-1.8H17a4 4 0 0 0 0-8h-.21A8.95 8.95 0 0 0 12 3Zm-4.25 8.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm3-3.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm4.25.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm-7 7a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
								</svg>
								<span class="theme-current" data-theme-current>{labelForMode(currentLang, themeMode)}</span>
								<svg class="icon chevron-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
									<path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z" />
								</svg>
							</button>

							<div id="theme-menu-panel" class="theme-menu-panel" role="menu" hidden={!themeMenuOpen}>
								<button
									class="theme-option"
									class:active={themeMode === 'auto'}
									type="button"
									role="menuitemradio"
									data-theme-choice="auto"
									aria-checked={themeMode === 'auto'}
									onclick={() => setTheme('auto')}
								>
									<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
										<path d="M4 5h16v10H4V5Zm7 12h2v2h4v2H7v-2h4v-2ZM2 5c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Z" />
									</svg>
									<span>{t(currentLang, 'theme.mode.auto')}</span>
								</button>

								<button
									class="theme-option"
									class:active={themeMode === 'light'}
									type="button"
									role="menuitemradio"
									data-theme-choice="light"
									aria-checked={themeMode === 'light'}
									onclick={() => setTheme('light')}
								>
									<svg class="icon sun-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
										<path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0-5 1.1 3h-2.2L12 2Zm0 20-1.1-3h2.2L12 22ZM2 12l3-1.1v2.2L2 12Zm20 0-3 1.1v-2.2L22 12ZM4.22 4.22l2.9 1.34-1.56 1.56-1.34-2.9Zm15.56 15.56-2.9-1.34 1.56-1.56 1.34 2.9Zm0-15.56-1.34 2.9-1.56-1.56 2.9-1.34ZM4.22 19.78l1.34-2.9 1.56 1.56-2.9 1.34Z" />
									</svg>
									<span>{t(currentLang, 'theme.mode.light')}</span>
								</button>

								<button
									class="theme-option"
									class:active={themeMode === 'dark'}
									type="button"
									role="menuitemradio"
									data-theme-choice="dark"
									aria-checked={themeMode === 'dark'}
									onclick={() => setTheme('dark')}
								>
									<svg class="icon moon-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
										<path d="M20.5 14.7A8.5 8.5 0 0 1 9.3 3.5 9.5 9.5 0 1 0 20.5 14.7Z" />
									</svg>
									<span>{t(currentLang, 'theme.mode.dark')}</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</nav>
		</header>

		<slot />
	</div>

	<footer class="text-center py-3 mt-auto small">
		<p class="legal-line">{t(currentLang, 'footer')}</p>
		<a
			href="https://github.com/Termindiego25"
			target="_blank"
			rel="noopener noreferrer me"
			aria-label="GitHub"
			class="social-inline"
		>
			<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
				<path d="M8 0C3.58 0 0 3.68 0 8.22c0 3.63 2.29 6.71 5.47 7.8.4.08.55-.18.55-.4 0-.2-.01-.86-.01-1.56-2.01.38-2.53-.5-2.69-.96-.09-.24-.48-.96-.82-1.15-.28-.16-.68-.55-.01-.56.63-.01 1.08.6 1.23.85.72 1.24 1.87.89 2.33.68.07-.53.28-.89.51-1.09-1.78-.21-3.64-.91-3.64-4.05 0-.9.31-1.63.82-2.21-.08-.21-.36-1.05.08-2.18 0 0 .67-.22 2.2.84A7.4 7.4 0 0 1 8 3.95c.68 0 1.36.09 2 .28 1.53-1.06 2.2-.84 2.2-.84.44 1.13.16 1.97.08 2.18.51.58.82 1.31.82 2.21 0 3.15-1.87 3.84-3.65 4.05.29.26.54.76.54 1.54 0 1.11-.01 2-.01 2.28 0 .22.15.48.55.4A8.13 8.13 0 0 0 16 8.22C16 3.68 12.42 0 8 0Z" />
			</svg>
			<span class="visually-hidden">GitHub</span>
		</a>
		<a
			href="https://linkedin.com/in/diegosr1998"
			target="_blank"
			rel="noopener noreferrer me"
			aria-label="LinkedIn"
			class="social-inline"
		>
			<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
				<path d="M1.15 0h13.7C15.49 0 16 .51 16 1.14v13.72c0 .63-.51 1.14-1.15 1.14H1.15C.51 16 0 15.49 0 14.86V1.14C0 .51.51 0 1.15 0Zm3.69 13.39V6.16H2.43v7.23h2.41ZM3.63 5.17c.84 0 1.36-.55 1.36-1.25-.02-.71-.52-1.25-1.34-1.25-.82 0-1.36.54-1.36 1.25 0 .7.52 1.25 1.32 1.25h.02Zm9.94 8.22V9.24c0-2.22-1.19-3.25-2.77-3.25-1.28 0-1.85.7-2.17 1.2V6.16H6.22c.03.68 0 7.23 0 7.23h2.41V9.35c0-.22.02-.43.08-.59.17-.43.56-.88 1.21-.88.85 0 1.19.65 1.19 1.6v3.91h2.46Z" />
			</svg>
			<span class="visually-hidden">LinkedIn</span>
		</a>
		<a href="mailto:diego@diegosr.es" target="_blank" rel="noopener noreferrer me" aria-label="Mail" class="social-inline">
			<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
				<path d="M1.5 2h13A1.5 1.5 0 0 1 16 3.5v9A1.5 1.5 0 0 1 14.5 14h-13A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2Zm0 1.25a.25.25 0 0 0-.25.25v.31L8 8.03l6.75-4.22V3.5a.25.25 0 0 0-.25-.25h-13Zm13.25 2.04-6.42 4.01a.62.62 0 0 1-.66 0L1.25 5.29v7.21c0 .14.11.25.25.25h13a.25.25 0 0 0 .25-.25V5.29Z" />
			</svg>
			<span class="visually-hidden">Mail</span>
		</a>
	</footer>
</div>
