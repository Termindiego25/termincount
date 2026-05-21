import { translate, type Language } from './i18n';

export const MAX_OPTIONS = 9;

export const BAR_COLORS = [
	'accent-9',
	'accent-2',
	'accent-3',
	'accent-4',
	'accent-5',
	'accent-1',
	'accent-6',
	'accent-7',
	'accent-8'
] as const;

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export type BarColor = (typeof BAR_COLORS)[number];

export interface VoteSlot {
	slotlabel: string;
	barType: BarColor;
}

export interface Poll {
	question: string;
	isDefault: boolean;
	slots: VoteSlot[];
}

export function createDefaultPoll(lang: Language): Poll {
	return {
		question: translate(lang, 'poll.default.question'),
		isDefault: true,
		slots: [
			{ slotlabel: translate(lang, 'poll.default.opt.afavor'), barType: 'accent-2' },
			{ slotlabel: translate(lang, 'poll.default.opt.encontra'), barType: 'accent-3' },
			{ slotlabel: translate(lang, 'poll.default.opt.blanco'), barType: 'accent-4' },
			{ slotlabel: translate(lang, 'poll.default.opt.nulo'), barType: 'accent-5' }
		]
	};
}

export function createCustomPoll(title: string, options: string[], lang: Language): Poll {
	const slots = options
		.map((option) => option.trim())
		.filter(Boolean)
		.slice(0, MAX_OPTIONS)
		.map((slotlabel, index) => ({
			slotlabel,
			barType: BAR_COLORS[index % BAR_COLORS.length]
		}));

	return {
		question: title.trim() || translate(lang, 'poll.default.question'),
		isDefault: false,
		slots
	};
}

export function percentage(count: number, total: number): number {
	return total > 0 ? Math.round((count / total) * 100) : 0;
}
