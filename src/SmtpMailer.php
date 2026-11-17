<?php

declare(strict_types=1);

/**
 * Envío de correo por SMTP autenticado, sin librerías externas. Reglas de seguridad:
 *  - La contraseña solo se manda con la conexión ya cifrada (SSL desde el principio, o STARTTLS aceptado).
 *  - Se verifica el certificado del servidor (lo hace SmtpSocket).
 *  - Una cabecera o dirección con saltos de línea se rechaza antes de hablar con el servidor.
 *  - El cuerpo va en base64: no hay líneas largas ni puntos al inicio de línea que rompan el protocolo.
 * Ajustes del .env (prefijo ERD_): SMTP_HOST, SMTP_USER y SMTP_PASSWORD obligatorios;
 * SMTP_SECURE («ssl» por defecto, o «tls» para STARTTLS) y SMTP_PORT opcionales.
 */
final class SmtpMailer
{
    private const PUERTO_SSL = 465;
    private const PUERTO_STARTTLS = 587;

    /** Si hay host, el correo sale por SMTP; si faltan otros datos, falla en vez de recurrir a mail() sin avisar. */
    public static function estaActivo(): bool
    {
        return Config::obtener('SMTP_HOST') !== null;
    }

    /** @return array{host: string, puerto: int, seguridad: string, usuario: string, clave: string}|null null si falta algo o no es válido */
    public static function leerAjustes(): ?array
    {
        $host = Config::obtener('SMTP_HOST');
        $usuario = Config::obtener('SMTP_USER');
        $clave = Config::obtener('SMTP_PASSWORD');
        if ($host === null || $usuario === null || $clave === null) {
            return null;
        }

        // Solo se admiten modos cifrados: no existe la opción de enviar la contraseña en claro.
        $seguridad = strtolower(Config::obtener('SMTP_SECURE') ?? 'ssl');
        if ($seguridad !== 'ssl' && $seguridad !== 'tls') {
            return null;
        }

        $puerto = $seguridad === 'ssl' ? self::PUERTO_SSL : self::PUERTO_STARTTLS;
        $textoDelPuerto = Config::obtener('SMTP_PORT');
        if ($textoDelPuerto !== null) {
            if (!ctype_digit($textoDelPuerto) || (int) $textoDelPuerto < 1 || (int) $textoDelPuerto > 65535) {
                return null;
            }
            $puerto = (int) $textoDelPuerto;
        }

        return ['host' => $host, 'puerto' => $puerto, 'seguridad' => $seguridad, 'usuario' => $usuario, 'clave' => $clave];
    }

    /**
     * Envía por la red con los ajustes del .env (esta parte no se prueba: necesita un servidor real).
     * Los fallos quedan en el registro del servidor, sin contraseñas.
     *
     * @param array{para: string, asunto: string, cuerpo: string, cabeceras: list<string>} $correo
     */
    public static function enviarConConfiguracion(array $correo, string $remitente): bool
    {
        $ajustes = self::leerAjustes();
        if ($ajustes === null) {
            error_log('SMTP: configuración incompleta o no válida (ERD_SMTP_HOST, ERD_SMTP_USER, ERD_SMTP_PASSWORD, ERD_SMTP_SECURE, ERD_SMTP_PORT)');
            return false;
        }

        $transporte = new SmtpSocket($ajustes['host'], $ajustes['puerto'], $ajustes['seguridad'] === 'ssl');
        try {
            $transporte->conectar();
        } catch (RuntimeException $error) {
            error_log('SMTP: ' . $error->getMessage());
            return false;
        }

        // El nombre con el que nos presentamos al servidor es el dominio del remitente.
        $partesDelRemitente = explode('@', $remitente);
        $nombreLocal = end($partesDelRemitente);

        $correcto = self::enviar(
            $transporte,
            $ajustes['usuario'],
            $ajustes['clave'],
            $nombreLocal,
            $ajustes['seguridad'] === 'tls',
            $remitente,
            $correo
        );
        if (!$correcto) {
            error_log('SMTP: el servidor ' . $ajustes['host'] . ' no aceptó el mensaje');
        }

        return $correcto;
    }

    /**
     * Diálogo SMTP completo sobre un transporte. Devuelve false en cuanto algo no sale como se espera.
     *
     * @param array{para: string, asunto: string, cuerpo: string, cabeceras: list<string>} $correo
     */
    public static function enviar(
        SmtpTransport $transporte,
        string $usuario,
        string $clave,
        string $nombreLocal,
        bool $usarStartTls,
        string $remitente,
        array $correo,
    ): bool {
        if (!self::sonDatosSeguros($remitente, $correo)) {
            return false;
        }

        $nombreLocal = preg_match('/^[A-Za-z0-9.-]+$/', $nombreLocal) === 1 ? $nombreLocal : 'localhost';

        try {
            return self::dialogar($transporte, $usuario, $clave, $nombreLocal, $usarStartTls, $remitente, $correo);
        } finally {
            $transporte->cerrar();
        }
    }

