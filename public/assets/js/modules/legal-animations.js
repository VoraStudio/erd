// Animación de las páginas legales (privadesa, avís legal y cookies), con GSAP, SplitText y ScrollTrigger.
// Los títulos usan la pieza de toda la web (data-titulo-palabras). El texto de cada bloque (subtítulos, párrafos y
// elementos de lista) se parte en líneas y cada línea entra DESDE EL LADO, deslizándose desde detrás de una máscara,
// una detrás de otra: así se distingue del resto de la web, donde los textos suben en vertical.

const SEGUNDOS_LINEA = 1;
const ESCALONADO_LINEAS = 0.08;

// La línea parte totalmente fuera, a la izquierda de su propia caja: la máscara la tapa hasta que entra.
const DESPLAZAMIENTO_INICIAL = -105;

const BLOQUES_DE_TEXTO = '.legal-body h2, .legal-body p, .legal-body li';

function animarBloque(gsap, SplitText, bloque) {
  SplitText.create(bloque, {
    type: 'lines',
    mask: 'lines',
    // La clase de cada línea da nombre a su máscara: legal-line-mask (ver pages.css), con relleno para las colas de letras.
    linesClass: 'legal-line',
    autoSplit: true,
    onSplit: (division) => {
      return gsap.from(division.lines, {
        xPercent: DESPLAZAMIENTO_INICIAL,
        duration: SEGUNDOS_LINEA,
        ease: 'power3.out',
        stagger: ESCALONADO_LINEAS,
        scrollTrigger: { trigger: bloque, start: 'top 88%', toggleActions: 'play none none reverse' },
      });
    },
  });
}

export function iniciarAnimacionesLegales() {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger || !SplitText) {
    return;
  }

  const bloques = gsap.utils.toArray(BLOQUES_DE_TEXTO);
  if (bloques.length === 0) {
    return;
  }

  // Si el visitante pide menos movimiento, los textos se quedan tal cual, visibles.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  for (const bloque of bloques) {
    animarBloque(gsap, SplitText, bloque);
  }
}
