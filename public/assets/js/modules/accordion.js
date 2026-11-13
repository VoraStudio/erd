// Tarjetas que se abren (Home). Cada tarjeta tiene un botón con aria-expanded: el CSS (:has) hace el resto.
// Sin JavaScript las tarjetas quedan cerradas, pero el texto sigue en el HTML.

export function iniciarAcordeones() {
  const botones = document.querySelectorAll('.accordion-trigger');

  for (const boton of botones) {
    boton.addEventListener('click', () => {
      const estaAbierto = boton.getAttribute('aria-expanded') === 'true';
      boton.setAttribute('aria-expanded', String(!estaAbierto));
    });
  }
}
