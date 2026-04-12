<?php
/**
 * Alphasec — Processador do formulário de contato
 * Recebe POST via fetch (AJAX) e envia e-mail.
 */

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');

register_shutdown_function(function (): void {
    $erro = error_get_last();
    if (!$erro) {
        return;
    }
    $tiposFatais = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR];
    if (!in_array($erro['type'], $tiposFatais, true)) {
        return;
    }
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Falha interna no servidor ao processar o envio.',
    ], JSON_UNESCAPED_UNICODE);
});

// -------------------------------------------------------
// CONFIGURAÇÕES — ajuste conforme necessário
// -------------------------------------------------------
define('DESTINATARIO', 'Contato@alphasec.com.br');
define('ASSUNTO_PREFIX', '[Site Alphasec] ');

define('SMTP_HOST', 'mail.alphasec.com.br');
define('SMTP_PORT', 587);
define('SMTP_USER', 'Contato@alphasec.com.br');
define('SMTP_PASS', 'pauloo3003');
define('SMTP_FROM_EMAIL', 'Contato@alphasec.com.br');
define('SMTP_FROM_NAME', 'Site Alphasec');
define('APP_DEBUG', true);
define('SMTP_TLS_VERIFY_PEER', false);
define('SMTP_TLS_VERIFY_PEER_NAME', false);
define('SMTP_TLS_ALLOW_SELF_SIGNED', true);
// -------------------------------------------------------

$REQUEST_ID = date('YmdHis') . '-' . bin2hex(random_bytes(4));

function appLog(string $requestId, string $etapa, array $dados = []): void {
    $linha = [
        'request_id' => $requestId,
        'etapa' => $etapa,
        'dados' => $dados,
    ];

    $json = json_encode($linha, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        $json = '{"request_id":"' . $requestId . '","etapa":"' . $etapa . '","dados":"erro_ao_gerar_json"}';
    }

    error_log('[AlphasecContato] ' . $json);

    $dir = __DIR__ . DIRECTORY_SEPARATOR . 'logs';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }

    $arquivo = $dir . DIRECTORY_SEPARATOR . 'contato-debug.log';
    @file_put_contents($arquivo, date('c') . ' ' . $json . PHP_EOL, FILE_APPEND);
}

/**
 * Sanitiza uma string removendo tags e espaços extras.
 */
function limpar(string $valor): string {
    return htmlspecialchars(strip_tags(trim($valor)), ENT_QUOTES, 'UTF-8');
}

function responder(bool $sucesso, string $mensagem, ?string $requestId = null, array $debug = []): void {
    $saida = ['sucesso' => $sucesso, 'mensagem' => $mensagem];
    if ($requestId !== null) {
        $saida['request_id'] = $requestId;
    }
    if (APP_DEBUG && !empty($debug)) {
        $saida['debug'] = $debug;
    }
    echo json_encode($saida, JSON_UNESCAPED_UNICODE);
    exit;
}

function tamanhoTexto(string $texto): int {
    if (function_exists('mb_strlen')) {
        return mb_strlen($texto);
    }
    return strlen(utf8_decode($texto));
}

function smtpLerResposta($conexao): array {
    $resposta = '';
    while (($linha = fgets($conexao, 515)) !== false) {
        $resposta .= $linha;
        if (strlen($linha) >= 4 && $linha[3] === ' ') {
            break;
        }
    }
    if ($resposta === '') {
        return [0, 'Sem resposta do servidor SMTP'];
    }
    return [(int) substr($resposta, 0, 3), $resposta];
}

function smtpComando($conexao, string $comando, array $codesEsperados, array &$debugSteps, string $requestId, string $label): bool {
    fwrite($conexao, $comando . "\r\n");
    [$code, $msg] = smtpLerResposta($conexao);
    $debugSteps[] = [
        'etapa' => $label,
        'codigo' => $code,
        'resposta' => trim($msg),
    ];
    if (!in_array($code, $codesEsperados, true)) {
        appLog($requestId, 'smtp_comando_erro', [
            'comando' => $label,
            'codigo' => $code,
            'resposta' => trim($msg),
        ]);
        return false;
    }
    return true;
}

