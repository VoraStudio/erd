const NOMBRE_ETIQUETA = 'site-header';

// Solo hay enlaces a lo que ya existe. Se añaden los demás cuando se construya cada página.
const ENLACES = [
  { texto: 'Home', url: '/' },
  { texto: 'Contacte', url: '/#contacte' },
];

// Componente sin Shadow DOM: pinta la cabecera dentro de la propia etiqueta <site-header>.
class CabeceraSitio extends HTMLElement {
  connectedCallback() {
    if (this.dataset.lista) {
      return;
    }
    this.innerHTML = this.crearHtml();
    this.dataset.lista = 'true';
  }

  crearHtml() {
    const enlaces = ENLACES.map(
      (enlace) =>
        `<li><a class="font-display text-body text-erd-red hover:underline underline-offset-8" href="${enlace.url}">${enlace.texto}</a></li>`,
    ).join('');

    return `
      <header class="flex items-center justify-between px-gutter-mobile py-6 sm:px-gutter-tablet lg:px-gutter">
        <a href="/"><img src="/assets/img/logo/erd-red.svg" alt="ERD" width="100" height="43"></a>
        <nav aria-label="Navegació principal">
          <ul class="flex items-center gap-9">${enlaces}</ul>
        </nav>
      </header>`;
  }
}

export function definirCabecera() {
  if (customElements.get(NOMBRE_ETIQUETA)) {
    return;
  }
  customElements.define(NOMBRE_ETIQUETA, CabeceraSitio);
}
