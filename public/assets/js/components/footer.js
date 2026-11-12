const NOMBRE_ETIQUETA = 'site-footer';

// Componente sin Shadow DOM: pinta el pie dentro de la propia etiqueta <site-footer>.
class PieSitio extends HTMLElement {
  connectedCallback() {
    if (this.dataset.lista) {
      return;
    }
    const anio = new Date().getFullYear();
    this.innerHTML = `
      <footer class="bg-erd-ink px-gutter-mobile py-12 text-white sm:px-gutter-tablet lg:px-gutter">
        <p class="font-display text-title-3">Menys intuïció. Més resultats.</p>
        <p class="mt-6 text-body-mobile lg:text-body">&copy; ${anio} ERD</p>
      </footer>`;
    this.dataset.lista = 'true';
  }
}

export function definirPie() {
  if (customElements.get(NOMBRE_ETIQUETA)) {
    return;
  }
  customElements.define(NOMBRE_ETIQUETA, PieSitio);
}
