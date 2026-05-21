# TerminCount

TerminCount es una aplicación ligera para configurar y realizar recuentos manuales de votos. Está pensada para reuniones, asambleas, clases, demostraciones en directo o cualquier situación donde haga falta contar opciones de forma rápida desde el navegador.

Demo: [https://termincount.diegosr.es](https://termincount.diegosr.es)

## Funcionalidades

- Recuento manual con opciones personalizadas.
- Hasta 9 opciones de voto.
- Opciones por defecto cuando no se configura ninguna: a favor, en contra, blanco y nulo.
- Atajos de teclado con las teclas `1` a `9`, y `R` para deshacer el último voto.
- Totales y porcentajes en tiempo real.
- Interfaz en español, catalán, gallego, euskera e inglés.
- Tema claro, oscuro o automático según el sistema.
- Funcionamiento 100% local en el navegador, sin enviar datos a ningún servidor.

## Uso Con DockerHub

La forma más sencilla de desplegar TerminCount es usando la imagen publicada en DockerHub:

```bash
docker run -d \
  --name termincount \
  --restart unless-stopped \
  -p 8080:80 \
  termindiego25/termincount:latest
```

Después abre [http://localhost:8080](http://localhost:8080).

También puedes usar una etiqueta concreta:

```bash
docker run -d \
  --name termincount \
  --restart unless-stopped \
  -p 8080:80 \
  termindiego25/termincount:latest
```

Etiquetas disponibles:

- `1.2.0`: versión exacta.
- `1.2`: última versión compatible dentro de la rama 1.2.
- `latest`: última versión publicada.

## Uso Desde GitHub

Clona el repositorio:

```bash
git clone https://github.com/Termindiego25/termincount.git
cd termincount
```

Arranca la aplicación con Docker Compose:

```bash
docker compose up -d --build
```

Después abre [http://localhost:8080](http://localhost:8080).

## Desarrollo Local

Instala las dependencias:

```bash
npm install
```

Arranca el servidor de desarrollo:

```bash
npm run dev
```

Por defecto Vite sirve la app en [http://127.0.0.1:8765](http://127.0.0.1:8765), o en el siguiente puerto libre si ese ya está ocupado.

## Comprobaciones

Ejecuta la validación de TypeScript/Svelte y los checks básicos del proyecto:

```bash
npm test
```

Genera el build estático de producción:

```bash
npm run build
```

Ejecuta las pruebas end-to-end:

```bash
npm run build
npm run test:e2e
```

Si Playwright todavía no tiene instalado Chromium:

```bash
npx playwright install chromium
```

## HTTPS Opcional

El contenedor puede servir HTTPS si se montan certificados en `/etc/termincount/certs` con estos nombres:

- `fullchain.pem`
- `privkey.pem`

Ejemplo:

```bash
docker run -d \
  --name termincount \
  --restart unless-stopped \
  -p 8080:80 \
  -p 8443:443 \
  -v ./ssl:/etc/termincount/certs:ro \
  termindiego25/termincount:latest
```

Cuando ambos certificados están presentes, el contenedor sirve HTTPS y redirige HTTP a HTTPS.

## Tecnología

- [SvelteKit](https://svelte.dev/docs/kit) para estructura de aplicación, rutas y futura evolución hacia backend.
- [TypeScript](https://www.typescriptlang.org/) para tipado y mantenimiento.
- [Vite](https://vite.dev/) para desarrollo y build optimizado.
- [Bootstrap CSS](https://getbootstrap.com/) como dependencia npm gestionada, sin Bootstrap JS.
- [Playwright](https://playwright.dev/) para pruebas de navegador.
- Servidor estático mínimo en Go dentro de una imagen Docker `scratch`.

## Estructura

```text
src/
  app.html                 Plantilla HTML
  app.css                  Estilos globales y temas
  lib/
    i18n.ts                Traducciones
    voting.ts              Tipos y helpers de votación
    server/                Zona reservada para futuro backend
  routes/
    +layout.ts             Imports globales y prerender
    +page.svelte           Interfaz principal

static/
  images/                  Logo, manifest y favicons

tests/
  termincount.spec.ts      Pruebas end-to-end

tools/
  smoke-test.mjs           Checks básicos del proyecto
  static-server/           Servidor mínimo para Docker
```

## Licencia

GPL-3.0. Consulta [LICENSE](LICENSE).
