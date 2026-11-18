const NOMBRE_ETIQUETA = 'site-contact';

// Iconos de trazo de 24 × 24, del mismo estilo que las flechas de la web: sin relleno y con el grosor de .icon.
const ICONOS = {
  telefono: '<path d="M6.6 3.5h3l1.4 4-2 1.3a11.5 11.5 0 0 0 5.2 5.2l1.3-2 4 1.4v3a2 2 0 0 1-2.1 2A15.6 15.6 0 0 1 4.6 5.6 2 2 0 0 1 6.6 3.5z"/>',
  correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  ubicacion: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  horario: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

// Un dato de contacto: icono + etiqueta (dt) y su valor (dd). Los huecos data-empresa se rellenan con el .env
// (modules/company.js); lo que va dentro es el texto de reserva mientras el dato no esté. Con opcional, la fila
// entera desaparece si el dato no existe.
function crearDato({ icono, etiqueta, valor, opcional = '' }) {
  const atributoOpcional = opcional ? ` data-empresa-opcional="${opcional}"` : '';

  return `
                <div class="contact-dato" data-contacto-dato${atributoOpcional}>
                  <dt>
                    <span class="contact-icon" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24">${ICONOS[icono]}</svg></span>
                    <span data-dato-etiqueta>${etiqueta}</span>
                  </dt>
                  <dd>${valor}</dd>
                </div>`;
}

const DATOS_DE_CONTACTO = [
  crearDato({
    icono: 'telefono',
    etiqueta: 'Telèfon',
    valor: '<span data-empresa="telefono" data-empresa-enlace>Pendent de confirmar</span>',
  }),
  crearDato({
    icono: 'correo',
    etiqueta: 'Correu',
    valor: '<span data-empresa="correo" data-empresa-enlace>Pendent de confirmar</span>',
  }),
  crearDato({
    icono: 'ubicacion',
    etiqueta: 'On som',
    valor: `<span class="font-display text-subtitle-mobile text-erd-red" data-empresa="poblacion">La Bisbal d'Empordà</span>
                    <span class="mt-1 block text-small" data-empresa="direccion" data-empresa-opcional="direccion"></span>`,
  }),
  crearDato({
    icono: 'horario',
    etiqueta: 'Horari',
    valor: '<span data-empresa="horario"></span>',
    opcional: 'horario',
  }),
].join('');

// Componente sin Shadow DOM: pinta el bloque de contacto (#contacte) que cierra todas las páginas.
// El formulario lo procesa /contact.php; los nombres de campo son los que espera src/ContactForm.php.
// El envío con fetch, los errores por campo y el estado los gestiona modules/contact-form.js: aquí solo
// están los huecos (data-error, data-estado-envio) donde escribe.
class ContactoSitio extends HTMLElement {
  connectedCallback() {
    if (this.dataset.lista) {
      return;
    }
    this.innerHTML = this.crearHtml();
    this.dataset.lista = 'true';
  }

  crearHtml() {
    return `
      <section class="bg-erd-red py-6 sm:py-12" id="contacte" aria-labelledby="contacte-titol">
        <div class="wrap">
          <div class="grid gap-3 rounded-card bg-erd-flour p-2 sm:p-3 lg:grid-cols-2">
            <div class="flex flex-col justify-between gap-7 px-5 py-7 sm:gap-12 sm:px-10 sm:py-11" data-contacto-grupo>
              <h2 class="font-display text-title-2-mobile text-erd-red sm:text-title-2-tablet" id="contacte-titol">
                <span class="block">Parlem del teu negoci.</span>
                <span class="mt-1.5 block text-subtitle-mobile sm:text-subtitle">La primera hora, va per nosaltres.</span>
              </h2>
              <dl class="grid gap-5">${DATOS_DE_CONTACTO}
              </dl>
            </div>

            <form class="grid gap-4.5 rounded-card border border-erd-border bg-erd-flour px-5 py-6.5 sm:p-10" action="/contact.php" method="post" data-contacto-grupo>
              <h3 class="mb-1.5 font-display text-subtitle-mobile text-erd-ink sm:text-subtitle">Escriu-nos</h3>

              <label class="field">
                <span>Nom</span>
                <input class="field-input" name="nom" autocomplete="name" maxlength="100" required>
              </label>
              <p class="field-error" id="error-nom" data-error="nom" hidden></p>

              <label class="field">
                <span>Correu electrònic</span>
                <input class="field-input" name="correu" type="email" autocomplete="email" maxlength="254" required>
              </label>
              <p class="field-error" id="error-correu" data-error="correu" hidden></p>

              <label class="field">
                <span>Deixa'ns un missatge</span>
                <textarea class="field-input" name="missatge" maxlength="5000"></textarea>
              </label>
              <p class="field-error" id="error-missatge" data-error="missatge" hidden></p>

              <!-- Campo trampa contra robots: las personas no lo ven. -->
              <div class="hidden" aria-hidden="true">
                <label>Web <input name="web" tabindex="-1" autocomplete="off"></label>
              </div>

              <label class="check">
                <input type="checkbox" name="privadesa" required>
                <span>He llegit i accepto la <a class="underline underline-offset-3 hover:text-erd-red" href="/privadesa/" target="_blank" rel="noopener">política de privadesa</a>.</span>
              </label>
              <p class="field-error" id="error-privadesa" data-error="privadesa" hidden></p>

              <button class="btn btn-submit" type="submit">Envia<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></button>
              <p class="form-status" data-estado-envio role="status" hidden></p>
            </form>
          </div>
        </div>
      </section>`;
  }
}

export function definirContacto() {
  if (customElements.get(NOMBRE_ETIQUETA)) {
    return;
  }
  customElements.define(NOMBRE_ETIQUETA, ContactoSitio);
}
