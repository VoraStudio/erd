<?php

declare(strict_types=1);

/**
 * Orquesta el envío del formulario: las comprobaciones van de la más barata a la más cara,
 * y la primera que falla corta (retorno temprano). Devuelve el código HTTP y el cuerpo de la respuesta;
 * no escribe nada en la salida, así se puede probar entero.
 */
final class ContactHandler
{
    private const MENSAJE_CORRECTO = 'Gràcies! Et respondrem aviat.';

    /**
     * @param array<string, mixed> $entrada lo que llega por POST
     * @param array<string, mixed> $servidor $_SERVER
     * @param array<string, mixed> $sesion $_SESSION (se modifica: token y hora del último envío)
     * @param callable(array): bool $enviarCorreo recibe el correo ya construido y dice si salió
     * @param (callable(string): string)|null $verificarRecaptcha null si el reCAPTCHA está desactivado
     * @return array{codigo: int, cuerpo: array<string, mixed>}
     */
    public static function procesar(
        array $entrada,
        array $servidor,
        array &$sesion,
        float $ahora,
        string $destinatario,
        string $remitente,
        callable $enviarCorreo,
        ?callable $verificarRecaptcha = null,
    ): array {
        if (!ContactSecurity::esMismoOrigen($servidor)) {
            return self::fallo(403, 'No s\'ha pogut verificar la sol·licitud. Recarrega la pàgina i torna-ho a provar.');
        }

        if (!ContactSecurity::esTokenValido($sesion, $entrada['csrf_token'] ?? null)) {
            return self::fallo(403, 'La sessió ha caducat. Recarrega la pàgina i torna-ho a provar.');
        }

        if (ContactSecurity::superaElLimiteDeFrecuencia($sesion, (int) $ahora)) {
            return self::fallo(429, 'Massa enviaments seguits. Espera uns segons i torna-ho a provar.');
        }

        // Un robot rellena el campo trampa: se responde como si todo fuese bien, pero no se envía nada.
        if (ContactForm::esSpam($entrada)) {
            return ['codigo' => 200, 'cuerpo' => ['ok' => true, 'message' => self::MENSAJE_CORRECTO]];
        }

        if (ContactSecurity::llegoDemasiadoRapido($sesion, $ahora)) {
            return self::fallo(429, 'Has enviat el formulari massa de pressa. Espera un moment i torna-ho a provar.');
        }

        if ($verificarRecaptcha !== null) {
            $respuestaDelNavegador = $entrada['recaptcha_response'] ?? '';
            $veredicto = $verificarRecaptcha(is_string($respuestaDelNavegador) ? $respuestaDelNavegador : '');

            if ($veredicto === 'inaccesible') {
                return self::fallo(503, 'No hem pogut verificar que no ets un robot. Torna-ho a provar d\'aquí a una estona.');
            }
            if ($veredicto !== 'ok') {
                return self::fallo(403, 'No hem pogut verificar que no ets un robot. Recarrega la pàgina i torna-ho a provar.');
            }
        }

        $resultado = ContactForm::validar($entrada);
        if ($resultado['errores'] !== []) {
            return [
                'codigo' => 422,
                'cuerpo' => [
                    'ok' => false,
                    'message' => 'Revisa els camps marcats.',
                    'errors' => ContactForm::mensajesDeError($resultado['errores']),
                ],
            ];
        }

        $correo = ContactForm::construirCorreo($resultado['datos'], $destinatario, $remitente);
        if (!$enviarCorreo($correo)) {
            return self::fallo(500, 'No hem pogut enviar el missatge. Torna-ho a provar més tard.');
        }

        // Solo un envío que ha salido cuenta para el límite de frecuencia.
        ContactSecurity::marcarEnviado($sesion, (int) $ahora);

        return [
            'codigo' => 200,
            'cuerpo' => [
                'ok' => true,
                'message' => self::MENSAJE_CORRECTO,
                'token' => ContactSecurity::emitirToken($sesion, $ahora),
            ],
        ];
    }

    /** @return array{codigo: int, cuerpo: array{ok: false, message: string}} */
    private static function fallo(int $codigo, string $mensaje): array
    {
        return ['codigo' => $codigo, 'cuerpo' => ['ok' => false, 'message' => $mensaje]];
    }
}
