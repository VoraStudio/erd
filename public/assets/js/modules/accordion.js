// Tarjetas que se abren (Home). Cada tarjeta tiene un botón rojo (data-acordeon-boton) con aria-expanded: es lo único
// clicable, y el CSS (:has) abre y cierra el panel.
// Con GSAP y SplitText se añaden dos efectos:
//   1. Con el ratón encima del botón, la flecha del botón rojo sube 5 px y baja, sin parar y con suavidad.
//      Al quitar el ratón vuelve a su sitio también con suavidad.
//   2. Al abrir la tarjeta, SplitText parte el texto en caracteres y cada uno aparece con un fundido, uno tras otro.
// Sin JavaScript, sin GSAP o con movimiento reducido las tarjetas se abren igual, solo sin estos efectos.

const DESPLAZAMIENTO_FLECHA_PX = 5;
// Lo que tarda en subir (o en bajar): el vaivén completo dura el doble.
const SEGUNDOS_MEDIO_VAIVEN = 0.5;
const SEGUNDOS_VUELTA_FLECHA = 0.3;

const SEGUNDOS_LETRA = 0.4;
const ESCALONADO_LETRAS = 0.012;
// El texto espera un poco para que el panel ya se esté abriendo cuando empiezan a aparecer las letras.
const RETRASO_TEXTO_SEGUNDOS = 0.15;

// yoyo hace que la animación, al llegar arriba, vuelva hacia abajo en vez de saltar al inicio.
function animarFlechaAlPasarElRaton(gsap, boton) {
  const flecha = boton.querySelector('svg');
  if (!flecha) {
    return;
  }

  const vaiven = gsap.to(flecha, {
    y: -DESPLAZAMIENTO_FLECHA_PX,
    duration: SEGUNDOS_MEDIO_VAIVEN,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    paused: true,
  });
  let vuelta = null;

  boton.addEventListener('mouseenter', () => {
    if (vuelta) {
      vuelta.kill();
    }
    // invalidate() hace que el vaivén parta de donde esté la flecha ahora, sin saltos.
    vaiven.invalidate().restart();
  });

  boton.addEventListener('mouseleave', () => {
    vaiven.pause();
    vuelta = gsap.to(flecha, { y: 0, duration: SEGUNDOS_VUELTA_FLECHA, ease: 'power2.out' });
  });
}

// Parte el texto de la tarjeta en palabras y caracteres (las palabras evitan que una palabra se corte a mitad de
// línea) y devuelve la función que hace aparecer las letras.
function prepararAparicionDelTexto(gsap, SplitText, tarjeta) {
  const texto = tarjeta.querySelector('.accordion-panel p');
  if (!texto) {
    return null;
  }

  const division = SplitText.create(texto, { type: 'words,chars' });

  return () => {
    gsap.fromTo(
      division.chars,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: SEGUNDOS_LETRA,
        ease: 'power1.out',
        stagger: ESCALONADO_LETRAS,
        delay: RETRASO_TEXTO_SEGUNDOS,
        // Si se cierra y se vuelve a abrir a mitad de efecto, la animación nueva sustituye a la anterior.
        overwrite: true,
      },
    );
  };
}

export function iniciarAcordeones() {
  const tarjetas = document.querySelectorAll('.accordion-card');
  const { gsap, SplitText } = window;

  const sePuedeAnimar = Boolean(gsap && SplitText) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // En pantallas táctiles no hay «pasar el ratón»: el vaivén se quedaría moviéndose tras tocar la tarjeta.
  const hayRaton = window.matchMedia('(hover: hover)').matches;

  if (sePuedeAnimar) {
    gsap.registerPlugin(SplitText);
  }

  for (const tarjeta of tarjetas) {
    const boton = tarjeta.querySelector('[data-acordeon-boton]');
    if (!boton) {
      continue;
    }

    const mostrarTexto = sePuedeAnimar ? prepararAparicionDelTexto(gsap, SplitText, tarjeta) : null;

    if (sePuedeAnimar && hayRaton) {
      animarFlechaAlPasarElRaton(gsap, boton);
    }

    boton.addEventListener('click', () => {
      const estaAbierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', String(!estaAbierto));

      if (!estaAbierto && mostrarTexto) {
        mostrarTexto();
      }
    });
  }
}
