# Sistema de diseño — ERD

Autoridad para toda la interfaz de ERD. Se lee antes de escribir cualquier UI.

- **Fuentes:** primero los PDFs de marca (manual de estilo y brandboard). Lo que los PDFs no digan, lo cubre la web HTML entregada. Lo que no esté en ninguna de las dos se marca como «no especificado» y no se inventa.
- **Valores:** viven solo en `theme.css` (colores, fuentes, tamaños, radios, sombras, duraciones, puntos de corte). Este documento nombra los tokens y explica **cuándo y cómo se usan**, sin repetir sus valores.
- **Origen de cada dato:** `(manual)` si sale del PDF, `(web)` si sale de la web, `(medido)` si se midió sobre una ilustración del manual y no está escrito.

## Visión general

ERD es una consultoría de empresa con más de 20 años de oficio, que trabaja a pie de planta en logística, industria y restauración. La interfaz transmite **operativa en marcha**: limpia, directa y con una sola acción clara por pantalla.

- **Valores de marca (manual):** proximidad, eficiencia, datos y resultados.
- **Lema (manual):** «Menys intuïció. Més resultats.»
- **Voz (manual):** clara, directa y práctica, sin teoría innecesaria ni jerga de consultoría. Cercana pero profesional: se tutea al cliente. Habla como un socio que conoce la operativa real, no como un consultor que trae informes. Se dice «Parlem de la teva operació», no «Implementem sinergies transversals».
- **Imagen (manual):** la **línea ERD**, que nace de la diagonal del logotipo, dibuja los procesos (recepción, ubicación, preparación, expedición) y las fotos de acción ponen la realidad.
  - Sí: flujos y recorridos dibujados con la línea, almacenes, plantas y cocinas en marcha, manos trabajando y material en movimiento, planos cenitales y detalles cerrados.
  - No: apretones de manos, gente sentada ante un ordenador, reuniones alrededor de una mesa, sonrisas posadas y miradas a cámara.
  - La línea tiene el mismo grosor que el trazo del logotipo, va en diagonales de 45° siempre ascendentes, en rojo sobre claro o blanco sobre rojo. El rosa se reserva para los caminos secundarios.
- **Logotipo (manual):** la palabra «erd» en minúscula, con un trazo de un solo grosor; la «e» y la «r» se unen por una diagonal de 45°. Zona de seguridad: como mínimo 1x alrededor (x es el grosor del trazo). Tamaño mínimo: 80 px de ancho en pantalla. Variantes: rojo, tinta y blanco. Usos incorrectos: sombras o resplandores, contornos o recuadros, cambiar el rojo oficial, girarlo o inclinarlo, separar o reordenar las letras, ponerlo sobre fondos sin contraste.

## Colores

**Principio (manual): el rojo rellena y la tinta escribe.** La harina es el fondo de referencia.

| Token | Papel |
| --- | --- |
| `--color-erd-red` | Protagonista de la marca. Rellena: botón primario, caja de mensaje principal, bloques, píldoras de etiqueta. También es el color de los títulos de las listas con flechas y del foco. |
| `--color-erd-red-dark` | Solo hover del rojo (web). |
| `--color-erd-ink` | La tinta escribe: texto principal sobre claro y fondos oscuros. |
| `--color-erd-cacao` | Profundidad. Texto sobre arena y líneas de filete oscuras. |
| `--color-erd-sand` | Fondo cálido de tarjetas y bloques secundarios. |
| `--color-erd-flour` | Fondo de referencia de la página y de los campos. |
| `--color-erd-stone` | Estados neutros: relleno del botón desactivado. |
| `--color-erd-line` | Rosa. **Solo grafismo de líneas. Nunca lleva texto encima.** |
| `--color-erd-muted` | Texto secundario sobre harina (web). |
| `--color-erd-muted-sand` | Texto secundario sobre arena (web). |
| `--color-white` | Texto sobre rojo y fondo del botón blanco. |
| `--color-erd-border` | Borde de contenedores, como el del formulario (manual, medido). |
| `--color-erd-input-border` | Borde de los campos de formulario (manual, medido). |
| `--color-erd-border-light` | Filete sobre fondos oscuros (web). |

