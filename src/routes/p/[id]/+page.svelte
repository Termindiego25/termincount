<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import AppShell from '$lib/AppShell.svelte';
	import { translate, type Language } from '$lib/i18n';
	import { isPollExpired, totalVotesFor, type PollResult } from '$lib/polls';
	import { percentage } from '$lib/voting';
	import type { PageData } from './$types';

	export let data: PageData;

	let currentLang: Language = data.poll.language;
	let poll: PollResult = data.poll;
	let canManage = data.canManage;
	let shareUrl = data.shareUrl;
	let qrDataUrl = '';
	let copyState: 'idle' | 'copied' | 'selected' | 'failed' = 'idle';
	let liveState: 'connecting' | 'connected' | 'disconnected' = 'connecting';
	let actionError = '';
	let flashIndex: number | null = null;
	let flashTimer: number | undefined;
	let now = Date.now();
	let clockTimer: number | undefined;
	let shareInput: HTMLInputElement | undefined;

	$: pageTitle = `${poll.title} - TerminCount`;
	$: totalVotes = totalVotesFor(poll);
	$: expired = isPollExpired(poll, now);
	$: expiresLabel = new Intl.DateTimeFormat(currentLang, {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(poll.expiresAt));

	function t(lang: Language, key: string, params?: Record<string, string | number>): string {
		return translate(lang, key, params);
	}

	function releasePointerFocus(event: MouseEvent) {
		if (event.detail === 0) return;
		const target = event.currentTarget as HTMLElement;
		window.requestAnimationFrame(() => {
			if (document.activeElement === target) {
				target.blur();
			}
		});
	}

	async function vote(index: number) {
		if (!canManage || expired) return;
		actionError = '';

		try {
			const response = await fetch(`/api/polls/${poll.id}/vote`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ index })
			});
			if (!response.ok) throw new Error(`Vote failed with ${response.status}`);
			const result = (await response.json()) as { poll: PollResult };
			poll = result.poll;
			flash(index);
		} catch {
			actionError = t(currentLang, 'error.vote');
		}
	}

	function handleVoteClick(index: number, event: MouseEvent) {
		void vote(index);
		releasePointerFocus(event);
	}

	async function undoLastVote() {
		if (!canManage || expired) return;
		actionError = '';

		try {
			const response = await fetch(`/api/polls/${poll.id}/undo`, { method: 'POST' });
			if (!response.ok) throw new Error(`Undo failed with ${response.status}`);
			const result = (await response.json()) as { poll: PollResult };
			const changedIndex = poll.options.findIndex((option, index) => {
				const next = result.poll.options[index];
				return next && next.votes !== option.votes;
			});
			poll = result.poll;
			if (changedIndex >= 0) flash(changedIndex);
		} catch {
			actionError = t(currentLang, 'error.vote');
		}
	}

	function handleUndoClick(event: MouseEvent) {
		void undoLastVote();
		releasePointerFocus(event);
	}

	function flash(index: number) {
		flashIndex = index;
		if (flashTimer) window.clearTimeout(flashTimer);
		flashTimer = window.setTimeout(() => {
			flashIndex = null;
		}, 460);
	}

	function shouldIgnoreShortcutTarget(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		if (target.closest('input, textarea, select, [contenteditable="true"]')) return true;

		const focusedButton = target.closest('button');
		return Boolean(focusedButton && !focusedButton.matches('.vote-option, #deshacer'));
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (!canManage || expired || event.defaultPrevented || shouldIgnoreShortcutTarget(event.target)) return;

		if (event.key === 'r' || event.key === 'R') {
			event.preventDefault();
			void undoLastVote();
			return;
		}

		const numeric = Number.parseInt(event.key, 10);
		if (Number.isInteger(numeric) && numeric >= 1 && numeric <= poll.options.length) {
			event.preventDefault();
			void vote(numeric - 1);
		}
	}

	async function copyShareLink() {
		copyState = 'idle';
		const copied = await writeClipboardText(shareUrl);
		if (copied) {
			copyState = 'copied';
			window.setTimeout(() => {
				copyState = 'idle';
			}, 1800);
			return;
		}

		shareInput?.focus();
		shareInput?.select();
		copyState = shareInput ? 'selected' : 'failed';
	}

	async function writeClipboardText(value: string): Promise<boolean> {
		if (navigator.clipboard?.writeText && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(value);
				return true;
			} catch {
				// Fall back to a selected textarea for browsers that deny async clipboard writes.
			}
		}

		if (shareInput) {
			const focused = document.activeElement;
			shareInput.focus();
			shareInput.select();
			shareInput.setSelectionRange(0, shareInput.value.length);

			try {
				const copied = document.execCommand('copy');
				if (copied && focused instanceof HTMLElement) focused.focus();
				return copied;
			} catch {
				return false;
			}
		}

		const textarea = document.createElement('textarea');
		textarea.value = value;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.inset = '0 auto auto -9999px';
		document.body.append(textarea);
		textarea.select();
		textarea.setSelectionRange(0, textarea.value.length);

		try {
			return document.execCommand('copy');
		} catch {
			return false;
		} finally {
			textarea.remove();
		}
	}

	onMount(() => {
		if (canManage && !expired) {
			QRCode.toDataURL(shareUrl, {
				errorCorrectionLevel: 'M',
				margin: 1,
				width: 184
			}).then((url) => {
				qrDataUrl = url;
			});
		}

		const events = new EventSource(`/api/polls/${poll.id}/events`);
		events.addEventListener('open', () => {
			liveState = 'connected';
		});
		events.addEventListener('poll', (event) => {
			liveState = 'connected';
			poll = JSON.parse((event as MessageEvent).data) as PollResult;
		});
		events.addEventListener('expired', () => {
			now = Date.now();
			liveState = 'disconnected';
			events.close();
		});
		events.addEventListener('error', () => {
			liveState = 'disconnected';
		});

		clockTimer = window.setInterval(() => {
			now = Date.now();
		}, 30_000);

		return () => {
			events.close();
			if (clockTimer) window.clearInterval(clockTimer);
			if (flashTimer) window.clearTimeout(flashTimer);
		};
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<svelte:window onkeydown={handleGlobalKeydown} />

<AppShell bind:currentLang>
	{#if canManage && !expired}
		<div class="owner-tools mb-3">
			<nav aria-labelledby="shortcut-heading" class="tool-panel shortcut-panel">
				<div class="tool-panel-heading">
					<h3 id="shortcut-heading" class="h6 fw-semibold mb-0">{t(currentLang, 'shortcut.heading')}</h3>
					<button id="deshacer" type="button" class="btn btn-sm btn-outline-danger" onclick={handleUndoClick}>
						{t(currentLang, 'btn.undo')}
					</button>
				</div>
				<ul class="shortcut-list small mb-0" id="lista">
					{#each poll.options as option, index}
						<li>
							<span class="shortcut-key">{index + 1}</span>
							<span>{option.label}</span>
						</li>
					{/each}
				</ul>
			</nav>

			<section class="tool-panel share-panel" aria-labelledby="share-heading">
				<div class="share-copy">
					<div class="tool-panel-heading">
						<h3 id="share-heading" class="h6 fw-semibold mb-0">{t(currentLang, 'share.heading')}</h3>
						<span class="small text-body-secondary">
							{t(currentLang, 'share.expires', { date: expiresLabel })}
						</span>
					</div>
					<div class="share-link-box">
						<input
							bind:this={shareInput}
							class="form-control share-link-input"
							readonly
							value={shareUrl}
							aria-label={shareUrl}
						/>
						<button class="btn btn-outline-secondary" type="button" onclick={copyShareLink}>
							{#if copyState === 'copied'}
								{t(currentLang, 'btn.copied')}
							{:else if copyState === 'selected'}
								{t(currentLang, 'btn.selected')}
							{:else}
								{t(currentLang, 'btn.copy')}
							{/if}
						</button>
						<span class="copy-feedback form-text" class:text-danger={copyState === 'failed'} aria-live="polite">
							{#if copyState === 'failed'}
								{t(currentLang, 'share.copy.error')}
							{:else if copyState === 'copied'}
								{t(currentLang, 'btn.copied')}
							{:else if copyState === 'selected'}
								{t(currentLang, 'share.copy.selected')}
							{/if}
						</span>
					</div>
				</div>
				{#if qrDataUrl}
					<img class="share-qr" src={qrDataUrl} alt={t(currentLang, 'share.qr.alt')} />
				{/if}
			</section>
		</div>
	{/if}

	<div class="poll-status-row mb-3">
		<span class="status-pill" class:readonly={!canManage} class:expired>
			{#if expired}
				{t(currentLang, 'poll.expired')}
			{:else if canManage}
				{t(currentLang, 'poll.owner')}
			{:else}
				{t(currentLang, 'poll.readonly')}
			{/if}
		</span>
		<span class={`live-pill ${liveState}`}>
			<span class="live-dot" aria-hidden="true"></span>
			{t(currentLang, `live.${liveState}`)}
		</span>
	</div>

	{#if !canManage}
		<div class="alert alert-info" role="status">{t(currentLang, 'poll.readonly.help')}</div>
	{/if}

	{#if actionError}
		<div class="alert alert-danger" role="alert">{actionError}</div>
	{/if}

	<h2 id="question" class="text-primary h4">{poll.title}</h2>

	<div class="row g-4">
		<div class="col-12" id="col-lg-12">
			<h3 class="h6 fw-semibold">
				<span>{t(currentLang, 'votes.emitted')}</span>
				<span id="votos-emitidos" class="badge text-bg-info">{totalVotes}</span>
			</h3>
			<ul id="option-container" class="list-unstyled" aria-live="polite" role="list">
				{#each poll.options as option, index}
					{@const pct = percentage(option.votes, totalVotes)}
					<li class="mb-3">
						{#if canManage && !expired}
							<button
								type="button"
								class="vote-option p-3 rounded border bg-white position-relative w-100 text-start"
								class:flash={flashIndex === index}
								data-index={index}
								aria-keyshortcuts={String(index + 1)}
								aria-label={t(currentLang, 'vote.option.aria', { n: index + 1, label: option.label })}
								onclick={(event) => handleVoteClick(index, event)}
							>
								<span class="option-heading h6 mb-2 d-flex align-items-center gap-2 flex-wrap">
									<span class="option-label-text flex-grow-1">{option.label}</span>
									<span id={`slot-${index}-label`} class="badge text-bg-secondary">{option.votes}</span>
									<span class="option-percentage text-body-secondary small">{pct}%</span>
								</span>
								<span class="progress vote-progress">
									<progress
										id={`slot-${index}`}
										class={`vote-meter ${option.barType}`}
										value={pct}
										max="100"
										aria-valuetext={`${option.votes} (${pct}%)`}
									>
										{pct}%
									</progress>
								</span>
							</button>
						{:else}
							<div
								class="vote-option readonly p-3 rounded border bg-white position-relative w-100 text-start"
								class:flash={flashIndex === index}
								data-index={index}
							>
								<span class="option-heading h6 mb-2 d-flex align-items-center gap-2 flex-wrap">
									<span class="option-label-text flex-grow-1">{option.label}</span>
									<span id={`slot-${index}-label`} class="badge text-bg-secondary">{option.votes}</span>
									<span class="option-percentage text-body-secondary small">{pct}%</span>
								</span>
								<span class="progress vote-progress">
									<progress
										id={`slot-${index}`}
										class={`vote-meter ${option.barType}`}
										value={pct}
										max="100"
										aria-valuetext={`${option.votes} (${pct}%)`}
									>
										{pct}%
									</progress>
								</span>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>
</AppShell>
