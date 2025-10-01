var totalVotes = 0;
var numOptions = 0;
var stackKey = [];
var pollData = null;

function generatePoll() {
	totalVotes = 0;
	numOptions = 0;
	stackKey = [];
	document.querySelectorAll('.progress-bar').forEach(pb => {
		pb.setAttribute('aria-valuenow', '0');
		pb.style.width = '0%';
	});
	var question = document.getElementById('title').value.trim();
	var inputs = Array.from(document.querySelectorAll('#voteOptions input[type="text"]')).slice(0, 4);
	var colors = ['info', 'success', 'danger', 'warning'];
	var slots = inputs.filter(i => i.value.trim() !== '').map((i, idx) => ({
		slotlabel: i.value.trim(),
		barType: colors[(idx + 1) % 4]
	}));
	if (slots.length === 0) {
		buildOptions();
	} else {
		pollData = {
			question: question || (window.I18N ? I18N.t('poll.default.question') : 'Votación'),
			slots: slots
		};
		buildOptions(pollData);
		generateTopList(pollData);
	}
	registerKeys();
	var inputEl = document.getElementById('input');
	var resultsEl = document.getElementById('col-lg-12');
	inputEl.hidden = true;
	resultsEl.hidden = false;
}

function generateTopList(options) {
	var $list = $('#lista');
	$list.empty();
	jQuery.each(options.slots.slice(0, 4), function (i, slot) { // asegurar máximo 4
		var txt = (window.I18N ? I18N.t('shortcut.template', {
			n: (i + 1),
			label: slot.slotlabel
		}) : "Tecla '" + (i + 1) + "' o click en el contador: " + slot.slotlabel);
		var htmlModel = "<li class='me-3'>" + txt + "</li>";
		$list.append(htmlModel);
	});
	// Botón deshacer como li
	var undoLabel = window.I18N ? I18N.t('btn.undo') : "Deshacer último voto (Tecla 'R')";
	var undoLi = $("<li class='mt-3 list-inline-item' id='deshacer-wrapper'></li>");
	var undoBtn = $("<button id='deshacer' type='button' class='btn btn-sm btn-outline-danger'>" + undoLabel + "</button>");
	undoLi.append(undoBtn);
	$list.append(undoLi);
	$('#deshacer').on('click', function () {
		var e = jQuery.Event("keypress");
		e.which = 114; // r
		$(document).trigger(e);
	});
}

function registerKeys() {
	$(document).bind("keypress", function (event) {
		target = null;
		targetLabel = null;
		addVotes = 0;

		if (stackKey.length != 0 && event.which == 114) {
			var aRetirar = stackKey.pop();
			targetPos = aRetirar - 49;
			target = $('#slot-' + targetPos);
			targetLabel = $('#slot-' + targetPos + '-label');
			addVotes = -1;
		} else {
			if (event.which >= 49 && event.which <= 52 && (event.which - 49) < numOptions) { // teclas 1-4
				stackKey.push(event.which);
				targetPos = event.which - 49;
				target = $('#slot-' + targetPos);
				targetLabel = $('#slot-' + targetPos + '-label');
				addVotes = 1;
			}
		}

		if (target != null) {
			target.attr("aria-valuenow", parseInt(target.attr("aria-valuenow")) + addVotes);
			totalVotes = parseInt(totalVotes) + addVotes;
			targetLabel.text(target.attr("aria-valuenow"));
			$('#votos-emitidos').text(totalVotes);
			updateVotes();
			var optionEl = target.closest('.vote-option');
			if (optionEl) {
				optionEl.classList.remove('flash');
				void optionEl.offsetWidth;
				optionEl.classList.add('flash');
			}
		}
	});
}

function updateVotes() {
	document.querySelectorAll('.progress-bar').forEach(function (el) {
		var now = parseInt(el.getAttribute('aria-valuenow')) || 0;
		var width = totalVotes > 0 ? ((now / totalVotes) * 100).toFixed() : 0;
		el.style.width = width + '%';
		var pct = el.closest('.vote-option')?.querySelector('.option-percentage');
		if (pct) pct.textContent = width + '%';
	});
}

function buildOptions(options) {
	var defaults = {
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
	var $c = $('#option-container');
	$c.empty();
	jQuery.each(options.slots, function (i, slot) {
		var html = '<li class="vote-option p-3 mb-3 rounded border bg-white position-relative" data-index="' + i + '" tabindex="0">' +
			'<h2 class="h6 mb-2 d-flex align-items-center gap-2 flex-wrap">' +
			'<span class="option-label-text flex-grow-1">' + slot.slotlabel + '</span>' +
			'<span id="slot-' + i + '-label" class="badge text-bg-secondary">0</span>' +
			'<span class="option-percentage text-body-secondary small">0%</span>' +
			'</h2>' +
			'<div class="progress" style="height:1.25rem;"><div id="slot-' + i + '" class="progress-bar bg-' + slot.barType + '" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="0" style="width:0%"></div></div>' +
			'</li>';
		$c.append(html);
		numOptions++;
	});
	$('#option-container').off('click.vote').on('click.vote', '.vote-option', function () {
		var idx = parseInt($(this).data('index'));
		if (isNaN(idx)) return;
		var e = jQuery.Event('keypress');
		e.which = 49 + idx;
		$(document).trigger(e);
	}).off('keydown.vote').on('keydown.vote', '.vote-option', function (ev) {
		if (ev.key === 'Enter' || ev.key === ' ') {
			ev.preventDefault();
			$(this).trigger('click');
		}
	});
}