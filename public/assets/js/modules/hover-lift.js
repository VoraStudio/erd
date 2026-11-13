// Elevación leve al pasar el ratón: el elemento sube un par de píxeles y baja al salir.
// Para usarlo en otro sitio basta con ponerle el atributo data-elevar al elemento.
// Solo con ratón: en pantallas táctiles no hay hover y el elemento se quedaría elevado tras el toque.

const ELEVACION_PX = 2;
const SEGUNDOS = 0.25;

function prepararElemento(gsap, elemento) {
  const elevar = gsap.to(elemento, { y: -ELEVACION_PX, duration: SEGUNDOS, ease: 'power2.out', paused: true });

  const subir = (evento) => {
    if (evento.pointerType !== 'mouse') {
      return;
    }
    elevar.play();
  };
  const bajar = () => elevar.reverse();

  elemento.addEventListener('pointerenter', subir);
  elemento.addEventListener('pointerleave', bajar);

  return () => {
    elemento.removeEventListener('pointerenter', subir);
    elemento.removeEventListener('pointerleave', bajar);
    elevar.kill();
  };
}

export function iniciarElevacionAlPasarElRaton() {
  const { gsap } = window;
  if (!gsap) {
    return;
  }

  // Con movimiento reducido no se anima nada.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    const quitadores = gsap.utils.toArray('[data-elevar]').map((elemento) => prepararElemento(gsap, elemento));
    return () => quitadores.forEach((quitar) => quitar());
  });
}
