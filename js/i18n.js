// Soporte multi-idioma sencillo (es/en) con persistencia en localStorage
(function(){
  const dictionaries = {
    es: {
      'app.title': 'TerminCount - Recuento de votos',
      'header.title': 'Recuento de votos',
      'config.heading': 'Configuración de la votación',
      'label.title': 'Título de la votación',
      'ph.title': 'Escriba el título',
      'label.options': 'Opciones de voto',
      'ph.option': 'Escriba la opción {n}',
      'help.max': 'Puede añadir hasta 4 opciones. Dejar en blanco para omitir.',
      'help.default': '<strong>NOTA:</strong> <strong>Si deja todas las casillas vacías y pulsa "Pasar a recuento" se usarán las opciones por defecto: A favor, En contra, Blanco y Nulo.</strong>',
      'btn.add': 'Añadir opción',
      'btn.start': 'Pasar a recuento',
      'votes.emitted': 'Votos emitidos:',
      'poll.default.question': 'Votación',
      'poll.default.opt.afavor': 'A favor',
      'poll.default.opt.encontra': 'En contra',
      'poll.default.opt.blanco': 'Blanco',
      'poll.default.opt.nulo': 'Nulo',
      'shortcut.template': "Tecla '{n}' o click en el contador: {label}",
      'btn.undo': "Deshacer último voto (Tecla 'R')"
    },
  lang: { 'es': 'Español', 'ca':'Català', 'gl':'Galego', 'eu':'Euskara', 'en':'English' },
    ca: {
      'app.title': 'TerminCount - Recompte de vots',
      'header.title': 'Recompte de vots',
      'config.heading': 'Configuració de la votació',
      'label.title': 'Títol de la votació',
      'ph.title': 'Escriu el títol',
      'label.options': 'Opcions de vot',
      'ph.option': 'Escriu l\'opció {n}',
      'help.max': 'Pots afegir fins a 4 opcions. Deixa en blanc per ometre.',
      'help.default': '<strong>NOTA:</strong> <strong>Si deixes totes les caselles buides i prems "Iniciar recompte" s\'utilitzaran les opcions per defecte: A favor, En contra, En blanc i Nul.</strong>',
      'btn.add': 'Afegir opció',
      'btn.start': 'Iniciar recompte',
      'votes.emitted': 'Vots emesos:',
      'poll.default.question': 'Votació',
      'poll.default.opt.afavor': 'A favor',
      'poll.default.opt.encontra': 'En contra',
      'poll.default.opt.blanco': 'En blanc',
      'poll.default.opt.nulo': 'Nul',
      'shortcut.template': "Tecla '{n}' o clic al comptador: {label}",
      'btn.undo': "Desfer l\'últim vot (Tecla 'R')"
    },
    eu: {
      'app.title': 'TerminCount - Botoen zenbaketa',
      'header.title': 'Botoen zenbaketa',
      'config.heading': 'Bozketaren konfigurazioa',
      'label.title': 'Bozketaren izenburua',
      'ph.title': 'Izenburua idatzi',
      'label.options': 'Bozketa aukerak',
      'ph.option': 'Idatzi {n}. aukera',
      'help.max': 'Gehienez 4 aukera gehi ditzakezu. Hutsik utzi baztertzeko.',
      'help.default': '<strong>OHARRA:</strong> <strong>Lauki guztiak hutsik uzten badituzu eta "Zenbaketa hasi" sakatzen baduzu, lehenetsitako aukerak erabiliko dira: Alde, Aurka, Zuri eta Baliogabe.</strong>',
      'btn.add': 'Aukera gehitu',
      'btn.start': 'Zenbaketa hasi',
      'votes.emitted': 'Emandako botoak:',
      'poll.default.question': 'Bozketa',
      'poll.default.opt.afavor': 'Alde',
      'poll.default.opt.encontra': 'Aurka',
      'poll.default.opt.blanco': 'Zuri',
      'poll.default.opt.nulo': 'Baliogabe',
      'shortcut.template': "'{n}' tekla edo egin klik kontagailuan: {label}",
      'btn.undo': "Azken botoa desegin (Tecla 'R')"
    },
    gl: {
      'app.title': 'TerminCount - Reconto de votos',
      'header.title': 'Reconto de votos',
      'config.heading': 'Configuración da votación',
      'label.title': 'Título da votación',
      'ph.title': 'Escribe o título',
      'label.options': 'Opcións de voto',
      'ph.option': 'Escribe a opción {n}',
      'help.max': 'Podes engadir ata 4 opcións. Deixa en branco para omitir.',
      'help.default': '<strong>NOTA:</strong> <strong>Se deixas todas as caixas baleiras e premes "Comezar o reconto" usaranse as opcións por defecto: A favor, En contra, Branco e Nulo.</strong>',
      'btn.add': 'Engadir opción',
      'btn.start': 'Comezar o reconto',
      'votes.emitted': 'Votos emitidos:',
      'poll.default.question': 'Votación',
      'poll.default.opt.afavor': 'A favor',
      'poll.default.opt.encontra': 'En contra',
      'poll.default.opt.blanco': 'Branco',
      'poll.default.opt.nulo': 'Nulo',
      'shortcut.template': "Tecla '{n}' ou clic no contador: {label}",
      'btn.undo': "Desfacer o último voto (Tecla 'R')"
    },
    en: {
      'app.title': 'TerminCount - Vote Count',
      'header.title': 'Vote Count',
      'config.heading': 'Voting setup',
      'label.title': 'Poll title',
      'ph.title': 'Enter the title',
      'label.options': 'Voting options',
      'ph.option': 'Enter option {n}',
      'help.max': 'You can add up to 4 options. Leave blank to skip.',
      'help.default': '<strong>NOTE:</strong> <strong>If you leave all boxes empty and press "Start counting" default options will be used: In favour, Against, Blank and Null.</strong>',
      'btn.add': 'Add option',
      'btn.start': 'Start counting',
      'votes.emitted': 'Votes cast:',
      'poll.default.question': 'Voting',
      'poll.default.opt.afavor': 'In favour',
      'poll.default.opt.encontra': 'Against',
      'poll.default.opt.blanco': 'Blank',
      'poll.default.opt.nulo': 'Null',
      'shortcut.template': "Key '{n}' or click on the counter: {label}",
      'btn.undo': "Undo last vote (Key 'R')"
    }
  };

  const storageKey = 'termincount.lang';
  let current = localStorage.getItem(storageKey) || (navigator.language||'en').substring(0,2);
  if(!dictionaries[current]) current = 'en';

  function format(str, params){
    return str.replace(/\{(\w+)\}/g,(m,k)=> params && params[k] != null ? params[k] : m);
  }
  function t(key, params){
    const dict = dictionaries[current] || dictionaries.es;
    return dict[key] ? format(dict[key], params) : key;
  }
  function apply(){
    document.documentElement.lang = current;
    document.title = t('app.title');
    document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ el.placeholder = t(el.dataset.i18nPlaceholder,{n:el.dataset.n}); });
    document.querySelectorAll('[data-i18n-html]').forEach(el=>{ el.innerHTML = t(el.dataset.i18nHtml); });
    const sel = document.getElementById('lang-select');
  if(sel && sel.value !== current) sel.value = current;
  }
  function setLang(lang){
    if(dictionaries[lang]){ current = lang; localStorage.setItem(storageKey, lang); apply(); }
  }
  window.I18N = { t, apply, setLang, getLang:()=>current };
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const sel = document.getElementById('lang-select');
    if(sel) sel.addEventListener('change', e=> setLang(e.target.value));
  });
})();
