<?php

declare(strict_types=1);

/**
 * Conexión real con un servidor SMTP por sockets. Siempre verifica el certificado del servidor.
 * No se prueba en tests/run.php (necesita red): el diálogo del protocolo se prueba con un servidor falso.
 */
final class SmtpSocket implements SmtpTransport
{
    private const SEGUNDOS_DE_ESPERA = 10;
    private const LINEAS_MAXIMAS_POR_RESPUESTA = 100;

    /** @var resource|null */
    private $conexion = null;

    public function __construct(
        private string $host,
        private int $puerto,
        private bool $cifradaDesdeElPrincipio,
    ) {
    }

    /** @throws RuntimeException si no se puede conectar o el certificado no es válido */
    public function conectar(): void
    {
        $contexto = stream_context_create([
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
                'peer_name' => $this->host,
                'allow_self_signed' => false,
            ],
        ]);

        $esquema = $this->cifradaDesdeElPrincipio ? 'ssl' : 'tcp';
        // El @ evita el aviso de PHP: el motivo del fallo ya llega en $mensaje y se registra sin datos sensibles.
        $conexion = @stream_socket_client(
            "{$esquema}://{$this->host}:{$this->puerto}",
            $codigo,
            $mensaje,
            self::SEGUNDOS_DE_ESPERA,
            STREAM_CLIENT_CONNECT,
            $contexto
        );
        if ($conexion === false) {
            throw new RuntimeException("no se pudo conectar con {$this->host}:{$this->puerto} ({$mensaje})");
        }

        stream_set_timeout($conexion, self::SEGUNDOS_DE_ESPERA);
        $this->conexion = $conexion;
    }

    public function leerRespuesta(): array
    {
        if ($this->conexion === null) {
            return ['codigo' => 0, 'texto' => 'sin conexión'];
        }

        $texto = '';
        $codigo = 0;
        for ($i = 0; $i < self::LINEAS_MAXIMAS_POR_RESPUESTA; $i++) {
            $linea = fgets($this->conexion, 1024);
            if ($linea === false) {
                return ['codigo' => 0, 'texto' => 'sin respuesta del servidor'];
            }

            $texto .= $linea;
            $codigo = (int) substr($linea, 0, 3);

            // «250-...» indica que sigue otra línea; «250 ...» es la última de la respuesta.
            if (strlen($linea) < 4 || $linea[3] !== '-') {
                break;
            }
        }

        return ['codigo' => $codigo, 'texto' => trim($texto)];
    }

    public function enviarComando(string $linea): void
    {
        $this->escribir($linea . "\r\n");
    }

    public function enviarDatos(string $mensaje): void
    {
        // El mensaje ya acaba en CRLF: con «.» y CRLF se cierra el bloque DATA.
        $this->escribir($mensaje . ".\r\n");
    }

    public function activarCifrado(): bool
    {
        if ($this->conexion === null) {
            return false;
        }

        return stream_socket_enable_crypto($this->conexion, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) === true;
    }

    public function cerrar(): void
    {
        if ($this->conexion === null) {
            return;
        }

        fclose($this->conexion);
        $this->conexion = null;
    }

    private function escribir(string $texto): void
    {
        if ($this->conexion === null) {
            return;
        }

        fwrite($this->conexion, $texto);
    }
}
