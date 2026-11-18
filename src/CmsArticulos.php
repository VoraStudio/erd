<?php

declare(strict_types=1);

/**
 * Convierte las entradas del tipo «Blog ERD» del CMS en lo que pinta la web de Actualitat:
 * las filas del listado y el artículo completo. El cuerpo del artículo es texto plano con un formato sencillo
 * (ver separarBloques) y nunca HTML: la web lo pinta con textContent.
 */
final class CmsArticulos
{
    public const SECCION = 'blog_erd';

    private const PALABRAS_POR_MINUTO = 200;

    /**
     * @param list<mixed> $entradas lo que devuelve el CMS (cada elemento debería ser una entrada)
     * @return list<array{id: int, categoria: string, titol: string, entradeta: string, imatge: string|null}>
     */
    public static function transformar(array $entradas, string $urlDelCms): array
    {
        $filas = [];

        foreach ($entradas as $entrada) {
            if (!is_array($entrada)) {
                continue;
            }

            $titulo = CmsCampos::texto($entrada['titol'] ?? null);
            if ($titulo === '') {
                continue;
            }

            $filas[] = [
                'id' => (int) ($entrada['id'] ?? 0),
                'categoria' => CmsCampos::texto($entrada['tipus'] ?? null),
                'titol' => $titulo,
                'entradeta' => CmsCampos::texto($entrada['entradeta'] ?? null),
                'imatge' => self::imagenDeLaFila($entrada, $urlDelCms),
            ];
        }

        return $filas;
    }

    /**
     * El artículo completo, o null si no existe entre las entradas publicadas.
     *
     * @param list<mixed> $entradas lo que devuelve el CMS
     * @return array{id: int, categoria: string, titol: string, entradeta: string, autor: string, data: string, minuts: int, portada: array{url: string, peu: string}|null, blocs: list<array{tipus: string, text: string}>, galeria: list<string>}|null
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

            $bloques = self::separarBloques(CmsCampos::texto($entrada['cos'] ?? null));

            return [
                'id' => $id,
                'categoria' => CmsCampos::texto($entrada['tipus'] ?? null),
                'titol' => $titulo,
                'entradeta' => CmsCampos::texto($entrada['entradeta'] ?? null),
                'autor' => CmsCampos::texto($entrada['autor'] ?? null),
                'data' => CmsCampos::fecha($entrada['data'] ?? null),
                'minuts' => self::minutosDeLectura($bloques),
                'portada' => self::portada($entrada, $urlDelCms),
                'blocs' => $bloques,
                'galeria' => CmsCampos::direccionesDeImagenes($entrada['galeria'] ?? null, $urlDelCms, false),
            ];
        }

        return null;
    }

    /**
     * Parte el cuerpo del artículo en bloques. El formato es muy sencillo:
     *   - una línea en blanco separa los párrafos (las líneas seguidas forman un solo párrafo);
     *   - una línea que empieza por «## » es un subtítulo;
     *   - una línea que empieza por «> » es una cita destacada (las seguidas forman una sola).
     * Todo lo demás es texto normal. El HTML no se interpreta: se conserva como texto.
     *
     * @return list<array{tipus: string, text: string}>
     */
    public static function separarBloques(string $texto): array
    {
        $bloques = [];
        $lineasDelParrafo = [];
        $lineasDeLaCita = [];

        foreach (preg_split('/\R/u', $texto) ?: [] as $linea) {
            $linea = ltrim($linea);

            if (trim($linea) === '') {
                self::cerrarBloque($bloques, 'parrafo', $lineasDelParrafo);
                self::cerrarBloque($bloques, 'cita', $lineasDeLaCita);
                continue;
            }

            if (preg_match('/^##(?:\s+(.*))?$/u', $linea, $partes) === 1) {
                self::cerrarBloque($bloques, 'parrafo', $lineasDelParrafo);
                self::cerrarBloque($bloques, 'cita', $lineasDeLaCita);
                $lineasDelSubtitulo = [$partes[1] ?? ''];
                self::cerrarBloque($bloques, 'subtitulo', $lineasDelSubtitulo);
                continue;
            }

            if (preg_match('/^>(?:\s+(.*))?$/u', $linea, $partes) === 1) {
                self::cerrarBloque($bloques, 'parrafo', $lineasDelParrafo);
                $lineasDeLaCita[] = $partes[1] ?? '';
                continue;
            }

            self::cerrarBloque($bloques, 'cita', $lineasDeLaCita);
            $lineasDelParrafo[] = $linea;
        }

        self::cerrarBloque($bloques, 'parrafo', $lineasDelParrafo);
        self::cerrarBloque($bloques, 'cita', $lineasDeLaCita);

        return $bloques;
    }

    /**
     * Junta las líneas acumuladas en un bloque y las vacía. Un bloque que queda sin texto no se añade.
     *
     * @param list<array{tipus: string, text: string}> $bloques
     * @param list<string> $lineas
     */
    private static function cerrarBloque(array &$bloques, string $tipo, array &$lineas): void
    {
        $texto = trim((string) preg_replace('/\s+/u', ' ', implode(' ', $lineas)));
        $lineas = [];

        if ($texto === '') {
            return;
        }

        $bloques[] = ['tipus' => $tipo, 'text' => $texto];
    }

    /**
     * La imagen de una tarjeta o fila: la portada y, si no hay (o no es una imagen válida), la primera foto de la galería.
     *
     * @param array<mixed> $entrada
     */
    private static function imagenDeLaFila(array $entrada, string $urlDelCms): ?string
    {
        $deLaPortada = CmsCampos::direccionesDeImagenes($entrada['portada'] ?? null, $urlDelCms, true);
        if ($deLaPortada !== []) {
            return $deLaPortada[0];
        }

        $deLaGaleria = CmsCampos::direccionesDeImagenes($entrada['galeria'] ?? null, $urlDelCms, true);

        return $deLaGaleria[0] ?? null;
    }

    /** @param list<array{tipus: string, text: string}> $bloques */
    private static function minutosDeLectura(array $bloques): int
    {
        $palabras = 0;
        foreach ($bloques as $bloque) {
            $palabras += count(preg_split('/\s+/u', $bloque['text'], -1, PREG_SPLIT_NO_EMPTY) ?: []);
        }

        return max(1, (int) ceil($palabras / self::PALABRAS_POR_MINUTO));
    }

    /**
     * @param array<mixed> $entrada
     * @return array{url: string, peu: string}|null
     */
    private static function portada(array $entrada, string $urlDelCms): ?array
    {
        $direcciones = CmsCampos::direccionesDeImagenes($entrada['portada'] ?? null, $urlDelCms, false);
        if ($direcciones === []) {
            return null;
        }

        return ['url' => $direcciones[0], 'peu' => CmsCampos::texto($entrada['peu_de_foto'] ?? null)];
    }
}
