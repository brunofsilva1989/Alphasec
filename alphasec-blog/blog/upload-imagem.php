<?php
/**
 * upload-imagem.php — Upload de imagens para o blog Alphasec
 */

define('SENHA_CORRETA', 'alphasec2026');
define('PASTA_UPLOAD',  __DIR__ . '/assets/imgs/');
define('URL_BASE',      'assets/imgs/');
define('TAMANHO_MAX',   5 * 1024 * 1024); // 5 MB
define('TIPOS_ACEITOS', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { erro(405, 'Método não permitido.'); }

// Valida senha — vem no FormData agora (compatível com XAMPP/Windows)
$senha = $_POST['senha'] ?? '';
if ($senha !== SENHA_CORRETA) erro(403, 'Acesso negado.');

// Verifica se veio arquivo
if (empty($_FILES['imagem'])) erro(400, 'Nenhuma imagem enviada.');

$arquivo = $_FILES['imagem'];

if ($arquivo['error'] !== UPLOAD_ERR_OK) erro(400, 'Erro no upload: código ' . $arquivo['error']);
if ($arquivo['size'] > TAMANHO_MAX)      erro(400, 'Imagem muito grande. Máximo: 5 MB.');

// Tipo MIME real
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $arquivo['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, TIPOS_ACEITOS)) erro(400, 'Tipo não permitido. Use JPG, PNG, WebP ou GIF.');

$exts = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
$ext  = $exts[$mime];
$nome = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$destino = PASTA_UPLOAD . $nome;

if (!is_dir(PASTA_UPLOAD)) mkdir(PASTA_UPLOAD, 0755, true);

if (!move_uploaded_file($arquivo['tmp_name'], $destino)) {
    erro(500, 'Falha ao salvar. Verifique permissões da pasta assets/imgs/');
}

echo json_encode(['ok' => true, 'url' => URL_BASE . $nome, 'nome' => $nome]);

function erro($code, $msg) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'erro' => $msg]);
    exit;
}