<?php

declare(strict_types=1);

// Entrega al navegador los proyectos, que se leen del CMS desde el servidor:
// sin parámetros, las tarjetas del listado; con ?id=77, el detalle de ese proyecto.
// Todo el flujo está en src/CmsEndpoint.php. Los errores de PHP quedan en el registro del servidor.
ini_set('display_errors', '0');

// public/cms/ cuelga de public/, que cuelga de la raíz del proyecto: src/ y el .env viven en la raíz.
$raiz = dirname(__DIR__, 2);

require $raiz . '/src/Env.php';
require $raiz . '/src/Config.php';
require $raiz . '/src/CmsClient.php';
require $raiz . '/src/CmsCampos.php';
require $raiz . '/src/CmsProjectes.php';
require $raiz . '/src/CmsEndpoint.php';
require $raiz . '/src/Http.php';

Env::cargar($raiz, dirname($raiz));

CmsEndpoint::servir(
    CmsProjectes::SECCION,
    [CmsProjectes::class, 'transformar'],
    [CmsProjectes::class, 'detallar'],
    'projectes',
    'projecte'
);
