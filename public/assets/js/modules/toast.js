// Aviso flotante para lo que todavía no existe (páginas legales, recursos...).
// Cualquier botón con data-soon="texto" muestra ese texto unos segundos.

const DURACION_AVISO_MS = 2600;

function crearAviso() {
  const aviso = document.createElement('div');
  aviso.className = 'toast';
  // role="status": los lectores de pantalla leen el aviso sin mover el foco.
  aviso.setAttribute('role', 'status');
  document.body.append(aviso);
  return aviso;
}

export function iniciarAvisos() {
  const aviso = crearAviso();
  let temporizador = null;

  // Delegación de eventos: un solo listener sirve para todos los data-soon, también los de los componentes.
  document.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-soon]');
    if (!boton) {
      return;
    }
    evento.preventDefault();
    aviso.textContent = `${boton.dataset.soon}.`;
    aviso.classList.add('is-visible');

    clearTimeout(temporizador);
    temporizador = setTimeout(() => aviso.classList.remove('is-visible'), DURACION_AVISO_MS);
  });
}
