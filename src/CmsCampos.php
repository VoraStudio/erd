<?php

declare(strict_types=1);

/**
 * Lectura segura de los campos que llegan del CMS. El CMS puede cambiar el tipo de un campo
 * o dejarlo vacío, así que nada se da por hecho: lo que no encaja se trata como vacío.
 */
final class CmsCampos
{
    /** Un valor que no es texto (el CMS cambió un tipo, por ejemplo) cuenta como vacío. */
    public static function texto(mixed $valor): string
    {
        return is_string($valor) ? trim($valor) : '';
    }

    /** El día de una fecha del CMS («2026-11-18T11:07:00» pasa a «2026-11-18»), o vacío si no es una fecha real. */
    public static function fecha(mixed $valor): string
    {
        $texto = self::texto($valor);
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $texto, $partes) !== 1) {
            return '';
        }

        if (!checkdate((int) $partes[2], (int) $partes[3], (int) $partes[1])) {
            return '';
        }

        return $partes[1] . '-' . $partes[2] . '-' . $partes[3];
    }

    /**
     * Las direcciones de las imágenes de un campo de imagen o de galería, ya completas. Las miniaturas
     * usan la versión pequeña; las páginas de detalle, la original. Lo que no es una imagen válida se descarta.
     *
     * @return list<string>
     */
    public static function direccionesDeImagenes(mixed $imagenes, string $urlDelCms, bool $versionPequena): array
    {
        if (!is_array($imagenes)) {
            return [];
        }

        $direcciones = [];

        foreach ($imagenes as $imagen) {
            if (!is_array($imagen)) {
                continue;
            }

            $direccion = $imagen['url'] ?? null;
            if ($versionPequena && is_string($imagen['formats']['small']['url'] ?? null)) {
                $direccion = $imagen['formats']['small']['url'];
            }
            if (!is_string($direccion)) {
                continue;
            }

            $completa = self::hacerAbsoluta($direccion, $urlDelCms);
            if ($completa !== null) {
                $direcciones[] = $completa;
            }
        }

        return $direcciones;
    }

    /** El CMS devuelve rutas como «/uploads/a.png». Solo se aceptan rutas suyas o direcciones https/http completas. */
    private static function hacerAbsoluta(string $direccion, string $urlDelCms): ?string
    {
        if (preg_match('#^https?://#i', $direccion) === 1) {
            return $direccion;
        }

        if (str_starts_with($direccion, '/') && !str_starts_with($direccion, '//')) {
            return rtrim($urlDelCms, '/') . $direccion;
        }

        return null;
    }
}
