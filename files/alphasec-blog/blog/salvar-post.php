<?php
/**
 * salvar-post.php — API de salvamento do Blog Alphasec
 * Recebe JSON via POST, valida a senha e grava posts/posts.json
 *
 * ⚠️  MANTENHA ESTE ARQUIVO PROTEGIDO.
 *     A senha abaixo deve ser IDÊNTICA à definida em admin.html (SENHA_ADMIN).
 */

// ── Configuração ──────────────────────────────────────────────
define('SENHA_CORRETA', 'alphasec2025'); // ← altere para uma senha forte
define('POSTS_FILE', __DIR__ . '/posts/posts.json');

// ── CORS / Headers ───────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');       // Restrinja ao domínio do site em produção
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Só aceita POST ────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'erro' => 'Método não permitido.']);
    exit;
}

// ── Lê o body JSON ───────────────────────────────────────────
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'erro' => 'Payload inválido.']);
    exit;
}

// ── Valida senha ─────────────────────────────────────────────
if (!isset($data['senha']) || $data['senha'] !== SENHA_CORRETA) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'erro' => 'Acesso negado.']);
    exit;
}

// ── Valida estrutura dos posts ────────────────────────────────
if (!isset($data['posts']) || !is_array($data['posts'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'erro' => 'Lista de posts inválida.']);
    exit;
}

$posts = $data['posts'];

// Sanitiza cada post (garante campos obrigatórios)
$campos = ['id', 'titulo', 'resumo', 'conteudo', 'imagem', 'categoria', 'autor', 'data'];
foreach ($posts as $i => $post) {
    foreach ($campos as $campo) {
        if (empty($post[$campo])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'erro' => "Post #{$i}: campo '{$campo}' obrigatório."]);
            exit;
        }
    }
    // Garante boolean em destaque
    $posts[$i]['destaque'] = !empty($post['destaque']);
}

// ── Grava o arquivo ───────────────────────────────────────────
$json = json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if (file_put_contents(POSTS_FILE, $json, LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'erro' => 'Falha ao gravar o arquivo. Verifique as permissões da pasta posts/.']);
    exit;
}

// ── Sucesso ──────────────────────────────────────────────────
echo json_encode([
    'ok'    => true,
    'total' => count($posts),
    'msg'   => 'Posts salvos com sucesso.'
]);
