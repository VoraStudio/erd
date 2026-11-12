<?php

declare(strict_types=1);

// Gestor del formulario de contacto: recibe el POST, valida y envía el correo.
// Los errores de PHP no se muestran al visitante: quedan en el registro del servidor.
ini_set('display_errors', '0');

// public/ cuelga de la raíz del proyecto: src/ y el .env viven un nivel por encima.
$raiz = dirname(__DIR__);

require $raiz . '/src/Env.php';
require $raiz . '/src/Config.php';
require $raiz . '/src/ContactForm.php';

Env::cargar($raiz, dirname($raiz));

/** Pinta una página mínima con el resultado y termina. Los textos son fijos: nunca se repite lo que escribió el visitante. */
function responder(int $codigo, string $titulo, string $mensaje): never
{
    http_response_code($codigo);
    header('Content-Type: text/html; charset=UTF-8');

    $pagina = <<<'HTML'
<!DOCTYPE html>
<html lang="ca">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>{{titulo}}</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body class="bg-erd-flour font-body text-erd-cacao">
    <main>
        <h1 class="font-display text-title-1-mobile sm:text-title-1-tablet lg:text-title-1 text-erd-ink">{{titulo}}</h1>
        <p>{{mensaje}}</p>
        <p><a href="/">Tornar a l'inici</a></p>
    </main>
</body>
</html>
HTML;

    echo str_replace(
        ['{{titulo}}', '{{mensaje}}'],
        [htmlspecialchars($titulo, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), htmlspecialchars($mensaje, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')],
        $pagina
    );
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    responder(405, 'Mètode no permès', 'Aquesta adreça només accepta els enviaments del formulari.');
}

$entrada = $_POST;

// Un robot rellena el campo trampa: se responde como si todo fuese bien, pero no se envía nada.
if (ContactForm::esSpam($entrada)) {
    responder(200, 'Missatge enviat', 'Gràcies! Et respondrem aviat.');
}

$destinatario = Config::obtener('MAIL_RECIPIENT');
$remitente = Config::obtener('MAIL_SENDER');
if ($destinatario === null || $remitente === null) {
    responder(503, 'Servei no disponible', 'Ara mateix no podem rebre missatges. Torna-ho a provar més tard.');
}

$resultado = ContactForm::validar($entrada);
if ($resultado['errores'] !== []) {
    responder(422, 'Revisa el formulari', 'Hi ha dades que no són correctes. Torna enrere i revisa el formulari.');
}

$correo = ContactForm::construirCorreo($resultado['datos'], $destinatario, $remitente);
$seHaEnviado = mail($correo['para'], $correo['asunto'], $correo['cuerpo'], implode("\r\n", $correo['cabeceras']));
if (!$seHaEnviado) {
    responder(500, 'Error en l\'enviament', 'No hem pogut enviar el missatge. Torna-ho a provar més tard.');
}

responder(200, 'Missatge enviat', 'Gràcies! Et respondrem aviat.');
