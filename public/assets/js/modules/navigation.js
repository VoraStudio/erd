// Mapa del sitio: una sola lista para la cabecera, el menú y el pie.
// Las rutas son las carpetas de public/ (una carpeta por página).

export const PAGINAS = [
  { texto: 'Home', url: '/' },
  { texto: 'Serveis', url: '/serveis/' },
  { texto: 'Sobre ERD', url: '/sobre-erd/' },
  { texto: 'Projectes', url: '/projectes/' },
  { texto: 'Actualitat', url: '/actualitat/' },
];

export const SERVEIS = [
  { texto: 'Logística i emmagatzematge', url: '/serveis/logistica-emmagatzematge/' },
  { texto: 'Organització industrial', url: '/serveis/organitzacio-industrial/' },
  { texto: 'Operacions de restauració', url: '/serveis/operacions-restauracio/' },
  { texto: 'Finances operatives (NOF)', url: '/serveis/finances-operatives-nof/' },
  { texto: 'Control i anticipació', url: '/serveis/control-anticipacio/' },
  { texto: 'Compravenda de negocis', url: '/serveis/compravenda-negocis/' },
  { texto: 'Màrqueting & comunicació', url: '/serveis/marqueting-comunicacio/' },
  { texto: 'Comercial', url: '/serveis/comercial/' },
  { texto: 'Estratègia IA', url: '/serveis/estrategia-ia/' },
];

// Devuelve el valor de aria-current para un enlace, o null si no toca marcarlo.
// "page" es la página exacta; "true" es su sección (por ejemplo, Serveis dentro de un servicio).
export function obtenerEstadoActual(url) {
  const rutaActual = window.location.pathname;

  if (rutaActual === url) {
    return 'page';
  }
  const esSeccion = url !== '/' && rutaActual.startsWith(url);
  if (esSeccion) {
    return 'true';
  }
  return null;
}

// Atributo aria-current listo para meter en una plantilla HTML.
export function atributoActual(url) {
  const estado = obtenerEstadoActual(url);
  if (!estado) {
    return '';
  }
  return ` aria-current="${estado}"`;
}
