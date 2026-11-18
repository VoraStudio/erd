<?php

declare(strict_types=1);

// Ejecutor de pruebas sin dependencias para Env, Config, ContactForm, ContactSecurity, ContactHandler, CmsClient y CmsProjectes. Uso: php tests/run.php

error_reporting(E_ALL);
set_error_handler(static function (int $gravedad, string $mensaje, string $archivo, int $linea): bool {
    throw new ErrorException($mensaje, 0, $gravedad, $archivo, $linea);
});

require __DIR__ . '/../src/Env.php';
require __DIR__ . '/../src/Config.php';
require __DIR__ . '/../src/ContactForm.php';
require __DIR__ . '/../src/ContactSecurity.php';
require __DIR__ . '/../src/Recaptcha.php';
require __DIR__ . '/../src/SmtpTransport.php';
require __DIR__ . '/../src/SmtpMailer.php';
require __DIR__ . '/../src/ContactHandler.php';
require __DIR__ . '/../src/CmsClient.php';
require __DIR__ . '/../src/Empresa.php';
require __DIR__ . '/../src/CmsProjectes.php';

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

/** Servidor SMTP falso: devuelve las respuestas del guion y apunta todo lo que el cliente le manda. */
final class TransporteFalso implements SmtpTransport
{
    /** @var list<array{codigo: int, texto: string}> */
    private array $respuestas = [];

    /** @var list<string> */
    public array $comandos = [];

    public ?string $datos = null;
    public bool $cerrado = false;

    /** @param list<int> $codigos un código de respuesta por cada paso del diálogo */
    public function __construct(array $codigos, private bool $aceptaCifrado = true)
    {
        foreach ($codigos as $codigo) {
            $this->respuestas[] = ['codigo' => $codigo, 'texto' => 'respuesta de prueba'];
        }
    }

    public function leerRespuesta(): array
    {
        return array_shift($this->respuestas) ?? ['codigo' => 421, 'texto' => 'sin respuesta'];
    }

    public function enviarComando(string $linea): void
    {
        $this->comandos[] = $linea;
    }

    public function enviarDatos(string $mensaje): void
    {
        $this->datos = $mensaje;
    }

    public function activarCifrado(): bool
    {
        return $this->aceptaCifrado;
    }

    public function cerrar(): void
    {
        $this->cerrado = true;
    }
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

echo "Formulario de contacto: mensajes de error\n";
$mensajes = ContactForm::mensajesDeError(['nom', 'privadesa']);
comprobar('hay un mensaje por cada campo con error', array_keys($mensajes) === ['nom', 'privadesa']);
comprobar('los mensajes no están vacíos', $mensajes['nom'] !== '' && $mensajes['privadesa'] !== '');
comprobar('sin errores no hay mensajes', ContactForm::mensajesDeError([]) === []);

echo "Seguridad del envío: token\n";
$sesion = [];
$token = ContactSecurity::obtenerToken($sesion, 100.0);
comprobar('el token son 64 caracteres hexadecimales', preg_match('/^[0-9a-f]{64}$/', $token) === 1);
comprobar('mientras no se rota se devuelve el mismo', ContactSecurity::obtenerToken($sesion, 105.0) === $token);
comprobar('el token de la sesión es válido', ContactSecurity::esTokenValido($sesion, $token) === true);
comprobar('otro token no es válido', ContactSecurity::esTokenValido($sesion, str_repeat('a', 64)) === false);
comprobar('un token vacío no es válido', ContactSecurity::esTokenValido($sesion, '') === false);
comprobar('un token que no es texto no es válido', ContactSecurity::esTokenValido($sesion, ['x']) === false
    && ContactSecurity::esTokenValido($sesion, null) === false);
comprobar('sin token en la sesión nada es válido', ContactSecurity::esTokenValido([], $token) === false);
$tokenNuevo = ContactSecurity::emitirToken($sesion, 106.0);
comprobar('rotar cambia el token', $tokenNuevo !== $token);
comprobar('el token anterior deja de valer', ContactSecurity::esTokenValido($sesion, $token) === false);

echo "Seguridad del envío: tiempo mínimo y frecuencia\n";
$sesion = [];
ContactSecurity::obtenerToken($sesion, 100.0);
comprobar('un segundo después de pedir el token es demasiado rápido', ContactSecurity::llegoDemasiadoRapido($sesion, 101.0) === true);
comprobar('cumplido el mínimo ya vale', ContactSecurity::llegoDemasiadoRapido($sesion, 100.0 + ContactSecurity::SEGUNDOS_MINIMOS_DE_RELLENO) === false);
comprobar('sin token emitido no cuenta como rápido', ContactSecurity::llegoDemasiadoRapido([], 100.0) === false);
$sesion = [];
comprobar('sin envíos previos no hay límite', ContactSecurity::superaElLimiteDeFrecuencia($sesion, 1000) === false);
ContactSecurity::marcarEnviado($sesion, 1000);
comprobar('poco después de enviar se supera el límite', ContactSecurity::superaElLimiteDeFrecuencia($sesion, 1005) === true);
comprobar('pasado el intervalo ya no', ContactSecurity::superaElLimiteDeFrecuencia($sesion, 1000 + ContactSecurity::SEGUNDOS_ENTRE_ENVIOS) === false);

echo "Seguridad del envío: mismo origen\n";
comprobar('el Origin igual al Host es válido', ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'erd.test', 'HTTP_ORIGIN' => 'https://erd.test']) === true);
comprobar('otro Origin no es válido', ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'erd.test', 'HTTP_ORIGIN' => 'https://evil.test']) === false);
comprobar('un Origin «null» no es válido', ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'erd.test', 'HTTP_ORIGIN' => 'null']) === false);
comprobar('un dominio que empieza igual no engaña', ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'erd.test', 'HTTP_ORIGIN' => 'https://erd.test.evil.test']) === false);
comprobar('sin Origin se usa el Referer', ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'erd.test', 'HTTP_REFERER' => 'https://erd.test/serveis/']) === true);
comprobar('un Referer de otro sitio no es válido', ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'erd.test', 'HTTP_REFERER' => 'https://evil.test/']) === false);
comprobar('sin Origin ni Referer no es válido', ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'erd.test']) === false);
comprobar('el puerto cuenta', ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'localhost:8000', 'HTTP_ORIGIN' => 'http://localhost:8000']) === true
    && ContactSecurity::esMismoOrigen(['HTTP_HOST' => 'localhost:8000', 'HTTP_ORIGIN' => 'http://localhost:9000']) === false);

