// Animaciones de entrada y salida al hacer scroll, con GSAP y ScrollTrigger.
// Cada elemento dice cómo aparece con un atributo en el HTML:
//   data-animacion="fade"       aparece sin moverse
//   data-animacion="arriba"     sube desde abajo
//   data-animacion="abajo"      baja desde arriba
//   data-animacion="izquierda"  entra desde la izquierda
//   data-animacion="derecha"    entra desde la derecha
// Al salir de la pantalla se desvanece y vuelve a su posición de partida; al volver, entra otra vez.
// Con data-ritmo="secuencia", "lento", "pausado" o "suave" el elemento entra con más espera entre un elemento y el siguiente
// (sin atributo, el ritmo es el normal). Con data-espera="0.5" empieza esos segundos más tarde (p. ej. un subtítulo
// que debe entrar cuando el título ya va a medias).
//
// Entradas con más recorrido: data-entrada="izquierda" | "arriba" | "derecha" (en vez de data-animacion).
// Se usan cuando varios elementos de un mismo grupo entran cada uno desde un lado distinto: todos los que llevan
// data-entrada comparten lote, así que se escalonan entre sí (con data-animacion, cada dirección es un lote aparte
// y no se escalonarían). La distancia es mayor que la normal para que el movimiento se note.

const DESPLAZAMIENTO = 40;

// duracion: lo que tarda el movimiento de cada elemento. escalonado: la espera entre un elemento y el siguiente.
// duracionFade y easeFade (opcionales): el fade va aparte del movimiento. Con la misma curva que el movimiento
// (power2.out) casi toda la opacidad llega en los primeros 0,3 s y apenas se nota; un fade lineal y más largo se aprecia.
const RITMOS = {
  normal: { duracion: 0.8, escalonado: 0.08 },
  // Cada elemento arranca cuando el anterior está a punto de asentarse (power2.out llega casi a su sitio hacia 0,55 s).
  secuencia: { duracion: 0.9, escalonado: 0.55, duracionFade: 1.2, easeFade: 'none' },
  lento: { duracion: 1.2, escalonado: 0.25 },
  pausado: { duracion: 1.5, escalonado: 0.35 },
  // Para textos que aparecen casi solo con el fundido: el fade es lineal y mucho más largo que el movimiento.
  suave: { duracion: 1.2, escalonado: 0.25, duracionFade: 1.8, easeFade: 'none' },
};

// Distancias de las entradas amplias: los lados recorren más que la de abajo.
const DESPLAZAMIENTO_LATERAL = 240;
const DESPLAZAMIENTO_VERTICAL = 120;

const ESTADOS_AMPLIOS = {
  izquierda: { autoAlpha: 0, x: -DESPLAZAMIENTO_LATERAL },
  arriba: { autoAlpha: 0, y: DESPLAZAMIENTO_VERTICAL },
  derecha: { autoAlpha: 0, x: DESPLAZAMIENTO_LATERAL },
};

const ESTADOS_OCULTOS = {
  fade: { autoAlpha: 0 },
  arriba: { autoAlpha: 0, y: DESPLAZAMIENTO },
  abajo: { autoAlpha: 0, y: -DESPLAZAMIENTO },
  izquierda: { autoAlpha: 0, x: -DESPLAZAMIENTO },
  derecha: { autoAlpha: 0, x: DESPLAZAMIENTO },
};

// obtenerEstadoOculto(elemento) devuelve de dónde parte (y a dónde vuelve al salir) cada elemento.
function animarElementos(gsap, ScrollTrigger, elementos, obtenerEstadoOculto) {
  if (elementos.length === 0) {
    return;
  }

  for (const elemento of elementos) {
    gsap.set(elemento, obtenerEstadoOculto(elemento));
  }

  // Lote: los elementos que entran a la vez aparecen escalonados, uno detrás de otro.
  // Cada uno lleva su propio ritmo (normal o lento), así que la espera se calcula elemento a elemento.
  const mostrar = (lote) => {
    lote.forEach((elemento, posicion) => {
      const ritmo = RITMOS[elemento.dataset.ritmo] || RITMOS.normal;
      const espera = posicion * ritmo.escalonado + Number(elemento.dataset.espera || 0);

      // overwrite: true elimina cualquier animación anterior del elemento (p. ej. la de salida). El fade se crea
      // después y sin overwrite, para no eliminar el movimiento que acaba de crearse.
      gsap.to(elemento, { x: 0, y: 0, duration: ritmo.duracion, delay: espera, ease: 'power2.out', overwrite: true });
      gsap.to(elemento, {
        autoAlpha: 1,
        duration: ritmo.duracionFade || ritmo.duracion,
        delay: espera,
        ease: ritmo.easeFade || 'power2.out',
      });
    });
  };
  const ocultar = (lote) => {
    for (const elemento of lote) {
      gsap.to(elemento, { ...obtenerEstadoOculto(elemento), duration: 0.5, ease: 'power2.in', overwrite: true });
    }
  };

  ScrollTrigger.batch(elementos, {
    start: 'top 90%',
    end: 'bottom 10%',
    onEnter: mostrar,
    onEnterBack: mostrar,
    onLeave: ocultar,
    onLeaveBack: ocultar,
  });
}

export function iniciarAnimaciones() {
  // GSAP se carga desde el HTML con defer, antes que este módulo.
  // Si no ha cargado, la página se queda tal cual: visible y sin animar.
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) {
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Las fuentes y las fotos cambian la altura de la página al cargar: hay que recalcular las posiciones.
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // Solo se anima si el visitante no ha pedido menos movimiento. Si lo pide, no se oculta nada.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    for (const [variante, estadoOculto] of Object.entries(ESTADOS_OCULTOS)) {
      const elementos = gsap.utils.toArray(`[data-animacion="${variante}"]`);
      animarElementos(gsap, ScrollTrigger, elementos, () => estadoOculto);
    }

    const conEntradaAmplia = gsap.utils.toArray('[data-entrada]');
    animarElementos(gsap, ScrollTrigger, conEntradaAmplia, (elemento) => ESTADOS_AMPLIOS[elemento.dataset.entrada] || ESTADOS_AMPLIOS.arriba);
  });
}
