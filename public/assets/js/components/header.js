import { PAGINAS, SERVEIS, atributoActual } from '/assets/js/modules/navigation.js';

const NOMBRE_ETIQUETA = 'site-header';

const ICONO_FLECHA = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
const ICONO_CERRAR = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

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
      (pagina) => `<li><a class="nav-link" href="${pagina.url}"${atributoActual(pagina.url)}>${pagina.texto}</a></li>`,
    ).join('');

    return `
      <header class="relative z-30">
        <div class="wrap flex h-21 items-center justify-between gap-6 sm:h-25 lg:h-30">
          <button class="menu-pill" type="button" aria-label="Obre el menú" aria-haspopup="dialog" aria-controls="menu-principal" data-menu-obrir>
            <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
            <img src="/assets/img/logo/erd-white.svg" alt="" width="80" height="34">
          </button>
          <nav class="flex items-center gap-9" aria-label="Principal">
            <ul class="hidden items-center gap-9 font-display text-body text-erd-red lg:flex">${enlaces}</ul>
            <a class="btn btn-sm" href="#contacte">Contacte</a>
          </nav>
        </div>
      </header>`;
  }

  crearMenu() {
    const paginas = PAGINAS.map(
      (pagina) => `<li><a class="menu-link font-display text-title-1-mobile sm:text-title-1-tablet" href="${pagina.url}"${atributoActual(pagina.url)}>${pagina.texto}</a></li>`,
    ).join('');

    const serveis = SERVEIS.map(
      (servei) => `<li><a class="menu-link flex items-center gap-3 border-b border-erd-border-light py-2.5 font-display text-subtitle-mobile" href="${servei.url}">${ICONO_FLECHA}${servei.texto}</a></li>`,
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
              <h2 class="mb-3.5 text-eyebrow uppercase opacity-80" id="menu-titol-serveis">Serveis</h2>
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

    botonAbrir.addEventListener('click', () => menu.showModal());
    botonCerrar.addEventListener('click', () => menu.close());
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
