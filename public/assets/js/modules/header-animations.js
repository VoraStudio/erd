// Animaciones de la cabecera y del menú a pantalla completa, con GSAP.
// Solo se usan aquí, así que viven juntas: si se rediseña la cabecera, se tocan a la vez.
// Las piezas que sí se reutilizan en otras partes tienen su propio módulo: draw-link.js y hover-lift.js.
//
//   1. Entrada de la cabecera: el logotipo desde la izquierda y el nav desde arriba, con stagger.
//   2. Cruz del botón de menú: las tres rayas se vuelven una cruz al pasar el ratón.
//   3. Cortina del menú: cae de arriba abajo y sus elementos aparecen escalonados (se exporta, la usa el componente).
//   4. Botón de cierre: un anillo se dibuja alrededor de la cruz y la cruz gira.
//   5. Flechas con texto (servicios del menú y pasos de la sección roja de la Home): la flecha se pone horizontal y
//      el texto se desplaza. Se activa con data-flecha en el elemento y data-flecha-texto en el texto que se mueve.

const SEGUNDOS_ENTRADA = 0.8;
const DESPLAZAMIENTO_ENTRADA = 40;
const ESCALONADO_NAV = 0.08;
const SOLAPE_NAV = '<0.15';

const SEGUNDOS_CRUZ = 0.3;

const SEGUNDOS_ABRIR = 1.5;
const SEGUNDOS_CERRAR = 1.1;
// power2.out frena de forma suave al final. Una curva más fuerte (power3, expo) revela casi todo
// en los primeros 300 ms y el resto se arrastra: parece rápida aunque dure más.
const EASE_CORTINA = 'power2.out';
// Los elementos empiezan cuando la cortina lleva este tiempo, para que entren sobre el menú ya visible.
const RETRASO_ELEMENTOS = 0.5;
const SEGUNDOS_ELEMENTO = 0.8;
const ESCALONADO_ELEMENTOS = 0.05;
const DESPLAZAMIENTO_ELEMENTOS = 30;
// inset(arriba derecha abajo izquierda): con 100% abajo no se ve nada; con 0% se ve todo.
const CORTINA_RECOGIDA = 'inset(0% 0% 100% 0%)';
const CORTINA_EXTENDIDA = 'inset(0% 0% 0% 0%)';
// Los elementos llevan sus propios estilos (p. ej. el título tiene una opacidad de CSS): al terminar se limpian.
const PROPIEDADES_ANIMADAS = 'opacity,visibility,transform';

const SEGUNDOS_CIERRE = 0.5;
const GIRO_CIERRE_GRADOS = 90;

const SEGUNDOS_FLECHA = 0.35;
const GIRO_FLECHA_GRADOS = 45;
const DESPLAZAMIENTO_FLECHA_PX = 6;
const DESPLAZAMIENTO_TEXTO_PX = 10;

// Reproduce un efecto al entrar con el ratón y lo rebobina al salir. Devuelve la función que lo desconecta.
// Solo con ratón: en pantallas táctiles no hay hover y el efecto se quedaría puesto tras el toque.
function conectarHover(elemento, efecto) {
  const reproducir = (evento) => {
    if (evento.pointerType !== 'mouse') {
      return;
    }
    efecto.play();
  };
  const rebobinar = () => efecto.reverse();

  elemento.addEventListener('pointerenter', reproducir);
  elemento.addEventListener('pointerleave', rebobinar);

  return () => {
    elemento.removeEventListener('pointerenter', reproducir);
    elemento.removeEventListener('pointerleave', rebobinar);
    efecto.kill();
  };
}

// ---------- 1. Entrada de la cabecera ----------

// En móvil los enlaces están ocultos (display: none): no se animan, para que el botón
// «Contacte» no espere el turno de unos elementos que nadie ve.
function estaVisible(elemento) {
  return elemento.offsetParent !== null;
}

function animarEntradaDeLaCabecera(gsap) {
  const logo = document.querySelector('[data-entrada-logo]');
  if (!logo) {
    return;
  }
  const elementosDelNav = gsap.utils.toArray('[data-entrada-nav]').filter(estaVisible);

  const linea = gsap.timeline({ defaults: { duration: SEGUNDOS_ENTRADA, ease: 'power3.out' } });
  linea.from(logo, { x: -DESPLAZAMIENTO_ENTRADA, autoAlpha: 0, clearProps: 'all' });
  linea.from(
    elementosDelNav,
    { y: -DESPLAZAMIENTO_ENTRADA, autoAlpha: 0, stagger: ESCALONADO_NAV, clearProps: 'all' },
    SOLAPE_NAV,
  );
}

// ---------- 2. Cruz del botón de menú ----------

function prepararCruzDelMenu(gsap) {
  const boton = document.querySelector('[data-menu-obrir]');
  if (!boton) {
    return () => {};
  }
  const [rayaSuperior, rayaCentral, rayaInferior] = boton.querySelectorAll('.burger span');

  // Lo que separa una raya de la siguiente: es lo que tiene que recorrer cada raya para cruzarse en el centro.
  const separacion = rayaCentral.offsetTop - rayaSuperior.offsetTop;

  // La raya de arriba baja y gira 45°, la de abajo sube y gira -45°, y la del medio se desvanece.
  const cruz = gsap.timeline({ paused: true, defaults: { duration: SEGUNDOS_CRUZ, ease: 'power2.inOut' } });
  cruz.to(rayaSuperior, { y: separacion, rotation: 45 }, 0);
  cruz.to(rayaCentral, { scaleX: 0, autoAlpha: 0 }, 0);
  cruz.to(rayaInferior, { y: -separacion, rotation: -45 }, 0);

  return conectarHover(boton, cruz);
}

