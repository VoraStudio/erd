// Efecto «enlace que se dibuja» (la parte visual está en components.css, clase .draw-link).
// Al pasar el ratón o enfocar con teclado, GSAP anima --draw-progress de 0 a 1 y el CSS dibuja la línea
// y cambia el color del texto con una máscara. Al salir, vuelve atrás desde donde estuviera (sin saltos).
// Para usarlo en otro sitio basta con ponerle la clase draw-link a un enlace.

const SEGUNDOS = 0.45;

// Crea el tween (pausado) de un enlace y le conecta los eventos. Devuelve la función que los quita.
function prepararEnlace(gsap, enlace) {
  const dibujo = gsap.to(enlace, { '--draw-progress': 1, duration: SEGUNDOS, ease: 'power2.out', paused: true });

  // Con teclado el foco se queda puesto: la línea no debe borrarse mientras el enlace tenga el foco visible.
  const tieneFocoDeTeclado = () => enlace.matches(':focus-visible');

  const dibujar = () => dibujo.play();
  const borrar = () => {
    if (tieneFocoDeTeclado()) {
      return;
    }
    dibujo.reverse();
  };
  const dibujarSiEsTeclado = () => {
    if (tieneFocoDeTeclado()) {
      dibujo.play();
    }
  };

  enlace.addEventListener('mouseenter', dibujar);
  enlace.addEventListener('mouseleave', borrar);
  enlace.addEventListener('focus', dibujarSiEsTeclado);
  enlace.addEventListener('blur', () => dibujo.reverse());

  return () => {
    enlace.removeEventListener('mouseenter', dibujar);
    enlace.removeEventListener('mouseleave', borrar);
    enlace.removeEventListener('focus', dibujarSiEsTeclado);
    dibujo.kill();
  };
}

export function iniciarEnlacesQueSeDibujan() {
  const { gsap } = window;
  if (!gsap) {
    return;
  }

  // Con movimiento reducido no se anima: el CSS aplica el efecto de golpe con :hover y :focus-visible.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    const quitadores = gsap.utils.toArray('.draw-link').map((enlace) => prepararEnlace(gsap, enlace));
    return () => quitadores.forEach((quitar) => quitar());
  });
}
