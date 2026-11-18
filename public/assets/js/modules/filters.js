// Filtro de proyectos por sector (Projectes).
// Cada botón lleva data-filtre="sector" (vacío = todos) y cada tarjeta data-sector="sector".
// Si el sector elegido no tiene ningún proyecto, sale el mensaje data-filtre-buit con las palabras subiendo,
// igual que los títulos (SplitText por palabras dentro de una máscara).

const SEGUNDOS_PALABRA = 1.3;
const ESCALONADO_PALABRAS = 0.12;

let divisionDelMensaje = null;

function mostrarMensaje(mensaje) {
  mensaje.hidden = false;

  const { gsap, SplitText } = window;
  const sinAnimacion = !gsap || !SplitText || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sinAnimacion) {
    return;
  }

  gsap.registerPlugin(SplitText);
  divisionDelMensaje = SplitText.create(mensaje, {
    type: 'words',
    mask: 'words',
    // La clase de cada palabra da nombre a su máscara: process-word-mask (ver pages.css), con relleno para las colas de letras.
    wordsClass: 'process-word',
    onSplit: (division) => {
      // Baja 130 % (y no 100 %): la máscara tiene un relleno por abajo y la palabra tiene que quedar fuera de él.
      return gsap.from(division.words, {
        yPercent: 130,
        duration: SEGUNDOS_PALABRA,
        ease: 'power3.out',
        stagger: ESCALONADO_PALABRAS,
      });
    },
  });
}

function ocultarMensaje(mensaje) {
  // revert() deshace la división del texto y para su animación: el mensaje queda como en el HTML.
  if (divisionDelMensaje !== null) {
    divisionDelMensaje.revert();
    divisionDelMensaje = null;
  }
  mensaje.hidden = true;
}

function mostrarSector(botones, tarjetas, mensajeSinProyectos, sectorElegido) {
  for (const boton of botones) {
    const estaElegido = boton.dataset.filtre === sectorElegido;
    boton.setAttribute('aria-pressed', String(estaElegido));
  }

  let tarjetasVisibles = 0;
  for (const tarjeta of tarjetas) {
    const coincide = sectorElegido === '' || tarjeta.dataset.sector === sectorElegido;
    tarjeta.hidden = !coincide;
    if (coincide) {
      tarjetasVisibles++;
    }
  }

  // Sin ninguna tarjeta en la página ya sale el aviso general de «no hi ha projectes»: no se repite.
  const hayQueAvisar = tarjetas.length > 0 && tarjetasVisibles === 0;
  ocultarMensaje(mensajeSinProyectos);
  if (hayQueAvisar) {
    mostrarMensaje(mensajeSinProyectos);
  }
}

export function iniciarFiltros() {
  const grupo = document.querySelector('[data-filtres]');
  const mensajeSinProyectos = document.querySelector('[data-filtre-buit]');
  if (!grupo || !mensajeSinProyectos) {
    return;
  }

  const botones = grupo.querySelectorAll('[data-filtre]');
  const tarjetas = document.querySelectorAll('[data-sector]');

  for (const boton of botones) {
    boton.addEventListener('click', () => mostrarSector(botones, tarjetas, mensajeSinProyectos, boton.dataset.filtre));
  }
}
