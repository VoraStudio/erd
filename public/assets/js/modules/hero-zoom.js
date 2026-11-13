// Hero de la Home: el logotipo con la foto en las letras entra muy ampliado y se encoge hasta su tamaño.
// El estado inicial (ampliado) lo pone el CSS; aquí solo se anima hasta escala 1.

const SEGUNDOS = 2.2;
const ESPERA_MAXIMA_FOTO_MS = 2500;

// Si GSAP no carga, el logotipo se queda en su tamaño normal en vez de ampliado.
function dejarEnSuTamano(logo) {
  logo.classList.add('is-settled');
}

// La foto tiene que estar lista antes de animar: si no, se verían las letras rojas vacías.
function esperarFoto(foto) {
  const limite = new Promise((resolver) => setTimeout(resolver, ESPERA_MAXIMA_FOTO_MS));
  return Promise.race([foto.decode().catch(() => {}), limite]);
}

export async function iniciarZoomDelHero() {
  const logo = document.querySelector('[data-hero-zoom]');
  if (!logo) {
    return;
  }

  const { gsap } = window;
  if (!gsap) {
    dejarEnSuTamano(logo);
    return;
  }

  await esperarFoto(logo.querySelector('img'));

  // Con movimiento reducido el CSS no amplía nada y GSAP no anima: el logotipo ya está en su sitio.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    const escalaInicial = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-zoom-scale'));

    gsap.fromTo(
      logo,
      { scale: escalaInicial },
      { scale: 1, duration: SEGUNDOS, ease: 'power3.out', onComplete: () => dejarEnSuTamano(logo) },
    );
  });
}
