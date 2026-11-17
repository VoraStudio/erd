// Textos que entran línea a línea, con GSAP, SplitText y ScrollTrigger. Pieza reutilizable: basta con poner
// data-lineas en el texto. SplitText lo parte en líneas y cada una aparece con un fundido desde abajo, una detrás
// de otra (stagger), cuando el texto llega al 85 % de la altura de la ventana. Mismos tiempos que el bloque de contacto.
// Ajustes opcionales en el propio elemento: data-espera (segundos que tarda en empezar), data-escalonado (espera entre
// una línea y la siguiente) y data-segundos (lo que tarda cada línea). Sirven para encadenar varios textos de una sección.

const DESPLAZAMIENTO = 24;
const SEGUNDOS = 0.9;
const ESCALONADO = 0.09;

// Los elementos llevan sus propios estilos: al terminar se limpian.
const PROPIEDADES_ANIMADAS = 'opacity,visibility,transform';

function animarTexto(gsap, SplitText, texto) {
  // autoSplit vuelve a partir el texto si cambian las líneas (al cambiar el ancho de la ventana o al cargar la
  // fuente). La animación que devuelve onSplit se rehace sola.
  SplitText.create(texto, {
    type: 'lines',
    autoSplit: true,
    onSplit: (division) => {
      // fromTo deja las líneas ocultas desde el principio, antes de que llegue el scroll.
      return gsap.fromTo(
        division.lines,
        { autoAlpha: 0, y: DESPLAZAMIENTO },
        {
          autoAlpha: 1,
          y: 0,
          duration: Number(texto.dataset.segundos || SEGUNDOS),
          delay: Number(texto.dataset.espera || 0),
          ease: 'power2.out',
          stagger: Number(texto.dataset.escalonado || ESCALONADO),
          clearProps: PROPIEDADES_ANIMADAS,
          scrollTrigger: { trigger: texto, start: 'top 85%', toggleActions: 'play none none reverse' },
        },
      );
    },
  });
}

export function iniciarTextosPorLineas() {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger || !SplitText) {
    return;
  }

  const textos = gsap.utils.toArray('[data-lineas]');
  if (textos.length === 0) {
    return;
  }

  // Si el visitante pide menos movimiento, los textos se quedan tal cual, visibles.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  for (const texto of textos) {
    animarTexto(gsap, SplitText, texto);
  }
}
