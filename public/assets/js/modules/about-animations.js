// Animaciones propias de la página Sobre ERD, con GSAP y ScrollTrigger.
//   1. Las letras «erd» grandes del fondo de la sección «Com t'ajudem a créixer» (data-marca-fondo) aparecen
//      despacio desde la izquierda: se deslizan hacia su sitio mientras se funden.

const DESPLAZAMIENTO_MARCA = 400;
const SEGUNDOS_MARCA = 2.4;

function animarMarcaDeFondo(gsap, marca) {
  const seccion = marca.closest('section');

  // Las letras tienen una opacidad de CSS (0,1): ahí tienen que acabar, no en 1.
  const opacidadFinal = parseFloat(getComputedStyle(marca).opacity);

  gsap.fromTo(
    marca,
    { x: -DESPLAZAMIENTO_MARCA, opacity: 0 },
    {
      x: 0,
      opacity: opacidadFinal,
      duration: SEGUNDOS_MARCA,
      ease: 'power2.out',
      scrollTrigger: { trigger: seccion, start: 'top 75%', toggleActions: 'play none none reverse' },
    },
  );
}

export function iniciarAnimacionesDeSobreErd() {
  const { gsap, ScrollTrigger } = window;
  const marca = document.querySelector('[data-marca-fondo]');
  if (!gsap || !ScrollTrigger || !marca) {
    return;
  }

  // Si el visitante pide menos movimiento, las letras se quedan en su sitio.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  animarMarcaDeFondo(gsap, marca);
}
