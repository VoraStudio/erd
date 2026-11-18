<?php

declare(strict_types=1);

// Entrega los datos públicos de la empresa (teléfono, correo, dirección y datos legales) que están en el .env.
// La web es HTML estático: no puede llevarlos escritos, así que un módulo JavaScript los pide aquí y los rellena.
// Todo el trabajo de lectura y limpieza está en src/Empresa.php. Los errores de PHP quedan en el registro del servidor.
ini_set('display_errors', '0');

// public/empresa/ cuelga de public/, que cuelga de la raíz del proyecto: src/ y el .env viven en la raíz.
$raiz = dirname(__DIR__, 2);

require $raiz . '/src/Env.php';
require $raiz . '/src/Config.php';
require $raiz . '/src/Empresa.php';
require $raiz . '/src/Http.php';

Env::cargar($raiz, dirname($raiz));

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    Http::responderJson(405, ['ok' => false, 'message' => 'Mètode no permès.']);
}

// Son datos públicos y iguales para todos: el navegador puede reutilizarlos un minuto. Poco tiempo a propósito:
// al cambiar el .env, la web tiene que mostrar el cambio enseguida.
// (object): sin ningún dato, PHP lo enviaría como una lista vacía [] en vez de un objeto {}.
Http::responderJson(200, ['ok' => true, 'empresa' => (object) Empresa::leer()], 'public, max-age=60');
