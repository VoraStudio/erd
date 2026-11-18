<?php

declare(strict_types=1);

/** Respuestas HTTP de los endpoints públicos. */
final class Http
{
    /** @param array<string, mixed> $cuerpo */
    public static function responderJson(int $codigo, array $cuerpo, string $cache = 'no-store'): never
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=UTF-8');
        // Por defecto nada se guarda en caché: el token y los resultados son de cada visitante.
        header('Cache-Control: ' . $cache);

        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
