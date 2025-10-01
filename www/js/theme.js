(function () {
	const meta = document.getElementById('meta-theme-color');
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
	const saved = localStorage.getItem('ts-theme'); // 'light' | 'dark' | null

	function apply(theme) {
		const html = document.documentElement;
		if (theme === 'light' || theme === 'dark') {
			html.setAttribute('data-theme', theme);
		} else {
			html.setAttribute('data-theme', prefersDark.matches ? 'dark' : 'light');
		}
		const isDark = html.getAttribute('data-theme') === 'dark';
		if (meta) meta.setAttribute('content', isDark ? '#0b1220' : '#ffffff');
	}

	apply(saved || 'auto');

	prefersDark.addEventListener('change', () => {
		if (!localStorage.getItem('ts-theme')) apply('auto');
	});

	window.__toggleTheme = function () {
		const current = document.documentElement.getAttribute('data-theme');
		const next = current === 'dark' ? 'light' : 'dark';
		localStorage.setItem('ts-theme', next);
		apply(next);
	};
	window.__resetTheme = function () {
		localStorage.removeItem('ts-theme');
		apply('auto');
	};

	document.addEventListener('DOMContentLoaded', () => {
		const btnToggle = document.querySelector('[data-action="toggle-theme"]');
		const btnAuto = document.querySelector('[data-action="auto-theme"]');
		if (btnToggle) btnToggle.addEventListener('click', window.__toggleTheme);
		if (btnAuto) btnAuto.addEventListener('click', window.__resetTheme);
	});
})();