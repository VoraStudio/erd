// Frase que pasa sola (Home). La pista tiene la frase repetida: se desplaza la mitad y vuelve a empezar,
// y como las dos mitades son iguales no se nota el salto.

const SEGUNDOS_POR_VUELTA = 38;

export function iniciarFrasePasante() {
  const { gsap } = window;
  const pista = document.querySelector('[data-marquee]');
  if (!gsap || !pista) {
    return;
  }

  // Con movimiento reducido la frase se queda quieta.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.to(pista, { xPercent: -50, ease: 'none', duration: SEGUNDOS_POR_VUELTA, repeat: -1 });
  });
}
