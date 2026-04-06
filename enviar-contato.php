<?php
/**
 * Alphasec — Processador do formulário de contato
 * Recebe POST via fetch (AJAX) e envia e-mail.
 */

// Só aceita POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Método não permitido.');
}

header('Content-Type: application/json; charset=utf-8');

// -------------------------------------------------------
// CONFIGURAÇÕES — ajuste conforme necessário
// -------------------------------------------------------
define('DESTINATARIO', 'contato@alphasec.com.br');
define('ASSUNTO_PREFIX', '[Site Alphasec] ');
// -------------------------------------------------------

/**
 * Sanitiza uma string removendo tags e espaços extras.
 */
function limpar(string $valor): string {
    return htmlspecialchars(strip_tags(trim($valor)), ENT_QUOTES, 'UTF-8');
}

function responder(bool $sucesso, string $mensagem): void {
    echo json_encode(['sucesso' => $sucesso, 'mensagem' => $mensagem], JSON_UNESCAPED_UNICODE);
    exit;
}

// Lê e valida os campos
$nome     = limpar($_POST['nome']     ?? '');
$email    = limpar($_POST['email']    ?? '');
$assunto  = limpar($_POST['assunto']  ?? '');
$mensagem = limpar($_POST['mensagem'] ?? '');

if ($nome === '' || $email === '' || $assunto === '' || $mensagem === '') {
    responder(false, 'Preencha todos os campos obrigatórios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(false, 'Informe um endereço de e-mail válido.');
}

if (mb_strlen($nome) > 120 || mb_strlen($assunto) > 120) {
    responder(false, 'Campo nome ou assunto muito longo.');
}

if (mb_strlen($mensagem) > 5000) {
    responder(false, 'Mensagem muito longa (máximo 5000 caracteres).');
}

// Monta o corpo do e-mail
$corpo = "Você recebeu uma nova mensagem pelo site da Alphasec.\n\n"
       . "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
       . "Nome:     {$nome}\n"
       . "E-mail:   {$email}\n"
       . "Assunto:  {$assunto}\n"
       . "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
       . $mensagem
       . "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
       . "Mensagem enviada em: " . date('d/m/Y H:i') . "\n";

// Cabeçalhos do e-mail
$headers  = "From: Site Alphasec <noreply@alphasec.com.br>\r\n";
$headers .= "Reply-To: {$nome} <{$email}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$assuntoEmail = ASSUNTO_PREFIX . $assunto;

// Envia
$enviado = mail(DESTINATARIO, $assuntoEmail, $corpo, $headers);

if ($enviado) {
    responder(true, 'Mensagem enviada com sucesso! Em breve entraremos em contato.');
} else {
    responder(false, 'Erro ao enviar a mensagem. Tente novamente ou entre em contato pelo WhatsApp.');
}
