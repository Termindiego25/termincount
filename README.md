# TerminCount – Lightweight Vote Counter

TerminCount is a lightweight, dependency-minimal web app to quickly configure and run simple vote counts (meetings, assemblies, classrooms, live demos).
Set up to 4 options, collect votes via keyboard or mouse, undo the last vote, and see live totals and percentages — all in a clean, accessible UI.

## 🌐 Live Demo

👉 [https://termincount.diegosr.es](https://termincount.diegosr.es)

---

## ✨ Key Features

* Up to **4 custom options** (blank entries are ignored; defaults: In favor / Against / Blank / Null).
* **Keyboard voting** (keys 1–4) and **clickable cards**.
* **Undo last vote** (key **R**).
* **Live totals + percentages** with animated progress bars.
* **Multi-language UI**: Spanish, Catalan, Galician, Basque, English
  (auto-detect + manual selector; English fallback).
* **Theme selector**: Light, Dark, or Auto (follows OS preference).
* **Accessibility**: `aria-live` updates, visible focus styles, keyboard-first design.
* **Responsive modern UI** (Bootstrap 5, flexbox layout).
* **Footer with inline social links** (GitHub, LinkedIn).
* Clean separation of UI text (simple **i18n dictionary**).

---

## 🌍 Internationalization (i18n)

* Auto-detects `navigator.language` (first two letters), defaults to English if unsupported.
* Manual language selector in the header; choice persists to `localStorage`.
* To add a new language:

  1. Edit `js/i18n.js` and add your dictionary.
  2. Add `<option value="xx">NativeName</option>` in the language `<select>` (in `index.html`).
  3. Keep keys consistent across all dictionaries.

---

## 🗂 Project Structure

```
www/
  index.html        # Main page (UI, footer, theme + lang selectors)
  css/style.css     # Custom styles (themes, layout, animations, footer icons)
  js/i18n.js        # Dictionary + runtime switcher
  js/app-init.js    # Option input management (add fields, start poll)
  js/core-dyn.js    # Poll creation, voting logic, live updates
  js/theme.js       # Theme switching (light/dark/auto)
  js/nav.js         # Responsive nav (mobile menu toggle)

Dockerfile
nginx.conf
```

---

## 📦 Dependencies

* [Bootstrap 5 (CSS/JS via CDN)](https://getbootstrap.com/)
* [Bootstrap Icons](https://icons.getbootstrap.com/)
* [jQuery 3.x](https://jquery.com/) – used for DOM/event helpers (roadmap: migrate to vanilla JS).

---

## 🐳 Run from Docker Hub (recommended)

### HTTP

#### CLI
```bash
docker pull termindiego25/termincount:latest
docker run --rm -p 8080:80 -e TERMINCOUNT_DOMAIN=localhost termindiego25/termincount:latest
```

#### Docker Compose
```yaml
services:
  web:
    image: termindiego25/termincount:latest
    ports:
      - "8080:80"
    environment:
      - TERMINCOUNT_DOMAIN=localhost
    restart: unless-stopped
```

Open: [http://localhost:8080](http://localhost:8080)

### HTTP + HTTPS (with your own certificates)

#### CLI
```bash
docker run --rm \
  -p 8080:80 \
  -p 8443:443 \
  -e TERMINCOUNT_DOMAIN=localhost \
  -v "./certs:/etc/nginx/certs:ro" \
# Alternative (bind individual files instead of the whole folder):
# -v "./certs/fullchain.pem:/etc/nginx/certs/fullchain.pem:ro" \
# -v "./certs/privkey.pem:/etc/nginx/certs/privkey.pem:ro" \
  termindiego25/termincount:latest
```

#### Docker Compose
```yaml
services:
  web:
    image: termindiego25/termincount:latest
    ports:
      - "8080:80"   # HTTP
      - "8443:443"  # HTTPS
    environment:
      - TERMINCOUNT_DOMAIN=localhost
    volumes:
      - "./certs:/etc/nginx/certs:ro"
      # Alternative (bind individual files):
      # - "./certs/fullchain.pem:/etc/nginx/certs/fullchain.pem:ro"
      # - "./certs/privkey.pem:/etc/nginx/certs/privkey.pem:ro"
    restart: unless-stopped
```

Certificates expected inside `./certs`:

* `fullchain.pem`
* `privkey.pem`

Then open:

* HTTP → **[http://localhost:8080](http://localhost:8080)**
* HTTPS → **[https://localhost:8443](https://localhost:8443)**

---

## 🏗️ Build Locally (optional)

### HTTP

#### CLI
```bash
docker build -t termincount:latest .
docker run --rm -p 8080:80 -e TERMINCOUNT_DOMAIN=localhost termincount:latest
```

#### Docker Compose
```yaml
services:
  web:
    image: termincount:latest
    build:
      context: .
    ports:
      - "8080:80"
    environment:
      - TERMINCOUNT_DOMAIN=localhost
    restart: unless-stopped
```

### HTTP + HTTPS

#### CLI
```bash
docker build -t termincount:latest .
docker run --rm \
  -p 8080:80 \
  -p 8443:443 \
  -e TERMINCOUNT_DOMAIN=localhost \
  -v "./certs:/etc/nginx/certs:ro" \
# Alternative (bind individual files instead of the whole folder):
# -v "./certs/fullchain.pem:/etc/nginx/certs/fullchain.pem:ro" \
# -v "./certs/privkey.pem:/etc/nginx/certs/privkey.pem:ro" \
  termincount:latest
```

#### Docker Compose
```yaml
services:
  web:
    image: termincount:latest
    build:
      context: .
    ports:
      - "8080:80"   # HTTP
      - "8443:443"  # HTTPS
    environment:
      - TERMINCOUNT_DOMAIN=localhost
    volumes:
      - "./certs:/etc/nginx/certs:ro"
      # Alternative (bind individual files):
      # - "./certs/fullchain.pem:/etc/nginx/certs/fullchain.pem:ro"
      # - "./certs/privkey.pem:/etc/nginx/certs/privkey.pem:ro"
    restart: unless-stopped
```

---

## ⚙️ Configuration

| Variable             | Required | Default  | Description                                                                                  |
| -------------------- | :------: | -------- | -------------------------------------------------------------------------------------------- |
| `TERMINCOUNT_DOMAIN` |     ❓    | *localhost* | Passed into Nginx as `server_name`. Set to your domain or `localhost` for local runs.        |
| `certs` volume       |     ❓    | *(none)* | Mount a folder containing `fullchain.pem` and `privkey.pem` at `/etc/nginx/certs` to enable HTTPS on port 443. Alternatively, you can bind the two files individually. |

---

## 🤝 Contributing

Issues and PRs are welcome!
Please keep changes small and focused.
When adding new text, update all language dictionaries.

---

## 👤 Credits

* Original author: **[Termindiego25](https://www.diegosr.es)**

---

## 📜 License

GPL-3.0 — see [LICENSE](LICENSE).
