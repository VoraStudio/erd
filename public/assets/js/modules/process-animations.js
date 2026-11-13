// Animaciones de la sección «Així treballem» de la Home, con GSAP, SplitText y ScrollTrigger:
//   1. El título: SplitText parte el texto en palabras (no en líneas), cada una dentro de una máscara,
//      y las palabras suben desde abajo una detrás de otra (stagger).
//   2. Las tres fotos aparecen con una cortina vertical, de abajo hacia arriba: primero una, luego otra y luego otra.
//   3. El botón «Sobre ERD»: aparece con un fundido cuando ya está apareciendo la segunda cortina y, al pasar el
//      ratón, sale una flecha dentro del botón. La elevación del botón la hace hover-lift.js (lleva data-elevar).
// Las dos primeras se reproducen al entrar en pantalla, se ocultan al salir y se repiten al volver, como el resto de la web.

const SEGUNDOS_PALABRA = 1.3;
const ESCALONADO_PALABRAS = 0.12;

// Cada cortina dura 1,4 s y la siguiente arranca a los 0,4 s: se solapan y parece una sola ola.
const SEGUNDOS_FOTO = 1.4;
const SEGUNDOS_SALIDA = 0.5;
const ESCALONADO_FOTOS = 0.4;
const EASE_FOTO = 'power2.out';

const SEGUNDOS_APARICION_BOTON = 0.8;
// A partir de este ancho (el punto de ruptura sm), las tres fotos van una al lado de otra.
const FOTOS_EN_COLUMNAS = '(min-width: 40rem)';
// inset(arriba derecha abajo izquierda): con 100% arriba no se ve nada; al bajar ese valor a 0%
// la foto se va revelando desde su borde de abajo hacia arriba.
const CORTINA_RECOGIDA = 'inset(100% 0% 0% 0%)';
const CORTINA_EXTENDIDA = 'inset(0% 0% 0% 0%)';

const SEGUNDOS_FLECHA = 0.35;

// Reproducir al entrar, rebobinar al salir hacia arriba y volver a reproducir al volver a bajar.
const AL_HACER_SCROLL = 'play reverse play reverse';

function animarTitulo(gsap, SplitText, titulo) {
  SplitText.create(titulo, {
    type: 'words',
    mask: 'words',
    // SplitText le pone a cada máscara la clase de su palabra + «-mask»: aquí, process-word-mask (ver pages.css).
    wordsClass: 'process-word',
    autoSplit: true,
    onSplit: (division) => {
      // Baja 130 % (y no 100 %): la máscara tiene un relleno por abajo y la palabra tiene que quedar fuera de él.
      return gsap.from(division.words, {
        yPercent: 130,
        duration: SEGUNDOS_PALABRA,
        ease: 'power3.out',
        stagger: ESCALONADO_PALABRAS,
        scrollTrigger: { trigger: titulo, start: 'top 85%', toggleActions: AL_HACER_SCROLL },
      });
    },
  });
}

