// Imagen que crece al bajar (Actualitat). Se anima el recorte (clip-path), no el tamaño:
// así el navegador no recalcula el layout en cada fotograma.

const RECORTE_VERTICAL_VH = 19;
const RADIO_INICIAL = '1.25rem';

export function iniciarImagenQueCrece() {
  const { gsap, ScrollTrigger } = window;
  const seccion = document.querySelector('[data-grow]');
  if (!gsap || !ScrollTrigger || !seccion) {
    return;
  }

  const marco = seccion.querySelector('.grow-frame');
  // El margen lateral es el mismo que el de .wrap, así la imagen parte alineada con el resto de la página.
  const margenLateral = () => parseFloat(getComputedStyle(document.querySelector('.wrap')).paddingLeft);

  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    seccion.classList.add('is-growing');

    gsap.fromTo(
      marco,
      { clipPath: () => `inset(${RECORTE_VERTICAL_VH}vh ${margenLateral()}px round ${RADIO_INICIAL})` },
      {
        clipPath: 'inset(0vh 0px round 0rem)',
        ease: 'none',
        scrollTrigger: {
          trigger: seccion,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );

    // Al pedir movimiento reducido, GSAP deshace la animación y aquí se quita el recorrido extra.
    return () => seccion.classList.remove('is-growing');
  });
}
