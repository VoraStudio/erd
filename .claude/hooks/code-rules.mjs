// Hook Code Rules (Claude Code, PreToolUse sobre Write y Edit).
// Bloquea el código HTML, CSS o JS que rompe las reglas de AGENTS.md antes de escribirlo.
// Código de salida 2: Claude Code cancela la escritura y le muestra el motivo al agente.

const EXTENSIONES_REVISADAS = ['.html', '.css', '.js'];

// Material del cliente y código de terceros: no se revisa.
const CARPETAS_IGNORADAS = ['/node_modules/', '/sdd-local/', '/.claude/skills/', '/vendor/'];

// Único archivo donde se escriben colores a mano.
const ARCHIVO_DE_TOKENS = 'src/css/theme.css';

// Atributos dentro de una etiqueta (<a ... onclick="">). Así no se confunden con variables JS como `once`.
const REGLAS_DE_MARCADO = [
  { patron: /<style[\s>]/i, mensaje: 'Etiqueta <style> en línea: los estilos van en src/css/.' },
  { patron: /<script(?![^>]*\bsrc\s*=)[^>]*>/i, mensaje: 'Etiqueta <script> en línea: el JavaScript va en public/assets/js/.' },
  { patron: /<[a-z][^>]*\son(?!pen\b)[a-z]+\s*=\s*["']/i, mensaje: 'Atributo on*= (onclick, onload...): los eventos se escuchan desde JavaScript.' },
  { patron: /<[a-z][^>]*\sstyle\s*=\s*["']/i, mensaje: 'Atributo style="": los estilos van en clases de Tailwind o en src/css/.' },
];

const REGLAS_DE_JAVASCRIPT = [
  { patron: /\bvar\s+[A-Za-z_$]/, mensaje: 'Uso de var: se usa const (o let si se reasigna).' },
  { patron: /\bconsole\.log\s*\(/, mensaje: 'console.log en el código: se quita antes de escribirlo.' },
];

function normalizarRuta(ruta) {
  return ruta.replaceAll('\\', '/');
}

function debeRevisarse(ruta) {
  const tieneExtensionRevisada = EXTENSIONES_REVISADAS.some((extension) => ruta.endsWith(extension));
  if (!tieneExtensionRevisada) {
    return false;
  }
  const estaEnCarpetaIgnorada = CARPETAS_IGNORADAS.some((carpeta) => `/${ruta}`.includes(carpeta));
  return !estaEnCarpetaIgnorada;
}

// Un # seguido de 3, 4, 6 u 8 cifras hexadecimales es un color.
// No cuentan las anclas (href="#add") ni las entidades HTML (&#x27;).
function tieneColorHexadecimal(texto) {
  const posiblesColores = texto.matchAll(/#([0-9a-fA-F]+)\b/g);

  for (const coincidencia of posiblesColores) {
    const longitud = coincidencia[1].length;
    const esLongitudDeColor = [3, 4, 6, 8].includes(longitud);
    const textoAnterior = texto.slice(Math.max(0, coincidencia.index - 6), coincidencia.index);
    const esAncla = /href=["']$/.test(textoAnterior);
    const esEntidad = textoAnterior.endsWith('&');

    if (esLongitudDeColor && !esAncla && !esEntidad) {
      return true;
    }
  }
  return false;
}

function buscarInfracciones(rutaOriginal, texto) {
  const ruta = normalizarRuta(rutaOriginal);
  if (!debeRevisarse(ruta)) {
    return [];
  }

  const infracciones = [];
  const esCss = ruta.endsWith('.css');
  const esJavascript = ruta.endsWith('.js');

  if (!esCss) {
    for (const regla of REGLAS_DE_MARCADO) {
      if (regla.patron.test(texto)) {
        infracciones.push(regla.mensaje);
      }
    }
  }

  if (esJavascript) {
    for (const regla of REGLAS_DE_JAVASCRIPT) {
      if (regla.patron.test(texto)) {
        infracciones.push(regla.mensaje);
      }
    }
  }

  const esArchivoDeTokens = ruta.endsWith(ARCHIVO_DE_TOKENS);
  if (!esArchivoDeTokens && tieneColorHexadecimal(texto)) {
    infracciones.push('Color hexadecimal escrito a mano: se usa un token de theme.css (bg-erd-red, var(--color-erd-red), currentColor).');
  }

  return infracciones;
}

async function leerEntrada() {
  let entrada = '';
  process.stdin.setEncoding('utf8');
  for await (const trozo of process.stdin) {
    entrada += trozo;
  }
  return JSON.parse(entrada);
}

const datos = await leerEntrada();
const ruta = datos.tool_input?.file_path ?? '';
// Write trae el archivo entero (content); Edit solo el fragmento nuevo (new_string).
const textoNuevo = datos.tool_input?.content ?? datos.tool_input?.new_string ?? '';
const infracciones = buscarInfracciones(ruta, textoNuevo);

if (infracciones.length > 0) {
  const lista = infracciones.map((infraccion) => `- ${infraccion}`).join('\n');
  process.stderr.write(`Code Rules ha bloqueado la escritura de ${ruta}:\n${lista}\nReglas completas en AGENTS.md, sección 2.\n`);
  process.exit(2);
}
