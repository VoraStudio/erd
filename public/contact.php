<?php

declare(strict_types=1);

// Gestor del formulario de contacto: recibe el POST de contact.js y responde JSON.
// Toda la lógica está en src/ (ContactHandler); aquí solo se prepara el entorno y se usa.
// Los errores de PHP no se muestran al visitante: quedan en el registro del servidor.
ini_set('display_errors', '0');

// public/ cuelga de la raíz del proyecto: src/ y el .env viven un nivel por encima.
$raiz = dirname(__DIR__);

require $raiz . '/src/Env.php';
require $raiz . '/src/Config.php';
require $raiz . '/src/ContactForm.php';
require $raiz . '/src/ContactSecurity.php';
require $raiz . '/src/Recaptcha.php';
require $raiz . '/src/SmtpTransport.php';
require $raiz . '/src/SmtpSocket.php';
require $raiz . '/src/SmtpMailer.php';
require $raiz . '/src/ContactHandler.php';
require $raiz . '/src/Http.php';

Env::cargar($raiz, dirname($raiz));

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    Http::responderJson(405, ['ok' => false, 'message' => 'Aquesta adreça només accepta els enviaments del formulari.']);
}

$destinatario = Config::obtener('MAIL_RECIPIENT');
$remitente = Config::obtener('MAIL_SENDER');
if ($destinatario === null || $remitente === null) {
    Http::responderJson(503, ['ok' => false, 'message' => 'Ara mateix no podem rebre missatges. Torna-ho a provar més tard.']);
}

// Con ERD_SMTP_HOST en el .env el correo sale por SMTP autenticado; sin él, por mail() del hosting.
$enviarCorreo = SmtpMailer::estaActivo()
    ? static fn (array $correo): bool => SmtpMailer::enviarConConfiguracion($correo, $remitente)
    : static fn (array $correo): bool => mail(
        $correo['para'],
        $correo['asunto'],
        $correo['cuerpo'],
        implode("\r\n", $correo['cabeceras'])
    );

$verificarRecaptcha = null;
if (Recaptcha::estaActivo()) {
    $anfitrion = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $verificarRecaptcha = static fn (string $respuesta): string => Recaptcha::verificar(
        $respuesta,
        $anfitrion,
        static fn (string $r): ?array => Recaptcha::consultarGoogle($r)
    );
}

ContactSecurity::iniciarSesion($_SERVER);

$resultado = ContactHandler::procesar(
    $_POST,
    $_SERVER,
    $_SESSION,
    microtime(true),
    $destinatario,
    $remitente,
    $enviarCorreo,
    $verificarRecaptcha
);

Http::responderJson($resultado['codigo'], $resultado['cuerpo']);
