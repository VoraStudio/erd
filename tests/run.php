<?php

declare(strict_types=1);

// Ejecutor de pruebas sin dependencias para Env, Config y ContactForm. Uso: php tests/run.php

error_reporting(E_ALL);
set_error_handler(static function (int $gravedad, string $mensaje, string $archivo, int $linea): bool {
    throw new ErrorException($mensaje, 0, $gravedad, $archivo, $linea);
});

require __DIR__ . '/../src/Env.php';
require __DIR__ . '/../src/Config.php';
require __DIR__ . '/../src/ContactForm.php';

$fallos = 0;
$total = 0;

function comprobar(string $etiqueta, bool $condicion): void
{
    global $fallos, $total;
    $total++;
    if ($condicion) {
        echo "  ok    {$etiqueta}\n";
        return;
    }
    $fallos++;
    echo "  FALLO {$etiqueta}\n";
}

function crearDirectorioTemporal(): string
{
    $directorio = sys_get_temp_dir() . '/env-prueba-' . bin2hex(random_bytes(6));
    mkdir($directorio, 0777, true);
    return $directorio;
}

function borrarDirectorio(string $directorio): void
{
    foreach (glob($directorio . '/{,.}*', GLOB_BRACE) ?: [] as $entrada) {
        if (in_array(basename($entrada), ['.', '..'], true)) {
            continue;
        }
        is_dir($entrada) ? borrarDirectorio($entrada) : unlink($entrada);
    }
    rmdir($directorio);
}

function clavesDeConfiguracion(): array
{
    return ['MAIL_RECIPIENT', 'MAIL_SENDER'];
}

function reiniciarEstado(): void
{
    Env::reiniciar();
    foreach (clavesDeConfiguracion() as $clave) {
        putenv(Config::PREFIJO . $clave);
    }
    putenv('PRUEBA_SIMPLE');
}

$prefijo = Config::PREFIJO;

echo "Config sin entorno\n";
reiniciarEstado();
$vacio = crearDirectorioTemporal();
Env::cargar($vacio);
comprobar('no está configurado', Config::estaConfigurado() === false);
comprobar('todas las claves pendientes', Config::clavesPendientes() === clavesDeConfiguracion());
comprobar('una clave ausente es null', Config::obtener('MAIL_RECIPIENT') === null);
borrarDirectorio($vacio);

echo "Config desde .env\n";
reiniciarEstado();
$directorio = crearDirectorioTemporal();
file_put_contents($directorio . '/.env', implode("\n", [
    "{$prefijo}MAIL_RECIPIENT=to@example.test",
    "{$prefijo}MAIL_SENDER=from@example.test",
]));
Env::cargar($directorio);
comprobar('está configurado', Config::estaConfigurado() === true);
comprobar('sin claves pendientes', Config::clavesPendientes() === []);
comprobar('se lee el valor', Config::obtener('MAIL_RECIPIENT') === 'to@example.test');

echo "El entorno real manda sobre el .env\n";
reiniciarEstado();
putenv("{$prefijo}MAIL_RECIPIENT=real@example.test");
Env::cargar($directorio);
comprobar('se usa el valor del entorno real', Config::obtener('MAIL_RECIPIENT') === 'real@example.test');
comprobar('las demás claves siguen viniendo del .env', Config::obtener('MAIL_SENDER') === 'from@example.test');
putenv("{$prefijo}MAIL_RECIPIENT");

echo "Vacío significa pendiente\n";
reiniciarEstado();
file_put_contents($directorio . '/.env', "{$prefijo}MAIL_RECIPIENT=\n{$prefijo}MAIL_SENDER=\"\"\n");
Env::cargar($directorio);
comprobar('vacío sin comillas es pendiente', Config::obtener('MAIL_RECIPIENT') === null);
comprobar('vacío con comillas es pendiente', Config::obtener('MAIL_SENDER') === null);
reiniciarEstado();
file_put_contents($directorio . '/.env', "{$prefijo}MAIL_SENDER='   '\n");
Env::cargar($directorio);
comprobar('solo espacios es pendiente', Config::obtener('MAIL_SENDER') === null);
reiniciarEstado();
putenv("{$prefijo}MAIL_RECIPIENT=");
file_put_contents($directorio . '/.env', "{$prefijo}MAIL_RECIPIENT=DelArchivo\n");
Env::cargar($directorio);
comprobar('un entorno real vacío recurre al .env', Config::obtener('MAIL_RECIPIENT') === 'DelArchivo');
putenv("{$prefijo}MAIL_RECIPIENT");