echo "SMTP: configuración\n";
function limpiarSmtp(): void
{
    foreach (['HOST', 'PORT', 'SECURE', 'USER', 'PASSWORD'] as $clave) {
        putenv(Config::PREFIJO . 'SMTP_' . $clave);
    }
}

reiniciarEstado();
limpiarSmtp();
$sinSmtp = crearDirectorioTemporal();
Env::cargar($sinSmtp);
comprobar('sin host no está activo', SmtpMailer::estaActivo() === false);
putenv("{$prefijo}SMTP_HOST=smtp.erd.test");
putenv("{$prefijo}SMTP_USER=noreply@erd.test");
comprobar('con host está activo aunque falte algo', SmtpMailer::estaActivo() === true);
comprobar('si falta la contraseña los ajustes no son válidos', SmtpMailer::leerAjustes() === null);
putenv("{$prefijo}SMTP_PASSWORD=clave-secreta-prueba");
$ajustes = SmtpMailer::leerAjustes();
comprobar('por defecto: SSL en el puerto 465', $ajustes !== null && $ajustes['seguridad'] === 'ssl' && $ajustes['puerto'] === 465);
comprobar('se leen host, usuario y contraseña', $ajustes !== null && $ajustes['host'] === 'smtp.erd.test'
    && $ajustes['usuario'] === 'noreply@erd.test' && $ajustes['clave'] === 'clave-secreta-prueba');
putenv("{$prefijo}SMTP_SECURE=tls");
comprobar('con STARTTLS el puerto por defecto es 587', (SmtpMailer::leerAjustes()['puerto'] ?? null) === 587);
putenv("{$prefijo}SMTP_PORT=2525");
comprobar('un puerto explícito manda', (SmtpMailer::leerAjustes()['puerto'] ?? null) === 2525);
putenv("{$prefijo}SMTP_PORT=abc");
comprobar('un puerto que no es número es inválido', SmtpMailer::leerAjustes() === null);
putenv("{$prefijo}SMTP_PORT");
putenv("{$prefijo}SMTP_SECURE=none");
comprobar('sin cifrado no se admite', SmtpMailer::leerAjustes() === null);
limpiarSmtp();
borrarDirectorio($sinSmtp);

echo "SMTP: diálogo con el servidor\n";
$datosCorreo = ContactForm::validar(['nom' => 'Anna Puig', 'correu' => 'anna@example.test', 'missatge' => "Hola\n.punto al inicio", 'privadesa' => 'on'])['datos'];
$correoSmtp = ContactForm::construirCorreo($datosCorreo, 'to@example.test', 'from@example.test');
$claveSmtp = 'clave-secreta-prueba';

$transporte = new TransporteFalso([220, 250, 334, 334, 235, 250, 250, 354, 250, 221]);
$enviado = SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', false, 'from@example.test', $correoSmtp);
comprobar('un diálogo correcto devuelve true', $enviado === true);
comprobar('empieza con EHLO', str_starts_with($transporte->comandos[0] ?? '', 'EHLO '));
comprobar('autentica con AUTH LOGIN y credenciales en base64', in_array('AUTH LOGIN', $transporte->comandos, true)
    && in_array(base64_encode('usuario@erd.test'), $transporte->comandos, true)
    && in_array(base64_encode($claveSmtp), $transporte->comandos, true));
comprobar('la contraseña nunca va en claro', !str_contains(implode("\n", $transporte->comandos), $claveSmtp) && !str_contains((string) $transporte->datos, $claveSmtp));
comprobar('indica remitente y destinatario', in_array('MAIL FROM:<from@example.test>', $transporte->comandos, true)
    && in_array('RCPT TO:<to@example.test>', $transporte->comandos, true));
comprobar('termina con QUIT y cierra la conexión', end($transporte->comandos) === 'QUIT' && $transporte->cerrado === true);
$mensaje = (string) $transporte->datos;
comprobar('el mensaje lleva las cabeceras obligatorias', str_contains($mensaje, "From: from@example.test\r\n")
    && str_contains($mensaje, "To: to@example.test\r\n") && str_contains($mensaje, "Subject: =?UTF-8?B?")
    && str_contains($mensaje, "\r\nDate: ") && str_contains($mensaje, "\r\nMessage-ID: <")
    && str_contains($mensaje, "Reply-To: anna@example.test\r\n") && str_contains($mensaje, "Content-Transfer-Encoding: base64\r\n"));
