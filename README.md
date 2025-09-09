# TerminCount – Lightweight Vote Counter

TerminCount is a small, dependency‑light web app for quickly configuring and running simple vote counts (meetings, assemblies, classrooms, live demos). Set up to 4 options, collect votes via keyboard or mouse, undo the last vote, and see live totals and percentages.

## Live Demo
https://termincount.diegosr.es

## Key Features
* Up to 4 custom options (blank entries are ignored)
* Keyboard voting (keys 1–4) and full click area per option
* Undo last vote (key R)
* Live percentages + animated progress bars
* Multi‑language UI: Spanish, Catalan, Galician, Basque, English (auto + manual selector; English fallback)
* Accessibility enhancements (aria-live updates, focus styles, keyboard activation)
* Responsive modern UI (Bootstrap 5 CDN)
* Clean separation of UI text (simple i18n dictionary)

## Quick Start
1. Clone or download the repository.
2. Open `index.html` directly in a modern browser (no build step required).
3. Enter a poll title and up to 4 options (or leave all blank to use the default set).
4. Click “Start counting” (or the localized equivalent).
5. Cast votes with keys 1–4 or by clicking an option card.
6. Undo the last vote with key R.
7. Change language from the selector in the header at any time.

## Internationalization (i18n)
* The app auto-detects `navigator.language` (first two letters) and falls back to English if unsupported.
* You can switch language manually via the dropdown; the choice persists in `localStorage`.
* To add a new language:
	1. Open `js/i18n.js`.
	2. Add a new object inside `dictionaries` using existing languages as a template.
	3. Insert a `<option value="xx">NativeName</option>` in the language selector (`index.html`).
	4. (Optional) Add any new message keys consistently across all dictionaries.

## Project Structure
```
index.html          # Main page
css/style.css       # Custom styles (layout, option visuals, animations)
js/i18n.js          # Simple dictionary + runtime switcher
js/app-init.js      # Option input management (add fields, start poll)
js/core-dyn.js      # Poll creation, voting logic, live updates
```

## Dependencies
* [Bootstrap 5 (CSS/JS via CDN)](https://getbootstrap.com/)
* [jQuery 3.x (CDN)](https://jquery.com/) – currently used for some DOM/event helpers; roadmap includes a migration to vanilla JS.

## Run with Docker
Build image:
```
docker build -t termincount:latest .
```
Run container (port 8080 -> 80):
```
docker run --rm -p 8080:80 termincount:latest
```
Then open: http://localhost:8080

Minimal one‑liner:
```
docker build -t termincount . && docker run --rm -p 8080:80 termincount
```

### Using docker compose (optional)
Create a simple `compose.yml`:
``` yaml
services:
    web:
        image: termincount:latest
        build: .
        ports:
            - "8080:80"
        restart: unless-stopped
```
Launch:
```
docker compose up --build
```

## Contributing
Issues and PRs are welcome. Please keep changes small and focused. For new text, remember to update all language dictionaries.

## Credits
* Original author: Termindiego25

## License
GPL-3.0 license – see [LICENSE](LICENSE) for full text.