echo "Intérprete\n";
$interpretado = Env::interpretar(implode("\n", [
    '# comentario de línea completa',
    '',
    'PLAIN=value',
    'export EXPORTED=yes',
    "SINGLE='single # not comment'",
    'DOUBLE="double # not comment"',
    'INLINE=before # after',
    'LITERAL=${HOME}/x',
    'DOLLAR=$OTHER',
    'SUBSHELL=$(whoami)',
    'ESCAPED="line1\nline2 \"q\""',
    'SPACED = spaced value ',
    'NOEQUALS',
    '=nokey',
    '1BAD=x',
    'WINDOWS=crlf',
]) . "\r\n");
comprobar('simple', ($interpretado['PLAIN'] ?? null) === 'value');
comprobar('prefijo export', ($interpretado['EXPORTED'] ?? null) === 'yes');
comprobar('las comillas simples conservan la almohadilla', ($interpretado['SINGLE'] ?? null) === 'single # not comment');
comprobar('las comillas dobles conservan la almohadilla', ($interpretado['DOUBLE'] ?? null) === 'double # not comment');
comprobar('se quita el comentario en línea', ($interpretado['INLINE'] ?? null) === 'before');
comprobar('${} se queda literal', ($interpretado['LITERAL'] ?? null) === '${HOME}/x');
comprobar('$VAR se queda literal', ($interpretado['DOLLAR'] ?? null) === '$OTHER');
comprobar('$() no se ejecuta', ($interpretado['SUBSHELL'] ?? null) === '$(whoami)');
comprobar('escapes de comillas dobles', ($interpretado['ESCAPED'] ?? null) === "line1\nline2 \"q\"");
comprobar('se recortan los espacios alrededor de =', ($interpretado['SPACED'] ?? null) === 'spaced value');
comprobar('se ignoran las líneas inválidas', !array_key_exists('NOEQUALS', $interpretado) && !array_key_exists('1BAD', $interpretado));
comprobar('se admite CRLF', ($interpretado['WINDOWS'] ?? null) === 'crlf');

echo "Búsqueda y caché\n";
reiniciarEstado();
$padre = crearDirectorioTemporal();
$hijo = $padre . '/app';
mkdir($hijo);
file_put_contents($padre . '/.env', "PRUEBA_SIMPLE=del-padre\n");
Env::cargar($hijo, $padre);
comprobar('se encuentra el .env un nivel por encima', Env::obtener('PRUEBA_SIMPLE') === 'del-padre');
file_put_contents($padre . '/.env', "PRUEBA_SIMPLE=cambiado\n");
Env::cargar($hijo, $padre);
comprobar('solo se carga una vez', Env::obtener('PRUEBA_SIMPLE') === 'del-padre');
Env::reiniciar();
file_put_contents($hijo . '/.env', "PRUEBA_SIMPLE=del-hijo\n");
Env::cargar($hijo, $padre);
comprobar('gana el primer directorio', Env::obtener('PRUEBA_SIMPLE') === 'del-hijo');
comprobar('una clave desconocida es null', Env::obtener('PRUEBA_NO_EXISTE') === null);

echo "Formulario de contacto: validación\n";
$entradaValida = [
    'nom' => '  Anna Puig  ',
    'correu' => 'anna@example.test',
    'missatge' => 'Hola, voldria més informació.',
    'privadesa' => 'on',
];
$resultado = ContactForm::validar($entradaValida);
comprobar('una entrada correcta no da errores', $resultado['errores'] === []);
comprobar('se recorta el nombre', $resultado['datos']['nombre'] === 'Anna Puig');
comprobar('se conserva el correo y el mensaje', $resultado['datos']['correo'] === 'anna@example.test'
    && $resultado['datos']['mensaje'] === 'Hola, voldria més informació.');

