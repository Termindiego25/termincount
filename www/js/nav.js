(function () {
	const doc = document;
	const menuBtn = doc.querySelector('.menu-toggle');
	const nav = doc.getElementById('primary-nav');
	const backdrop = doc.getElementById('nav-backdrop');

	const openMenu = () => {
		if (!nav) return;
		nav.classList.add('open');
		if (backdrop) backdrop.hidden = false, backdrop.classList.add('open');
		if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
	};
	const closeMenu = () => {
		if (!nav) return;
		nav.classList.remove('open');
		if (backdrop) backdrop.classList.remove('open'), backdrop.hidden = true;
		if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
	};

	if (menuBtn && nav) {
		menuBtn.addEventListener('click', () => {
			nav.classList.contains('open') ? closeMenu() : openMenu();
		});
	}
	if (backdrop) backdrop.addEventListener('click', closeMenu);
	window.addEventListener('resize', () => {
		if (window.innerWidth >= 769) closeMenu();
	});

	function safe(fnName, fallback) {
		return typeof window[fnName] === 'function' ? window[fnName] : fallback;
	}
	const toggle = safe('__toggleTheme', () => {
		const html = document.documentElement;
		const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
		html.setAttribute('data-theme', next);
	});
	const auto = safe('__resetTheme', () => {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
	});

	doc.querySelectorAll('[data-action="toggle-theme"]').forEach(btn =>
		btn.addEventListener('click', toggle)
	);
	doc.querySelectorAll('[data-action="auto-theme"]').forEach(btn =>
		btn.addEventListener('click', auto)
	);
})();