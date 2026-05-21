<script lang="ts">
	import { goto } from '$app/navigation';
	import AppShell from '$lib/AppShell.svelte';
	import { translate, type Language } from '$lib/i18n';
	import { MAX_OPTIONS } from '$lib/voting';

	let currentLang: Language = 'es';
	let title = '';
	let optionInputs = [''];
	let isCreating = false;
	let createError = '';

	$: pageTitle = t(currentLang, 'app.title');

	function t(lang: Language, key: string, params?: Record<string, string | number>): string {
		return translate(lang, key, params);
	}

	function addEntry() {
		if (optionInputs.length >= MAX_OPTIONS) return;
		optionInputs = [...optionInputs, ''];
	}

	function updateOption(index: number, value: string) {
		optionInputs = optionInputs.map((option, optionIndex) =>
			optionIndex === index ? value : option
		);
	}

	function resetToHome() {
		title = '';
		optionInputs = [''];
		isCreating = false;
		createError = '';
	}

	async function startPoll() {
		if (isCreating) return;
		isCreating = true;
		createError = '';

		try {
			const response = await fetch('/api/polls', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					title,
					options: optionInputs,
					language: currentLang
				})
			});

			if (!response.ok) throw new Error(`Poll creation failed with ${response.status}`);
			const result = (await response.json()) as { poll: { id: string } };
			await goto(`/p/${result.poll.id}`);
		} catch {
			createError = t(currentLang, 'error.create');
		} finally {
			isCreating = false;
		}
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<AppShell bind:currentLang onHome={resetToHome}>
	<div class="row g-4">
		<div class="col-12" id="input">
			<h3 class="h5 mb-3">{t(currentLang, 'config.heading')}</h3>

			{#if createError}
				<div class="alert alert-danger" role="alert">{createError}</div>
			{/if}

			<div class="mb-3">
				<label for="title" class="form-label">{t(currentLang, 'label.title')}</label>
				<input
					type="text"
					id="title"
					class="form-control"
					placeholder={t(currentLang, 'ph.title')}
					autocomplete="off"
					bind:value={title}
				/>
			</div>

			<div id="voteOptions" class="mb-3" aria-describedby="help-max help-default">
				<label for="o1" class="form-label">{t(currentLang, 'label.options')}</label>
				{#each optionInputs as option, index}
					<input
						type="text"
						id={`o${index + 1}`}
						class="form-control my-2"
						placeholder={t(currentLang, 'ph.option', { n: index + 1 })}
						autocomplete="off"
						maxlength="80"
						value={option}
						oninput={(event) => updateOption(index, event.currentTarget.value)}
					/>
				{/each}
				<div id="help-max" class="form-text">{t(currentLang, 'help.max')}</div>
				<div id="help-default" class="form-text mt-1 fw-semibold">{t(currentLang, 'help.default')}</div>
			</div>

			<div class="d-flex flex-wrap gap-2 mb-2">
				<button
					class="btn btn-outline-secondary"
					type="button"
					id="addEntry"
					aria-describedby="help-max"
					disabled={optionInputs.length >= MAX_OPTIONS || isCreating}
					onclick={addEntry}
				>
					{t(currentLang, 'btn.add')}
				</button>
				<button
					class="btn btn-primary"
					type="button"
					id="startPoll"
					aria-describedby="help-default"
					disabled={isCreating}
					onclick={startPoll}
				>
					{isCreating ? t(currentLang, 'btn.creating') : t(currentLang, 'btn.start')}
				</button>
			</div>
		</div>
	</div>
</AppShell>
