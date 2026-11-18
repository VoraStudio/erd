<?php

declare(strict_types=1);

// Entrega al navegador los proyectos, que se leen del CMS desde el servidor:
// sin parámetros, las tarjetas del listado; con ?id=77, el detalle de ese proyecto.
// El token del CMS no sale nunca de aquí. Los errores de PHP quedan en el registro del servidor.
ini_set('display_errors', '0');

// public/cms/ cuelga de public/, que cuelga de la raíz del proyecto: src/ y el .env viven en la raíz.
$raiz = dirname(__DIR__, 2);

require $raiz . '/src/Env.php';
require $raiz . '/src/Config.php';
require $raiz . '/src/CmsClient.php';
require $raiz . '/src/CmsProjectes.php';
require $raiz . '/src/Http.php';

Env::cargar($raiz, dirname($raiz));

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    Http::responderJson(405, ['ok' => false, 'message' => 'Mètode no permès.']);
}

// Se valida el id antes de molestar al CMS: solo cifras, sin ceros a la izquierda y de un tamaño razonable.
$idPedido = $_GET['id'] ?? null;
$idDelProyecto = null;
if ($idPedido !== null) {
    if (!is_string($idPedido) || preg_match('/^[1-9][0-9]{0,9}$/', $idPedido) !== 1) {
        Http::responderJson(400, ['ok' => false, 'message' => 'Projecte no vàlid.']);
    }
    $idDelProyecto = (int) $idPedido;
}

// El CMS autoriza por dominio: aunque la web se pruebe en local, se presenta siempre con el dominio de ERD.
$urlDelCms = Config::obtener('CMS_URL') ?? 'https://voracms.voradata.cat';
$origen = Config::obtener('CMS_ORIGIN') ?? 'https://erd.cat';

$cliente = new CmsClient($urlDelCms, $origen, sys_get_temp_dir(), [CmsClient::class, 'consultarPorCurl']);
$entradas = $cliente->leerSeccion(CmsProjectes::SECCION);

if ($entradas === null) {
    error_log('CMS: no se han podido leer los proyectos (token, dominio no autorizado o el CMS no responde)');
    Http::responderJson(502, ['ok' => false, 'message' => 'No s\'han pogut carregar els projectes.']);
}

// Son datos públicos y iguales para todos: el navegador puede reutilizarlos un minuto.
$cacheDelNavegador = 'public, max-age=60';

if ($idDelProyecto === null) {
    Http::responderJson(
        200,
        ['ok' => true, 'projectes' => CmsProjectes::transformar($entradas, $urlDelCms)],
        $cacheDelNavegador
    );
}

// El detalle se busca entre las entradas publicadas del listado, así un borrador nunca se puede pedir por su id.
$detalle = CmsProjectes::detallar($entradas, $idDelProyecto, $urlDelCms);
if ($detalle === null) {
    Http::responderJson(404, ['ok' => false, 'message' => 'Projecte no trobat.']);
}

Http::responderJson(200, ['ok' => true, 'projecte' => $detalle], $cacheDelNavegador);
