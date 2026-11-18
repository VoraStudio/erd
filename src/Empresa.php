<?php

declare(strict_types=1);

/**
 * Los datos de la empresa (teléfono, correo, dirección, datos legales) viven en el .env, con el prefijo
 * ERD_EMPRESA_ (por ejemplo ERD_EMPRESA_TELEFONO), para tenerlos en un solo sitio. Esta clase los lee, los limpia y
 * calcula lo que se necesita derivado (la dirección completa y los enlaces tel: y mailto:).
 * Un dato que falta, está vacío o no es válido simplemente no sale: la web decide qué enseña en su lugar.
 */
final class Empresa
{
    public const LONGITUD_MAXIMA = 200;

    // Nombre de cada dato (en minúsculas). En el .env se escribe en mayúsculas tras el prefijo: ERD_EMPRESA_RAZON_SOCIAL.
    private const CLAVES = [
        'nombre',
        'razon_social',
        'nif',
        'direccion',
        'codigo_postal',
        'poblacion',
        'provincia',
        'telefono',
        'correo',
        'horario',
        'registro_mercantil',
        'dpd',
    ];

    /** @return array<string, string> los datos de la empresa que hay en el .env, ya limpios */
    public static function leer(): array
    {
        $valores = [];
        foreach (self::CLAVES as $clave) {
            $valores[$clave] = Config::obtener('EMPRESA_' . strtoupper($clave));
        }

        return self::componer($valores);
    }

    /**
     * @param array<string, mixed> $valores los datos tal como llegan (null o vacío si faltan)
     * @return array<string, string> solo los datos válidos, más los derivados (direccion_completa, telefono_enlace, correo_enlace)
     */
    public static function componer(array $valores): array
    {
        $datos = [];
        foreach (self::CLAVES as $clave) {
            $texto = self::limpiar($valores[$clave] ?? null);
            if ($texto !== '') {
                $datos[$clave] = $texto;
            }
        }

        $datos = self::validarCorreo($datos);
        $datos = self::validarTelefono($datos);

        $direccionCompleta = self::componerDireccion($datos);
        if ($direccionCompleta !== '') {
            $datos['direccion_completa'] = $direccionCompleta;
        }

        return $datos;
    }

    /** Un texto en una sola línea, sin caracteres de control y de un tamaño razonable. */
    private static function limpiar(mixed $valor): string
    {
        if (!is_string($valor)) {
            return '';
        }

        $enUnaLinea = trim((string) preg_replace('/\s+/u', ' ', $valor));
        $sinControl = (string) preg_replace('/[\x00-\x1F\x7F]/u', '', $enUnaLinea);

        return mb_substr($sinControl, 0, self::LONGITUD_MAXIMA);
    }

    /**
     * @param array<string, string> $datos
     * @return array<string, string>
     */
    private static function validarCorreo(array $datos): array
    {
        if (!isset($datos['correo'])) {
            return $datos;
        }

        if (filter_var($datos['correo'], FILTER_VALIDATE_EMAIL) === false) {
            unset($datos['correo']);
            return $datos;
        }

        $datos['correo_enlace'] = 'mailto:' . $datos['correo'];

        return $datos;
    }

    /**
     * El enlace tel: solo lleva cifras y, si acaso, un «+» al principio. Un teléfono sin cifras suficientes no es un teléfono.
     *
     * @param array<string, string> $datos
     * @return array<string, string>
     */
    private static function validarTelefono(array $datos): array
    {
        if (!isset($datos['telefono'])) {
            return $datos;
        }

        $soloCifras = (string) preg_replace('/[^\d+]/', '', $datos['telefono']);
        if (preg_match('/^\+?\d{6,15}$/', $soloCifras) !== 1) {
            unset($datos['telefono']);
            return $datos;
        }

        $datos['telefono_enlace'] = 'tel:' . $soloCifras;

        return $datos;
    }

    /**
     * «Carrer Major, 12, 17100 La Bisbal d'Empordà (Girona)». Sin calle ni población no hay dirección,
     * y la provincia no se repite si es igual que la población.
     *
     * @param array<string, string> $datos
     */
    private static function componerDireccion(array $datos): string
    {
        $codigoYPoblacion = trim(($datos['codigo_postal'] ?? '') . ' ' . ($datos['poblacion'] ?? ''));
        $partes = array_filter([$datos['direccion'] ?? '', $codigoYPoblacion], static fn (string $parte): bool => $parte !== '');
        if ($partes === []) {
            return '';
        }

        $direccion = implode(', ', $partes);

        $provincia = $datos['provincia'] ?? '';
        if ($provincia !== '' && $provincia !== ($datos['poblacion'] ?? '')) {
            $direccion .= ' (' . $provincia . ')';
        }

        return $direccion;
    }
}
