// Envío del formulario de contacto (#contacte) con fetch.
// Flujo: al tocar el formulario por primera vez se pide el token a /token.php (también la clave del reCAPTCHA,
// si está activo); al enviar se manda todo a /contact.php y el resultado se pinta en el propio bloque.
// El token se pide al primer foco y no al cargar la página: así un visitante que no toca el formulario
// no recibe ninguna cookie de sesión, y el servidor puede medir cuánto tardó en rellenarlo.

const URL_TOKEN = '/token.php';
const URL_ENVIO = '/contact.php';
const URL_RECAPTCHA = 'https://www.google.com/recaptcha/api.js';
const ACCION_RECAPTCHA = 'contacte';

const MENSAJE_SIN_CONEXION = 'No hem pogut enviar el missatge. Torna-ho a provar més tard.';
const MENSAJE_RECAPTCHA = 'No hem pogut verificar que no ets un robot. Recarrega la pàgina i torna-ho a provar.';

// Carga el script de Google una sola vez. Si no se puede cargar, devuelve null.
function cargarRecaptcha(clave) {
  return new Promise((resolver) => {
    if (window.grecaptcha) {
      resolver(window.grecaptcha);
      return;
    }
    const script = document.createElement('script');
    script.src = `${URL_RECAPTCHA}?render=${encodeURIComponent(clave)}`;
    script.async = true;
    script.addEventListener('load', () => resolver(window.grecaptcha));
    script.addEventListener('error', () => resolver(null));
    document.head.append(script);
  });
}

// Pide a Google la respuesta de este envío. Devuelve null si algo falla.
async function pedirRespuestaRecaptcha(cargaRecaptcha, clave) {
  const grecaptcha = await cargaRecaptcha;
  if (!grecaptcha) {
    return null;
  }
  return new Promise((resolver) => {
    grecaptcha.ready(() => {
      grecaptcha.execute(clave, { action: ACCION_RECAPTCHA }).then(resolver, () => resolver(null));
    });
  });
}

export function iniciarFormularioDeContacto() {
  const formulario = document.querySelector('#contacte form');
  if (!formulario) {
    return;
  }

  const boton = formulario.querySelector('.btn-submit');
  const estado = formulario.querySelector('[data-estado-envio]');

  let sesion = null; // { token, claveRecaptcha, cargaRecaptcha }
  let estaEnviando = false;

  async function prepararSesion() {
    if (sesion) {
      return sesion;
    }
    try {
      const respuesta = await fetch(URL_TOKEN, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
      if (!respuesta.ok) {
        return null;
      }
      const datos = await respuesta.json();
      const claveRecaptcha = datos.recaptcha ?? null;
      sesion = {
        token: datos.token,
        claveRecaptcha,
        cargaRecaptcha: claveRecaptcha ? cargarRecaptcha(claveRecaptcha) : null,
      };
      return sesion;
    } catch {
      return null;
    }
  }

  function mostrarEstado(tipo, mensaje) {
    estado.dataset.estado = tipo;
    estado.textContent = mensaje;
    estado.hidden = false;
  }

  function mostrarErrorDeCampo(nombre, mensaje) {
    const campo = formulario.elements.namedItem(nombre);
    const aviso = formulario.querySelector(`[data-error="${nombre}"]`);
    if (!campo || !aviso) {
      return;
    }
    aviso.textContent = mensaje;
    aviso.hidden = false;
    campo.setAttribute('aria-invalid', 'true');
    campo.setAttribute('aria-describedby', aviso.id);
  }

  function limpiarResultado() {
    estado.hidden = true;
    estado.textContent = '';
    for (const aviso of formulario.querySelectorAll('[data-error]')) {
      aviso.hidden = true;
      aviso.textContent = '';
    }
    for (const campo of formulario.querySelectorAll('[aria-invalid]')) {
      campo.removeAttribute('aria-invalid');
      campo.removeAttribute('aria-describedby');
    }
  }

  function tratarError(codigo, cuerpo) {
    // Si la sesión ha caducado se pide un token nuevo en el próximo intento.
    if (codigo === 403) {
      sesion = null;
    }

    const errores = cuerpo.errors ?? {};
    const campos = Object.keys(errores);
    for (const nombre of campos) {
      mostrarErrorDeCampo(nombre, errores[nombre]);
    }
    mostrarEstado('error', cuerpo.message ?? MENSAJE_SIN_CONEXION);

    // El foco va al primer campo con error: el lector de pantalla lee su mensaje.
    if (campos.length > 0) {
      formulario.elements.namedItem(campos[0])?.focus();
    }
  }

  async function enviar() {
    const datosDeSesion = await prepararSesion();
    if (!datosDeSesion) {
      mostrarEstado('error', MENSAJE_SIN_CONEXION);
      return;
    }

    const datos = new FormData(formulario);
    datos.set('csrf_token', datosDeSesion.token);

    if (datosDeSesion.claveRecaptcha) {
      const respuestaRecaptcha = await pedirRespuestaRecaptcha(datosDeSesion.cargaRecaptcha, datosDeSesion.claveRecaptcha);
      if (respuestaRecaptcha === null) {
        mostrarEstado('error', MENSAJE_RECAPTCHA);
        return;
      }
      datos.set('recaptcha_response', respuestaRecaptcha);
    }

    let respuesta;
    let cuerpo;
    try {
      respuesta = await fetch(URL_ENVIO, {
        method: 'POST',
        body: datos,
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      cuerpo = await respuesta.json();
    } catch {
      mostrarEstado('error', MENSAJE_SIN_CONEXION);
      return;
    }

    if (!respuesta.ok) {
      tratarError(respuesta.status, cuerpo);
      return;
    }

    // Tras un envío correcto el servidor rota el token: el siguiente envío usa el nuevo.
    if (cuerpo.token) {
      datosDeSesion.token = cuerpo.token;
    }
    formulario.reset();
    mostrarEstado('ok', cuerpo.message);
  }

  formulario.addEventListener('focusin', prepararSesion, { once: true });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (estaEnviando) {
      return;
    }

    estaEnviando = true;
    boton.disabled = true;
    limpiarResultado();
    try {
      await enviar();
    } finally {
      estaEnviando = false;
      boton.disabled = false;
    }
  });
}
