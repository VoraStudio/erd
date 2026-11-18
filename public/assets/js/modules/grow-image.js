// Imagen que crece al bajar (Actualitat). Se anima el recorte (clip-path), no el tamaño:
// así el navegador no recalcula el layout en cada fotograma.
// Los textos de la foto (la etiqueta, el título y el botón) entran cuando ya ha crecido casi del todo: la etiqueta con
// un fundido, el título palabra a palabra con SplitText (dentro de una máscara, como los demás títulos) y el botón
// al final. Al volver hacia arriba, la animación se rebobina y salen en orden inverso.

const RECORTE_VERTICAL_VH = 19;
const RADIO_INICIAL = '1.25rem';

const SEGUNDOS_PALABRA = 1.3;
const ESCALONADO_PALABRAS = 0.12;
const SEGUNDOS_ENTRADA = 0.9;
const DESPLAZAMIENTO_ETIQUETA = 24;
const DESPLAZAMIENTO_BOTON = 40;
const RETRASO_TITULO = 0.15;
const RETRASO_BOTON = 0.9;

// Los elementos llevan sus propios estilos (el botón tiene una transición): al terminar se limpian.
const PROPIEDADES_ANIMADAS = 'opacity,visibility,transform';

function animarTextos(gsap, SplitText, seccion) {
  const etiqueta = seccion.querySelector('.grow-content .chip');
  const titulo = seccion.querySelector('.grow-content h2');
  const boton = seccion.querySelector('.grow-content .btn');
  if (!etiqueta || !titulo || !boton) {
    return;
  }

  // Con la sección a un 25 % de la altura de la ventana la foto ya ha crecido un 75 %.
  const entrada = gsap.timeline({
    scrollTrigger: { trigger: seccion, start: 'top 25%', toggleActions: 'play reverse play reverse' },
  });

  entrada.fromTo(
    etiqueta,
    { autoAlpha: 0, y: DESPLAZAMIENTO_ETIQUETA },
    { autoAlpha: 1, y: 0, duration: SEGUNDOS_ENTRADA, ease: 'power2.out', clearProps: PROPIEDADES_ANIMADAS },
    0,
  );

  const division = SplitText.create(titulo, {
    type: 'words',
    mask: 'words',
    // La clase de cada palabra da nombre a su máscara: process-word-mask (ver pages.css), con relleno para las colas de letras.
    wordsClass: 'process-word',
  });
  // Baja 130 % (y no 100 %): la máscara tiene un relleno por abajo y la palabra tiene que quedar fuera de él.
  entrada.from(division.words, { yPercent: 130, duration: SEGUNDOS_PALABRA, ease: 'power3.out', stagger: ESCALONADO_PALABRAS }, RETRASO_TITULO);

  entrada.fromTo(
    boton,
    { autoAlpha: 0, y: DESPLAZAMIENTO_BOTON },
    { autoAlpha: 1, y: 0, duration: SEGUNDOS_ENTRADA, ease: 'power2.out', clearProps: PROPIEDADES_ANIMADAS },
    RETRASO_BOTON,
  );
}

export function iniciarImagenQueCrece() {
  const { gsap, ScrollTrigger, SplitText } = window;
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

    if (SplitText) {
      gsap.registerPlugin(SplitText);
      animarTextos(gsap, SplitText, seccion);
    }

    // Al pedir movimiento reducido, GSAP deshace la animación y aquí se quita el recorrido extra.
    return () => seccion.classList.remove('is-growing');
  });
}