    /** @param array{para: string, asunto: string, cuerpo: string, cabeceras: list<string>} $correo */
    private static function dialogar(
        SmtpTransport $transporte,
        string $usuario,
        string $clave,
        string $nombreLocal,
        bool $usarStartTls,
        string $remitente,
        array $correo,
    ): bool {
        if (!self::esperar($transporte, [220])) {
            return false;
        }

        $transporte->enviarComando('EHLO ' . $nombreLocal);
        if (!self::esperar($transporte, [250])) {
            return false;
        }

        // Con SSL la conexión ya nació cifrada; con STARTTLS hay que cifrarla antes de autenticar.
        if ($usarStartTls) {
            $transporte->enviarComando('STARTTLS');
            if (!self::esperar($transporte, [220]) || !$transporte->activarCifrado()) {
                return false;
            }

            // Tras cifrar, el servidor olvida lo anterior: hay que presentarse otra vez.
            $transporte->enviarComando('EHLO ' . $nombreLocal);
            if (!self::esperar($transporte, [250])) {
                return false;
            }
        }

        $transporte->enviarComando('AUTH LOGIN');
        if (!self::esperar($transporte, [334])) {
            return false;
        }
        $transporte->enviarComando(base64_encode($usuario));
        if (!self::esperar($transporte, [334])) {
            return false;
        }
        $transporte->enviarComando(base64_encode($clave));
        if (!self::esperar($transporte, [235])) {
            return false;
        }

        $transporte->enviarComando('MAIL FROM:<' . $remitente . '>');
        if (!self::esperar($transporte, [250])) {
            return false;
        }
        $transporte->enviarComando('RCPT TO:<' . $correo['para'] . '>');
        if (!self::esperar($transporte, [250, 251])) {
            return false;
        }

        $transporte->enviarComando('DATA');
        if (!self::esperar($transporte, [354])) {
            return false;
        }
        $transporte->enviarDatos(self::construirMensaje($correo, $nombreLocal));
        if (!self::esperar($transporte, [250])) {
            return false;
        }

        $transporte->enviarComando('QUIT');

        return true;
    }

    /** @param list<int> $codigosAceptados */
    private static function esperar(SmtpTransport $transporte, array $codigosAceptados): bool
    {
        $respuesta = $transporte->leerRespuesta();

        return in_array($respuesta['codigo'], $codigosAceptados, true);
    }

    /**
     * Cabeceras y cuerpo, con líneas CRLF. El asunto y las cabeceras de $correo ya vienen preparados
     * por ContactForm::construirCorreo(); aquí se añaden las que exige SMTP.
     *
     * @param array{para: string, asunto: string, cuerpo: string, cabeceras: list<string>} $correo
     */
    private static function construirMensaje(array $correo, string $nombreLocal): string
    {
        $cabeceras = array_merge($correo['cabeceras'], [
            'To: ' . $correo['para'],
            'Subject: ' . $correo['asunto'],
            'Date: ' . date('r'),
            'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $nombreLocal . '>',
            'Content-Transfer-Encoding: base64',
        ]);

        // chunk_split corta en líneas de 76 caracteres y deja un CRLF al final.
        return implode("\r\n", $cabeceras) . "\r\n\r\n" . chunk_split(base64_encode($correo['cuerpo']), 76, "\r\n");
    }

    /**
     * Antes de hablar con el servidor: direcciones válidas y ninguna cabecera con saltos de línea
     * (un salto permitiría colar cabeceras o comandos SMTP).
     *
     * @param array{para: string, asunto: string, cuerpo: string, cabeceras: list<string>} $correo
     */
    private static function sonDatosSeguros(string $remitente, array $correo): bool
    {
        // FILTER_VALIDATE_EMAIL rechaza saltos de línea y los símbolos < y >.
        if (filter_var($remitente, FILTER_VALIDATE_EMAIL) === false || filter_var($correo['para'], FILTER_VALIDATE_EMAIL) === false) {
            return false;
        }

        foreach ([...$correo['cabeceras'], $correo['asunto']] as $linea) {
            if (str_contains($linea, "\r") || str_contains($linea, "\n")) {
                return false;
            }
        }

        return true;
    }
}
