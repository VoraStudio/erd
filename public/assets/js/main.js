// Punto de entrada de los módulos ES. Sin paso de compilación: el navegador carga estos archivos tal cual.
import { definirCabecera } from '/assets/js/components/header.js';
import { definirPie } from '/assets/js/components/footer.js';
import { definirContacto } from '/assets/js/components/contact.js';
import { iniciarAvisos } from '/assets/js/modules/toast.js';
import { iniciarFormularioDeContacto } from '/assets/js/modules/contact-form.js';
import { iniciarAcordeones } from '/assets/js/modules/accordion.js';
import { cargarProyectos, cargarProyecto } from '/assets/js/modules/projects.js';
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

// Las tarjetas y el detalle de Projectes vienen del CMS: tienen que existir antes de que los módulos de debajo los busquen.
await cargarProyectos();
await cargarProyecto();

iniciarAvisos();
iniciarFormularioDeContacto();
iniciarAcordeones();
iniciarFiltros();
iniciarEnlacesQueSeDibujan();
iniciarElevacionAlPasarElRaton();
iniciarAnimacionesDeLaCabecera();
iniciarAnimacionesDelHero();

// Los efectos de scroll van al final, cuando la página ya tiene su forma definitiva.
iniciarFrasePasante();
iniciarScrollHorizontal();
iniciarImagenQueCrece();
iniciarAnimaciones();
iniciarAnimacionesDelProceso();
iniciarTextosPorLineas();
iniciarAnimacionesDeSobreErd();
iniciarAnimacionesDelContacto();
iniciarAnimacionesDelPie();
