<?php

declare(strict_types=1);

/**
 * Seguridad del envío del formulario de contacto.
 * Los métodos reciben el array de la sesión y la hora como parámetros, no leen $_SESSION ni el reloj:
 * así se pueden probar sin servidor. Solo iniciarSesion() toca la sesión real.
 */
final class ContactSecurity
{
    public const SEGUNDOS_ENTRE_ENVIOS = 10;
    public const SEGUNDOS_MINIMOS_DE_RELLENO = 3;

    private const CLAVE_TOKEN = 'contacto_token';
    private const CLAVE_TOKEN_EMITIDO = 'contacto_token_emitido';
    private const CLAVE_ULTIMO_ENVIO = 'contacto_ultimo_envio';

    /** Cookie de sesión solo para el formulario: sin JavaScript, solo por HTTPS si el sitio lo es. */
    public static function iniciarSesion(array $servidor): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $https = (string) ($servidor['HTTPS'] ?? '');

        ini_set('session.use_strict_mode', '1');
        session_name('erd_contacto');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $https !== '' && strtolower($https) !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    /** Token CSRF: se guarda en la sesión y el formulario tiene que devolverlo en cada envío. */
    public static function emitirToken(array &$sesion, float $ahora): string
    {
        $sesion[self::CLAVE_TOKEN] = bin2hex(random_bytes(32));
        $sesion[self::CLAVE_TOKEN_EMITIDO] = $ahora;

        return $sesion[self::CLAVE_TOKEN];
    }

    /** Devuelve el token de la sesión; solo crea uno si todavía no hay. */
    public static function obtenerToken(array &$sesion, float $ahora): string
    {
        $actual = $sesion[self::CLAVE_TOKEN] ?? null;
        if (is_string($actual) && $actual !== '') {
            return $actual;
        }

        return self::emitirToken($sesion, $ahora);
    }

    public static function esTokenValido(array $sesion, mixed $recibido): bool
    {
        $esperado = $sesion[self::CLAVE_TOKEN] ?? null;
        if (!is_string($esperado) || !is_string($recibido) || $recibido === '') {
            return false;
        }

        // hash_equals compara en tiempo constante: no filtra información por lo que tarda.
        return hash_equals($esperado, $recibido);
    }

    /** Un robot envía al instante; una persona tarda unos segundos en rellenar los campos. */
    public static function llegoDemasiadoRapido(array $sesion, float $ahora): bool
    {
        $emitido = $sesion[self::CLAVE_TOKEN_EMITIDO] ?? null;
        if (!is_int($emitido) && !is_float($emitido)) {
            return false;
        }

        return $ahora - $emitido < self::SEGUNDOS_MINIMOS_DE_RELLENO;
    }

    public static function superaElLimiteDeFrecuencia(array $sesion, int $ahora): bool
    {
        $ultimo = $sesion[self::CLAVE_ULTIMO_ENVIO] ?? null;
        if (!is_int($ultimo)) {
            return false;
        }

        return $ahora - $ultimo < self::SEGUNDOS_ENTRE_ENVIOS;
    }

    public static function marcarEnviado(array &$sesion, int $ahora): void
    {
        $sesion[self::CLAVE_ULTIMO_ENVIO] = $ahora;
    }

    /** La petición tiene que venir de nuestra propia web: Origin y, si falta, Referer. */
    public static function esMismoOrigen(array $servidor): bool
    {
        $anfitrion = strtolower((string) ($servidor['HTTP_HOST'] ?? ''));
        if ($anfitrion === '') {
            return false;
        }

        $origen = (string) ($servidor['HTTP_ORIGIN'] ?? '');
        if ($origen === '') {
            $origen = (string) ($servidor['HTTP_REFERER'] ?? '');
        }
        if ($origen === '') {
            return false;
        }

        $partes = parse_url($origen);
        if (!is_array($partes) || !isset($partes['host'])) {
            return false;
        }

        $destino = strtolower($partes['host']);
        if (isset($partes['port'])) {
            $destino .= ':' . $partes['port'];
        }

        return $destino === $anfitrion;
    }
}
