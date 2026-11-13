# OpenSpec

Registro de decisiones del proyecto ERD, en archivos Markdown versionados en git. **Siempre en español.**

Cada commit lleva su nota. El hook **OpenSpec Commit** bloquea un `git commit` si entre los cambios del commit no hay ninguna nota nueva en `openspec/decisiones/`. El hook solo vigila: la nota la escribe el agente.

## Carpetas

```
openspec/decisiones/<categoria>/NNN.md
```

| Categoría | Qué va |
| --- | --- |
| `arquitectura` | Estructura del proyecto, stack, compilación, despliegue y decisiones transversales |
| `html` | Estructura semántica, páginas, accesibilidad y SEO |
| `css` | Tailwind, `theme.css` y cómo se implementan los estilos |
| `js` | Componentes y módulos de JavaScript |
| `php` | Lógica de servidor (carpeta preparada; todavía no se usa) |
| `diseno` | Decisiones de interfaz y de diseño, tokens de marca y cómo se aprovecha y se mejora el boceto de VoraStudio |
| `animacion` | Animaciones de entrada y de salida con GSAP, y animaciones de scroll |

Los nombres de carpeta van en ASCII, sin tildes ni `ñ`, porque se corrompen al pasar entre sistemas (macOS, Windows, FTP).

## Reglas

- **Una nota por decisión.** Si un commit toca varias áreas, la nota va en la carpeta de la categoría principal y la línea `Afecta` enlaza las demás. Si no afecta a ninguna, se escribe `Afecta: ninguna`.
- **Numeración correlativa de tres cifras dentro de cada carpeta** (`001.md`, `002.md`…).
- **Una nota cerrada no se edita.** Si la decisión cambia, se escribe una nota nueva que la sustituye y la enlaza con `Sustituye: [001](001.md)`.
- **Todo lo que hay aquí se versiona.** Ningún dato confidencial del cliente ni credenciales.
- Si no está claro a qué categoría va una decisión, se elige la que explica el porqué y se marcan las demás en `Afecta`.

## Plantilla

```markdown
# <título de la decisión>

Categoría: css · Afecta: [js](../js/)

## Qué

<la decisión, en una o dos frases>

## Por qué

<el motivo y las alternativas descartadas>

## Archivos

- <ruta> — <qué cambia>
```
