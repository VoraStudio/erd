// Punto de entrada de los módulos ES. Sin paso de compilación: el navegador carga estos archivos tal cual.
import { definirCabecera } from '/assets/js/components/header.js';
import { definirPie } from '/assets/js/components/footer.js';
import { definirContacto } from '/assets/js/components/contact.js';
import { iniciarAvisos } from '/assets/js/modules/toast.js';
import { iniciarFormularioDeContacto } from '/assets/js/modules/contact-form.js';
import { iniciarAcordeones } from '/assets/js/modules/accordion.js';
import { cargarDatosDeLaEmpresa } from '/assets/js/modules/company.js';
import { iniciarAnimacionesLegales } from '/assets/js/modules/legal-animations.js';
import { cargarProyectos, cargarProyecto } from '/assets/js/modules/projects.js';
import { cargarArticulos, cargarArticulo, cargarUltimosArticulos } from '/assets/js/modules/articles.js';
import { iniciarAnimacionesDelArticulo } from '/assets/js/modules/article-animations.js';
import { iniciarAnimacionesDelProyecto } from '/assets/js/modules/project-animations.js';
import { iniciarVideosLentos } from '/assets/js/modules/slow-video.js';
import { iniciarFiltros } from '/assets/js/modules/filters.js';
import { iniciarAnimaciones } from '/assets/js/modules/animations.js';
import { iniciarEnlacesQueSeDibujan } from '/assets/js/modules/draw-link.js';
import { iniciarElevacionAlPasarElRaton } from '/assets/js/modules/hover-lift.js';
import { iniciarAnimacionesDeLaCabecera } from '/assets/js/modules/header-animations.js';
import { iniciarAnimacionesDelPie } from '/assets/js/modules/footer-animations.js';
import { iniciarAnimacionesDelContacto } from '/assets/js/modules/contact-animations.js';
import { iniciarTextosPorLineas } from '/assets/js/modules/text-lines.js';
import { iniciarAnimacionesDeSobreErd } from '/assets/js/modules/about-animations.js';
import { iniciarAnimacionesDelHero } from '/assets/js/modules/hero-animations.js';
import { iniciarAnimacionesDelProceso } from '/assets/js/modules/process-animations.js';
import { iniciarFrasePasante } from '/assets/js/modules/marquee.js';
import { iniciarScrollHorizontal } from '/assets/js/modules/horizontal-scroll.js';
import { iniciarImagenQueCrece } from '/assets/js/modules/grow-image.js';

// Primero los componentes: los módulos de debajo tienen que encontrar ya pintado su contenido.
definirCabecera();
definirContacto();
definirPie();

// La cabecera y la portada de la Home no dependen del servidor: su animación arranca ya, sin esperar a los datos.
iniciarAnimacionesDeLaCabecera();
iniciarAnimacionesDelHero();

// Los datos de la empresa, los proyectos y los artículos vienen del servidor: tienen que estar pintados antes de que
// los módulos de debajo los busquen. Cada función no hace nada si la página no tiene su hueco, y van en paralelo.
// Mientras tanto, el bloque de contacto y el pie están ocultos (data-cms-pendiente, ver components.css).
await Promise.all([
  cargarDatosDeLaEmpresa(),
  cargarProyectos(),
  cargarProyecto(),
  cargarArticulos(),
  cargarArticulo(),
  cargarUltimosArticulos(),
]);

iniciarVideosLentos();
iniciarAvisos();
iniciarFormularioDeContacto();
iniciarAcordeones();
iniciarFiltros();
iniciarEnlacesQueSeDibujan();
iniciarElevacionAlPasarElRaton();

// Los efectos de scroll van al final, cuando la página ya tiene su forma definitiva.
iniciarFrasePasante();
iniciarScrollHorizontal();
iniciarImagenQueCrece();
iniciarAnimaciones();
iniciarAnimacionesDelProceso();
iniciarTextosPorLineas();
iniciarAnimacionesDeSobreErd();
iniciarAnimacionesDelArticulo();
iniciarAnimacionesDelProyecto();
iniciarAnimacionesLegales();
iniciarAnimacionesDelContacto();
iniciarAnimacionesDelPie();

// La página ya tiene su contenido y todas las animaciones preparadas: el contacto y el pie dejan de estar ocultos.
// Va al final y sin esperas, así no hay ningún fotograma en que se vean antes de que su entrada esté lista.
document.querySelector('main[data-cms-pendiente]')?.removeAttribute('data-cms-pendiente');