function smtpEnviarEmail(string $destinatario, string $assunto, string $corpoHtml, string $replyToEmail, string $replyToNome, string $requestId, array &$debugSteps): bool {
    $contexto = stream_context_create([
        'ssl' => [
            'verify_peer' => SMTP_TLS_VERIFY_PEER,
            'verify_peer_name' => SMTP_TLS_VERIFY_PEER_NAME,
            'allow_self_signed' => SMTP_TLS_ALLOW_SELF_SIGNED,
            'SNI_enabled' => true,
            'peer_name' => SMTP_HOST,
        ],
    ]);

    $conexao = @stream_socket_client(
        'tcp://' . SMTP_HOST . ':' . SMTP_PORT,
        $errno,
        $errstr,
        15,
        STREAM_CLIENT_CONNECT,
        $contexto
    );
    if (!$conexao) {
        $debugSteps[] = ['etapa' => 'conexao', 'erro' => $errno . ' - ' . $errstr];
        appLog($requestId, 'smtp_conexao_falhou', ['erro' => $errno . ' - ' . $errstr]);
        return false;
    }

    stream_set_timeout($conexao, 15);

    [$codeInicial, $msgInicial] = smtpLerResposta($conexao);
    $debugSteps[] = ['etapa' => 'banner', 'codigo' => $codeInicial, 'resposta' => trim($msgInicial)];
    if ($codeInicial !== 220) {
        appLog($requestId, 'smtp_banner_invalido', ['codigo' => $codeInicial, 'resposta' => trim($msgInicial)]);
        fclose($conexao);
        return false;
    }

    if (!smtpComando($conexao, 'EHLO alphasec.com.br', [250], $debugSteps, $requestId, 'EHLO_1')) {
        fclose($conexao);
        return false;
    }

    if (!smtpComando($conexao, 'STARTTLS', [220], $debugSteps, $requestId, 'STARTTLS')) {
        fclose($conexao);
        return false;
    }

    if (!stream_socket_enable_crypto($conexao, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        $debugSteps[] = ['etapa' => 'TLS', 'erro' => 'Falha ao iniciar TLS'];
        appLog($requestId, 'smtp_tls_falhou');
        fclose($conexao);
        return false;
    }
    $debugSteps[] = ['etapa' => 'TLS', 'ok' => true];

    if (!smtpComando($conexao, 'EHLO alphasec.com.br', [250], $debugSteps, $requestId, 'EHLO_2')) {
        fclose($conexao);
        return false;
    }

    // Autentica apenas quando usuário e senha estiverem configurados.
    if (SMTP_USER !== '' && SMTP_PASS !== '') {
        if (!smtpComando($conexao, 'AUTH LOGIN', [334], $debugSteps, $requestId, 'AUTH_LOGIN')) {
            fclose($conexao);
            return false;
        }
        if (!smtpComando($conexao, base64_encode(SMTP_USER), [334], $debugSteps, $requestId, 'AUTH_USER')) {
            fclose($conexao);
            return false;
        }
        if (!smtpComando($conexao, base64_encode(SMTP_PASS), [235], $debugSteps, $requestId, 'AUTH_PASS')) {
            fclose($conexao);
            return false;
        }
    }

    if (!smtpComando($conexao, 'MAIL FROM:<' . SMTP_FROM_EMAIL . '>', [250], $debugSteps, $requestId, 'MAIL_FROM')) {
        fclose($conexao);
        return false;
    }
    if (!smtpComando($conexao, 'RCPT TO:<' . $destinatario . '>', [250, 251], $debugSteps, $requestId, 'RCPT_TO')) {
        fclose($conexao);
        return false;
    }
    if (!smtpComando($conexao, 'DATA', [354], $debugSteps, $requestId, 'DATA')) {
        fclose($conexao);
        return false;
    }

    $headers  = 'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM_EMAIL . ">\r\n";
    $headers .= 'Reply-To: ' . $replyToNome . ' <' . $replyToEmail . ">\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";

    $mensagem = $headers
        . 'Subject: =?UTF-8?B?' . base64_encode($assunto) . "=?=\r\n"
        . "\r\n"
        . $corpoHtml;

    $mensagem = str_replace(["\r\n.", "\n."], ["\r\n..", "\n.."], $mensagem);

    fwrite($conexao, $mensagem . "\r\n.\r\n");
    [$codeData, $msgData] = smtpLerResposta($conexao);
    $debugSteps[] = ['etapa' => 'DATA_RESULT', 'codigo' => $codeData, 'resposta' => trim($msgData)];
    if ($codeData !== 250) {
        appLog($requestId, 'smtp_data_falhou', ['codigo' => $codeData, 'resposta' => trim($msgData)]);
        fclose($conexao);
        return false;
    }

    smtpComando($conexao, 'QUIT', [221], $debugSteps, $requestId, 'QUIT');
    fclose($conexao);
    return true;
}

// Só aceita POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    responder(false, 'Método não permitido.', $REQUEST_ID);
}

appLog($REQUEST_ID, 'inicio_requisicao', [
    'metodo' => $_SERVER['REQUEST_METHOD'] ?? '',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
]);

