<?php

declare(strict_types=1);

// Entrega al navegador los artículos de Actualitat, que se leen del CMS desde el servidor:
// sin parámetros, las filas del listado; con ?id=76, el artículo completo.
// Todo el flujo está en src/CmsEndpoint.php. Los errores de PHP quedan en el registro del servidor.
ini_set('display_errors', '0');

// public/cms/ cuelga de public/, que cuelga de la raíz del proyecto: src/ y el .env viven en la raíz.
$raiz = dirname(__DIR__, 2);

require $raiz . '/src/Env.php';
require $raiz . '/src/Config.php';
require $raiz . '/src/CmsClient.php';
require $raiz . '/src/CmsCampos.php';
require $raiz . '/src/CmsArticulos.php';
require $raiz . '/src/CmsEndpoint.php';
require $raiz . '/src/Http.php';

Env::cargar($raiz, dirname($raiz));

CmsEndpoint::servir(
    CmsArticulos::SECCION,
    [CmsArticulos::class, 'transformar'],
    [CmsArticulos::class, 'detallar'],
    'articles',
    'article'
);