**Contraste (manual):**

- Blanco sobre rojo: 5,0:1. Correcto.
- Rojo sobre harina: 4,7:1. Correcto.
- Tinta sobre harina: 15,6:1. Correcto.
- Cacao sobre arena: 13,0:1. Correcto.
- Rojo sobre rosa: 2,9:1. **No permitido.**

La paleta por defecto de Tailwind está desactivada: solo existen los tokens de esta lista (más `transparent` y `current`).

## Tipografía

- **Display** (`--font-display`): Agrandir, para titulares, cifras y frases destacadas, en pesos Light, Regular y Medium. No hay archivo de Agrandir: la web entregada usa Hanken Grotesk como sustituta, y esa es la pila de reserva.
- **Texto** (`--font-body`): Inter, para el cuerpo, la interfaz y los formularios.

| Token | Uso |
| --- | --- |
| `--text-title-1` | Título de página. Agrandir Light. |
| `--text-title-2` | Título de sección. Agrandir Regular. |
| `--text-title-3` | Subtítulo. Inter Bold. |
| `--text-body` | Texto de cuerpo. Inter Regular. |
| `--text-label` | Etiqueta. Inter, en mayúsculas. |
| `--text-button` | Texto de botón. Inter seminegrita, mayúsculas y con espaciado entre letras (web). |

- La escala del manual está definida para escritorio. La web la reduce en dos saltos al estrechar la pantalla (títulos 1 y 2). Como el CSS es mobile first, la base es la escala pequeña y se amplía con `min-width`. Los valores concretos están en `theme.css`. Los títulos 1 y 2 y el cuerpo tienen variantes `-tablet` y `-mobile` (por ejemplo `--text-title-1-mobile`).

## Layout

- **Contenedor:** ancho máximo `--container-site`, con márgenes laterales `--spacing-gutter` y separación vertical entre secciones `--spacing-section` (los tres, de la web; el manual no los define). Tienen variantes `-tablet` y `-mobile`.
- **Puntos de corte (web):** móvil como base, `sm` y `lg`. Son los dos saltos de la web.
- **Rejillas de tarjetas:** tres columnas en escritorio, dos en tableta y una en móvil.
- **Un solo botón primario por pantalla.**

## Elevación y profundidad

Diseño plano. La profundidad la dan las capas de color (arena sobre harina, bloque rojo), no las sombras. Las tarjetas no llevan sombra en reposo.

- `--shadow-card-hover`: sombra suave que aparece al pasar el ratón por una tarjeta de recurso (web).

## Formas

- **Píldora** (`rounded-full`): botones, etiquetas y chips, y el botón circular de las tarjetas.
- `--radius-card`: tarjetas (manual).
- `--radius-field`: campos de formulario (manual: 4 px; la web usaba más y gana el manual).
- Caja roja de mensaje: esquina menor que la de las tarjetas (medido).
- `--radius-submit`: botón de envío del formulario. Esquina pequeña, no es una píldora (medido).
- Bloque «Què fem»: sin esquinas redondeadas.

## Componentes

### Botones

**Reglas (manual):** un solo primario por pantalla. El texto va en mayúsculas y dice qué pasará («RESERVA LA TEVA HORA»).

| Variante | Aspecto | Hover | Foco | Pulsado |
| --- | --- | --- | --- | --- |
| Primario | Píldora de relleno `erd-red`, texto blanco | Pasa a `erd-red-dark` | Contorno de 2 px en `erd-red` separado 3 px | No especificado |
| Secundario | Píldora transparente con contorno de 1,5 px en `erd-red` y texto rojo | Se rellena de `erd-red` y el texto pasa a blanco | Igual | No especificado |
| Blanco (web) | Relleno blanco, texto rojo | Relleno `erd-sand` | Igual | No especificado |
| Desactivado | Relleno `erd-stone` | Sin respuesta | — | — |

