# TerminCount – Lightweight Vote Counter

TerminCount is a lightweight, dependency-minimal web app to quickly configure and run simple vote counts (meetings, assemblies, classrooms, live demos). Set up to 4 options, collect votes via keyboard or mouse, undo the last vote, and see live totals and percentages — all in a clean, accessible UI.

## Live Demo
👉 https://termincount.diegosr.es

## ✨ Key Features
- Up to **4 custom options** (blank entries are ignored, defaults: In favor / Against / Blank / Null).
- **Keyboard voting** (keys 1–4) and **clickable cards**.
- **Undo last vote** (key **R**).
- **Live totals + percentages** with animated progress bars.
- **Multi-language UI**: Spanish, Catalan, Galician, Basque, English  
  (auto-detect + manual selector; English fallback).
- **Theme selector**: Light, Dark, or Auto (follows OS preference).
- **Accessibility**: `aria-live` updates, visible focus styles, keyboard-first design.
- **Responsive modern UI** (Bootstrap 5, flexbox layout).
- **Footer with inline social links** (GitHub, LinkedIn).
- Clean separation of UI text (simple **i18n dictionary**).

## 🚀 Quick Start
1. Clone or download the repository.
2. Open `index.html` directly in a modern browser (no build step required).
3. Enter a poll title and up to 4 options (or leave all blank to use defaults).
4. Click **“Start counting”** (localized).
5. Cast votes with **keys 1–4** or by clicking an option card.
6. Undo last vote with **R**.
7. Switch **language** or **theme** anytime from the header controls.

## 🌍 Internationalization (i18n)
- Auto-detects `navigator.language` (first two letters), defaults to English if unsupported.
- Manual selection available in header; choice persists in `localStorage`.
- To add a new language:
  1. Open `js/i18n.js`.
  2. Add a new dictionary object (use existing ones as template).
  3. Insert a `<option value="xx">NativeName</option>` in the language selector (`index.html`).
  4. Keep keys consistent across all dictionaries.

## 🗂 Project Structure
```

index.html          # Main page (UI, footer, theme + lang selectors)
css/style.css       # Custom styles (themes, layout, animations, footer icons)
js/i18n.js          # Dictionary + runtime switcher
js/app-init.js      # Option input management (add fields, start poll)
js/core-dyn.js      # Poll creation, voting logic, live updates
js/theme.js         # Theme switching (light/dark/auto)
js/nav.js           # Responsive nav (mobile menu toggle)

````

## 📦 Dependencies
- [Bootstrap 5 (CSS/JS via CDN)](https://getbootstrap.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [jQuery 3.x](https://jquery.com/) – used for DOM/event helpers (roadmap: migrate to vanilla JS).

---

## 🐳 Run with Docker

### HTTP (default)
Build image:
```bash
docker build -t termincount:latest .
````

Run container (port 8080 → 80):

```bash
docker run --rm -p 8080:80 termincount:latest
```

Then open: [http://localhost:8080](http://localhost:8080)

Minimal one-liner:

```bash
docker build -t termincount . && docker run --rm -p 8080:80 termincount
```

### Using docker compose (HTTP)

Create `compose.yml`:

```yaml
services:
  web:
    image: termincount:latest
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

Launch:

```bash
docker compose up --build
```

---

## 🔐 Run with HTTPS (via Nginx in container)

The container includes **Nginx**, so you can mount your TLS certificates and serve over HTTPS.

Example `compose.yml` with HTTPS enabled:

```yaml
services:
  web:
    image: termincount:latest
    build: .
    ports:
      - "8080:80"     # HTTP (optional)
      - "8443:443"    # HTTPS (container 443 → host 8443)
    volumes:
      - ./certs/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
      - ./certs/privkey.pem:/etc/nginx/ssl/privkey.pem:ro
    restart: unless-stopped
```

Inside the container, Nginx is configured to:

* Serve HTTP on port 80
* Serve HTTPS on port 443 using the mounted certificates

After starting, you can open:

* **HTTP:** [http://localhost:8080](http://localhost:8080)
* **HTTPS:** [https://localhost:8443](https://localhost:8443)

> 🔑 Make sure your certificate files exist in `./certs/` (adjust paths as needed).

---

## 🤝 Contributing

Issues and PRs are welcome!
Please keep changes small and focused.
When adding new text, update all language dictionaries.

## 👤 Credits

* Original author: **[Termindiego25](https://github.com/Termindiego25)**

## 📜 License

GPL-3.0 license – see [LICENSE](LICENSE) for full text.
