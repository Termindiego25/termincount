<script lang="ts">
	import PollResultView from './PollResultView.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
</script>

{#key `${data.poll.id}:${data.canManage}`}
	<PollResultView {data} />
{/key}
