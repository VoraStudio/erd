// Animaciones del bloque de contacto (#contacte, el que cierra todas las páginas), con GSAP, SplitText y ScrollTrigger.
// Como el pie, pero algo más lento: todo aparece con un fundido desde abajo, uno detrás de otro (stagger).
//   - Los textos (títulos, datos de contacto, etiquetas) se parten en líneas con SplitText y cada línea entra por separado.
//   - Los campos, la casilla y el botón entran enteros.
//   - Los datos de contacto (teléfono, correo, dónde estamos y horario) tienen su propia entrada, más vistosa: el icono
//     rebota y gira, la etiqueta entra de lado y el valor aparece letra a letra, una fila detrás de otra.
// Las dos columnas (los datos de contacto y el formulario) arrancan a la vez y escalonan cada una por su lado.
// Los atributos data-contacto-grupo del HTML (components/contact.js) marcan cada columna.

const DESPLAZAMIENTO = 24;
const SEGUNDOS = 0.9;
const ESCALONADO = 0.09;

// Del título se parten sus dos <span> y no el <h2>: si SplitText parte un <span> anidado, lo clona una vez por línea
// y repite su margen (el título crecería en móvil).
const SELECTOR_TEXTOS = 'h2 > span, h3, .field > span';
const SELECTOR_CONTROLES = '.field-input, .check, .btn-submit';

// Los elementos llevan sus propios estilos (p. ej. el botón tiene una transición): al terminar se limpian.
const PROPIEDADES_ANIMADAS = 'opacity,visibility,transform';

// Entrada de los datos de contacto: empiezan cuando el título ya va a medias y cada fila arranca algo después de la anterior.
const RETRASO_DATOS = 0.45;
const ESCALONADO_DATOS = 0.2;
const SEGUNDOS_ICONO = 0.7;
const SEGUNDOS_ETIQUETA = 0.5;
const DESPLAZAMIENTO_ETIQUETA = 14;
const SEGUNDOS_LETRAS = 0.7;
const ESCALONADO_LETRAS = 0.022;

// Las letras bajan 130 % (y no 100 %): la máscara tiene un relleno por abajo y la letra tiene que quedar fuera de él.
const DESPLAZAMIENTO_LETRAS = 130;

// Las líneas de texto y los campos van mezclados: se ordenan por su posición en pantalla para que entren
// de arriba abajo, como se leen.
function ordenarDeArribaAbajo(elementos) {
  return [...elementos].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
}

function animarColumna(gsap, SplitText, columna, seccion) {
  const textos = columna.querySelectorAll(SELECTOR_TEXTOS);
  const controles = columna.querySelectorAll(SELECTOR_CONTROLES);

  // autoSplit vuelve a partir los textos si cambian las líneas (al cambiar el ancho de la ventana o al cargar la
  // fuente). La animación que devuelve onSplit se rehace sola.
  SplitText.create(textos, {
    type: 'lines',
    autoSplit: true,
    onSplit: (division) => {
      const entradas = ordenarDeArribaAbajo([...division.lines, ...controles]);

      // fromTo deja los elementos ocultos desde el principio, antes de que llegue el scroll.
      return gsap.fromTo(
        entradas,
        { autoAlpha: 0, y: DESPLAZAMIENTO },
        {
          autoAlpha: 1,
          y: 0,
          duration: SEGUNDOS,
          ease: 'power2.out',
          stagger: ESCALONADO,
          clearProps: PROPIEDADES_ANIMADAS,
          scrollTrigger: { trigger: seccion, start: 'top 75%', toggleActions: 'play none none reverse' },
        },
      );
    },
  });
}

function animarDatos(gsap, SplitText, columna, seccion) {
  const filas = columna.querySelectorAll('[data-contacto-dato]');
  if (filas.length === 0) {
    return;
  }

  const linea = gsap.timeline({
    delay: RETRASO_DATOS,
    scrollTrigger: { trigger: seccion, start: 'top 75%', toggleActions: 'play none none reverse' },
  });

  filas.forEach((fila, posicion) => {
    const icono = fila.querySelector('.contact-icon');
    const etiqueta = fila.querySelector('[data-dato-etiqueta]');
    // Primero en palabras y luego en letras: así una palabra nunca se parte por la mitad al saltar de línea.
    const letras = SplitText.create(fila.querySelector('dd'), {
      type: 'words,chars',
      mask: 'chars',
      charsClass: 'contact-char',
    }).chars;
    const inicio = posicion * ESCALONADO_DATOS;

    linea.fromTo(
      icono,
      { scale: 0.4, rotation: -25, autoAlpha: 0 },
      { scale: 1, rotation: 0, autoAlpha: 1, duration: SEGUNDOS_ICONO, ease: 'back.out(1.8)', clearProps: PROPIEDADES_ANIMADAS },
      inicio,
    );
    linea.fromTo(
      etiqueta,
      { autoAlpha: 0, x: -DESPLAZAMIENTO_ETIQUETA },
      { autoAlpha: 1, x: 0, duration: SEGUNDOS_ETIQUETA, ease: 'power2.out', clearProps: PROPIEDADES_ANIMADAS },
      inicio + 0.1,
    );
    linea.from(letras, { yPercent: DESPLAZAMIENTO_LETRAS, duration: SEGUNDOS_LETRAS, ease: 'power3.out', stagger: ESCALONADO_LETRAS }, inicio + 0.2);
  });
}

export function iniciarAnimacionesDelContacto() {
  const { gsap, ScrollTrigger, SplitText } = window;
  const seccion = document.querySelector('#contacte');
  if (!gsap || !ScrollTrigger || !SplitText || !seccion) {
    return;
  }

  // Si el visitante pide menos movimiento, el bloque se queda tal cual, visible.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  for (const columna of seccion.querySelectorAll('[data-contacto-grupo]')) {
    animarColumna(gsap, SplitText, columna, seccion);
    animarDatos(gsap, SplitText, columna, seccion);
  }
}
