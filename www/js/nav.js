(() => {
	const doc = document;
	const menuBtn = doc.querySelector('.menu-toggle');
	const nav = doc.getElementById('primary-nav');
	const backdrop = doc.getElementById('nav-backdrop');

	const openMenu = () => {
		if (!nav) return;
		nav.classList.add('open');
		if (backdrop) {
			backdrop.hidden = false;
			backdrop.classList.add('open');
		}
		if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
	};
	const closeMenu = () => {
		if (!nav) return;
		nav.classList.remove('open');
		if (backdrop) {
			backdrop.classList.remove('open');
			backdrop.hidden = true;
		}
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
})();