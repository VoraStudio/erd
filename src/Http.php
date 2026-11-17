<?php

declare(strict_types=1);

/** Respuestas HTTP de los endpoints públicos. */
final class Http
{
    /** @param array<string, mixed> $cuerpo */
    public static function responderJson(int $codigo, array $cuerpo): never
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=UTF-8');
        // El token y los resultados son de cada visitante: nada se guarda en caché.
        header('Cache-Control: no-store');

        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
