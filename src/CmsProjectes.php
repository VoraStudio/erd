<?php

declare(strict_types=1);

/**
 * Convierte las entradas del tipo «Projectes ERD» del CMS en lo que pinta la web:
 * tarjetas para el listado y un detalle completo para la página de cada proyecto.
 * Solo sale lo que la web necesita; el resto de campos del CMS no viaja al navegador.
 */
final class CmsProjectes
{
    public const SECCION = 'projectes_erd';

    private const NUMERO_DE_RECUADROS = 3;

    /**
     * @param list<mixed> $entradas lo que devuelve el CMS (cada elemento debería ser una entrada)
     * @return list<array{id: int, sector: string, titol: string, resum: string, imatge: string|null}>
     */
    public static function transformar(array $entradas, string $urlDelCms): array
    {
        $tarjetas = [];

        foreach ($entradas as $entrada) {
            if (!is_array($entrada)) {
                continue;
            }

            $titulo = self::comoTexto($entrada['titol'] ?? null);
            if ($titulo === '') {
                continue;
            }

            $imagenes = self::direccionesDeLasImagenes($entrada['imatges'] ?? null, $urlDelCms, true);

            $tarjetas[] = [
                'id' => (int) ($entrada['id'] ?? 0),
                'sector' => self::comoTexto($entrada['tipus'] ?? null),
                'titol' => $titulo,
                'resum' => self::comoTexto($entrada['descripcio_breu'] ?? null),
                'imatge' => $imagenes[0] ?? null,
            ];
        }

        return $tarjetas;
    }

    /**
     * El detalle de un proyecto, o null si no existe entre las entradas publicadas.
     *
     * @param list<mixed> $entradas lo que devuelve el CMS
     * @return array{id: int, sector: string, titol: string, resum: string, repte: string, que_vam_fer: string, resultat: string, recuadres: list<array{valor: string, text: string}>, imatges: list<string>}|null
     */
    public static function detallar(array $entradas, int $id, string $urlDelCms): ?array
    {
        foreach ($entradas as $entrada) {
            if (!is_array($entrada) || (int) ($entrada['id'] ?? 0) !== $id) {
                continue;
            }

            $titulo = self::comoTexto($entrada['titol'] ?? null);
            if ($titulo === '') {
                return null;
            }

            return [
                'id' => $id,
                'sector' => self::comoTexto($entrada['tipus'] ?? null),
                'titol' => $titulo,
                'resum' => self::comoTexto($entrada['descripcio_breu'] ?? null),
                'repte' => self::comoTexto($entrada['el_repte'] ?? null),
                'que_vam_fer' => self::comoTexto($entrada['que_vam_fer'] ?? null),
                'resultat' => self::comoTexto($entrada['el_resultat'] ?? null),
                'recuadres' => self::recuadres($entrada),
                'imatges' => self::direccionesDeLasImagenes($entrada['imatges'] ?? null, $urlDelCms, false),
            ];
        }

        return null;
    }

    /** Un valor que no es texto (el CMS cambió un tipo, por ejemplo) cuenta como vacío. */
    private static function comoTexto(mixed $valor): string
    {
        return is_string($valor) ? trim($valor) : '';
    }

    /**
     * Los tres recuadros del diseño (cifra y texto). Se omite el que llega del todo vacío.
     *
     * @param array<mixed> $entrada
     * @return list<array{valor: string, text: string}>
     */
    private static function recuadres(array $entrada): array
    {
        $recuadros = [];

        for ($numero = 1; $numero <= self::NUMERO_DE_RECUADROS; $numero++) {
            $valor = self::comoTexto($entrada['recuadre_' . $numero . '_numero'] ?? null);
            $texto = self::comoTexto($entrada['recuadre_' . $numero . '_text'] ?? null);
            if ($valor === '' && $texto === '') {
                continue;
            }

            $recuadros[] = ['valor' => $valor, 'text' => $texto];
        }

        return $recuadros;
    }

    /**
     * Las direcciones de las imágenes de la galería, ya completas. La tarjeta usa la versión pequeña;
     * el detalle, la original. Lo que no es una imagen válida se descarta.
     *
     * @return list<string>
     */
    private static function direccionesDeLasImagenes(mixed $imagenes, string $urlDelCms, bool $versionPequena): array
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