comprobar('todas las líneas acaban en CRLF', preg_match('/(?<!\r)\n/', $mensaje) === 0);
$cuerpoCodificado = substr($mensaje, (int) strpos($mensaje, "\r\n\r\n") + 4);
comprobar('el cuerpo va en base64 y se recupera tal cual', base64_decode(str_replace("\r\n", '', $cuerpoCodificado), true) === $correoSmtp['cuerpo']);
comprobar('ninguna línea del cuerpo empieza por punto', preg_match('/^\./m', $cuerpoCodificado) === 0);

$transporte = new TransporteFalso([220, 250, 220, 250, 334, 334, 235, 250, 250, 354, 250, 221]);
$enviado = SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', true, 'from@example.test', $correoSmtp);
$ordenStartTls = array_keys(array_filter($transporte->comandos, static fn (string $c): bool => $c === 'STARTTLS' || $c === 'AUTH LOGIN'));
comprobar('con STARTTLS: cifra antes de autenticar', $enviado === true && count($ordenStartTls) === 2
    && $transporte->comandos[$ordenStartTls[0]] === 'STARTTLS');

$transporte = new TransporteFalso([220, 250, 220, 250], false);
comprobar('si el cifrado no se puede activar, falla sin enviar la contraseña', SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', true, 'from@example.test', $correoSmtp) === false
    && !in_array('AUTH LOGIN', $transporte->comandos, true) && $transporte->cerrado === true);

$transporte = new TransporteFalso([220, 250, 454]);
comprobar('si el servidor rechaza STARTTLS, falla sin autenticar', SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', true, 'from@example.test', $correoSmtp) === false
    && !in_array('AUTH LOGIN', $transporte->comandos, true));

$transporte = new TransporteFalso([220, 250, 334, 334, 535]);
comprobar('si la autenticación falla, no se envía nada', SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', false, 'from@example.test', $correoSmtp) === false
    && $transporte->datos === null && $transporte->cerrado === true);

$transporte = new TransporteFalso([220, 250, 334, 334, 235, 250, 550]);
comprobar('si rechaza al destinatario, falla', SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', false, 'from@example.test', $correoSmtp) === false
    && $transporte->datos === null);

