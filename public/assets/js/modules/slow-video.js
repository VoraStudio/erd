// Vídeos decorativos en cámara lenta (data-video-lento): se repiten en bucle, mudos y sin controles.
// Con «reducir movimiento» activado en el sistema no se reproducen: se queda el primer fotograma.

const VELOCIDAD_LENTA = 0.5;

export function iniciarVideosLentos() {
  const videos = document.querySelectorAll('[data-video-lento]');
  if (videos.length === 0) {
    return;
  }

  const quiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  for (const video of videos) {
    // defaultPlaybackRate hace que la velocidad se mantenga cada vez que el bucle vuelve a empezar.
    video.defaultPlaybackRate = VELOCIDAD_LENTA;
    video.playbackRate = VELOCIDAD_LENTA;

    if (quiereMenosMovimiento) {
      video.removeAttribute('autoplay');
      video.pause();
    }
  }
}
