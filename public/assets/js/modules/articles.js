// Pinta los artículos de Actualitat con lo que entrega el servidor (que lee el CMS): las filas del listado y el
// artículo completo. Todo se escribe con textContent y el cuerpo se construye con createElement: nunca con innerHTML,
// así un texto del CMS no puede colar código en la web.

import { pedirDatos, escribirTexto, leerIdDeLaDireccion } from '/assets/js/modules/cms.js';

const DIRECCION_DE_LOS_ARTICULOS = '/cms/articles.php';
const FORMATO_DE_LA_FECHA = { day: 'numeric', month: 'long', year: 'numeric' };

// Cada tipo de bloque del cuerpo es una etiqueta distinta. Los párrafos entran línea a línea (data-lineas);
// los subtítulos y las citas, palabra a palabra (data-titulo-palabras), como los títulos de la web.
const ETIQUETAS_DEL_CUERPO = { parrafo: 'p', subtitulo: 'h2', cita: 'blockquote' };

async function pedirArticulos() {
  const datos = await pedirDatos(DIRECCION_DE_LOS_ARTICULOS);
  if (datos === null || !Array.isArray(datos.articles)) {
    return null;
  }

  return datos.articles;
}

async function pedirArticulo(id) {
  const datos = await pedirDatos(`${DIRECCION_DE_LOS_ARTICULOS}?id=${encodeURIComponent(id)}`);
  if (datos === null || typeof datos.article !== 'object') {
    return null;
  }

  return datos.article;
}

/* ===== Listado de Actualitat ===== */

function crearFila(plantilla, articulo) {
  const fila = plantilla.content.firstElementChild.cloneNode(true);

  // El filtro por categoría (modules/filters.js) oculta las filas que no coinciden con la píldora elegida.
  fila.dataset.sector = articulo.categoria;
  escribirTexto(fila, 'categoria', articulo.categoria);
  escribirTexto(fila, 'titol', articulo.titol);
  escribirTexto(fila, 'entradeta', articulo.entradeta);
  fila.querySelector('[data-campo="enlace"]').href = `/actualitat/article/?id=${encodeURIComponent(articulo.id)}`;

  // Un artículo sin categoría o sin entradilla no deja huecos vacíos en la fila.
  fila.querySelector('[data-campo="categoria"]').hidden = articulo.categoria === '';
  fila.querySelector('[data-campo="entradeta"]').hidden = articulo.entradeta === '';

  return fila;
}

export async function cargarArticulos() {
  const lista = document.querySelector('[data-articles]');
  const plantilla = document.querySelector('[data-plantilla-article]');
  const avisoSinArticulos = document.querySelector('[data-articles-buit]');
  if (!lista || !plantilla || !avisoSinArticulos) {
    return;
  }

  const articulos = await pedirArticulos();
  if (articulos === null || articulos.length === 0) {
    avisoSinArticulos.hidden = false;
    return;
  }

  lista.replaceChildren(...articulos.map((articulo) => crearFila(plantilla, articulo)));
}

/* ===== Últimos artículos (final de Sobre ERD) ===== */

const NUMERO_DE_ULTIMOS_ARTICULOS = 3;

function crearTarjeta(plantilla, articulo) {
  const tarjeta = plantilla.content.firstElementChild.cloneNode(true);

  escribirTexto(tarjeta, 'categoria', articulo.categoria);
  escribirTexto(tarjeta, 'titol', articulo.titol);
  escribirTexto(tarjeta, 'entradeta', articulo.entradeta);
  tarjeta.querySelector('[data-campo="enlace"]').href = `/actualitat/article/?id=${encodeURIComponent(articulo.id)}`;

  // Un artículo sin categoría, sin entradilla o sin imagen no deja huecos vacíos en la tarjeta.
  tarjeta.querySelector('[data-campo="categoria"]').hidden = articulo.categoria === '';
  tarjeta.querySelector('[data-campo="entradeta"]').hidden = articulo.entradeta === '';

  const imagen = tarjeta.querySelector('[data-campo="imatge"]');
  if (articulo.imatge) {
    imagen.src = articulo.imatge;
  } else {
    imagen.closest('.project-card-image').remove();
  }

  return tarjeta;
}

