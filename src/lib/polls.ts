import type { BarColor } from './voting';
import type { Language } from './i18n';

export interface PollOptionResult {
	id: string;
	position: number;
	label: string;
	barType: BarColor;
	votes: number;
}

export interface PollResult {
	id: string;
	title: string;
	language: Language;
	isDefault: boolean;
	createdAt: string;
	expiresAt: string;
	options: PollOptionResult[];
}

export interface CreatePollPayload {
	title: string;
	options: string[];
	language: Language;
}

export function totalVotesFor(poll: PollResult): number {
	return poll.options.reduce((sum, option) => sum + option.votes, 0);
}

export function isPollExpired(poll: PollResult, now = Date.now()): boolean {
	return new Date(poll.expiresAt).getTime() <= now;
}