$transporte = new TransporteFalso([554]);
comprobar('si el saludo no es 220, falla', SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', false, 'from@example.test', $correoSmtp) === false);

$conSalto = ['cabeceras' => ["X-Prueba: a\r\nBcc: espia@example.test"] + $correoSmtp['cabeceras']] + $correoSmtp;
$transporte = new TransporteFalso([220, 250, 334, 334, 235, 250, 250, 354, 250, 221]);
comprobar('una cabecera con salto de línea se rechaza antes de hablar con el servidor', SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', false, 'from@example.test', $conSalto) === false
    && $transporte->comandos === []);
$transporte = new TransporteFalso([220, 250, 334, 334, 235, 250, 250, 354, 250, 221]);
comprobar('un remitente con formato raro se rechaza', SmtpMailer::enviar($transporte, 'usuario@erd.test', $claveSmtp, 'erd.test', false, "from@example.test>\r\nRCPT TO:<x@x.test", $correoSmtp) === false
    && $transporte->comandos === []);

echo "reCAPTCHA: configuración\n";
reiniciarEstado();
$sinClaves = crearDirectorioTemporal();
Env::cargar($sinClaves);
comprobar('sin claves está desactivado', Recaptcha::estaActivo() === false && Recaptcha::claveDelSitio() === null);
putenv("{$prefijo}RECAPTCHA_SITE_KEY=sitio-prueba");
comprobar('con solo la clave del sitio sigue desactivado', Recaptcha::estaActivo() === false);
putenv("{$prefijo}RECAPTCHA_SECRET=secreta-prueba");
comprobar('con las dos claves está activo', Recaptcha::estaActivo() === true && Recaptcha::claveDelSitio() === 'sitio-prueba');
putenv("{$prefijo}RECAPTCHA_SITE_KEY");
putenv("{$prefijo}RECAPTCHA_SECRET");
borrarDirectorio($sinClaves);

echo "reCAPTCHA: veredicto\n";
$bueno = ['success' => true, 'action' => Recaptcha::ACCION, 'hostname' => 'erd.test', 'score' => 0.9];
comprobar('una respuesta buena es ok', Recaptcha::interpretar($bueno, 'erd.test') === 'ok');
comprobar('el puerto del Host no cuenta', Recaptcha::interpretar($bueno, 'erd.test:8000') === 'ok');
comprobar('sin respuesta de Google es inaccesible', Recaptcha::interpretar(null, 'erd.test') === 'inaccesible');
comprobar('puntuación baja se rechaza', Recaptcha::interpretar(['score' => 0.1] + $bueno, 'erd.test') === 'rechazado');
comprobar('sin puntuación se rechaza', Recaptcha::interpretar(array_diff_key($bueno, ['score' => 1]), 'erd.test') === 'rechazado');
comprobar('otra acción se rechaza', Recaptcha::interpretar(['action' => 'otra'] + $bueno, 'erd.test') === 'rechazado');
comprobar('otro dominio se rechaza', Recaptcha::interpretar(['hostname' => 'evil.test'] + $bueno, 'erd.test') === 'rechazado');
comprobar('success falso se rechaza', Recaptcha::interpretar(['success' => false] + $bueno, 'erd.test') === 'rechazado');
$consultas = 0;
$consultar = static function (string $respuesta) use (&$consultas, $bueno): ?array {
    $consultas++;
    return $bueno;
};
comprobar('una respuesta vacía se rechaza sin consultar a Google', Recaptcha::verificar('', 'erd.test', $consultar) === 'rechazado' && $consultas === 0);
comprobar('una respuesta enorme se rechaza sin consultar a Google', Recaptcha::verificar(str_repeat('a', 4097), 'erd.test', $consultar) === 'rechazado' && $consultas === 0);
comprobar('una respuesta normal se consulta y pasa', Recaptcha::verificar('abc', 'erd.test', $consultar) === 'ok' && $consultas === 1);

echo "Gestor del envío\n";
function crearServidor(string $origen = 'https://erd.test'): array
{
    return ['HTTP_HOST' => 'erd.test', 'HTTP_ORIGIN' => $origen];
}

function crearEntrada(string $token, array $cambios = []): array
{
    return $cambios + ['nom' => 'Anna Puig', 'correu' => 'anna@example.test', 'missatge' => 'Hola', 'privadesa' => 'on', 'csrf_token' => $token];
}

function procesarEnvio(array $entrada, array $servidor, array &$sesion, float $ahora, callable $enviarCorreo, ?callable $verificarRecaptcha = null): array
{
    return ContactHandler::procesar($entrada, $servidor, $sesion, $ahora, 'to@example.test', 'from@example.test', $enviarCorreo, $verificarRecaptcha);
}

$enviados = [];
$enviarBien = static function (array $correo) use (&$enviados): bool {
    $enviados[] = $correo;
    return true;
};
$enviarMal = static fn (array $correo): bool => false;

$sesion = [];
$token = ContactSecurity::obtenerToken($sesion, 100.0);
$respuesta = procesarEnvio(crearEntrada($token), crearServidor(), $sesion, 110.0, $enviarBien);
comprobar('un envío correcto responde 200', $respuesta['codigo'] === 200 && $respuesta['cuerpo']['ok'] === true);
comprobar('se envía un correo al destinatario', count($enviados) === 1 && $enviados[0]['para'] === 'to@example.test');
comprobar('se devuelve un token nuevo', is_string($respuesta['cuerpo']['token']) && $respuesta['cuerpo']['token'] !== $token);
comprobar('el token nuevo es el de la sesión', ContactSecurity::esTokenValido($sesion, $respuesta['cuerpo']['token']));
$tokenSiguiente = $respuesta['cuerpo']['token'];
$seguido = procesarEnvio(crearEntrada($tokenSiguiente), crearServidor(), $sesion, 115.0, $enviarBien);
comprobar('un segundo envío seguido se frena con 429', $seguido['codigo'] === 429 && count($enviados) === 1);
$despues = procesarEnvio(crearEntrada($tokenSiguiente), crearServidor(), $sesion, 125.0, $enviarBien);
comprobar('pasado el intervalo se puede volver a enviar', $despues['codigo'] === 200 && count($enviados) === 2);

$enviados = [];
$sesion = [];
$token = ContactSecurity::obtenerToken($sesion, 100.0);
$ajeno = procesarEnvio(crearEntrada($token), crearServidor('https://evil.test'), $sesion, 110.0, $enviarBien);
comprobar('un origen ajeno se rechaza con 403', $ajeno['codigo'] === 403 && $enviados === []);
$sinToken = procesarEnvio(crearEntrada('falso'), crearServidor(), $sesion, 110.0, $enviarBien);
comprobar('un token falso se rechaza con 403', $sinToken['codigo'] === 403 && $enviados === []);
$entradaSinToken = crearEntrada($token);
unset($entradaSinToken['csrf_token']);
comprobar('sin token se rechaza con 403', procesarEnvio($entradaSinToken, crearServidor(), $sesion, 110.0, $enviarBien)['codigo'] === 403);
$robot = procesarEnvio(crearEntrada($token, ['web' => 'http://spam.test']), crearServidor(), $sesion, 110.0, $enviarBien);
comprobar('el campo trampa responde como si fuese bien, sin enviar', $robot['codigo'] === 200 && $enviados === []);
$rapido = procesarEnvio(crearEntrada($token), crearServidor(), $sesion, 101.0, $enviarBien);
comprobar('enviar demasiado rápido se frena con 429', $rapido['codigo'] === 429 && $enviados === []);

$invalido = procesarEnvio(crearEntrada($token, ['nom' => 'XSSNOMBRE', 'correu' => 'no-es-un-correo-QWERTY']), crearServidor(), $sesion, 110.0, $enviarBien);
comprobar('datos inválidos responden 422 con el campo', $invalido['codigo'] === 422 && isset($invalido['cuerpo']['errors']['correu']) && $enviados === []);
$cuerpoJson = (string) json_encode($invalido['cuerpo']);
comprobar('la respuesta nunca repite lo que escribió el visitante', !str_contains($cuerpoJson, 'QWERTY') && !str_contains($cuerpoJson, 'XSSNOMBRE'));
$corregido = procesarEnvio(crearEntrada($token), crearServidor(), $sesion, 111.0, $enviarBien);
comprobar('un error de validación no activa el límite de frecuencia', $corregido['codigo'] === 200 && count($enviados) === 1);

$sesion = [];
$token = ContactSecurity::obtenerToken($sesion, 100.0);
$falla = procesarEnvio(crearEntrada($token), crearServidor(), $sesion, 110.0, $enviarMal);
comprobar('si el correo falla responde 500', $falla['codigo'] === 500 && $falla['cuerpo']['ok'] === false);
$reintento = procesarEnvio(crearEntrada($token), crearServidor(), $sesion, 111.0, $enviarBien);
comprobar('un envío fallido no activa el límite de frecuencia', $reintento['codigo'] === 200);

echo "Gestor del envío con reCAPTCHA\n";
$enviados = [];
$sesion = [];
$token = ContactSecurity::obtenerToken($sesion, 100.0);
$recibido = null;
$recaptchaBueno = static function (string $respuesta) use (&$recibido): string {
    $recibido = $respuesta;
    return 'ok';
};
$conRecaptcha = procesarEnvio(crearEntrada($token, ['recaptcha_response' => 'respuesta-google']), crearServidor(), $sesion, 110.0, $enviarBien, $recaptchaBueno);
comprobar('con reCAPTCHA correcto se envía', $conRecaptcha['codigo'] === 200 && count($enviados) === 1);
comprobar('se verifica la respuesta que mandó el navegador', $recibido === 'respuesta-google');

$enviados = [];
$sesion = [];
$token = ContactSecurity::obtenerToken($sesion, 100.0);
$recaptchaMalo = static fn (string $respuesta): string => 'rechazado';
$rechazado = procesarEnvio(crearEntrada($token), crearServidor(), $sesion, 110.0, $enviarBien, $recaptchaMalo);
comprobar('un reCAPTCHA rechazado responde 403 sin enviar', $rechazado['codigo'] === 403 && $enviados === []);
$recaptchaCaido = static fn (string $respuesta): string => 'inaccesible';
$caido = procesarEnvio(crearEntrada($token), crearServidor(), $sesion, 110.0, $enviarBien, $recaptchaCaido);
comprobar('si Google no responde, 503 sin enviar', $caido['codigo'] === 503 && $enviados === []);
$sinRespuesta = procesarEnvio(crearEntrada($token), crearServidor(), $sesion, 110.0, $enviarBien, static fn (string $respuesta): string => $respuesta === '' ? 'rechazado' : 'ok');
comprobar('sin respuesta del navegador se verifica una cadena vacía', $sinRespuesta['codigo'] === 403);

echo "Cliente del CMS\n";
$carpetaDelCms = crearDirectorioTemporal();
$archivoDeToken = $carpetaDelCms . '/' . CmsClient::NOMBRE_DE_LA_CACHE;
$urlDelToken = 'https://cms.test/api/public/token';
$urlDeLaSeccion = 'https://cms.test/api/projectes_erd';
$llamadasAlCms = [];
$respuestasDelCms = [];

// Servidor del CMS falso: devuelve en orden las respuestas preparadas para cada URL y apunta cada llamada.
$cmsFalso = static function (string $url, array $cabeceras) use (&$llamadasAlCms, &$respuestasDelCms): array {
    $llamadasAlCms[] = ['url' => $url, 'cabeceras' => $cabeceras];
    $cola = $respuestasDelCms[$url] ?? [];
    $respuesta = array_shift($cola) ?? ['codigo' => 0, 'cuerpo' => ''];
    $respuestasDelCms[$url] = $cola;
    return $respuesta;
};
$crearClienteDelCms = static fn (): CmsClient => new CmsClient('https://cms.test', 'https://erd.cat', $carpetaDelCms, $cmsFalso);
$reiniciarCms = static function () use (&$llamadasAlCms, &$respuestasDelCms, $archivoDeToken): void {
    $llamadasAlCms = [];
    $respuestasDelCms = [];
    if (is_file($archivoDeToken)) {
        unlink($archivoDeToken);
    }
};

function respuestaJson(int $codigo, array $cuerpo): array
{
    return ['codigo' => $codigo, 'cuerpo' => (string) json_encode($cuerpo)];
}

function contarLlamadas(array $llamadas, string $url): int
{
    return count(array_filter($llamadas, static fn (array $llamada): bool => $llamada['url'] === $url));
}

function cabeceraEnviada(array $llamada, string $cabecera): bool
{
    return in_array($cabecera, $llamada['cabeceras'], true);
}

$reiniciarCms();
$respuestasDelCms[$urlDelToken] = [respuestaJson(200, ['token' => 'TOKEN-UNO'])];
$respuestasDelCms[$urlDeLaSeccion] = [respuestaJson(200, ['data' => [['id' => 1]]])];
$entradasLeidas = $crearClienteDelCms()->leerSeccion('projectes_erd');
comprobar('lee las entradas de una sección', $entradasLeidas === [['id' => 1]]);
comprobar('el token se pide con el Origin de la web', $llamadasAlCms[0]['url'] === $urlDelToken && cabeceraEnviada($llamadasAlCms[0], 'Origin: https://erd.cat'));
comprobar('la sección se pide con el token y el Origin', cabeceraEnviada($llamadasAlCms[1], 'Authorization: Bearer TOKEN-UNO') && cabeceraEnviada($llamadasAlCms[1], 'Origin: https://erd.cat'));

$llamadasAlCms = [];
$respuestasDelCms[$urlDeLaSeccion] = [respuestaJson(200, ['data' => []])];
$crearClienteDelCms()->leerSeccion('projectes_erd');
comprobar('el token guardado se reutiliza sin volver a pedirlo', contarLlamadas($llamadasAlCms, $urlDelToken) === 0);

$llamadasAlCms = [];
touch($archivoDeToken, time() - CmsClient::SEGUNDOS_DE_CACHE - 60);
clearstatcache(); // dentro de un mismo proceso PHP recuerda la fecha antigua del archivo
$respuestasDelCms[$urlDelToken] = [respuestaJson(200, ['token' => 'TOKEN-DOS'])];
$respuestasDelCms[$urlDeLaSeccion] = [respuestaJson(200, ['data' => []])];
$crearClienteDelCms()->leerSeccion('projectes_erd');
comprobar('un token caducado se vuelve a pedir', contarLlamadas($llamadasAlCms, $urlDelToken) === 1);

$reiniciarCms();
file_put_contents($archivoDeToken, 'TOKEN-VIEJO');
$respuestasDelCms[$urlDelToken] = [respuestaJson(200, ['token' => 'TOKEN-NUEVO'])];
$respuestasDelCms[$urlDeLaSeccion] = [respuestaJson(401, ['error' => 'caducado']), respuestaJson(200, ['data' => [['id' => 7]]])];
$trasReintento = $crearClienteDelCms()->leerSeccion('projectes_erd');
comprobar('con un 401 pide un token nuevo y reintenta una vez', $trasReintento === [['id' => 7]] && contarLlamadas($llamadasAlCms, $urlDelToken) === 1);
comprobar('el reintento usa el token nuevo', cabeceraEnviada($llamadasAlCms[2], 'Authorization: Bearer TOKEN-NUEVO'));
comprobar('el token nuevo queda guardado', trim((string) file_get_contents($archivoDeToken)) === 'TOKEN-NUEVO');

$reiniciarCms();
file_put_contents($archivoDeToken, 'TOKEN-VIEJO');
$respuestasDelCms[$urlDelToken] = [respuestaJson(200, ['token' => 'TOKEN-NUEVO'])];
$respuestasDelCms[$urlDeLaSeccion] = [respuestaJson(401, []), respuestaJson(401, [])];
comprobar('si el reintento también da 401, devuelve null', $crearClienteDelCms()->leerSeccion('projectes_erd') === null);

$reiniciarCms();
$respuestasDelCms[$urlDelToken] = [respuestaJson(403, ['error' => 'Domini no autoritzat'])];
comprobar('si el dominio no está autorizado, devuelve null sin pedir la sección', $crearClienteDelCms()->leerSeccion('projectes_erd') === null && contarLlamadas($llamadasAlCms, $urlDeLaSeccion) === 0);

$reiniciarCms();
$respuestasDelCms[$urlDelToken] = [['codigo' => 0, 'cuerpo' => '']];
comprobar('si el CMS no responde al pedir el token, devuelve null', $crearClienteDelCms()->leerSeccion('projectes_erd') === null);

$reiniciarCms();
$respuestasDelCms[$urlDelToken] = [respuestaJson(200, ['token' => 'T'])];
$respuestasDelCms[$urlDeLaSeccion] = [respuestaJson(500, [])];
comprobar('un error del CMS devuelve null', $crearClienteDelCms()->leerSeccion('projectes_erd') === null);

$reiniciarCms();
$respuestasDelCms[$urlDelToken] = [respuestaJson(200, ['token' => 'T'])];
$respuestasDelCms[$urlDeLaSeccion] = [['codigo' => 200, 'cuerpo' => '<html>no es json']];
comprobar('una respuesta que no es JSON devuelve null', $crearClienteDelCms()->leerSeccion('projectes_erd') === null);

$reiniciarCms();
$respuestasDelCms[$urlDelToken] = [respuestaJson(200, ['token' => 'T'])];
$respuestasDelCms[$urlDeLaSeccion] = [respuestaJson(200, ['otra' => 'cosa'])];
comprobar('una respuesta sin «data» devuelve null', $crearClienteDelCms()->leerSeccion('projectes_erd') === null);

$reiniciarCms();
foreach (['', '../admin', 'a/b', 'Projectes ERD', 'a?b=1'] as $slugRaro) {
    $crearClienteDelCms()->leerSeccion($slugRaro);
}
comprobar('un slug con caracteres raros no llega a pedirse al CMS', $llamadasAlCms === []);
$reiniciarCms();
borrarDirectorio($carpetaDelCms);

echo "Proyectos del CMS\n";
$cms = 'https://cms.test';
$entradaCompleta = [
    'id' => 77,
    'status' => 'published',
    'tipus' => 'Logística',
    'titol' => 'VoraData',
    'subtitol' => 'LA IA a Girona',
    'descripcio_breu' => 'Resum del projecte',
    'imatges' => [['url' => '/uploads/a.png', 'formats' => ['small' => ['url' => '/uploads/a-small.png']]]],
];
$proyectos = CmsProjectes::transformar([$entradaCompleta], $cms);
comprobar('una entrada completa se convierte en una tarjeta', $proyectos === [[
    'id' => 77,
    'sector' => 'Logística',
    'titol' => 'VoraData',
    'resum' => 'Resum del projecte',
    'imatge' => 'https://cms.test/uploads/a-small.png',
]]);

$sinFormato = CmsProjectes::transformar([array_merge($entradaCompleta, ['imatges' => [['url' => '/uploads/b.png']]])], $cms);
comprobar('sin formato pequeño se usa la imagen original', $sinFormato[0]['imatge'] === 'https://cms.test/uploads/b.png');
$imagenAbsoluta = CmsProjectes::transformar([array_merge($entradaCompleta, ['imatges' => [['url' => 'https://cdn.test/c.png']]])], $cms);
comprobar('una imagen con dirección completa se respeta', $imagenAbsoluta[0]['imatge'] === 'https://cdn.test/c.png');
$imagenPeligrosa = CmsProjectes::transformar([array_merge($entradaCompleta, ['imatges' => [['url' => 'javascript:alert(1)']]])], $cms);
comprobar('una dirección que no es http ni ruta del CMS se descarta', $imagenPeligrosa[0]['imatge'] === null);
$sinImagen = CmsProjectes::transformar([array_merge($entradaCompleta, ['imatges' => []])], $cms);
comprobar('sin imágenes la tarjeta no lleva imagen', $sinImagen[0]['imatge'] === null);
$sinCampoDeImagenes = $entradaCompleta;
unset($sinCampoDeImagenes['imatges']);
comprobar('sin el campo de imágenes tampoco', CmsProjectes::transformar([$sinCampoDeImagenes], $cms)[0]['imatge'] === null);

$sinTitulo = CmsProjectes::transformar([array_merge($entradaCompleta, ['titol' => '  '])], $cms);
comprobar('una entrada sin título no se muestra', $sinTitulo === []);
comprobar('lo que no es una entrada se ignora', CmsProjectes::transformar(['texto', 5, null, $entradaCompleta], $cms) !== [] && count(CmsProjectes::transformar(['texto', 5, null, $entradaCompleta], $cms)) === 1);
$camposRaros = CmsProjectes::transformar([array_merge($entradaCompleta, ['tipus' => ['x'], 'descripcio_breu' => 12])], $cms);
comprobar('un campo que no es texto queda vacío', $camposRaros[0]['sector'] === '' && $camposRaros[0]['resum'] === '');
$conEspacios = CmsProjectes::transformar([array_merge($entradaCompleta, ['titol' => '  VoraData  '])], $cms);
comprobar('los textos se recortan', $conEspacios[0]['titol'] === 'VoraData');
comprobar('la dirección del CMS puede acabar en barra', CmsProjectes::transformar([$entradaCompleta], 'https://cms.test/')[0]['imatge'] === 'https://cms.test/uploads/a-small.png');

echo "Detalle de un proyecto del CMS\n";
$entradaConDetalle = array_merge($entradaCompleta, [
    'el_repte' => 'Dades disperses',
    'que_vam_fer' => 'Ordenar-les',
    'el_resultat' => 'Tot a mà',
    'recuadre_1_numero' => '−40 %',
    'recuadre_1_text' => 'Menys temps',
    'recuadre_2_numero' => '+25 %',
    'recuadre_2_text' => 'Més marge',
    'recuadre_3_numero' => '6 mesos',
    'recuadre_3_text' => 'Durada',
    'imatges' => [
        ['url' => '/uploads/a.png', 'formats' => ['small' => ['url' => '/uploads/a-small.png']]],
        ['url' => '/uploads/b.png'],
    ],
]);
$otraEntrada = array_merge($entradaCompleta, ['id' => 5, 'titol' => 'Una altra']);

$detalle = CmsProjectes::detallar([$otraEntrada, $entradaConDetalle], 77, $cms);
comprobar('el detalle recoge todos los campos de la entrada pedida', $detalle === [
    'id' => 77,
    'sector' => 'Logística',
    'titol' => 'VoraData',
    'resum' => 'Resum del projecte',
    'repte' => 'Dades disperses',
    'que_vam_fer' => 'Ordenar-les',
    'resultat' => 'Tot a mà',
    'recuadres' => [
        ['valor' => '−40 %', 'text' => 'Menys temps'],
        ['valor' => '+25 %', 'text' => 'Més marge'],
        ['valor' => '6 mesos', 'text' => 'Durada'],
    ],
    'imatges' => ['https://cms.test/uploads/a.png', 'https://cms.test/uploads/b.png'],
]);
comprobar('un id que no existe devuelve null', CmsProjectes::detallar([$entradaConDetalle], 999, $cms) === null);
comprobar('sin entradas devuelve null', CmsProjectes::detallar([], 77, $cms) === null);
comprobar('una entrada sin título no tiene detalle', CmsProjectes::detallar([array_merge($entradaConDetalle, ['titol' => ''])], 77, $cms) === null);

$recuadroVacio = CmsProjectes::detallar([array_merge($entradaConDetalle, ['recuadre_2_numero' => '', 'recuadre_2_text' => ' '])], 77, $cms);
comprobar('un recuadro vacío se omite y se respeta el orden', $recuadroVacio['recuadres'] === [
    ['valor' => '−40 %', 'text' => 'Menys temps'],
    ['valor' => '6 mesos', 'text' => 'Durada'],
]);
$recuadroMedio = CmsProjectes::detallar([array_merge($entradaConDetalle, ['recuadre_2_numero' => '', 'recuadre_2_text' => 'Només text'])], 77, $cms);
comprobar('un recuadro con solo uno de los dos textos se conserva', count($recuadroMedio['recuadres']) === 3 && $recuadroMedio['recuadres'][1] === ['valor' => '', 'text' => 'Només text']);

$imagenesMezcladas = CmsProjectes::detallar([array_merge($entradaConDetalle, ['imatges' => [['url' => 'javascript:alert(1)'], ['url' => '/uploads/ok.png'], 'texto']])], 77, $cms);
comprobar('en el detalle se descartan las imágenes no válidas', $imagenesMezcladas['imatges'] === ['https://cms.test/uploads/ok.png']);
$sinGaleria = $entradaConDetalle;
unset($sinGaleria['imatges']);
comprobar('sin galería el detalle no lleva imágenes', CmsProjectes::detallar([$sinGaleria], 77, $cms)['imatges'] === []);
$sinRecuadros = CmsProjectes::detallar([array_merge($entradaCompleta, ['id' => 77])], 77, $cms);
comprobar('sin recuadros ni textos largos el detalle queda vacío en esos campos', $sinRecuadros['recuadres'] === [] && $sinRecuadros['repte'] === '' && $sinRecuadros['resultat'] === '');
$detalleRaro = CmsProjectes::detallar([array_merge($entradaConDetalle, ['el_repte' => ['x'], 'recuadre_1_numero' => 40])], 77, $cms);
comprobar('un campo que no es texto queda vacío también en el detalle', $detalleRaro['repte'] === '' && $detalleRaro['recuadres'][0]['valor'] === '');
$idComoTexto = CmsProjectes::detallar([array_merge($entradaConDetalle, ['id' => '77'])], 77, $cms);
comprobar('el id del CMS puede llegar como texto', $idComoTexto !== null && $idComoTexto['id'] === 77);

echo "Datos de la empresa\n";
$empresaCompleta = [
    'nombre' => 'ERD',
    'razon_social' => 'ERD Consultoria, S.L.',
    'nif' => 'B12345678',
    'direccion' => 'Carrer Major, 12',
    'codigo_postal' => '17100',
    'poblacion' => 'La Bisbal d\'Empordà',
    'provincia' => 'Girona',
    'telefono' => '+34 972 64 00 00',
    'correo' => 'info@erd.cat',
    'registro_mercantil' => 'Registre Mercantil de Girona, tom 1, foli 2, full GI-3',
    'dpd' => 'dpd@erd.cat',
];
$empresa = Empresa::componer($empresaCompleta);
comprobar('los datos completos se entregan tal cual', $empresa['nombre'] === 'ERD' && $empresa['nif'] === 'B12345678' && $empresa['poblacion'] === 'La Bisbal d\'Empordà' && $empresa['dpd'] === 'dpd@erd.cat');
comprobar('la dirección completa se compone en orden', $empresa['direccion_completa'] === 'Carrer Major, 12, 17100 La Bisbal d\'Empordà (Girona)');
comprobar('el teléfono lleva su enlace tel: sin espacios', $empresa['telefono'] === '+34 972 64 00 00' && $empresa['telefono_enlace'] === 'tel:+34972640000');
comprobar('el correo lleva su enlace mailto:', $empresa['correo_enlace'] === 'mailto:info@erd.cat');
comprobar('el horario se entrega como texto', Empresa::componer(['horario' => 'De dilluns a divendres, de 9 a 18 h'])['horario'] === 'De dilluns a divendres, de 9 a 18 h');
comprobar('sin datos no sale nada', Empresa::componer([]) === []);
comprobar('un valor vacío o solo de espacios cuenta como ausente', Empresa::componer(['nif' => '   ', 'nombre' => '']) === []);
comprobar('lo que no es texto se ignora', Empresa::componer(['nif' => ['x'], 'nombre' => 5, 'poblacion' => null]) === []);
comprobar('una clave desconocida no se entrega', !array_key_exists('secreto', Empresa::componer(['secreto' => 'x', 'nif' => 'B1'])));
comprobar('los saltos de línea se convierten en espacios', Empresa::componer(['direccion' => "Carrer\nMajor\r\n12"])['direccion'] === 'Carrer Major 12');
comprobar('un valor muy largo se recorta', mb_strlen(Empresa::componer(['nombre' => str_repeat('a', 500)])['nombre']) === Empresa::LONGITUD_MAXIMA);
comprobar('el HTML no se interpreta: se conserva como texto', Empresa::componer(['nombre' => '<b>ERD</b>'])['nombre'] === '<b>ERD</b>');

$soloCorreoMalo = Empresa::componer(['correo' => 'no-es-un-correo']);
comprobar('un correo inválido no se entrega ni con enlace', !isset($soloCorreoMalo['correo']) && !isset($soloCorreoMalo['correo_enlace']));
$soloTelefonoMalo = Empresa::componer(['telefono' => 'truca\'ns']);
comprobar('un teléfono sin cifras no se entrega ni con enlace', !isset($soloTelefonoMalo['telefono']) && !isset($soloTelefonoMalo['telefono_enlace']));
comprobar('un teléfono con puntos y paréntesis se limpia para el enlace', Empresa::componer(['telefono' => '(972) 64.00.00'])['telefono_enlace'] === 'tel:972640000');

comprobar('la dirección completa sin provincia', Empresa::componer(['direccion' => 'Carrer Major, 12', 'codigo_postal' => '17100', 'poblacion' => 'La Bisbal'])['direccion_completa'] === 'Carrer Major, 12, 17100 La Bisbal');
comprobar('la dirección completa sin calle', Empresa::componer(['poblacion' => 'La Bisbal d\'Empordà', 'provincia' => 'Girona'])['direccion_completa'] === 'La Bisbal d\'Empordà (Girona)');
comprobar('la provincia no se repite si coincide con la población', Empresa::componer(['poblacion' => 'Girona', 'provincia' => 'Girona'])['direccion_completa'] === 'Girona');
comprobar('solo con provincia no hay dirección completa', !isset(Empresa::componer(['provincia' => 'Girona'])['direccion_completa']));

putenv('ERD_EMPRESA_NIF=B99999999');
putenv('ERD_EMPRESA_CORREO=hola@erd.cat');
Env::reiniciar();
$desdeElEntorno = Empresa::leer();
comprobar('los datos se leen del .env con el prefijo ERD_EMPRESA_', ($desdeElEntorno['nif'] ?? null) === 'B99999999' && ($desdeElEntorno['correo_enlace'] ?? null) === 'mailto:hola@erd.cat');
putenv('ERD_EMPRESA_NIF');
putenv('ERD_EMPRESA_CORREO');
Env::reiniciar();
comprobar('sin variables definidas no sale nada del .env', Empresa::leer() === []);

reiniciarEstado();
borrarDirectorio($directorio);
borrarDirectorio($padre);

echo "\n{$total} comprobaciones, {$fallos} fallidas\n";
exit($fallos === 0 ? 0 : 1);