export async function cargarUltimosArticulos() {
  const contenedor = document.querySelector('[data-ultims-articles]');
  const plantilla = document.querySelector('[data-plantilla-ultim-article]');
  const avisoSinArticulos = document.querySelector('[data-ultims-buit]');
  if (!contenedor || !plantilla || !avisoSinArticulos) {
    return;
  }

  const articulos = await pedirArticulos();
  if (articulos === null || articulos.length === 0) {
    avisoSinArticulos.hidden = false;
    return;
  }

  // El CMS entrega primero los más recientes: los últimos artículos son los primeros de la lista.
  const ultimos = articulos.slice(0, NUMERO_DE_ULTIMOS_ARTICULOS);
  contenedor.replaceChildren(...ultimos.map((articulo) => crearTarjeta(plantilla, articulo)));
}

/* ===== Artículo completo ===== */

function pintarDatosDeLaCabecera(detalle, articulo) {
  const elementoDeLaFecha = detalle.querySelector('[data-campo="data"]');
  if (articulo.data === '') {
    elementoDeLaFecha.closest('li').remove();
  } else {
    elementoDeLaFecha.dateTime = articulo.data;
    elementoDeLaFecha.textContent = new Date(`${articulo.data}T00:00:00`).toLocaleDateString('ca-ES', FORMATO_DE_LA_FECHA);
  }

  const elementoDelAutor = detalle.querySelector('[data-campo="autor"]');
  if (articulo.autor === '') {
    elementoDelAutor.remove();
  } else {
    elementoDelAutor.textContent = articulo.autor;
  }

  escribirTexto(detalle, 'lectura', `${articulo.minuts} min de lectura`);
}

function pintarPortada(detalle, portada) {
  const figura = detalle.querySelector('[data-article-portada]');
  if (portada === null) {
    figura.remove();
    return;
  }

  figura.querySelector('[data-campo="portada"]').src = portada.url;

  const pie = figura.querySelector('[data-campo="peu"]');
  if (portada.peu === '') {
    pie.remove();
    return;
  }
  pie.textContent = portada.peu;
}

function crearBloque(bloque) {
  const elemento = document.createElement(ETIQUETAS_DEL_CUERPO[bloque.tipus] ?? 'p');
  elemento.textContent = bloque.text;

  if (bloque.tipus === 'parrafo') {
    elemento.dataset.lineas = '';
  } else {
    elemento.dataset.tituloPalabras = '';
  }

  return elemento;
}

function pintarCuerpo(detalle, bloques) {
  const cuerpo = detalle.querySelector('[data-article-cos]');
  if (bloques.length === 0) {
    cuerpo.remove();
    return;
  }

  cuerpo.replaceChildren(...bloques.map(crearBloque));
}

function pintarGaleria(detalle, direcciones) {
  const galeria = detalle.querySelector('[data-article-galeria]');
  if (direcciones.length === 0) {
    galeria.remove();
    return;
  }

  const plantilla = document.querySelector('[data-plantilla-galeria]');
  const figuras = direcciones.map((direccion) => {
    const figura = plantilla.content.firstElementChild.cloneNode(true);
    figura.querySelector('[data-campo="imatge"]').src = direccion;
    return figura;
  });
  galeria.replaceChildren(...figuras);
}

function rellenarArticulo(detalle, articulo) {
  for (const campo of ['categoria', 'titol', 'entradeta']) {
    escribirTexto(detalle, campo, articulo[campo]);
  }

  // Sin categoría o sin entradilla no se deja una etiqueta ni un párrafo vacíos.
  detalle.querySelector('.chip').hidden = articulo.categoria === '';
  detalle.querySelector('.lead').hidden = articulo.entradeta === '';

  pintarDatosDeLaCabecera(detalle, articulo);
  pintarPortada(detalle, articulo.portada);
  pintarCuerpo(detalle, articulo.blocs);
  pintarGaleria(detalle, articulo.galeria);

  document.title = `${articulo.titol} · ERD`;
  document.querySelector('meta[name="description"]').content = articulo.entradeta || articulo.titol;
}

export async function cargarArticulo() {
  const detalle = document.querySelector('[data-article-detall]');
  const avisoNoEncontrado = document.querySelector('[data-article-error]');
  if (!detalle || !avisoNoEncontrado) {
    return;
  }

  const id = leerIdDeLaDireccion();
  const articulo = id === null ? null : await pedirArticulo(id);
  if (articulo === null) {
    // Se quita el artículo vacío: así ninguna animación se engancha a elementos sin contenido.
    detalle.remove();
    avisoNoEncontrado.hidden = false;
    return;
  }

  rellenarArticulo(detalle, articulo);
  detalle.hidden = false;
}
