const NOMBRE_ETIQUETA = 'site-contact';

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
              <dl class="grid gap-3.5">
                <div class="grid gap-0.5">
                  <dt class="text-eyebrow text-erd-muted uppercase">Telèfon</dt>
                  <dd class="text-erd-muted">Pendent de confirmar</dd>
                </div>
                <div class="grid gap-0.5">
                  <dt class="text-eyebrow text-erd-muted uppercase">Correu</dt>
                  <dd class="text-erd-muted">Pendent de confirmar</dd>
                </div>
                <div class="grid gap-0.5">
                  <dt class="text-eyebrow text-erd-muted uppercase">On som</dt>
                  <dd class="font-display text-subtitle-mobile text-erd-red">La Bisbal d'Empordà</dd>
                </div>
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
                <span>He llegit i accepto la <button class="link-pending" type="button" data-soon="Política de privadesa: pendent">política de privadesa</button>.</span>
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
