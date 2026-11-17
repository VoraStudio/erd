<?php

declare(strict_types=1);

/**
 * Verificación de Google reCAPTCHA v3 desde el servidor. Las claves viven en el .env:
 * sin las dos, el reCAPTCHA queda desactivado y el resto de protecciones siguen funcionando.
 * El veredicto es siempre uno de estos textos: «ok», «rechazado» o «inaccesible» (Google no respondió).
 */
final class Recaptcha
{
    public const ACCION = 'contacte';
    public const PUNTUACION_MINIMA = 0.5;
    public const LONGITUD_MAXIMA_RESPUESTA = 4096;

    private const URL_VERIFICACION = 'https://www.google.com/recaptcha/api/siteverify';

    public static function estaActivo(): bool
    {
        return self::claveDelSitio() !== null && Config::obtener('RECAPTCHA_SECRET') !== null;
    }

    /** La clave pública: es la que el navegador necesita para pedir su respuesta a Google. */
    public static function claveDelSitio(): ?string
    {
        return Config::obtener('RECAPTCHA_SITE_KEY');
    }

    /**
     * @param callable(string): ?array<string, mixed> $consultar envía la respuesta a Google y devuelve su JSON, o null si falla
     */
    public static function verificar(string $respuesta, string $anfitrion, callable $consultar): string
    {
        if ($respuesta === '' || strlen($respuesta) > self::LONGITUD_MAXIMA_RESPUESTA) {
            return 'rechazado';
        }

        return self::interpretar($consultar($respuesta), $anfitrion);
    }

    /** @param array<string, mixed>|null $resultado lo que contestó Google */
    public static function interpretar(?array $resultado, string $anfitrion): string
    {
        if ($resultado === null) {
            return 'inaccesible';
        }

        // El Host puede traer puerto (localhost:8000) y Google solo devuelve el nombre.
        $nombreDelAnfitrion = explode(':', $anfitrion)[0];

        $esValido = ($resultado['success'] ?? false) === true
            && ($resultado['action'] ?? null) === self::ACCION
            && ($resultado['hostname'] ?? null) === $nombreDelAnfitrion
            && is_numeric($resultado['score'] ?? null)
            && (float) $resultado['score'] >= self::PUNTUACION_MINIMA;

        return $esValido ? 'ok' : 'rechazado';
    }

    /** Llamada real a Google (no se prueba: necesita red). Devuelve null si algo falla. */
    public static function consultarGoogle(string $respuesta): ?array
    {
        $secreto = Config::obtener('RECAPTCHA_SECRET');
        if ($secreto === null || !function_exists('curl_init')) {
            return null;
        }

        $conexion = curl_init(self::URL_VERIFICACION);
        curl_setopt_array($conexion, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query(['secret' => $secreto, 'response' => $respuesta]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        $cuerpo = curl_exec($conexion);
        $estado = curl_getinfo($conexion, CURLINFO_RESPONSE_CODE);
        curl_close($conexion);

        if (!is_string($cuerpo) || $estado !== 200) {
            return null;
        }

        $decodificado = json_decode($cuerpo, true);

        return is_array($decodificado) ? $decodificado : null;
    }
}