// Las fotos empiezan a revelarse en cuanto asoman por abajo de la pantalla.
// En escritorio van las tres juntas: un solo disparador sobre su contenedor las revela en orden (1, 2, 3) por el
// stagger. (Con un disparador por foto, la más alta asomaría antes y se revelaría la primera.)
// En móvil van apiladas: cada foto tiene su disparador y se revela cuando le toca.
// En escritorio, el botón aparece con un fundido cuando arranca la segunda cortina (ver mostrarBoton).
function animarFotos(gsap, ScrollTrigger, fotos, boton) {
  gsap.set(fotos, { clipPath: CORTINA_RECOGIDA });
  gsap.set(boton, { autoAlpha: 0 });

  const segundaFoto = fotos[1];
  const botonDependeDeLaSegundaFoto = window.matchMedia(FOTOS_EN_COLUMNAS).matches;

  const mostrarBoton = (retraso) => {
    gsap.to(boton, { autoAlpha: 1, duration: SEGUNDOS_APARICION_BOTON, ease: 'power2.out', delay: retraso, overwrite: true });
  };
  const ocultarBoton = () => {
    gsap.to(boton, { autoAlpha: 0, duration: SEGUNDOS_SALIDA, ease: 'power2.in', overwrite: true });
  };

  const mostrar = (lote) => {
    gsap.to(lote, {
      clipPath: CORTINA_EXTENDIDA,
      duration: SEGUNDOS_FOTO,
      ease: EASE_FOTO,
      stagger: ESCALONADO_FOTOS,
      overwrite: true,
    });
    // El botón espera a la segunda foto: su retraso es el que tiene la segunda cortina dentro del lote.
    if (botonDependeDeLaSegundaFoto && lote.includes(segundaFoto)) {
      mostrarBoton(lote.indexOf(segundaFoto) * ESCALONADO_FOTOS);
    }
  };
  const ocultar = (lote) => {
    gsap.to(lote, { clipPath: CORTINA_RECOGIDA, duration: SEGUNDOS_SALIDA, ease: 'power2.in', overwrite: true });
    if (botonDependeDeLaSegundaFoto && lote.includes(segundaFoto)) {
      ocultarBoton();
    }
  };

  if (botonDependeDeLaSegundaFoto) {
    ScrollTrigger.create({
      trigger: fotos[0].parentElement,
      start: 'top 85%',
      end: 'bottom 10%',
      onEnter: () => mostrar(fotos),
      onEnterBack: () => mostrar(fotos),
      onLeave: () => ocultar(fotos),
      onLeaveBack: () => ocultar(fotos),
    });
  } else {
    ScrollTrigger.batch(fotos, {
      start: 'top 85%',
      end: 'bottom 10%',
      onEnter: mostrar,
      onEnterBack: mostrar,
      onLeave: ocultar,
      onLeaveBack: ocultar,
    });
  }

  // En móvil la segunda foto queda lejos del botón: aparece cuando el botón entra en pantalla, junto al título.
  if (!botonDependeDeLaSegundaFoto) {
    ScrollTrigger.create({
      trigger: boton,
      start: 'top 90%',
      end: 'bottom 10%',
      onEnter: () => mostrarBoton(0),
      onEnterBack: () => mostrarBoton(0),
      onLeave: ocultarBoton,
      onLeaveBack: ocultarBoton,
    });
  }
}

function prepararFlechaDelBoton(gsap, boton) {
  const flecha = boton.querySelector('[data-proceso-flecha]');
  if (!flecha) {
    return;
  }

  // La flecha parte sin anchura y con un margen negativo que anula el hueco (gap) del botón: así,
  // en reposo, el botón no tiene ningún espacio de más y crece al aparecer la flecha.
  const anchoFlecha = flecha.getBoundingClientRect().width;
  const hueco = parseFloat(getComputedStyle(boton).columnGap);
  gsap.set(flecha, { width: 0, marginLeft: -hueco, autoAlpha: 0 });

  const efecto = gsap.timeline({ paused: true, defaults: { duration: SEGUNDOS_FLECHA, ease: 'power2.out' } });
  // (La aparición del botón la controla animarFotos con autoAlpha; aquí solo se anima la flecha.)
  efecto.to(flecha, { width: anchoFlecha, marginLeft: 0, autoAlpha: 1 });

  // Solo con ratón: en pantallas táctiles no hay hover y la flecha se quedaría puesta tras el toque.
  boton.addEventListener('pointerenter', (evento) => {
    if (evento.pointerType !== 'mouse') {
      return;
    }
    efecto.play();
  });
  boton.addEventListener('pointerleave', () => efecto.reverse());
}

export function iniciarAnimacionesDelProceso() {
  const { gsap, ScrollTrigger, SplitText } = window;
  const titulo = document.querySelector('[data-proceso-titulo]');
  if (!gsap || !ScrollTrigger || !SplitText || !titulo) {
    return;
  }

  // Si el visitante pide menos movimiento, la sección se queda tal cual, visible.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  const boton = document.querySelector('[data-proceso-boton]');

  animarTitulo(gsap, SplitText, titulo);
  animarFotos(gsap, ScrollTrigger, gsap.utils.toArray('[data-proceso-foto]'), boton);
  prepararFlechaDelBoton(gsap, boton);
}
