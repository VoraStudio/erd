// Animaciones de entrada y salida al hacer scroll, con GSAP y ScrollTrigger.
// Cada elemento dice cómo aparece con un atributo en el HTML:
//   data-animacion="fade"       aparece sin moverse
//   data-animacion="arriba"     sube desde abajo
//   data-animacion="abajo"      baja desde arriba
//   data-animacion="izquierda"  entra desde la izquierda
//   data-animacion="derecha"    entra desde la derecha
// Al salir de la pantalla se desvanece y vuelve a su posición de partida; al volver, entra otra vez.

const DESPLAZAMIENTO = 40;

const ESTADOS_OCULTOS = {
  fade: { autoAlpha: 0 },
  arriba: { autoAlpha: 0, y: DESPLAZAMIENTO },
  abajo: { autoAlpha: 0, y: -DESPLAZAMIENTO },
  izquierda: { autoAlpha: 0, x: -DESPLAZAMIENTO },
  derecha: { autoAlpha: 0, x: DESPLAZAMIENTO },
};

function animarVariante(gsap, ScrollTrigger, variante, estadoOculto) {
  const elementos = gsap.utils.toArray(`[data-animacion="${variante}"]`);
  if (elementos.length === 0) {
    return;
  }

  gsap.set(elementos, estadoOculto);

  // Lote: los elementos que entran a la vez aparecen escalonados, uno detrás de otro.
  const mostrar = (lote) => {
    gsap.to(lote, { autoAlpha: 1, x: 0, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08, overwrite: true });
  };
  const ocultar = (lote) => {
    gsap.to(lote, { ...estadoOculto, duration: 0.5, ease: 'power2.in', overwrite: true });
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

  // Solo se anima si el visitante no ha pedido menos movimiento. Si lo pide, no se oculta nada.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    for (const [variante, estadoOculto] of Object.entries(ESTADOS_OCULTOS)) {
      animarVariante(gsap, ScrollTrigger, variante, estadoOculto);
    }
  });
}
