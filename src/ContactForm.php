<?php

declare(strict_types=1);

/**
 * Validación del formulario de contacto y construcción del correo.
 * No envía nada: solo prepara los datos, para poder probarlo sin servidor de correo.
 * Las claves de $entrada son los nombres de campo del formulario HTML (catalán).
 */
final class ContactForm
{
    public const LONGITUD_MAXIMA_NOMBRE = 100;
    public const LONGITUD_MAXIMA_CORREO = 254;
    public const LONGITUD_MAXIMA_MENSAJE = 5000;

    /**
     * @param array<string, mixed> $entrada lo que llega por POST
     * @return array{errores: list<string>, datos: array{nombre: string, correo: string, mensaje: string}}
     */
    public static function validar(array $entrada): array
    {
        $nombre = self::limpiarLinea(self::comoTexto($entrada['nom'] ?? ''));
        $correo = trim(self::comoTexto($entrada['correu'] ?? ''));
        $mensaje = trim(str_replace(["\r\n", "\r"], "\n", self::comoTexto($entrada['missatge'] ?? '')));

        $errores = [];

        if ($nombre === '' || mb_strlen($nombre) > self::LONGITUD_MAXIMA_NOMBRE) {
            $errores[] = 'nom';
        }

        // FILTER_VALIDATE_EMAIL rechaza los saltos de línea: así no se puede inyectar una cabecera.
        $esCorreoValido = $correo !== ''
            && mb_strlen($correo) <= self::LONGITUD_MAXIMA_CORREO
            && filter_var($correo, FILTER_VALIDATE_EMAIL) !== false;
        if (!$esCorreoValido) {
            $errores[] = 'correu';
        }

        if (mb_strlen($mensaje) > self::LONGITUD_MAXIMA_MENSAJE) {
            $errores[] = 'missatge';
        }

        if (!self::estaMarcada($entrada['privadesa'] ?? null)) {
            $errores[] = 'privadesa';
        }

        return [
            'errores' => $errores,
            'datos' => ['nombre' => $nombre, 'correo' => $correo, 'mensaje' => $mensaje],
        ];
    }

    /**
     * Un mensaje fijo por cada campo con error, para pintarlo junto al campo.
     * Son textos fijos: nunca se repite lo que escribió el visitante.
     *
     * @param list<string> $campos nombres de campo con error, tal como los devuelve validar()
     * @return array<string, string>
     */
    public static function mensajesDeError(array $campos): array
    {
        $mensajes = [
            'nom' => 'Escriu el teu nom (màxim ' . self::LONGITUD_MAXIMA_NOMBRE . ' caràcters).',
            'correu' => 'Escriu un correu electrònic vàlid.',
            'missatge' => 'El missatge és massa llarg (màxim ' . self::LONGITUD_MAXIMA_MENSAJE . ' caràcters).',
            'privadesa' => 'Cal acceptar la política de privadesa.',
        ];

        $resultado = [];
        foreach ($campos as $campo) {
            $resultado[$campo] = $mensajes[$campo] ?? 'Revisa aquest camp.';
        }

        return $resultado;
    }

    /** Campo trampa: un visitante real no lo ve ni lo rellena; los robots sí. */
    public static function esSpam(array $entrada): bool
    {
        return trim(self::comoTexto($entrada['web'] ?? '')) !== '';
    }

    /**
     * @param array{nombre: string, correo: string, mensaje: string} $datos datos ya validados
     * @return array{para: string, asunto: string, cuerpo: string, cabeceras: list<string>}
     */
    public static function construirCorreo(array $datos, string $destinatario, string $remitente): array
    {
        $asunto = 'Nou missatge de contacte';
        $cuerpo = "Nom: {$datos['nombre']}\nCorreu: {$datos['correo']}\n\nMissatge:\n{$datos['mensaje']}\n";

        return [
            'para' => $destinatario,
            'asunto' => '=?UTF-8?B?' . base64_encode($asunto) . '?=',
            'cuerpo' => $cuerpo,
            'cabeceras' => [
                'From: ' . $remitente,
                'Reply-To: ' . $datos['correo'],
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=UTF-8',
            ],
        ];
    }

    /** Un valor que no es texto (por ejemplo un array enviado a propósito) cuenta como vacío. */
    private static function comoTexto(mixed $valor): string
    {
        return is_string($valor) ? $valor : '';
    }

    /** Deja el texto en una sola línea: los caracteres de control pasan a ser espacios. */
    private static function limpiarLinea(string $texto): string
    {
        return trim((string) preg_replace('/[\x00-\x1F\x7F]+/', ' ', $texto));
    }

    private static function estaMarcada(mixed $valor): bool
    {
        return in_array($valor, ['on', '1', 'true', 'yes'], true);
    }
}
