import { PAGINAS, SERVEIS } from '/assets/js/modules/navigation.js';

const NOMBRE_ETIQUETA = 'site-footer';

// Páginas legales del pie.
const LEGALES = [
  { texto: 'Política de privadesa', url: '/privadesa/' },
  { texto: 'Avís legal', url: '/avis-legal/' },
  { texto: 'Cookies', url: '/cookies/' },
];

function crearLista(enlaces) {
  return enlaces
    .map((enlace) => `<li data-pie-elemento><a class="hover:underline hover:underline-offset-3" href="${enlace.url}">${enlace.texto}</a></li>`)
    .join('');
}

// Componente sin Shadow DOM: pinta el pie dentro de <site-footer>.
class PieSitio extends HTMLElement {
  connectedCallback() {
    if (this.dataset.lista) {
      return;
    }
    this.innerHTML = this.crearHtml();
    this.dataset.lista = 'true';
  }

  crearHtml() {
    const anio = new Date().getFullYear();
    const legales = LEGALES.map(
      (legal) => `<a class="hover:underline hover:underline-offset-3" href="${legal.url}">${legal.texto}</a>`,
    ).join('');

    return `
      <footer class="overflow-clip bg-erd-red pt-16 pb-9 text-white">
        <div class="wrap">
          <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div class="flex items-center gap-8 sm:block">
              <img class="w-30" src="/assets/img/logo/erd-white.svg" alt="ERD" width="120" height="51" data-pie-logo>
              <p class="max-w-[16ch] font-display text-subtitle-mobile font-light sm:mt-4.5" data-pie-subtitulo>Menys intuïció. Més resultats.</p>
            </div>
            <nav aria-labelledby="peu-navega" data-pie-grupo>
              <h2 class="mb-3.5 text-eyebrow uppercase opacity-75" id="peu-navega" data-pie-elemento>Navega</h2>
              <ul class="flex flex-wrap gap-x-8 gap-y-3 text-body-mobile sm:grid sm:gap-2">${crearLista(PAGINAS)}</ul>
            </nav>
            <nav class="lg:col-span-2" aria-labelledby="peu-serveis" data-pie-grupo>
              <h2 class="mb-3.5 text-eyebrow uppercase opacity-75" id="peu-serveis" data-pie-elemento>Serveis</h2>
              <ul class="grid gap-2 text-body-mobile lg:grid-cols-2 lg:gap-x-10">${crearLista(SERVEIS)}</ul>
            </nav>
          </div>
          <div class="mt-14 flex flex-wrap justify-between gap-5 border-t border-erd-border-light pt-5.5 text-small">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2" data-pie-legal>
              <p>&copy; ${anio} ERD</p>
              <span aria-hidden="true">·</span>
              <a class="inline-flex items-center gap-2 hover:underline hover:underline-offset-3" href="https://vorastudio.cat/" target="_blank" rel="noopener">Desenvolupada per <img class="h-8 w-auto" src="/assets/img/logo/vora-white.svg" alt="Vora Studio" width="112" height="32"></a>
            </div>
            <nav class="flex flex-wrap gap-5.5" aria-label="Legal" data-pie-legal>${legales}</nav>
          </div>
        </div>
      </footer>`;
  }
}

export function definirPie() {
  if (customElements.get(NOMBRE_ETIQUETA)) {
    return;
  }
  customElements.define(NOMBRE_ETIQUETA, PieSitio);
}
