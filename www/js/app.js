(() => {
	let totalVotes = 0;
	let numOptions = 0;
	let stackKey = [];
	let pollData = null;

	const $ = window.jQuery;

	function percent(now, total) {
		return total > 0 ? Math.round((now / total) * 100) : 0;
	}

	function addEntries() {
		const voteOptions = document.getElementById('voteOptions');
		const existing = voteOptions.querySelectorAll('input[type="text"]').length;
		const addBtn = document.getElementById('addEntrie');
		if (existing >= 4) {
			if (addBtn) addBtn.disabled = true;
			return;
		}

		const next = existing + 1;
		const input = document.createElement('input');
		input.type = 'text';
		input.id = 'o' + next;
		input.dataset.n = next;
		input.setAttribute('data-i18n-placeholder', 'ph.option');
		input.placeholder = (window.I18N ? I18N.t('ph.option', {
			n: next
		}) : 'Escriba la opción ' + next);
		input.className = 'form-control my-2';
		input.autocomplete = 'off';

		const helpMax = document.getElementById('help-max');
		if (helpMax) voteOptions.insertBefore(input, helpMax);
		else voteOptions.appendChild(input);

		if (window.I18N?.apply) I18N.apply();
		input.focus();

		if (next >= 4 && addBtn) addBtn.disabled = true;
	}

	function buildOptions(options) {
		const defaults = {
			question: window.I18N ? I18N.t('poll.default.question') : 'Votación',
			slots: [{
					slotlabel: window.I18N ? I18N.t('poll.default.opt.afavor') : 'A favor',
					barType: 'success'
				},
				{
					slotlabel: window.I18N ? I18N.t('poll.default.opt.encontra') : 'En contra',
					barType: 'danger'
				},
				{
					slotlabel: window.I18N ? I18N.t('poll.default.opt.blanco') : 'Blanco',
					barType: 'warning'
				},
				{
					slotlabel: window.I18N ? I18N.t('poll.default.opt.nulo') : 'Nulo',
					barType: 'info'
				}
			]
		};

		if (!options) {
			options = defaults;
			generateTopList(options);
		}

		$('#question').text(options.question);
		const $c = $('#option-container');
		$c.empty();
		numOptions = 0;

		options.slots.forEach((slot, i) => {
			const html = `
        <li class="vote-option p-3 mb-3 rounded border bg-white position-relative" data-index="${i}" tabindex="0">
          <h2 class="h6 mb-2 d-flex align-items-center gap-2 flex-wrap">
            <span class="option-label-text flex-grow-1">${slot.slotlabel}</span>
            <span id="slot-${i}-label" class="badge text-bg-secondary">0</span>
            <span class="option-percentage text-body-secondary small">0%</span>
          </h2>
          <div class="progress" style="height:1.25rem;">
            <div id="slot-${i}" class="progress-bar bg-${slot.barType}" role="progressbar"
                 aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%"></div>
          </div>
        </li>`;
			$c.append(html);
			numOptions++;
		});

		$('#option-container')
			.off('click.vote')
			.on('click.vote', '.vote-option', function () {
				const idx = parseInt($(this).data('index'));
				if (isNaN(idx)) return;
				const e = jQuery.Event('keydown');
				e.key = String(1 + idx);
				$(document).trigger(e);
			})
			.off('keydown.vote')
			.on('keydown.vote', '.vote-option', function (ev) {
				if (ev.key === 'Enter' || ev.key === ' ') {
					ev.preventDefault();
					$(this).trigger('click');
				}
			});
	}

	function generateTopList(options) {
		const $list = $('#lista');
		$list.empty();

		options.slots.slice(0, 4).forEach((slot, i) => {
			const txt = window.I18N ?
				I18N.t('shortcut.template', {
					n: (i + 1),
					label: slot.slotlabel
				}) :
				"Tecla '" + (i + 1) + "' o click en el contador: " + slot.slotlabel;
			$list.append(`<li class='me-3'>${txt}</li>`);
		});

		const undoLabel = window.I18N ? I18N.t('btn.undo') : "Deshacer último voto (Tecla 'R')";
		const undoLi = $(`<li class='mt-3 list-inline-item' id='deshacer-wrapper'></li>`);
		const undoBtn = $(`<button id='deshacer' type='button' class='btn btn-sm btn-outline-danger'>${undoLabel}</button>`);
		undoLi.append(undoBtn);
		$list.append(undoLi);

		$('#deshacer').off('click').on('click', () => {
			const e = jQuery.Event('keydown');
			e.key = 'r';
			$(document).trigger(e);
		});
	}

	function registerKeys() {
		$(document).off('keydown.vote').on('keydown.vote', (event) => {
			let target = null;
			let targetLabel = null;
			let addVotes = 0;

			// Undo con 'r' o 'R'
			if (stackKey.length !== 0 && (event.key === 'r' || event.key === 'R')) {
				const last = stackKey.pop();
				const pos = last - 49; // de '1'..'4' a 0..3
				target = $('#slot-' + pos);
				targetLabel = $('#slot-' + pos + '-label');
				addVotes = -1;
			} else if (event.key >= '1' && event.key <= '4') {
				const pos = event.key.charCodeAt(0) - 49;
				if (pos < numOptions) {
					stackKey.push(event.key.charCodeAt(0));
					target = $('#slot-' + pos);
					targetLabel = $('#slot-' + pos + '-label');
					addVotes = 1;
				}
			}

			if (target) {
				const current = parseInt(target.attr('aria-valuenow')) || 0;
				const next = current + addVotes;
				target.attr('aria-valuenow', next);
				totalVotes = (parseInt(totalVotes) || 0) + addVotes;
				targetLabel.text(String(next));
				$('#votos-emitidos').text(String(totalVotes));
				updateVotes();

				const optionEl = target.closest('.vote-option').get(0);
				if (optionEl) {
					optionEl.classList.remove('flash');
					void optionEl.offsetWidth;
					optionEl.classList.add('flash');
				}
			}
		});
	}

	function updateVotes() {
		document.querySelectorAll('.progress-bar').forEach((el) => {
			const now = parseInt(el.getAttribute('aria-valuenow')) || 0;
			const width = percent(now, totalVotes);
			el.style.width = width + '%';
			const pct = el.closest('.vote-option')?.querySelector('.option-percentage');
			if (pct) pct.textContent = width + '%';
		});
	}

	function generatePoll() {
		totalVotes = 0;
		numOptions = 0;
		stackKey = [];

		document.querySelectorAll('.progress-bar').forEach(pb => {
			pb.setAttribute('aria-valuenow', '0');
			pb.style.width = '0%';
		});

		const question = document.getElementById('title').value.trim();
		const inputs = Array.from(document.querySelectorAll('#voteOptions input[type="text"]')).slice(0, 4);
		const colors = ['info', 'success', 'danger', 'warning'];
		const slots = inputs
			.filter(i => i.value.trim() !== '')
			.map((i, idx) => ({
				slotlabel: i.value.trim(),
				barType: colors[(idx + 1) % 4]
			}));

		if (slots.length === 0) {
			buildOptions();
		} else {
			pollData = {
				question: question || (window.I18N ? I18N.t('poll.default.question') : 'Votación'),
				slots
			};
			buildOptions(pollData);
			generateTopList(pollData);
		}

		registerKeys();

		const inputEl = document.getElementById('input');
		const resultsEl = document.getElementById('col-lg-12');
		inputEl.hidden = true;
		resultsEl.hidden = false;
	}

	function init() {
		const addBtn = document.getElementById('addEntrie');
		const startBtn = document.getElementById('startPoll');
		if (addBtn) addBtn.addEventListener('click', addEntries);
		if (startBtn) startBtn.addEventListener('click', generatePoll);
	}

	window.App = {
		init,
		generatePoll,
		addEntries
	};
	document.addEventListener('DOMContentLoaded', init);
})();