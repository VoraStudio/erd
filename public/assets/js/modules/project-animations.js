// Animaciones propias de la página de un proyecto, con GSAP, SplitText y ScrollTrigger. El título, la entradilla y los
// textos de los pasos no están aquí: usan las piezas de toda la web (data-titulo-palabras y data-lineas).
//   1. Las fotos se revelan con una cortina LATERAL: la primera abre de izquierda a derecha, la segunda de derecha a
//      izquierda, y la foto se asienta con un pequeño zoom. Se anima el recorte (clip-path), no el tamaño.
//   2. Las cifras de los recuadros (data-cifra) aparecen letra a letra con SplitText, dentro de una máscara.
// Las dos se reproducen al entrar en pantalla y se rebobinan al salir (entrada y salida), como el resto de la web.

const SEGUNDOS_CORTINA = 1.3;
const ESPERA_ENTRE_FOTOS = 0.2;
const ZOOM_INICIAL = 1.2;

const SEGUNDOS_LETRA = 0.9;
const ESCALONADO_LETRAS = 0.06;
const ESPERA_CIFRA = 0.25;

// Cortina recogida: la foto está tapada desde un lado y la animación la abre hacia el otro.
const CORTINA_DESDE_LA_IZQUIERDA = 'inset(0% 100% 0% 0%)';
const CORTINA_DESDE_LA_DERECHA = 'inset(0% 0% 0% 100%)';
const CORTINA_EXTENDIDA = 'inset(0% 0% 0% 0%)';

// Reproducir al entrar, rebobinar al salir hacia arriba y volver a reproducir al volver a bajar.
const AL_HACER_SCROLL = 'play reverse play reverse';

function revelarFoto(gsap, marco, posicion) {
  // Alternan: la primera foto entra por la izquierda, la segunda por la derecha, la tercera otra vez por la izquierda…
  const desdeLaDerecha = posicion % 2 === 1;
  const foto = marco.querySelector('img');

  const entrada = gsap.timeline({
    delay: posicion * ESPERA_ENTRE_FOTOS,
    scrollTrigger: { trigger: marco, start: 'top 85%', toggleActions: AL_HACER_SCROLL },
  });

  entrada.fromTo(
    marco,
    { clipPath: desdeLaDerecha ? CORTINA_DESDE_LA_DERECHA : CORTINA_DESDE_LA_IZQUIERDA },
    { clipPath: CORTINA_EXTENDIDA, duration: SEGUNDOS_CORTINA, ease: 'power3.inOut' },
    0,
  );
  entrada.fromTo(foto, { scale: ZOOM_INICIAL }, { scale: 1, duration: SEGUNDOS_CORTINA + 0.4, ease: 'power2.out' }, 0);
}

function animarCifra(gsap, SplitText, cifra) {
  const division = SplitText.create(cifra, {
    // Primero en palabras y luego en letras: así «12 mesos» nunca se parte por la mitad de una palabra.
    type: 'words,chars',
    mask: 'chars',
    // La clase de cada letra da nombre a su máscara: figure-char-mask (ver pages.css).
    charsClass: 'figure-char',
  });

  // Bajan 130 % (y no 100 %): la máscara tiene un relleno y la letra tiene que quedar fuera de él.
  gsap.from(division.chars, {
    yPercent: 130,
    duration: SEGUNDOS_LETRA,
    ease: 'power3.out',
    stagger: ESCALONADO_LETRAS,
    delay: ESPERA_CIFRA,
    scrollTrigger: { trigger: cifra, start: 'top 90%', toggleActions: AL_HACER_SCROLL },
  });
}

export function iniciarAnimacionesDelProyecto() {
  const { gsap, ScrollTrigger, SplitText } = window;
  const marcos = gsap?.utils.toArray('[data-cortina-lateral]') ?? [];
  const cifras = gsap?.utils.toArray('[data-cifra]') ?? [];
  if (!gsap || !ScrollTrigger || !SplitText || (marcos.length === 0 && cifras.length === 0)) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Si el visitante pide menos movimiento, no se anima nada: las fotos y las cifras se ven enteras.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    marcos.forEach((marco, posicion) => revelarFoto(gsap, marco, posicion));

    for (const cifra of cifras) {
      animarCifra(gsap, SplitText, cifra);
    }
  });
}