- Altura de unos 45 px (medido; la web usa 50 px y gana el manual). Variante pequeña de 40 px (web).
- Botón de envío de un formulario: ocupa todo el ancho.

### Etiquetas y chips

Píldoras de unos 47 px para secciones, sectores y estados cortos. Variantes (manual): relleno rojo, arena o tinta, y contorno rojo o tinta. Una etiqueta de sección va en mayúsculas.

### Tarjetas

- Fondo `erd-sand` y esquina `--radius-card`.
- **Hover (web):** sube 4 px y aparece `--shadow-card-hover`.
- **Tarjeta de servicio (web):** al pasar el ratón se rellena de `erd-red`, el texto pasa a blanco y el botón circular invierte sus colores.
- **Caja roja:** se reserva para el mensaje principal de cada página. Una por página.
- **Botón circular de la esquina:** relleno rojo. En los acordeones, al abrirse, gira 45°.

### Campos de formulario

- Etiqueta encima del campo, en Inter con peso medio (web).
- Altura de unos 40 px (medido; la web usa 52 px y gana el manual).
- Borde de 1 px en `erd-input-border` y esquina `--radius-field`.
- Fondo `erd-flour`.
- **Foco (web):** borde de 2 px en `erd-red`.
- El formulario va dentro de un contenedor de fondo `erd-flour` con borde en `erd-border`.

### Navegación

- Enlaces en Agrandir y en rojo. **Hover y página actual (web):** subrayado de 1,5 px en `erd-red`.
- Botón de menú en píldora roja con el logotipo en blanco. Hover: `erd-red-dark`.
- Enlaces del pie: subrayado al pasar el ratón. Migas de pan: pasan a rojo.

### Lista con flechas (manual)

Título en mayúsculas y en rojo, con un texto corto debajo. Para procesos y pasos.

### Filas «Què fem» (manual)

Bloque rojo con una línea oscura entre filas.

## Movimiento

Sección propia de ERD: el estándar de `DESIGN.md` no la prevé, y la animación es parte del diseño. Se implementa con GSAP.

- **Duraciones:** rápida (`--duration-fast`) para color y bordes, y base (`--duration-base`) para transformaciones y sombras.
- **Efectos de la web entregada:** aparición de los bloques al hacer scroll, frase que pasa sola en la home, tarjetas que se abren, fotos que aparecen en una escala, paneles de «Sobre ERD» con scroll horizontal e imagen que crece al bajar en «Actualitat».
- Las versiones para Figma muestran estos efectos congelados: el comportamiento real está en la web interactiva.
- **Entradas y salidas de GSAP:** curvas, duraciones y escalonado, no especificados. Se definen al construirlas, con las skills de GSAP.
- Toda animación respeta `prefers-reduced-motion`.

## Qué sí y qué no

**Sí**

- El rojo rellena y la tinta escribe.
- Un solo botón primario por pantalla, con un texto que dice qué pasará.
- Rojo sobre claro y blanco sobre rojo.
- Fotos de acción, planos cenitales y detalles cerrados.
- Tutear al cliente con un lenguaje claro y práctico.
- Colores, tamaños y radios solo desde `theme.css`.

**No**

- Texto sobre el rosa, ni usarlo fuera de los trazos.
- Colores sueltos en hexadecimal o clases de la paleta por defecto de Tailwind.
- Sombras o contornos en el logotipo, ni cambiarle el rojo.
- Fotos posadas, reuniones o gente ante un ordenador.
- Jerga de consultoría.
- Inventar estados que el diseño no define.

## Decisiones pendientes

- **Tipografía:** el manual dice Agrandir + Inter y el brandboard dice Open Sauce. Falta el archivo de Agrandir.
- **Estado «pulsado»:** no está definido en ningún sitio.
- **Altura de los campos:** unos 40 px según el manual. Si la accesibilidad táctil pide más, hay que decidirlo.
- **Radios medidos pero no escritos:** caja roja y botón de envío del formulario.
- **Escala tipográfica móvil:** se deriva de la web, porque el manual solo define escritorio.
