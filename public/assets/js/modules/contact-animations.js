// Animaciones del bloque de contacto (#contacte, el que cierra todas las páginas), con GSAP, SplitText y ScrollTrigger.
// Como el pie, pero algo más lento: todo aparece con un fundido desde abajo, uno detrás de otro (stagger).
//   - Los textos (títulos, datos de contacto, etiquetas) se parten en líneas con SplitText y cada línea entra por separado.
//   - Los campos, la casilla y el botón entran enteros.
// Las dos columnas (los datos de contacto y el formulario) arrancan a la vez y escalonan cada una por su lado.
// Los atributos data-contacto-grupo del HTML (components/contact.js) marcan cada columna.

const DESPLAZAMIENTO = 24;
const SEGUNDOS = 0.9;
const ESCALONADO = 0.09;

// Del título se parten sus dos <span> y no el <h2>: si SplitText parte un <span> anidado, lo clona una vez por línea
// y repite su margen (el título crecería en móvil).
const SELECTOR_TEXTOS = 'h2 > span, h3, dt, dd, .field > span';
const SELECTOR_CONTROLES = '.field-input, .check, .btn-submit';

// Los elementos llevan sus propios estilos (p. ej. el botón tiene una transición): al terminar se limpian.
const PROPIEDADES_ANIMADAS = 'opacity,visibility,transform';

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
  }
}
