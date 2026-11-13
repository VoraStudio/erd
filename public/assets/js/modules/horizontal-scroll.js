// Paneles con scroll horizontal (Sobre ERD). La sección se fija y el scroll vertical mueve los paneles de lado.
// Sin JavaScript, o con movimiento reducido, los paneles se quedan apilados (CSS por defecto).

function marcarPunto(puntos, indiceActivo) {
  puntos.forEach((punto, indice) => {
    punto.setAttribute('aria-current', String(indice === indiceActivo));
  });
}

export function iniciarScrollHorizontal() {
  const { gsap, ScrollTrigger } = window;
  const seccion = document.querySelector('[data-hs]');
  if (!gsap || !ScrollTrigger || !seccion) {
    return;
  }

  const pista = seccion.querySelector('.hs-track');
  const puntos = seccion.querySelectorAll('.hs-dots span');
  const recorrido = () => pista.scrollWidth - window.innerWidth;

  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    seccion.classList.add('is-horizontal');
    marcarPunto(puntos, 0);

    gsap.to(pista, {
      x: () => -recorrido(),
      ease: 'none',
      scrollTrigger: {
        trigger: seccion,
        pin: true,
        scrub: 0.5,
        end: () => `+=${recorrido()}`,
        invalidateOnRefresh: true,
        onUpdate: (disparador) => {
          const indice = Math.round(disparador.progress * (puntos.length - 1));
          marcarPunto(puntos, indice);
        },
      },
    });

    // Al dejar de coincidir la condición, GSAP deshace la animación y aquí se quita el modo horizontal.
    return () => seccion.classList.remove('is-horizontal');
  });
}
