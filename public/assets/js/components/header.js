import { PAGINAS, SERVEIS, atributoActual } from '/assets/js/modules/navigation.js';
import { crearCortinaDelMenu } from '/assets/js/modules/header-animations.js';

const NOMBRE_ETIQUETA = 'site-header';

const ICONO_FLECHA = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
// Botón de cierre: una cruz blanca y un anillo que se dibuja al pasar el ratón (modules/header-animations.js).
// pathLength="100" hace que la longitud del círculo valga 100: el trazo se anima de 101 a 0 sin calcular nada.
// No vale 1: GSAP escribe este valor en píxeles enteros y el anillo saltaría de 1 a 0 sin dibujarse.
const ICONO_CERRAR = `
  <svg class="menu-close-ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="27" pathLength="100"/></svg>
  <svg class="menu-close-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`;

// Componente sin Shadow DOM: pinta la cabecera y el menú dentro de <site-header>.
// El menú es un <dialog>: el navegador ya cierra con Escape, atrapa el foco y lo devuelve al botón.
class CabeceraSitio extends HTMLElement {
  connectedCallback() {
    if (this.dataset.lista) {
      return;
    }
    this.innerHTML = this.crearCabecera() + this.crearMenu();
    this.prepararMenu();
    this.dataset.lista = 'true';
  }

  crearCabecera() {
    const enlaces = PAGINAS.map(
      (pagina) => `<li data-entrada-nav><a class="draw-link" href="${pagina.url}"${atributoActual(pagina.url)}>${pagina.texto}</a></li>`,
    ).join('');

    return `
      <header class="relative z-30">
        <div class="wrap flex h-21 items-center justify-between gap-6 sm:h-25 lg:h-30">
          <button class="menu-pill" type="button" aria-label="Obre el menú" aria-haspopup="dialog" aria-controls="menu-principal" data-menu-obrir data-entrada-logo>
            <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
            <img src="/assets/img/logo/erd-white.svg" alt="" width="80" height="34">
          </button>
          <nav class="flex items-center gap-9" aria-label="Principal">
            <ul class="hidden items-center gap-9 font-display text-body text-erd-red lg:flex">${enlaces}</ul>
            <a class="btn btn-sm" href="#contacte" data-entrada-nav data-elevar>Contacte</a>
          </nav>
        </div>
      </header>`;
  }

  crearMenu() {
    const paginas = PAGINAS.map(
      (pagina) => `<li data-menu-elemento><a class="menu-link font-display text-title-1-mobile sm:text-title-1-tablet" href="${pagina.url}"${atributoActual(pagina.url)}>${pagina.texto}</a></li>`,
    ).join('');

    // Los enlaces de servicios no atenúan al pasar el ratón: los anima la flecha (modules/header-animations.js).
    const serveis = SERVEIS.map(
      (servei) => `<li data-menu-elemento><a class="flex items-center gap-3 border-b border-erd-border-light py-2.5 font-display text-subtitle-mobile" href="${servei.url}" data-flecha>${ICONO_FLECHA}<span data-flecha-texto>${servei.texto}</span></a></li>`,
    ).join('');

    return `
      <dialog class="menu" id="menu-principal" aria-label="Menú">
        <div class="wrap">
          <div class="flex h-21 items-center justify-between sm:h-25 lg:h-30">
            <img class="w-24 sm:w-28" src="/assets/img/logo/erd-white.svg" alt="ERD" width="110" height="47">
            <button class="menu-close" type="button" aria-label="Tanca el menú" data-menu-tancar>${ICONO_CERRAR}</button>
          </div>
          <div class="grid gap-12 pt-6 pb-16 lg:grid-cols-2">
            <nav aria-label="Menú principal"><ul>${paginas}</ul></nav>
            <nav aria-labelledby="menu-titol-serveis">
              <h2 class="mb-3.5 text-eyebrow uppercase opacity-80" id="menu-titol-serveis" data-menu-elemento>Serveis</h2>
              <ul>${serveis}</ul>
            </nav>
          </div>
        </div>
      </dialog>`;
  }

  prepararMenu() {
    const menu = this.querySelector('dialog');
    const botonAbrir = this.querySelector('[data-menu-obrir]');
    const botonCerrar = this.querySelector('[data-menu-tancar]');

    const cortina = crearCortinaDelMenu(menu);

    botonAbrir.addEventListener('click', cortina.abrir);
    botonCerrar.addEventListener('click', cortina.cerrar);
    // Escape cierra el <dialog> de golpe por defecto: se intercepta para que también baje la cortina.
    menu.addEventListener('cancel', (evento) => {
      evento.preventDefault();
      cortina.cerrar();
    });
    // Al cerrar (botón o Escape), el foco vuelve al botón que abrió el menú.
    menu.addEventListener('close', () => botonAbrir.focus());
  }
}

export function definirCabecera() {
  if (customElements.get(NOMBRE_ETIQUETA)) {
    return;
  }
  customElements.define(NOMBRE_ETIQUETA, CabeceraSitio);
}