comprobar('el mensaje es opcional', ContactForm::validar(['missatge' => ''] + $entradaValida)['errores'] === []);
comprobar('falta el nombre', ContactForm::validar(['nom' => '   '] + $entradaValida)['errores'] === ['nom']);
comprobar('correo inválido', ContactForm::validar(['correu' => 'anna@'] + $entradaValida)['errores'] === ['correu']);
comprobar('falta el correo', ContactForm::validar(['correu' => ''] + $entradaValida)['errores'] === ['correu']);
comprobar('falta aceptar la privacidad', ContactForm::validar(['privadesa' => ''] + $entradaValida)['errores'] === ['privadesa']);
comprobar('sin la casilla de privacidad', ContactForm::validar(array_diff_key($entradaValida, ['privadesa' => 1]))['errores'] === ['privadesa']);
comprobar('mensaje demasiado largo', ContactForm::validar(['missatge' => str_repeat('a', ContactForm::LONGITUD_MAXIMA_MENSAJE + 1)] + $entradaValida)['errores'] === ['missatge']);
comprobar('nombre demasiado largo', ContactForm::validar(['nom' => str_repeat('a', ContactForm::LONGITUD_MAXIMA_NOMBRE + 1)] + $entradaValida)['errores'] === ['nom']);
comprobar('varios errores a la vez', ContactForm::validar([])['errores'] === ['nom', 'correu', 'privadesa']);
comprobar('un valor que no es texto no rompe', ContactForm::validar(['nom' => ['x'], 'correu' => 'anna@example.test', 'privadesa' => 'on'])['errores'] === ['nom']);

echo "Formulario de contacto: inyección de cabeceras\n";
$conSaltoEnNombre = ContactForm::validar(['nom' => "Anna\r\nBcc: espia@example.test"] + $entradaValida);
comprobar('los saltos de línea del nombre se eliminan', !str_contains($conSaltoEnNombre['datos']['nombre'], "\r")
    && !str_contains($conSaltoEnNombre['datos']['nombre'], "\n"));
$conSaltoEnCorreo = ContactForm::validar(['correu' => "anna@example.test\r\nBcc: espia@example.test"] + $entradaValida);
comprobar('un correo con salto de línea se rechaza', $conSaltoEnCorreo['errores'] === ['correu']);

echo "Formulario de contacto: antispam\n";
comprobar('el campo trampa vacío no es spam', ContactForm::esSpam(['web' => '']) === false);
comprobar('sin campo trampa no es spam', ContactForm::esSpam([]) === false);
comprobar('el campo trampa relleno es spam', ContactForm::esSpam(['web' => 'http://spam.test']) === true);

echo "Formulario de contacto: correo\n";
$datos = ContactForm::validar(['nom' => "Anna\r\nBcc: x"] + $entradaValida)['datos'];
$correo = ContactForm::construirCorreo($datos, 'to@example.test', 'from@example.test');
comprobar('el destinatario es el configurado', $correo['para'] === 'to@example.test');
comprobar('el asunto va codificado en UTF-8', str_starts_with($correo['asunto'], '=?UTF-8?B?'));
comprobar('el cuerpo incluye nombre, correo y mensaje', str_contains($correo['cuerpo'], 'anna@example.test')
    && str_contains($correo['cuerpo'], 'Hola, voldria més informació.') && str_contains($correo['cuerpo'], 'Anna'));
comprobar('se responde al correo del visitante', in_array('Reply-To: anna@example.test', $correo['cabeceras'], true));
comprobar('el remitente es el del sitio', in_array('From: from@example.test', $correo['cabeceras'], true));
$cabecerasLimpias = true;
foreach ($correo['cabeceras'] as $cabecera) {
    if (str_contains($cabecera, "\r") || str_contains($cabecera, "\n")) {
        $cabecerasLimpias = false;
    }
}
comprobar('ninguna cabecera contiene saltos de línea', $cabecerasLimpias);
comprobar('no hay una cabecera Bcc inyectada', array_filter($correo['cabeceras'], static fn (string $c): bool => stripos($c, 'Bcc') !== false) === []);

reiniciarEstado();
borrarDirectorio($directorio);
borrarDirectorio($padre);

echo "\n{$total} comprobaciones, {$fallos} fallidas\n";
exit($fallos === 0 ? 0 : 1);
