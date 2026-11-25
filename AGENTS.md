# AGENTS.md — ERD

## 1. Contexto del proyecto

ERD es la web corporativa de una consultoría de empresa con más de 20 años de oficio, que trabaja en ocho ámbitos de servicio, de la logística a las finanzas. La construye Vora Studio (VoraData).

**Cómo llega el diseño.** VoraStudio entrega un manual de estilo y un brandboard en PDF, los logotipos y un boceto de la web en HTML. Todo está en `sdd-local/brand/ERD/`, que no se sube a git. El boceto está en `sdd-local/brand/ERD/02 Web/`: 15 páginas, una versión interactiva (`Web ERD.html`), capturas, fuentes y fotos de muestra.

**De dónde salen los tokens de marca.**

1. Primero, los PDFs (manual de estilo y brandboard).
2. Lo que los PDFs no digan, lo cubre el boceto HTML.

**Qué se construye.** El boceto HTML es una idea de partida, no el resultado: aporta la estructura de las páginas, los contenidos y los efectos. La web se construye mejor que el boceto, mobile first y en archivos separados.

**Qué manda, en este orden:**

1. `DESIGN.md` y `theme.css`.
2. Las reglas de este archivo.
3. El boceto HTML.

Si el boceto choca con `DESIGN.md` o con estas reglas (por ejemplo, su CSS es desktop first), se sigue `DESIGN.md` y estas reglas.

**Discrepancias conocidas** (no se resuelven sin preguntar):

- Tipografía: el manual dice Agrandir + Inter, el brandboard dice Open Sauce.
- No hay archivo de Agrandir: la web entregada usa Hanken Grotesk como sustituta.
- El rojo antiguo `#E4141B` queda unificado con el rojo ERD `#E0040B`.

**Cómo trabaja el agente.**

- Propone y ejecuta; las decisiones las toma Pau.
- Explica el porqué de cada decisión, no solo el qué.
- Verifica antes de afirmar. Si Pau se equivoca, se lo dice con pruebas.
- Ante la duda, pregunta: una pregunta cada vez.

## 2. Reglas duras

- **Git:** ningún `commit`, `push`, `merge`, `checkout` ni `rebase` sin orden explícita de Pau. No hay despliegue automático: un push no publica nada.
- **Commits:** convencionales, en español (el tipo en inglés: `feat:`, `fix:`) y sin atribución a IA. Un cambio lógico por commit.
- **Confidencialidad:** ninguna credencial ni dato del cliente en el repo. `.env` y `sdd-local/brand/` están fuera de git.
- **Colores:** solo los tokens de `theme.css`. La paleta por defecto de Tailwind está desactivada y no se escriben hexadecimales sueltos.
- **HTML:** semántico, un solo `<h1>` por página, `alt` en las imágenes, `width` y `height` explícitos, `label` en los formularios y `aria-label` en los botones sin texto.
- **Sin código en línea:** ni `<style>`, ni `<script>`, ni atributos `on*=`.
- **CSS:** mobile first. La base no lleva media query y se amplía con `min-width`.
- **JavaScript:** `const` y `let`, nunca `var`. Sin `console.log`. Retornos tempranos y sin código muerto.
- **PHP:** `declare(strict_types=1)` en todos los archivos y PSR-12. La lógica va en `src/` y los archivos de `public/` solo la usan. Nunca se repite en la respuesta lo que escribió el visitante. Las credenciales (y el token del CMS, cuando exista) viven solo en el `.env` del servidor, nunca en JavaScript ni en el repo.
- **Rutas:** absolutas desde la raíz (`/assets/css/styles.css`).
- **Componentes:** máximo 15. Si hacen falta más, se agrupan en subcarpetas.
- **Alcance:** no se añade funcionalidad ni texto que no esté en el diseño.
- **Escalado:** parar y preguntar si el cambio toca la arquitectura, el alcance es ambiguo o puede tener efectos secundarios.
- **Dependencias:** stack cerrado. No se instala nada sin acuerdo.

## 3. Stack y estructura

| Capa | Tecnología |
| --- | --- |
| Marcado | HTML semántico y estático: `public/index.html` y una carpeta por página |
| Estilos | Tailwind CSS v4, compilado con su CLI, con un único `theme.css` |
| Lógica | JavaScript vanilla, organizado en componentes (la cabecera y el pie son los componentes `<site-header>` y `<site-footer>`) |
| Animación | GSAP: animaciones de entrada y de salida, y de scroll |
| Servidor | PHP plano, sin Composer ni framework, solo donde hace falta: el gestor del formulario de contacto (`public/contact.php`). La conexión al CMS queda para más adelante y, si su API necesita un token, se hará desde el servidor |

