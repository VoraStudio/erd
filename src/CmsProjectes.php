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

            $titulo = CmsCampos::texto($entrada['titol'] ?? null);
            if ($titulo === '') {
                continue;
            }

            $imagenes = CmsCampos::direccionesDeImagenes($entrada['imatges'] ?? null, $urlDelCms, true);

            $tarjetas[] = [
                'id' => (int) ($entrada['id'] ?? 0),
                'sector' => CmsCampos::texto($entrada['tipus'] ?? null),
                'titol' => $titulo,
                'resum' => CmsCampos::texto($entrada['descripcio_breu'] ?? null),
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

            $titulo = CmsCampos::texto($entrada['titol'] ?? null);
            if ($titulo === '') {
                return null;
            }

            return [
                'id' => $id,
                'sector' => CmsCampos::texto($entrada['tipus'] ?? null),
                'titol' => $titulo,
                'resum' => CmsCampos::texto($entrada['descripcio_breu'] ?? null),
                'repte' => CmsCampos::texto($entrada['el_repte'] ?? null),
                'que_vam_fer' => CmsCampos::texto($entrada['que_vam_fer'] ?? null),
                'resultat' => CmsCampos::texto($entrada['el_resultat'] ?? null),
                'recuadres' => self::recuadres($entrada),
                'imatges' => CmsCampos::direccionesDeImagenes($entrada['imatges'] ?? null, $urlDelCms, false),
            ];
        }

        return null;
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
            $valor = CmsCampos::texto($entrada['recuadre_' . $numero . '_numero'] ?? null);
            $texto = CmsCampos::texto($entrada['recuadre_' . $numero . '_text'] ?? null);
            if ($valor === '' && $texto === '') {
                continue;
            }

            $recuadros[] = ['valor' => $valor, 'text' => $texto];
        }

        return $recuadros;
    }
}
