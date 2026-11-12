<?php

declare(strict_types=1);

/**
 * Acceso tipado a los ajustes del proyecto. Todo viene del entorno;
 * un valor ausente o vacío significa «pendiente» y el sitio se muestra como borrador.
 */
final class Config
{
    public const PREFIJO = 'ERD_';

    public const CLAVES = ['MAIL_RECIPIENT', 'MAIL_SENDER'];

    public static function obtener(string $clave): ?string
    {
        return Env::obtener(self::PREFIJO . $clave);
    }

    public static function estaConfigurado(): bool
    {
        return self::clavesPendientes() === [];
    }

    /** @return list<string> */
    public static function clavesPendientes(): array
    {
        $pendientes = [];
        foreach (self::CLAVES as $clave) {
            if (self::obtener($clave) === null) {
                $pendientes[] = $clave;
            }
        }
        return $pendientes;
    }
}