// ---------- 3. Cortina del menú ----------

function hayAnimacion() {
  const pideMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return Boolean(window.gsap) && !pideMenosMovimiento;
}

// Abre y cierra el <dialog> del menú. La cortina es un recorte (clip-path): no mueve el menú, solo lo va revelando.
// Sin GSAP o con movimiento reducido, el menú se abre y se cierra de golpe, sin animar.
export function crearCortinaDelMenu(menu) {
  const elementos = menu.querySelectorAll('[data-menu-elemento]');
  let apertura = null;
  // Mientras la cortina sube se ignoran los clics y Escape para no mezclar dos animaciones.
  // Al abrir sí se puede cerrar enseguida: no hay que esperar a que acabe la entrada.
  let estaCerrando = false;

  function abrir() {
    if (estaCerrando) {
      return;
    }
    menu.showModal();
    if (!hayAnimacion()) {
      return;
    }

    // fromTo dentro de una timeline fija el estado inicial (elementos ocultos) al crearla,
    // así no hay un parpadeo con todo visible antes de que empiece la entrada.
    apertura = window.gsap.timeline();
    apertura.fromTo(
      menu,
      { clipPath: CORTINA_RECOGIDA },
      { clipPath: CORTINA_EXTENDIDA, duration: SEGUNDOS_ABRIR, ease: EASE_CORTINA, clearProps: 'clipPath' },
    );
    apertura.fromTo(
      elementos,
      { autoAlpha: 0, y: -DESPLAZAMIENTO_ELEMENTOS },
      {
        autoAlpha: 1,
        y: 0,
        duration: SEGUNDOS_ELEMENTO,
        ease: EASE_CORTINA,
        stagger: ESCALONADO_ELEMENTOS,
        clearProps: PROPIEDADES_ANIMADAS,
      },
      RETRASO_ELEMENTOS,
    );
  }

  // Si se cierra a mitad de la entrada, se corta y los elementos quedan ya visibles mientras sube la cortina.
  function terminarApertura() {
    if (!apertura) {
      return;
    }
    apertura.kill();
    apertura = null;
    window.gsap.set(elementos, { clearProps: PROPIEDADES_ANIMADAS });
  }

  function cerrar() {
    if (estaCerrando) {
      return;
    }
    if (!hayAnimacion()) {
      menu.close();
      return;
    }

    estaCerrando = true;
    terminarApertura();
    window.gsap.to(menu, {
      clipPath: CORTINA_RECOGIDA,
      duration: SEGUNDOS_CERRAR,
      ease: EASE_CORTINA,
      onComplete: () => {
        // Se cierra el <dialog> cuando ya no se ve, y se limpia el recorte para la próxima vez.
        menu.close();
        window.gsap.set(menu, { clearProps: 'clipPath' });
        estaCerrando = false;
      },
    });
  }

  return { abrir, cerrar };
}

// ---------- 4. Botón de cierre ----------

function prepararBotonDeCierre(gsap) {
  const boton = document.querySelector('[data-menu-tancar]');
  if (!boton) {
    return () => {};
  }
  const anillo = boton.querySelector('.menu-close-ring circle');
  const cruz = boton.querySelector('.menu-close-x');

  // Una cruz girada 90° queda igual que antes: solo se nota el movimiento, no un cambio de forma.
  const efecto = gsap.timeline({ paused: true, defaults: { duration: SEGUNDOS_CIERRE, ease: 'power2.out' } });
  efecto.to(anillo, { strokeDashoffset: 0 }, 0);
  efecto.to(cruz, { rotation: GIRO_CIERRE_GRADOS }, 0);

  return conectarHover(boton, efecto);
}

// ---------- 5. Flechas de los servicios ----------

function prepararFlechasDeServicios(gsap) {
  const quitadores = gsap.utils.toArray('[data-flecha]').map((enlace) => {
    const flecha = enlace.querySelector('.icon');
    const texto = enlace.querySelector('[data-flecha-texto]');
    if (!flecha || !texto) {
      return () => {};
    }

    // La flecha (↗) gira 45° y queda horizontal (→). Se anima el icono y el texto, no el enlace entero,
    // para que la línea divisoria de la fila (el borde del enlace) se quede quieta.
    const movimiento = gsap.timeline({ paused: true, defaults: { duration: SEGUNDOS_FLECHA, ease: 'power2.out' } });
    movimiento.to(flecha, { rotation: GIRO_FLECHA_GRADOS, x: DESPLAZAMIENTO_FLECHA_PX }, 0);
    movimiento.to(texto, { x: DESPLAZAMIENTO_TEXTO_PX }, 0);

    return conectarHover(enlace, movimiento);
  });

  return () => quitadores.forEach((quitar) => quitar());
}

// ---------- Punto de entrada ----------

export function iniciarAnimacionesDeLaCabecera() {
  const { gsap } = window;
  if (!gsap) {
    return;
  }

  // Con movimiento reducido no se anima nada: la cabecera ya está en su sitio.
  const medios = gsap.matchMedia();
  medios.add('(prefers-reduced-motion: no-preference)', () => {
    animarEntradaDeLaCabecera(gsap);

    const quitadores = [prepararCruzDelMenu(gsap), prepararBotonDeCierre(gsap), prepararFlechasDeServicios(gsap)];
    return () => quitadores.forEach((quitar) => quitar());
  });
}
