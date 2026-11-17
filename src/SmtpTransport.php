<?php

declare(strict_types=1);

/**
 * Lo que SmtpMailer necesita de una conexión con un servidor SMTP.
 * Tiene dos implementaciones: SmtpSocket (la real) y un servidor falso en tests/run.php.
 * Así el diálogo del protocolo se prueba sin red (inyección de dependencias).
 */
interface SmtpTransport
{
    /**
     * Lee la respuesta completa del servidor (una respuesta puede ocupar varias líneas).
     * Si no hay respuesta, devuelve el código 0.
     *
     * @return array{codigo: int, texto: string}
     */
    public function leerRespuesta(): array;

    /** Envía una línea de comando; el transporte añade el salto de línea. */
    public function enviarComando(string $linea): void;

    /** Envía el mensaje completo (cabeceras y cuerpo, con líneas CRLF, acabado en CRLF) y el punto final que lo cierra. */
    public function enviarDatos(string $mensaje): void;

    /** Pasa la conexión a TLS (tras STARTTLS), verificando el certificado del servidor. */
    public function activarCifrado(): bool;

    public function cerrar(): void;
}
