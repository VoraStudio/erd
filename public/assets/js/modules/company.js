// Rellena los datos de la empresa (teléfono, correo, dirección, datos legales) con lo que hay en el .env del servidor.
// En el HTML, cada hueco lleva data-empresa="campo" y un texto de reserva («Pendent de confirmar» o un aviso resaltado):
// si el servidor tiene el dato, lo sustituye; si no, el texto de reserva se queda y se ve qué falta.
//   data-empresa="correo"            el hueco se rellena con ese dato
//   data-empresa-enlace              además lo convierte en enlace (mailto: o tel:), si el dato tiene enlace
//   data-empresa-opcional="dpd"      el elemento entero desaparece si ese dato no existe

import { pedirDatos } from '/assets/js/modules/cms.js';

const DIRECCION_DE_LA_EMPRESA = '/empresa/dades.php';

function rellenarHueco(hueco, empresa) {
  const campo = hueco.dataset.empresa;
  const valor = empresa[campo];
  if (valor === undefined) {
    return;
  }

  const direccionDelEnlace = empresa[`${campo}_enlace`];
  if (hueco.hasAttribute('data-empresa-enlace') && direccionDelEnlace !== undefined) {
    const enlace = document.createElement('a');
    enlace.href = direccionDelEnlace;
    enlace.textContent = valor;
    hueco.replaceChildren(enlace);
  } else {
    hueco.textContent = valor;
  }

  // Con el dato ya puesto, el hueco deja de verse como «pendiente».
  hueco.classList.remove('legal-pending');
}

export async function cargarDatosDeLaEmpresa() {
  const huecos = document.querySelectorAll('[data-empresa]');
  const opcionales = document.querySelectorAll('[data-empresa-opcional]');
  if (huecos.length === 0 && opcionales.length === 0) {
    return;
  }

  const datos = await pedirDatos(DIRECCION_DE_LA_EMPRESA);
  if (datos === null || typeof datos.empresa !== 'object') {
    return;
  }

  for (const hueco of huecos) {
    rellenarHueco(hueco, datos.empresa);
  }

  for (const opcional of opcionales) {
    if (datos.empresa[opcional.dataset.empresaOpcional] === undefined) {
      opcional.remove();
    }
  }
}
