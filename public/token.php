<?php

declare(strict_types=1);

// Entrega el token CSRF del formulario de contacto (y la clave pública del reCAPTCHA, si está activo).
// La web es HTML estático: no puede llevar el token incrustado, así que contact.js lo pide aquí.
ini_set('display_errors', '0');

$raiz = dirname(__DIR__);

require $raiz . '/src/Env.php';
require $raiz . '/src/Config.php';
require $raiz . '/src/ContactSecurity.php';
require $raiz . '/src/Recaptcha.php';
require $raiz . '/src/Http.php';

Env::cargar($raiz, dirname($raiz));

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    Http::responderJson(405, ['ok' => false, 'message' => 'Mètode no permès.']);
}

if (!ContactSecurity::esMismoOrigen($_SERVER)) {
    Http::responderJson(403, ['ok' => false, 'message' => 'Origen no permès.']);
}

ContactSecurity::iniciarSesion($_SERVER);

Http::responderJson(200, [
    'ok' => true,
    'token' => ContactSecurity::obtenerToken($_SESSION, microtime(true)),
    'recaptcha' => Recaptcha::estaActivo() ? Recaptcha::claveDelSitio() : null,
]);
