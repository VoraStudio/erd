// Animaciones del pie, con GSAP y ScrollTrigger. Una sola timeline que se reproduce cada vez que el pie
// entra en pantalla al hacer scroll hacia abajo. Si se sube y el pie sale, la timeline se rebobina deprisa
// (queda de nuevo oculta) y al volver a bajar se repite. Cada bloque empieza un poco antes de que acabe el anterior:
//
//   1. El logotipo entra muy ampliado y se encoge hasta su tamaño.
//   2. El subtítulo del logotipo aparece con un fundido desde abajo.
//   3. Los títulos y enlaces de las dos columnas (Navega y Serveis) aparecen escalonados (stagger).
//   4. Las dos líneas de abajo (el © y los enlaces legales) aparecen al final.
//
// Los atributos data-pie-* del HTML (components/footer.js) dicen qué elemento es cada cosa.

const ESCALA_INICIAL_LOGO = 3;
const SEGUNDOS_LOGO = 0.7;
const SEGUNDOS_SUBTITULO = 0.8;
const SEGUNDOS_ELEMENTOS = 0.7;
const ESCALONADO_ELEMENTOS = 0.06;
const SEGUNDOS_LEGAL = 0.7;
const ESCALONADO_LEGAL = 0.15;
const DESPLAZAMIENTO_SUBTITULO = 30;
const DESPLAZAMIENTO_ELEMENTOS = 24;
const DESPLAZAMIENTO_LEGAL = 20;

// Al salir hacia arriba, la timeline se rebobina a esta velocidad (3 = tres veces más rápido que al entrar).
const VELOCIDAD_AL_SALIR = 3;

// Cada bloque arranca estos segundos antes de que termine el anterior, para que se encadenen sin esperas.
const SOLAPE_SUBTITULO = '>-0.4';
const SOLAPE_ELEMENTOS = '>-0.3';
const SOLAPE_LEGAL = '>-0.2';

// Los elementos llevan sus propios estilos (p. ej. los títulos tienen una opacidad de CSS): al terminar se limpian.
const PROPIEDADES_ANIMADAS = 'opacity,visibility,transform';

export function iniciarAnimacionesDelPie() {
  const { gsap, ScrollTrigger } = window;
  const pie = document.querySelector('site-footer footer');
  if (!gsap || !ScrollTrigger || !pie) {
    return;
  }

  // Si el visitante pide menos movimiento, el pie se queda tal cual, visible.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const logo = pie.querySelector('[data-pie-logo]');
  const subtitulo = pie.querySelector('[data-pie-subtitulo]');
  const columnas = pie.querySelectorAll('[data-pie-grupo]');
  const lineasLegales = pie.querySelectorAll('[data-pie-legal]');

  // Empieza parada: fromTo deja los elementos ocultos desde el principio y no se mueve nada hasta el scroll.
  const linea = gsap.timeline({ paused: true });

  // 1. Logotipo: crece desde su esquina de arriba a la izquierda, así nunca se sale por arriba ni por la izquierda.
  linea.fromTo(
    logo,
    { scale: ESCALA_INICIAL_LOGO, autoAlpha: 0, transformOrigin: 'left top' },
    { scale: 1, autoAlpha: 1, duration: SEGUNDOS_LOGO, ease: 'power3.out', clearProps: 'all' },
  );

  // 2. Subtítulo
  linea.fromTo(
    subtitulo,
    { autoAlpha: 0, y: DESPLAZAMIENTO_SUBTITULO },
    { autoAlpha: 1, y: 0, duration: SEGUNDOS_SUBTITULO, ease: 'power2.out', clearProps: PROPIEDADES_ANIMADAS },
    SOLAPE_SUBTITULO,
  );

  // 3. Columnas: las dos arrancan a la vez, y dentro de cada una los elementos entran uno detrás de otro.
  columnas.forEach((columna, indice) => {
    const elementos = columna.querySelectorAll('[data-pie-elemento]');
    // La primera columna marca el momento de arranque; la segunda se coloca "<" (a la vez que ella).
    const posicion = indice === 0 ? SOLAPE_ELEMENTOS : '<';
    linea.fromTo(
      elementos,
      { autoAlpha: 0, y: DESPLAZAMIENTO_ELEMENTOS },
      {
        autoAlpha: 1,
        y: 0,
        duration: SEGUNDOS_ELEMENTOS,
        ease: 'power2.out',
        stagger: ESCALONADO_ELEMENTOS,
        clearProps: PROPIEDADES_ANIMADAS,
      },
      posicion,
    );
  });

  // 4. Líneas de abajo
  linea.fromTo(
    lineasLegales,
    { autoAlpha: 0, y: DESPLAZAMIENTO_LEGAL },
    {
      autoAlpha: 1,
      y: 0,
      duration: SEGUNDOS_LEGAL,
      ease: 'power2.out',
      stagger: ESCALONADO_LEGAL,
      clearProps: PROPIEDADES_ANIMADAS,
    },
    SOLAPE_LEGAL,
  );

  // Al llegar la parte de arriba del pie al 80 % de la altura de la pantalla, se reproduce.
  // Al subir y pasar otra vez por esa línea, se rebobina: así, al volver a bajar, se repite.
  ScrollTrigger.create({
    trigger: pie,
    start: 'top 80%',
    onEnter: () => linea.timeScale(1).play(),
    onLeaveBack: () => linea.timeScale(VELOCIDAD_AL_SALIR).reverse(),
  });
}
