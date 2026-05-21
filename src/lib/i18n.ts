export const languages = [
	{ code: 'es', label: 'Español' },
	{ code: 'en', label: 'English' },
	{ code: 'ca', label: 'Català' },
	{ code: 'gl', label: 'Galego' },
	{ code: 'eu', label: 'Euskara' }
] as const;

export type Language = (typeof languages)[number]['code'];

type Dictionary = Record<string, string>;

export const dictionaries: Record<Language, Dictionary> = {
	es: {
		'app.title': 'TerminCount - Recuento de votos',
		'header.title': 'Recuento de votos',
		'nav.primary': 'Principal',
		'nav.github': 'GitHub',
		'nav.menu.open': 'Abrir menú',
		'nav.menu.close': 'Cerrar menú',
		'label.lang': 'Idioma',
		'theme.menu': 'Apariencia',
		'theme.menu.current': 'Apariencia: {mode}, mostrando {resolved}',
		'theme.mode.auto': 'Sistema',
		'theme.mode.light': 'Claro',
		'theme.mode.dark': 'Oscuro',
		'config.heading': 'Configuración de la votación',
		'label.title': 'Título de la votación',
		'ph.title': 'Escriba el título',
		'label.options': 'Opciones de voto',
		'ph.option': 'Escriba la opción {n}',
		'help.max': 'Puede añadir hasta 9 opciones. Dejar en blanco para omitir.',
		'help.default':
			'NOTA: Si deja todas las casillas vacías y pulsa "Pasar a recuento" se usarán las opciones por defecto: A favor, En contra, Blanco y Nulo.',
		'btn.add': 'Añadir opción',
		'btn.start': 'Pasar a recuento',
		'votes.emitted': 'Votos emitidos:',
		'poll.default.question': 'Votación',
		'poll.default.opt.afavor': 'A favor',
		'poll.default.opt.encontra': 'En contra',
		'poll.default.opt.blanco': 'Blanco',
		'poll.default.opt.nulo': 'Nulo',
		'shortcut.template': "Tecla '{n}' o click en el contador: {label}",
		'vote.option.aria': 'Registrar voto {n}: {label}',
		'btn.undo': "Deshacer último voto (Tecla 'R')",
		'footer': '© 2025-2026 Diego Sanchis Reig. Todos los derechos reservados.'
	},
	ca: {
		'app.title': 'TerminCount - Recompte de vots',
		'header.title': 'Recompte de vots',
		'nav.primary': 'Principal',
		'nav.github': 'GitHub',
		'nav.menu.open': 'Obrir menú',
		'nav.menu.close': 'Tancar menú',
		'label.lang': 'Idioma',
		'theme.menu': 'Aparença',
		'theme.menu.current': 'Aparença: {mode}, mostrant {resolved}',
		'theme.mode.auto': 'Sistema',
		'theme.mode.light': 'Clar',
		'theme.mode.dark': 'Fosc',
		'config.heading': 'Configuració de la votació',
		'label.title': 'Títol de la votació',
		'ph.title': 'Escriu el títol',
		'label.options': 'Opcions de vot',
		'ph.option': "Escriu l'opció {n}",
		'help.max': 'Pots afegir fins a 9 opcions. Deixa en blanc per ometre.',
		'help.default':
			'NOTA: Si deixes totes les caselles buides i prems "Iniciar recompte" s\'utilitzaran les opcions per defecte: A favor, En contra, En blanc i Nul.',
		'btn.add': 'Afegir opció',
		'btn.start': 'Iniciar recompte',
		'votes.emitted': 'Vots emesos:',
		'poll.default.question': 'Votació',
		'poll.default.opt.afavor': 'A favor',
		'poll.default.opt.encontra': 'En contra',
		'poll.default.opt.blanco': 'En blanc',
		'poll.default.opt.nulo': 'Nul',
		'shortcut.template': "Tecla '{n}' o clic al comptador: {label}",
		'vote.option.aria': 'Registrar vot {n}: {label}',
		'btn.undo': "Desfer l'últim vot (Tecla 'R')",
		'footer': '© 2025-2026 Diego Sanchis Reig. Tots els drets reservats.'
	},
	gl: {
		'app.title': 'TerminCount - Reconto de votos',
		'header.title': 'Reconto de votos',
		'nav.primary': 'Principal',
		'nav.github': 'GitHub',
		'nav.menu.open': 'Abrir menú',
		'nav.menu.close': 'Pechar menú',
		'label.lang': 'Idioma',
		'theme.menu': 'Aparencia',
		'theme.menu.current': 'Aparencia: {mode}, mostrando {resolved}',
		'theme.mode.auto': 'Sistema',
		'theme.mode.light': 'Claro',
		'theme.mode.dark': 'Escuro',
		'config.heading': 'Configuración da votación',
		'label.title': 'Título da votación',
		'ph.title': 'Escribe o título',
		'label.options': 'Opcións de voto',
		'ph.option': 'Escribe a opción {n}',
		'help.max': 'Podes engadir ata 9 opcións. Deixa en branco para omitir.',
		'help.default':
			'NOTA: Se deixas todas as caixas baleiras e premes "Comezar o reconto" usaranse as opcións por defecto: A favor, En contra, Branco e Nulo.',
		'btn.add': 'Engadir opción',
		'btn.start': 'Comezar o reconto',
		'votes.emitted': 'Votos emitidos:',
		'poll.default.question': 'Votación',
		'poll.default.opt.afavor': 'A favor',
		'poll.default.opt.encontra': 'En contra',
		'poll.default.opt.blanco': 'Branco',
		'poll.default.opt.nulo': 'Nulo',
		'shortcut.template': "Tecla '{n}' ou clic no contador: {label}",
		'vote.option.aria': 'Rexistrar voto {n}: {label}',
		'btn.undo': "Desfacer o último voto (Tecla 'R')",
		'footer': '© 2025-2026 Diego Sanchis Reig. Todos os dereitos reservados.'
	},
	eu: {
		'app.title': 'TerminCount - Botoen zenbaketa',
		'header.title': 'Botoen zenbaketa',
		'nav.primary': 'Nagusia',
		'nav.github': 'GitHub',
		'nav.menu.open': 'Menua ireki',
		'nav.menu.close': 'Menua itxi',
		'label.lang': 'Hizkuntza',
		'theme.menu': 'Itxura',
		'theme.menu.current': 'Itxura: {mode}, erakusten {resolved}',
		'theme.mode.auto': 'Sistema',
		'theme.mode.light': 'Argia',
		'theme.mode.dark': 'Iluna',
		'config.heading': 'Bozketaren konfigurazioa',
		'label.title': 'Bozketaren izenburua',
		'ph.title': 'Izenburua idatzi',
		'label.options': 'Bozketa aukerak',
		'ph.option': 'Idatzi {n}. aukera',
		'help.max': 'Gehienez 9 aukera gehi ditzakezu. Hutsik utzi baztertzeko.',
		'help.default':
			'OHARRA: Lauki guztiak hutsik uzten badituzu eta "Zenbaketa hasi" sakatzen baduzu, lehenetsitako aukerak erabiliko dira: Alde, Aurka, Zuri eta Baliogabe.',
		'btn.add': 'Aukera gehitu',
		'btn.start': 'Zenbaketa hasi',
		'votes.emitted': 'Emandako botoak:',
		'poll.default.question': 'Bozketa',
		'poll.default.opt.afavor': 'Alde',
		'poll.default.opt.encontra': 'Aurka',
		'poll.default.opt.blanco': 'Zuri',
		'poll.default.opt.nulo': 'Baliogabe',
		'shortcut.template': "'{n}' tekla edo egin klik kontagailuan: {label}",
		'vote.option.aria': 'Botoa erregistratu {n}: {label}',
		'btn.undo': "Azken botoa desegin (Tekla 'R')",
		'footer': '© 2025-2026 Diego Sanchis Reig. Eskubide guztiak erreserbatuta.'
	},
	en: {
		'app.title': 'TerminCount - Vote Count',
		'header.title': 'Vote Count',
		'nav.primary': 'Main',
		'nav.github': 'GitHub',
		'nav.menu.open': 'Open menu',
		'nav.menu.close': 'Close menu',
		'label.lang': 'Language',
		'theme.menu': 'Appearance',
		'theme.menu.current': 'Appearance: {mode}, showing {resolved}',
		'theme.mode.auto': 'System',
		'theme.mode.light': 'Light',
		'theme.mode.dark': 'Dark',
		'config.heading': 'Voting setup',
		'label.title': 'Poll title',
		'ph.title': 'Enter the title',
		'label.options': 'Voting options',
		'ph.option': 'Enter option {n}',
		'help.max': 'You can add up to 9 options. Leave blank to skip.',
		'help.default':
			'NOTE: If you leave all boxes empty and press "Start counting" default options will be used: In favour, Against, Blank and Null.',
		'btn.add': 'Add option',
		'btn.start': 'Start counting',
		'votes.emitted': 'Votes cast:',
		'poll.default.question': 'Voting',
		'poll.default.opt.afavor': 'In favour',
		'poll.default.opt.encontra': 'Against',
		'poll.default.opt.blanco': 'Blank',
		'poll.default.opt.nulo': 'Null',
		'shortcut.template': "Key '{n}' or click on the counter: {label}",
		'vote.option.aria': 'Record vote {n}: {label}',
		'btn.undo': "Undo last vote (Key 'R')",
		'footer': '© 2025-2026 Diego Sanchis Reig. All rights reserved.'
	}
};

export function isLanguage(value: string | null | undefined): value is Language {
	return Boolean(value && value in dictionaries);
}

export function detectLanguage(navigatorLanguage: string | undefined, stored: string | null): Language {
	if (isLanguage(stored)) return stored;
	const short = navigatorLanguage?.slice(0, 2).toLowerCase();
	return isLanguage(short) ? short : 'en';
}

export function translate(lang: Language, key: string, params?: Record<string, string | number>): string {
	const value = dictionaries[lang][key] ?? dictionaries.en[key] ?? dictionaries.es[key] ?? key;
	return value.replace(/\{(\w+)\}/g, (match, param) =>
		params?.[param] == null ? match : String(params[param])
	);
}