- **Compilación:** `npm run build` genera `public/assets/css/styles.css`. Ese archivo no se versiona: se compila en local antes de cada subida.
- **Carpeta pública:** `public/` es lo único que se publica. Su raíz se mantiene limpia: `index.html`, `contact.php`, `.htaccess`, `robots.txt` y `sitemap.xml` (el mapa del sitio se mantiene a mano: una `<url>` por página pública), las páginas de error y `assets/`. Cada página nueva va en su propia carpeta: `public/<pagina>/index.html`.
- **Web publicada:** la web ya es pública. `public/index.html` es la Home real y no hay vista previa protegida: el `.htaccess` no lleva Basic Auth.
- **Fuera de la carpeta pública:** `src/` (`Env`, `Config` y `ContactForm`) y `tests/`. En el servidor, `public/` es `/web` y `src/` cuelga de la raíz del FTP, junto a `/web`.
- **Recursos:** `public/assets/css/` (solo el `styles.css` compilado), `public/assets/js/` (`main.js`, `components/` y `modules/`), `fonts/` e `img/` (con los logotipos en `img/logo/`).
- **Estilos:** el código fuente está en `src/css/` (`theme.css` y la entrada `main.css`), fuera de `public/`.
- **Carpetas fijas:** `openspec/` (decisiones), `.claude/skills/` (skills del proyecto), `.claude/hooks/` y `.githooks/` (hooks).
- **Pruebas de PHP:** `php tests/run.php` (sin dependencias).
- **Configuración:** `.env` (local, fuera de git) y, en el servidor, en la raíz del FTP. Claves: `ERD_MAIL_RECIPIENT` (quién recibe los mensajes) y `ERD_MAIL_SENDER` (remitente). Plantilla en `.env.example`.

## 4. Diseño

1. **`DESIGN.md` es la autoridad.** Reúne los tokens y el diseño entregado. Se lee antes de escribir cualquier interfaz. Los tokens viven en `theme.css`.
2. **La skill Impeccable es referencia, nunca decide.** Solo se usa para revisar y afinar (`audit`, `critique`, `polish`, `animate`). No se usan `bolder`, `colorize` ni `overdrive` sobre el diseño entregado.
3. **Animaciones:** las skills de GSAP (`gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-performance`, `gsap-utils`). Toda animación respeta `prefers-reduced-motion`.
4. Si `DESIGN.md` o `theme.css` chocan con una skill, mandan `DESIGN.md` y `theme.css`.

Impeccable está instalada sin su binario ni sus hooks. Es normal que avise de que «no cargó el contexto» y lea `PRODUCT.md` y `DESIGN.md` directamente.

## 5. Hooks y OpenSpec

Dos hooks, activos:

- **OpenSpec Commit** (hook de git, `.githooks/pre-commit`): cada commit añade una nota nueva en `openspec/decisiones/<categoria>/NNN.md`, en español. El formato y las categorías están en `openspec/README.md`. Si falta la nota, el commit se bloquea, lo haga un agente o Pau. Es un hook de git porque se ejecuta después del `git add`, cuando ya se sabe qué entra en el commit. `npm install` lo activa (`git config core.hooksPath .githooks`).
- **Code Rules** (Claude Code, `.claude/settings.json` y `.claude/hooks/code-rules.mjs`): bloquea al escribir HTML, CSS o JS que rompa estas reglas: `<style>` o `<script>` en línea, atributos `on*=` y `style=""`, hexadecimales fuera de `theme.css`, `var` y `console.log`. No revisa `sdd-local/`, `node_modules/`, `.claude/skills/` ni las carpetas `vendor/`.

## 6. Idiomas y despliegue

| Qué | Idioma |
| --- | --- |
| Nombres de archivos | Inglés (`header.js`, `theme.css`, `package.json`) |
| Variables, funciones y métodos | Español (`abrirMenu`, `animarEntrada`) |
| Tokens de diseño (variables CSS) | Inglés, con los nombres del manual de marca (`--color-erd-red`) |
| Comentarios, documentos `.md`, OpenSpec y commits | Español |
| Textos de la web | Catalán, como el diseño entregado |

Lo que imponen las tecnologías se queda como está: etiquetas y atributos HTML, propiedades CSS, clases de Tailwind, APIs de GSAP y JavaScript, y los nombres estándar de archivo.

**Despliegue.** Manual: lo hace Pau por FTP, sin GitHub Actions ni Secrets. El hosting solo ofrece FTP sin cifrar (no admite FTPS). Antes de subir: `npm run build` y `php tests/run.php`. Se sube `public/` a `/web` y `src/` a la raíz del FTP, junto a `/web`. Nunca se sobrescribe ni se borra el `.env` del servidor. Las credenciales del FTP no se guardan en el repo ni se pegan en el chat.

**Memoria.** Engram guarda el contexto entre sesiones y OpenSpec guarda las decisiones en git.