// Lê e valida os campos
$nome     = limpar($_POST['nome']     ?? '');
$email    = limpar($_POST['email']    ?? '');
$assunto  = limpar($_POST['assunto']  ?? '');
$mensagem = limpar($_POST['mensagem'] ?? '');

if ($nome === '' || $email === '' || $assunto === '' || $mensagem === '') {
    appLog($REQUEST_ID, 'validacao_falhou', ['motivo' => 'campos_obrigatorios']);
    responder(false, 'Preencha todos os campos obrigatórios.', $REQUEST_ID);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    appLog($REQUEST_ID, 'validacao_falhou', ['motivo' => 'email_invalido']);
    responder(false, 'Informe um endereço de e-mail válido.', $REQUEST_ID);
}

if (tamanhoTexto($nome) > 120 || tamanhoTexto($assunto) > 120) {
    appLog($REQUEST_ID, 'validacao_falhou', ['motivo' => 'nome_ou_assunto_longo']);
    responder(false, 'Campo nome ou assunto muito longo.', $REQUEST_ID);
}

if (tamanhoTexto($mensagem) > 5000) {
    appLog($REQUEST_ID, 'validacao_falhou', ['motivo' => 'mensagem_longa']);
    responder(false, 'Mensagem muito longa (máximo 5000 caracteres).', $REQUEST_ID);
}

// Monta o corpo do e-mail (HTML)
$mensagemHtml = nl2br($mensagem, false);
$dataEnvio = date('d/m/Y H:i');

$corpo = '<!doctype html>'
    . '<html lang="pt-br"><head><meta charset="UTF-8"><title>Novo contato - Alphasec</title></head><body style="margin:0;padding:0;background:#f3f5f8;font-family:Arial,sans-serif;color:#0f172a;">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f5f8;padding:24px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#ffffff;border:1px solid #d9e0ea;border-radius:12px;overflow:hidden;">'
    . '<tr><td style="background:#0a1628;color:#ffffff;padding:18px 22px;font-size:20px;font-weight:bold;">Novo contato pelo site - Alphasec</td></tr>'
    . '<tr><td style="padding:20px 22px;">'
    . '<p style="margin:0 0 14px 0;font-size:14px;color:#334155;">Voce recebeu uma nova mensagem enviada pelo formulario de contato.</p>'
    . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">'
    . '<tr><td style="padding:8px 0;width:110px;color:#64748b;">Nome</td><td style="padding:8px 0;font-weight:600;">' . $nome . '</td></tr>'
    . '<tr><td style="padding:8px 0;width:110px;color:#64748b;">E-mail</td><td style="padding:8px 0;"><a href="mailto:' . $email . '" style="color:#1565c0;text-decoration:none;">' . $email . '</a></td></tr>'
    . '<tr><td style="padding:8px 0;width:110px;color:#64748b;">Assunto</td><td style="padding:8px 0;">' . $assunto . '</td></tr>'
    . '<tr><td style="padding:8px 0;width:110px;color:#64748b;">Enviado em</td><td style="padding:8px 0;">' . $dataEnvio . '</td></tr>'
    . '</table>'
    . '<div style="margin-top:16px;padding:14px;border:1px solid #dbe4f0;border-radius:10px;background:#f8fbff;">'
    . '<div style="font-size:13px;color:#64748b;margin-bottom:8px;">Mensagem</div>'
    . '<div style="font-size:15px;line-height:1.6;white-space:normal;">' . $mensagemHtml . '</div>'
    . '</div>'
    . '</td></tr>'
    . '</table>'
    . '</td></tr></table>'
    . '</body></html>';

$assuntoEmail = ASSUNTO_PREFIX . $assunto;

// Envia por SMTP autenticado
$smtpDebug = [];
$enviado = smtpEnviarEmail(DESTINATARIO, $assuntoEmail, $corpo, $email, $nome, $REQUEST_ID, $smtpDebug);

if (!$enviado) {
    appLog($REQUEST_ID, 'smtp_falhou_tentando_mail');
    $headers  = 'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM_EMAIL . ">\r\n";
    $headers .= 'Reply-To: ' . $nome . ' <' . $email . ">\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= 'X-Mailer: PHP/' . phpversion() . "\r\n";
    $enviado = @mail(DESTINATARIO, $assuntoEmail, $corpo, $headers);
}

if ($enviado) {
    appLog($REQUEST_ID, 'envio_ok');
    responder(true, 'Mensagem enviada com sucesso! Em breve entraremos em contato.', $REQUEST_ID, ['smtp' => $smtpDebug]);
} else {
    appLog($REQUEST_ID, 'envio_falhou', ['smtp' => $smtpDebug]);
    responder(false, 'Erro ao enviar a mensagem. Tente novamente em alguns instantes.', $REQUEST_ID, ['smtp' => $smtpDebug]);
}
