// Filtro de proyectos por sector (Projectes).
// Cada botón lleva data-filtre="sector" (vacío = todos) y cada tarjeta data-sector="sector".

function mostrarSector(botones, tarjetas, sectorElegido) {
  for (const boton of botones) {
    const estaElegido = boton.dataset.filtre === sectorElegido;
    boton.setAttribute('aria-pressed', String(estaElegido));
  }

  for (const tarjeta of tarjetas) {
    const coincide = sectorElegido === '' || tarjeta.dataset.sector === sectorElegido;
    tarjeta.hidden = !coincide;
  }
}

export function iniciarFiltros() {
  const grupo = document.querySelector('[data-filtres]');
  if (!grupo) {
    return;
  }

  const botones = grupo.querySelectorAll('[data-filtre]');
  const tarjetas = document.querySelectorAll('[data-sector]');

  for (const boton of botones) {
    boton.addEventListener('click', () => mostrarSector(botones, tarjetas, boton.dataset.filtre));
  }
}
