// Animaciones propias de la página de un artículo, con GSAP y ScrollTrigger. Los títulos, las entradillas y los
// párrafos no están aquí: usan las piezas de toda la web (data-titulo-palabras y data-lineas).
//   1. La portada crece al bajar: se anima el recorte (clip-path), no el tamaño, así el navegador no recalcula
//      el layout en cada fotograma (la misma idea que la imagen que crece de Actualitat).
//   2. Las fotos de la galería se revelan con una cortina vertical, de abajo hacia arriba, una detrás de otra
//      (la misma cortina que las fotos de «Així treballem»).

const RECORTE_INICIAL_DE_LA_PORTADA = 'inset(14% 12% 14% 12% round 1.25rem)';
const RECORTE_FINAL_DE_LA_PORTADA = 'inset(0% 0% 0% 0% round 0rem)';

const CORTINA_RECOGIDA = 'inset(100% 0% 0% 0%)';
const CORTINA_EXTENDIDA = 'inset(0% 0% 0% 0%)';
const SEGUNDOS_FOTO = 1.2;
const ESCALONADO_FOTOS = 0.25;

// Reproducir al entrar, rebobinar al salir hacia arriba y volver a reproducir al volver a bajar.
const AL_HACER_SCROLL = 'play reverse play reverse';

function crecerPortada(gsap, portada) {
  const marco = portada.querySelector('.article-cover-frame');

  gsap.fromTo(
    marco,
    { clipPath: RECORTE_INICIAL_DE_LA_PORTADA },
    {
      clipPath: RECORTE_FINAL_DE_LA_PORTADA,
      ease: 'none',
      scrollTrigger: { trigger: portada, start: 'top 90%', end: 'top 30%', scrub: true },
    },
  );
}

function revelarGaleria(gsap, galeria) {
  gsap.fromTo(
    galeria.children,
    { clipPath: CORTINA_RECOGIDA },
    {
      clipPath: CORTINA_EXTENDIDA,
      duration: SEGUNDOS_FOTO,
      ease: 'power2.out',
      stagger: ESCALONADO_FOTOS,
      scrollTrigger: { trigger: galeria, start: 'top 80%', toggleActions: AL_HACER_SCROLL },
    },
  );
}

export function iniciarAnimacionesDelArticulo() {
  const { gsap, ScrollTrigger } = window;
  const portada = document.querySelector('[data-article-portada]');
  const galeria = document.querySelector('[data-article-galeria]');
  if (!gsap || !ScrollTrigger || (!portada && !galeria)) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Si el visitante pide menos movimiento, no se anima nada: la portada y las fotos se ven enteras.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    if (portada) {
      crecerPortada(gsap, portada);
    }
    if (galeria) {
      revelarGaleria(gsap, galeria);
    }
  });
}
