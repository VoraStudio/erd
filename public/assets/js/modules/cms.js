// Lo que comparten las páginas que se pintan con datos del CMS (Projectes y Actualitat).
// El navegador nunca habla con el CMS: pide los datos a los endpoints PHP de /cms/, que los leen desde el servidor.

const MILISEGUNDOS_DE_ESPERA = 5000;

// Devuelve el JSON de la respuesta, o null si algo falla (sin red, servidor caído, sin respuesta a tiempo o error).
export async function pedirDatos(direccion) {
  try {
    const respuesta = await fetch(direccion, { signal: AbortSignal.timeout(MILISEGUNDOS_DE_ESPERA) });
    if (!respuesta.ok) {
      return null;
    }

    return await respuesta.json();
  } catch {
    return null;
  }
}

// Escribe un texto en todos los elementos con data-campo="campo". Siempre textContent, nunca innerHTML:
// un texto del CMS no puede colar código en la web.
export function escribirTexto(raiz, campo, texto) {
  for (const elemento of raiz.querySelectorAll(`[data-campo="${campo}"]`)) {
    elemento.textContent = texto;
  }
}

// El id viene de la dirección (?id=77): solo se acepta si son cifras.
export function leerIdDeLaDireccion() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (id === null || !/^\d+$/.test(id)) {
    return null;
  }

  return id;
}
