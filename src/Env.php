<?php

declare(strict_types=1);

/**
 * Lector mínimo de .env. Sin interpolación y sin eval: los valores son siempre literales.
 * El entorno real del proceso manda sobre el archivo; vacío significa «no definido».
 */
final class Env
{
    private const BARRA_INVERTIDA = "\x5C";

    private static bool $cargado = false;

    /** @var array<string, string> */
    private static array $valores = [];

    /** Carga el primer .env que encuentre en los directorios indicados (una sola vez). */
    public static function cargar(string ...$directorios): void
    {
        if (self::$cargado) {
            return;
        }
        self::$cargado = true;

        foreach ($directorios as $directorio) {
            $archivo = rtrim($directorio, '/' . self::BARRA_INVERTIDA) . '/.env';
            if (!is_file($archivo) || !is_readable($archivo)) {
                continue;
            }
            $contenido = file_get_contents($archivo);
            if ($contenido === false) {
                continue;
            }
            self::$valores = self::interpretar($contenido);
            return;
        }
    }

    /** Devuelve el valor, o null si falta o está vacío. */
    public static function obtener(string $nombre): ?string
    {
        $real = getenv($nombre);
        if (is_string($real) && trim($real) !== '') {
            return $real;
        }

        $valor = self::$valores[$nombre] ?? null;
        if ($valor === null || trim($valor) === '') {
            return null;
        }
        return $valor;
    }

    public static function reiniciar(): void
    {
        self::$cargado = false;
        self::$valores = [];
    }

    /** @return array<string, string> */
    public static function interpretar(string $contenido): array
    {
        $valores = [];

        foreach (preg_split('/\R/', $contenido) ?: [] as $linea) {
            $linea = trim($linea);
            if ($linea === '' || $linea[0] === '#') {
                continue;
            }
            if (preg_match('/^export\s+/', $linea) === 1) {
                $linea = (string) preg_replace('/^export\s+/', '', $linea);
            }

            $separador = strpos($linea, '=');
            if ($separador === false) {
                continue;
            }

            $nombre = trim(substr($linea, 0, $separador));
            if (preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $nombre) !== 1) {
                continue;
            }

            $valores[$nombre] = self::interpretarValor(trim(substr($linea, $separador + 1)));
        }

        return $valores;
    }

    private static function interpretarValor(string $bruto): string
    {
        if ($bruto === '') {
            return '';
        }

        $comilla = $bruto[0];
        if ($comilla === '"' || $comilla === "'") {
            $final = self::buscarComillaDeCierre($bruto, $comilla);
            if ($final !== null) {
                $interior = substr($bruto, 1, $final - 1);
                return $comilla === '"' ? self::desescaparComillasDobles($interior) : $interior;
            }
        }

        $hayComentario = preg_match('/\s#/', $bruto, $coincidencia, PREG_OFFSET_CAPTURE);
        if ($hayComentario === 1) {
            $bruto = substr($bruto, 0, $coincidencia[0][1]);
        }
        return trim($bruto);
    }

    private static function buscarComillaDeCierre(string $bruto, string $comilla): ?int
    {
        $longitud = strlen($bruto);
        for ($i = 1; $i < $longitud; $i++) {
            if ($comilla === '"' && $bruto[$i] === self::BARRA_INVERTIDA) {
                $i++;
                continue;
            }
            if ($bruto[$i] === $comilla) {
                return $i;
            }
        }
        return null;
    }

    private static function desescaparComillasDobles(string $valor): string
    {
        return strtr($valor, [
            self::BARRA_INVERTIDA . 'n' => "\n",
            self::BARRA_INVERTIDA . 'r' => "\r",
            self::BARRA_INVERTIDA . 't' => "\t",
            self::BARRA_INVERTIDA . '"' => '"',
            self::BARRA_INVERTIDA . self::BARRA_INVERTIDA => self::BARRA_INVERTIDA,
        ]);
    }
}
