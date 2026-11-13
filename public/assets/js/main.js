// Punto de entrada de los módulos ES. Sin paso de compilación: el navegador carga estos archivos tal cual.
import { definirCabecera } from '/assets/js/components/header.js';
import { definirPie } from '/assets/js/components/footer.js';
import { definirContacto } from '/assets/js/components/contact.js';
import { iniciarAvisos } from '/assets/js/modules/toast.js';
import { iniciarAnimaciones } from '/assets/js/modules/animations.js';

// Primero los componentes: las animaciones tienen que encontrar ya pintados sus data-animacion.
definirCabecera();
definirContacto();
definirPie();

iniciarAvisos();
iniciarAnimaciones();
