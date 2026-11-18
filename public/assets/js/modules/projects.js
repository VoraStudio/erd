// Pinta los proyectos con lo que entrega el servidor (que lee el CMS): las tarjetas de Projectes y el detalle de cada uno.
// Todo se clona de las <template> de la página y se rellena con textContent: nunca con innerHTML,
// así un texto del CMS no puede colar código en la web.

import { pedirDatos, escribirTexto, leerIdDeLaDireccion } from '/assets/js/modules/cms.js';

const DIRECCION_DE_LOS_PROYECTOS = '/cms/projectes.php';

async function pedirProyectos() {
  const datos = await pedirDatos(DIRECCION_DE_LOS_PROYECTOS);
  if (datos === null || !Array.isArray(datos.projectes)) {
    return null;
  }

  return datos.projectes;
}

async function pedirProyecto(id) {
  const datos = await pedirDatos(`${DIRECCION_DE_LOS_PROYECTOS}?id=${encodeURIComponent(id)}`);
  if (datos === null || typeof datos.projecte !== 'object') {
    return null;
  }

  return datos.projecte;
}

/* ===== Listado de Projectes ===== */

function crearTarjeta(plantilla, proyecto) {
  const tarjeta = plantilla.content.firstElementChild.cloneNode(true);

  tarjeta.dataset.sector = proyecto.sector;
  escribirTexto(tarjeta, 'sector', proyecto.sector);
  escribirTexto(tarjeta, 'titol', proyecto.titol);
  escribirTexto(tarjeta, 'resum', proyecto.resum);
  tarjeta.querySelector('[data-campo="enlace"]').href = `/projectes/projecte/?id=${encodeURIComponent(proyecto.id)}`;

  const imagen = tarjeta.querySelector('[data-campo="imatge"]');
  if (proyecto.imatge) {
    imagen.src = proyecto.imatge;
  } else {
    imagen.closest('.project-card-image').remove();
  }

  return tarjeta;
}

export async function cargarProyectos() {
  const contenedor = document.querySelector('[data-projectes]');
  const plantilla = document.querySelector('[data-plantilla-projecte]');
  const avisoSinProyectos = document.querySelector('[data-projectes-buit]');
  if (!contenedor || !plantilla || !avisoSinProyectos) {
    return;
  }

  const proyectos = await pedirProyectos();
  if (proyectos === null || proyectos.length === 0) {
    avisoSinProyectos.hidden = false;
    return;
  }

  const tarjetas = proyectos.map((proyecto) => crearTarjeta(plantilla, proyecto));
  contenedor.replaceChildren(...tarjetas);
}

/* ===== Detalle de un proyecto ===== */

function pintarRecuadros(detalle, recuadros) {
  const contenedor = detalle.querySelector('[data-recuadres]');
  if (recuadros.length === 0) {
    contenedor.remove();
    return;
  }

  const plantilla = document.querySelector('[data-plantilla-recuadre]');
  const tarjetas = recuadros.map((recuadro) => {
    const tarjeta = plantilla.content.firstElementChild.cloneNode(true);
    escribirTexto(tarjeta, 'valor', recuadro.valor);
    escribirTexto(tarjeta, 'text', recuadro.text);
    return tarjeta;
  });
  contenedor.replaceChildren(...tarjetas);
}

function pintarImagenes(detalle, direcciones) {
  const contenedor = detalle.querySelector('[data-imatges]');
  if (direcciones.length === 0) {
    contenedor.remove();
    return;
  }

  const plantilla = document.querySelector('[data-plantilla-imatge]');
  const bloques = direcciones.map((direccion) => {
    const bloque = plantilla.content.firstElementChild.cloneNode(true);
    bloque.querySelector('[data-campo="imatge"]').src = direccion;
    return bloque;
  });
  contenedor.replaceChildren(...bloques);
}

function rellenarDetalle(detalle, proyecto) {
  for (const campo of ['sector', 'titol', 'resum', 'repte', 'que_vam_fer', 'resultat']) {
    escribirTexto(detalle, campo, proyecto[campo]);
  }

  // Un proyecto sin sector no deja una etiqueta vacía.
  detalle.querySelector('.chip').hidden = proyecto.sector === '';

  pintarRecuadros(detalle, proyecto.recuadres);
  pintarImagenes(detalle, proyecto.imatges);

  document.title = `${proyecto.titol} · ERD`;
  document.querySelector('meta[name="description"]').content = proyecto.resum;
}

export async function cargarProyecto() {
  const detalle = document.querySelector('[data-projecte-detall]');
  const avisoNoEncontrado = document.querySelector('[data-projecte-error]');
  if (!detalle || !avisoNoEncontrado) {
    return;
  }

  const id = leerIdDeLaDireccion();
  const proyecto = id === null ? null : await pedirProyecto(id);
  if (proyecto === null) {
    // Se quita el detalle vacío: así ninguna animación se engancha a elementos sin contenido.
    detalle.remove();
    avisoNoEncontrado.hidden = false;
    return;
  }

  rellenarDetalle(detalle, proyecto);
  detalle.hidden = false;
}
