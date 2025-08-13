function addEntries() {
    const voteOptions = document.getElementById('voteOptions');
    const existing = voteOptions.querySelectorAll('input[type="text"]').length;
    if (existing >= 4) { document.getElementById('addEntrie').disabled = true; return; }
    const numOptions = existing + 1;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'o' + numOptions;
    input.dataset.n = numOptions;
    input.setAttribute('data-i18n-placeholder','ph.option');
    input.placeholder = (window.I18N ? I18N.t('ph.option',{n:numOptions}) : 'Escriba la opción '+numOptions);
    input.className = 'form-control my-2';
    input.autocomplete = 'off';
    // Insertar antes de las notas (help-max) para que las notas queden siempre debajo
    const helpMax = document.getElementById('help-max');
    if(helpMax){
        voteOptions.insertBefore(input, helpMax);
    } else {
        voteOptions.appendChild(input);
    }
    if(window.I18N) I18N.apply && I18N.apply();
    input.focus();
    if (numOptions >= 4) document.getElementById('addEntrie').disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addEntrie');
    const startBtn = document.getElementById('startPoll');
    if (addBtn) addBtn.addEventListener('click', addEntries);
    if (startBtn) startBtn.addEventListener('click', () => {
        if (typeof generatePoll === 'function') {
            generatePoll();
        }
    });
});