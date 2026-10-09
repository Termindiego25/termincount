import type { PollResult } from './polls.js';

type Action = { key: string; kind: 'vote'; index: number } | { key: string; kind: 'undo' };
interface Callbacks {
	confirmed: (poll: PollResult, action: Action) => void;
	retrying: (value: boolean) => void;
	rejected: (status: number) => void;
}

export function createMutationQueue(pollId: string, callbacks: Callbacks) {
	const storageKey = `termincount-actions:${pollId}`;
	let queue: Action[] = [];
	let disposed = false;
	let running = false;
	let attemptController: AbortController | undefined;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;
	let wake: (() => void) | undefined;
	try {
		const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
		if (Array.isArray(saved) && saved.every(isAction)) queue = saved;
	} catch { /* Storage may be disabled; in-memory retries still work. */ }

	function persist() {
		try {
			if (queue.length) sessionStorage.setItem(storageKey, JSON.stringify(queue));
			else sessionStorage.removeItem(storageKey);
		} catch { /* Keep the live queue when browser storage is unavailable. */ }
	}

	async function drain() {
		if (running || disposed) return;
		running = true;
		let delay = 500;
		try {
			while (queue.length && !disposed) {
				const action = queue[0];
				attemptController = new AbortController();
				const timeout = setTimeout(() => attemptController?.abort(), 10_000);
				try {
					const response = await fetch(`/api/polls/${pollId}/${action.kind}`, {
						method: 'POST',
						headers: { 'content-type': 'application/json', 'idempotency-key': action.key },
						body: action.kind === 'vote' ? JSON.stringify({ index: action.index }) : undefined,
						signal: attemptController.signal
					});
					if (disposed) return;
					if (response.status >= 400 && response.status < 500 && ![408, 425, 429].includes(response.status)) {
						// Stop on a definitive rejection; do not silently process later queued actions.
						queue = [];
						persist();
						callbacks.retrying(false);
						callbacks.rejected(response.status);
						return;
					}
					if (!response.ok) throw new Error('Temporary mutation failure.');
					const result = await response.json() as { poll: PollResult };
					if (result.poll?.id !== pollId || !/^\d+$/.test(result.poll.revision)) throw new Error('Invalid mutation response.');
					if (disposed) return;
					queue.shift();
					persist();
					callbacks.confirmed(result.poll, action);
					callbacks.retrying(false);
					delay = 500;
				} catch {
					if (disposed) return;
					callbacks.retrying(true);
					// Reuse the receipt key after a timeout or lost response, never create a second vote.
					await new Promise<void>((resolve) => {
						wake = resolve;
						retryTimer = setTimeout(resolve, delay);
					});
					delay = Math.min(delay * 2, 10_000);
				} finally {
					clearTimeout(timeout);
				}
			}
		} finally {
			running = false;
		}
	}

	if (queue.length) {
		callbacks.retrying(true);
		void drain();
	}
	return {
		vote(index: number) {
			if (disposed) return;
			queue.push({ key: newKey(), kind: 'vote', index });
			persist();
			void drain();
		},
		undo() {
			if (disposed) return;
			queue.push({ key: newKey(), kind: 'undo' });
			persist();
			void drain();
		},
		dispose() {
			disposed = true;
			attemptController?.abort();
			clearTimeout(retryTimer);
			wake?.();
		}
	};
}

function newKey(): string {
	return Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, '0')).join('');
}

function isAction(value: unknown): value is Action {
	if (!value || typeof value !== 'object') return false;
	const action = value as Record<string, unknown>;
	return typeof action.key === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(action.key) &&
		(action.kind === 'undo' || (action.kind === 'vote' && Number.isInteger(action.index) && Number(action.index) >= 0 && Number(action.index) < 9));
}
