// Animaciones de la sección «Així treballem» de la Home, con GSAP, SplitText y ScrollTrigger:
//   1. El título: SplitText parte el texto en palabras (no en líneas), cada una dentro de una máscara,
//      y las palabras suben desde abajo una detrás de otra (stagger). Se aplica a cualquier título que lleve
//      data-titulo-palabras.
//      El título de la sección roja «Com és el teu procés de creixement» (data-titulo-pildora) hace lo mismo con las
//      palabras de fuera de la píldora, y la píldora «procés de» se levanta del suelo en 3D (ver más abajo).
//      Los tres pasos de la sección roja (data-pasos) entran de lado con un fundido, uno detrás de otro y despacio.
//   2. Las tres fotos aparecen con una cortina vertical, de abajo hacia arriba: primero una, luego otra y luego otra.
//   3. El botón «Sobre ERD»: aparece con un fundido cuando ya está apareciendo la segunda cortina. La flecha del botón
//      y su elevación al pasar el ratón no son de este módulo: el giro es CSS (.btn .icon) y la elevación la hace
//      hover-lift.js (lleva data-elevar).
// Las dos primeras se reproducen al entrar en pantalla, se ocultan al salir y se repiten al volver, como el resto de la web.

const SEGUNDOS_PALABRA = 1.3;
const ESCALONADO_PALABRAS = 0.12;

// La píldora «procés de» se levanta del suelo: parte tumbada (girada 90° sobre su borde de abajo) y se pone de pie.
// Es el efecto «Inferior» del Despliegue Cinemático 3D de la galería de efectos (rotationX 90, transformOrigin
// bottom center, 1,4 s, power3.out).
const SEGUNDOS_PILDORA = 1.9;
const GIRO_PILDORA_GRADOS = 90;
const PERSPECTIVA_PILDORA = 1200;
// Empieza cuando ya han entrado las palabras de la primera línea.
const RETRASO_PILDORA = 0.5;

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

const SEGUNDOS_PASO = 1.2;
const ESCALONADO_PASOS = 0.4;
const DESPLAZAMIENTO_PASO = 40;

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

// Título con una píldora (<mark>). El texto de fuera de la píldora va en <span>: SplitText parte solo esos tramos
// en palabras y las sube con máscara, como en «Así treballem». La píldora no se parte: entera, con su fondo, se
// levanta del suelo. Todo va en una timeline con un solo disparador de scroll, así se rebobina junto.
function animarTituloConPildora(gsap, SplitText, titulo) {
  const pildora = titulo.querySelector('mark');
  const tramos = titulo.querySelectorAll(':scope > span');
  if (!pildora || tramos.length === 0) {
    return;
  }

  // La clase de cada máscara es la de su palabra + «-mask»: aquí, process-word-mask (ver pages.css).
  const division = SplitText.create(tramos, { type: 'words', mask: 'words', wordsClass: 'process-word' });

  const entrada = gsap.timeline({
    scrollTrigger: { trigger: titulo, start: 'top 85%', toggleActions: AL_HACER_SCROLL },
  });

  // Baja 130 % (y no 100 %): la máscara tiene un relleno por abajo y la palabra tiene que quedar fuera de él.
  entrada.from(
    division.words,
    { yPercent: 130, duration: SEGUNDOS_PALABRA, ease: 'power3.out', stagger: ESCALONADO_PALABRAS },
    0,
  );

  // transformPerspective da profundidad 3D a este elemento sin tocar el CSS del título.
  // Se usa fromTo y no from: con from, GSAP también animaría la perspectiva desde 1200 hasta el valor actual (0),
  // y al final la píldora se deformaría de golpe. Con fromTo la perspectiva queda fija en los dos extremos.
  entrada.fromTo(
    pildora,
    {
      opacity: 0,
      rotationX: GIRO_PILDORA_GRADOS,
      transformOrigin: 'bottom center',
      transformPerspective: PERSPECTIVA_PILDORA,
    },
    {
      opacity: 1,
      rotationX: 0,
      transformPerspective: PERSPECTIVA_PILDORA,
      duration: SEGUNDOS_PILDORA,
      ease: 'power3.out',
    },
    RETRASO_PILDORA,
  );
}

// Pasos de la sección roja: entran desde la derecha con un fundido. Un solo disparador sobre la lista y un stagger
// real entre los pasos: así la espera entre uno y otro no depende de la velocidad del scroll (si cada paso tuviera
// su propio disparador, entrarían casi a la vez). data-espera y data-escalonado en la lista cambian cuándo empiezan
// y cuánto tardan en entrar uno tras otro.
function animarPasos(gsap, lista) {
  gsap.from(lista.children, {
    x: DESPLAZAMIENTO_PASO,
    autoAlpha: 0,
    duration: SEGUNDOS_PASO,
    delay: Number(lista.dataset.espera || 0),
    ease: 'power2.out',
    stagger: Number(lista.dataset.escalonado || ESCALONADO_PASOS),
    scrollTrigger: { trigger: lista, start: 'top 85%', toggleActions: AL_HACER_SCROLL },
  });
}

export function iniciarAnimacionesDelProceso() {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger || !SplitText) {
    return;
  }

  const titulosPorPalabras = gsap.utils.toArray('[data-titulo-palabras]');
  const titulosConPildora = gsap.utils.toArray('[data-titulo-pildora]');
  const listasDePasos = gsap.utils.toArray('[data-pasos]');
  if (titulosPorPalabras.length === 0 && titulosConPildora.length === 0 && listasDePasos.length === 0) {
    return;
  }

  // Si el visitante pide menos movimiento, la sección se queda tal cual, visible.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  for (const titulo of titulosPorPalabras) {
    animarTitulo(gsap, SplitText, titulo);
  }

  for (const titulo of titulosConPildora) {
    animarTituloConPildora(gsap, SplitText, titulo);
  }

  for (const lista of listasDePasos) {
    animarPasos(gsap, lista);
  }

  const fotos = gsap.utils.toArray('[data-proceso-foto]');
  const boton = document.querySelector('[data-proceso-boton]');
  if (fotos.length === 0 || !boton) {
    return;
  }

  animarFotos(gsap, ScrollTrigger, fotos, boton);
}
