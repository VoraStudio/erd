<?php

declare(strict_types=1);

/**
 * Lo que tienen en común los endpoints que leen una sección del CMS: sin parámetros devuelven el listado
 * y con ?id=77 el detalle de esa entrada. Cada endpoint dice qué sección lee y cómo convierte sus entradas.
 * El token del CMS no sale nunca de aquí. Los errores de PHP quedan en el registro del servidor.
 */
final class CmsEndpoint
{
    private const URL_DEL_CMS_POR_DEFECTO = 'https://voracms.voradata.cat';
    private const ORIGEN_POR_DEFECTO = 'https://erd.cat';

    /** Son datos públicos y iguales para todos: el navegador puede reutilizarlos un minuto. */
    private const CACHE_DEL_NAVEGADOR = 'public, max-age=60';

    /**
     * @param callable(list<mixed>, string): array<mixed> $listar convierte las entradas del CMS en el listado
     * @param callable(list<mixed>, int, string): (array<mixed>|null) $detallar convierte una entrada en su detalle (null si no existe)
     */
    public static function servir(string $seccion, callable $listar, callable $detallar, string $claveDelListado, string $claveDelDetalle): never
    {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
            header('Allow: GET');
            Http::responderJson(405, ['ok' => false, 'message' => 'Mètode no permès.']);
        }

        // Se valida el id antes de molestar al CMS: solo cifras, sin ceros a la izquierda y de un tamaño razonable.
        $idPedido = $_GET['id'] ?? null;
        $idDeLaEntrada = null;
        if ($idPedido !== null) {
            if (!is_string($idPedido) || preg_match('/^[1-9][0-9]{0,9}$/', $idPedido) !== 1) {
                Http::responderJson(400, ['ok' => false, 'message' => 'Entrada no vàlida.']);
            }
            $idDeLaEntrada = (int) $idPedido;
        }

        // El CMS autoriza por dominio: aunque la web se pruebe en local, se presenta siempre con el dominio de ERD.
        $urlDelCms = Config::obtener('CMS_URL') ?? self::URL_DEL_CMS_POR_DEFECTO;
        $origen = Config::obtener('CMS_ORIGIN') ?? self::ORIGEN_POR_DEFECTO;

        $cliente = new CmsClient($urlDelCms, $origen, sys_get_temp_dir(), [CmsClient::class, 'consultarPorCurl']);
        $entradas = $cliente->leerSeccion($seccion);

        if ($entradas === null) {
            error_log('CMS: no se ha podido leer la sección ' . $seccion . ' (token, dominio no autorizado o el CMS no responde)');
            Http::responderJson(502, ['ok' => false, 'message' => 'No s\'ha pogut carregar el contingut.']);
        }

        if ($idDeLaEntrada === null) {
            Http::responderJson(200, ['ok' => true, $claveDelListado => $listar($entradas, $urlDelCms)], self::CACHE_DEL_NAVEGADOR);
        }

        // El detalle se busca entre las entradas publicadas del listado, así un borrador nunca se puede pedir por su id.
        $detalle = $detallar($entradas, $idDeLaEntrada, $urlDelCms);
        if ($detalle === null) {
            Http::responderJson(404, ['ok' => false, 'message' => 'No trobat.']);
        }

        Http::responderJson(200, ['ok' => true, $claveDelDetalle => $detalle], self::CACHE_DEL_NAVEGADOR);
    }
}
