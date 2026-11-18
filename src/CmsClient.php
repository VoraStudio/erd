<?php

declare(strict_types=1);

/**
 * Cliente del CMS (VoraCMS). Solo se usa desde el servidor.
 *
 * El CMS no usa claves: entrega un token (JWT, dura 1 hora) a quien llega con un dominio autorizado
 * en la cabecera Origin. El token se guarda unos minutos en un archivo temporal para no pedirlo en cada visita.
 * La llamada de red se recibe como función, así la lógica se prueba sin red.
 */
final class CmsClient
{
    public const NOMBRE_DE_LA_CACHE = 'erd-cms-token';
    public const SEGUNDOS_DE_CACHE = 300;

    private const RUTA_DEL_TOKEN = '/api/public/token';

    private string $urlDelCms;
    private string $origen;
    private string $archivoDeToken;
    private Closure $consultar;

    /**
     * @param callable(string, list<string>): array{codigo: int, cuerpo: string} $consultar GET que devuelve el código HTTP (0 si falla la red) y el cuerpo
     */
    public function __construct(string $urlDelCms, string $origen, string $carpetaDeCache, callable $consultar)
    {
        $this->urlDelCms = rtrim($urlDelCms, '/');
        $this->origen = $origen;
        $this->archivoDeToken = rtrim($carpetaDeCache, '/\\') . '/' . self::NOMBRE_DE_LA_CACHE;
        $this->consultar = Closure::fromCallable($consultar);
    }

    /**
     * Devuelve las entradas publicadas de una sección del CMS (por ejemplo «projectes_erd»), o null si algo falla.
     *
     * @return list<mixed>|null
     */
    public function leerSeccion(string $slug): ?array
    {
        // El slug acaba dentro de la URL: solo se admiten letras minúsculas, números y guion bajo.
        if (preg_match('/^[a-z0-9_]+$/', $slug) !== 1) {
            return null;
        }

        $token = $this->obtenerToken();
        if ($token === null) {
            return null;
        }

        $respuesta = $this->pedirSeccion($slug, $token);

        // 401 o 403: el token guardado pudo caducar. Se pide uno nuevo y se reintenta una sola vez.
        if ($respuesta['codigo'] === 401 || $respuesta['codigo'] === 403) {
            $this->borrarTokenGuardado();
            $token = $this->pedirTokenNuevo();
            if ($token === null) {
                return null;
            }
            $respuesta = $this->pedirSeccion($slug, $token);
        }

        if ($respuesta['codigo'] !== 200) {
            return null;
        }

        return self::extraerEntradas($respuesta['cuerpo']);
    }

    /**
     * Llamada real al CMS (no se prueba: necesita red).
     *
     * @param list<string> $cabeceras
     * @return array{codigo: int, cuerpo: string}
     */
    public static function consultarPorCurl(string $url, array $cabeceras): array
    {
        if (!function_exists('curl_init')) {
            return ['codigo' => 0, 'cuerpo' => ''];
        }

        $conexion = curl_init($url);
        curl_setopt_array($conexion, [
            CURLOPT_HTTPHEADER => $cabeceras,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        $cuerpo = curl_exec($conexion);
        $codigo = curl_getinfo($conexion, CURLINFO_RESPONSE_CODE);

        return ['codigo' => $codigo, 'cuerpo' => is_string($cuerpo) ? $cuerpo : ''];
    }

    private function obtenerToken(): ?string
    {
        $guardado = $this->leerTokenGuardado();
        if ($guardado !== null) {
            return $guardado;
        }

        return $this->pedirTokenNuevo();
    }

    /** @return array{codigo: int, cuerpo: string} */
    private function pedirSeccion(string $slug, string $token): array
    {
        return ($this->consultar)($this->urlDelCms . '/api/' . $slug, [
            'Authorization: Bearer ' . $token,
            'Origin: ' . $this->origen,
        ]);
    }

    private function pedirTokenNuevo(): ?string
    {
        $respuesta = ($this->consultar)($this->urlDelCms . self::RUTA_DEL_TOKEN, ['Origin: ' . $this->origen]);
        if ($respuesta['codigo'] !== 200) {
            return null;
        }

        $datos = json_decode($respuesta['cuerpo'], true);
        $token = is_array($datos) ? ($datos['token'] ?? null) : null;
        if (!is_string($token) || !self::esTokenValido($token)) {
            return null;
        }

        $this->guardarToken($token);

        return $token;
    }

    /** Un JWT solo lleva letras, números, punto, guion y guion bajo: así nada puede colarse en una cabecera HTTP. */
    private static function esTokenValido(string $token): bool
    {
        return preg_match('/^[A-Za-z0-9._-]+$/', $token) === 1;
    }

    private function leerTokenGuardado(): ?string
    {
        if (!is_file($this->archivoDeToken)) {
            return null;
        }

        $guardadoDesde = filemtime($this->archivoDeToken);
        if ($guardadoDesde === false || time() - $guardadoDesde > self::SEGUNDOS_DE_CACHE) {
            return null;
        }

        $contenido = file_get_contents($this->archivoDeToken);
        if ($contenido === false) {
            return null;
        }

        $token = trim($contenido);

        return self::esTokenValido($token) ? $token : null;
    }

    private function guardarToken(string $token): void
    {
        $carpeta = dirname($this->archivoDeToken);
        if (!is_dir($carpeta) || !is_writable($carpeta)) {
            return;
        }

        file_put_contents($this->archivoDeToken, $token, LOCK_EX);
        chmod($this->archivoDeToken, 0600);
    }

    private function borrarTokenGuardado(): void
    {
        if (is_file($this->archivoDeToken)) {
            unlink($this->archivoDeToken);
        }
    }

    /** @return list<mixed>|null */
    private static function extraerEntradas(string $cuerpo): ?array
    {
        $datos = json_decode($cuerpo, true);
        if (!is_array($datos) || !isset($datos['data']) || !is_array($datos['data'])) {
            return null;
        }

        return array_values($datos['data']);
    }
}
