/* ══════════════════════════════════════════
   CONFIGURAÇÃO
══════════════════════════════════════════ */
const SENHA_ADMIN = 'alphasec2026';
const API_URL     = 'salvar-post.php';
const IMAGEM_PADRAO = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80';

/* ══════════════════════════════════════════
   AUTENTICAÇÃO — sem sessionStorage
══════════════════════════════════════════ */
let autenticado = false;

function tentarLogin() {
  const senha = document.getElementById('campo-senha').value;
  if (senha === SENHA_ADMIN) {
    autenticado = true;
    document.getElementById('erro-login').style.display = 'none';
    abrirPainel();
  } else {
    document.getElementById('erro-login').style.display = 'block';
    document.getElementById('campo-senha').value = '';
    document.getElementById('campo-senha').focus();
  }
}

function abrirPainel() {
  document.getElementById('tela-login').style.display = 'none';
  document.getElementById('painel').style.display = 'block';
  document.getElementById('f-data').value = new Date().toISOString().split('T')[0];
  carregarLista();
  initEditor();
}

function sair() {
  autenticado = false;
  document.getElementById('tela-login').style.display = 'flex';
  document.getElementById('painel').style.display = 'none';
  document.getElementById('campo-senha').value = '';
}

window.addEventListener('load', () => {
  // Aviso se aberto via file://
  if (window.location.protocol === 'file:') {
    const aviso = document.createElement('div');
    aviso.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#c00;color:#fff;padding:10px 20px;font-weight:700;text-align:center;z-index:99999;font-size:.88rem;';
    aviso.textContent = '⚠️ Abra esta página pelo XAMPP (http://localhost/...) — salvar não funciona via file://';
    document.body.prepend(aviso);
  }

  // Enter no campo senha
  document.getElementById('campo-senha').addEventListener('keydown', e => {
    if (e.key === 'Enter') tentarLogin();
  });

  // Contador resumo
  document.getElementById('f-resumo').addEventListener('input', () => {
    document.getElementById('cont-resumo').textContent =
      document.getElementById('f-resumo').value.length;
  });
});

/* ══════════════════════════════════════════
   EDITOR QUILL
══════════════════════════════════════════ */
let quill;

function initEditor() {
  if (quill) return;
  quill = new Quill('#ql-editor', {
    theme: 'snow',
    placeholder: 'Escreva o conteúdo completo do artigo aqui…',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean']
      ]
    }
  });
}

/* ══════════════════════════════════════════
   POSTS
══════════════════════════════════════════ */
let posts   = [];
let salvando = false;

function formatarData(d) {
  const [a, m, di] = d.split('-');
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${di} ${meses[parseInt(m) - 1]}. ${a}`;
}

async function carregarLista() {
  try {
    const res = await fetch('posts/posts.json?' + Date.now());
    posts = await res.json();
    posts.sort((a, b) => new Date(b.data) - new Date(a.data));
    renderizarLista();
  } catch (e) {
    document.getElementById('lista-posts').innerHTML =
      '<p class="text-danger p-3">Erro ao carregar posts. Verifique se <code>posts/posts.json</code> existe.</p>';
  }
}

function renderizarLista() {
  const el = document.getElementById('lista-posts');
  if (!posts.length) {
    el.innerHTML = '<p class="text-muted text-center py-5">Nenhum artigo ainda. Crie o primeiro!</p>';
    return;
  }
  el.innerHTML = posts.map(p => `
    <div class="post-item">
      <img src="${p.imagem}" alt="${p.titulo}"
           onerror="this.src='https://placehold.co/80x60?text=IMG'" />
      <div class="info">
        <div class="titulo">${p.titulo}</div>
        <div class="meta">
          <span class="badge-cat me-2">${p.categoria}</span>
          <i class="bi bi-calendar3"></i> ${formatarData(p.data)}
          ${p.destaque ? '<span class="ms-2 badge bg-warning text-dark">⭐ Destaque</span>' : ''}
        </div>
      </div>
      <div class="acoes">
        <button class="btn-editar" onclick="editarPost('${p.id}')">
          <i class="bi bi-pencil me-1"></i>Editar
        </button>
        <button class="btn-excluir" onclick="excluirPost('${p.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

function editarPost(id) {
  const p = posts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-id').value       = p.id;
  document.getElementById('f-titulo').value      = p.titulo;
  document.getElementById('f-resumo').value      = p.resumo;
  document.getElementById('cont-resumo').textContent = p.resumo.length;
  document.getElementById('f-categoria').value   = p.categoria;
  document.getElementById('f-autor').value       = p.autor;
  document.getElementById('f-data').value        = p.data;
  document.getElementById('f-imagem').value      = p.imagem === IMAGEM_PADRAO ? '' : p.imagem;
  document.getElementById('f-destaque').checked  = !!p.destaque;
  previewImg();
  quill.root.innerHTML = p.conteudo;
  document.getElementById('form-titulo-aba').textContent = 'Editando artigo';
  trocarTab('novo');
}

function excluirPost(id) {
  const p = posts.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Excluir o artigo:\n\n"${p.titulo}"\n\nEssa ação não pode ser desfeita.`)) return;
  posts = posts.filter(x => x.id !== id);
  persistir('Artigo excluído com sucesso.');
}

async function salvarPost(event) {
  if (event) event.preventDefault();
  if (salvando) return;

  const titulo    = document.getElementById('f-titulo').value.trim();
  const resumo    = document.getElementById('f-resumo').value.trim();
  const categoria = document.getElementById('f-categoria').value || 'Geral';
  const autor     = document.getElementById('f-autor').value.trim() || 'Equipe Alphasec';
  const data      = document.getElementById('f-data').value || new Date().toISOString().split('T')[0];
  const imagem    = document.getElementById('f-imagem').value.trim() || IMAGEM_PADRAO;
  const destaque  = document.getElementById('f-destaque').checked;
  const conteudo  = quill ? quill.root.innerHTML : '<p></p>';
  const textoRaw  = quill ? quill.getText().trim() : '';

  // Validação mínima
  if (!titulo && !resumo && !textoRaw) {
    toast('Preencha pelo menos o título antes de salvar.', 'erro');
    return;
  }

  const tituloFinal  = titulo  || resumo.slice(0, 80) || 'Sem título';
  const resumoFinal  = resumo  || textoRaw.slice(0, 200) || tituloFinal;
  const conteudoFinal = textoRaw ? conteudo : `<p>${resumoFinal}</p>`;

  const slug = tituloFinal.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const editId = document.getElementById('edit-id').value;

  if (editId) {
    const idx = posts.findIndex(p => p.id === editId);
    if (idx >= 0) {
      posts[idx] = { ...posts[idx],
        titulo: tituloFinal, slug, resumo: resumoFinal,
        categoria, autor, data, imagem, destaque, conteudo: conteudoFinal };
    }
  } else {
    posts.unshift({
      id: String(Date.now()), titulo: tituloFinal, slug,
      resumo: resumoFinal, conteudo: conteudoFinal,
      imagem, categoria, autor, data, destaque
    });
  }

  await persistir(editId ? 'Artigo atualizado!' : 'Artigo publicado!');
}

async function persistir(mensagem) {
  salvando = true;
  const btn = document.getElementById('btn-salvar-post');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Salvando…'; }

  try {
    const res  = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts, senha: SENHA_ADMIN })
    });
    const texto = await res.text();
    let json;
    try { json = JSON.parse(texto); }
    catch { throw new Error('PHP não retornou JSON válido. Resposta: ' + texto.slice(0, 200)); }

    if (json.ok) {
      toast(mensagem, 'sucesso');
      limparForm();
      trocarTab('lista');
      await carregarLista();
    } else {
      toast('Erro: ' + (json.erro || 'resposta inválida'), 'erro');
    }
  } catch (e) {
    console.error('[Blog]', e);
    toast('Falha ao salvar: ' + e.message, 'erro');
  } finally {
    salvando = false;
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}

function limparForm() {
  document.getElementById('edit-id').value   = '';
  document.getElementById('f-titulo').value  = '';
  document.getElementById('f-resumo').value  = '';
  document.getElementById('cont-resumo').textContent = '0';
  document.getElementById('f-categoria').value = '';
  document.getElementById('f-autor').value   = 'Equipe Alphasec';
  document.getElementById('f-data').value    = new Date().toISOString().split('T')[0];
  document.getElementById('f-imagem').value  = '';
  document.getElementById('f-destaque').checked = false;
  document.getElementById('preview-imagem').style.display = 'none';
  document.getElementById('form-titulo-aba').textContent  = 'Novo Artigo';
  if (quill) quill.setText('');
}

/* ══ UI helpers ══ */
function trocarTab(tab) {
  document.getElementById('tab-lista').style.display = tab === 'lista' ? 'block' : 'none';
  document.getElementById('tab-novo').style.display  = tab === 'novo'  ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('ativo',
      (i === 0 && tab === 'lista') || (i === 1 && tab === 'novo'));
  });
}

function previewImg() {
  const url = document.getElementById('f-imagem').value;
  const img = document.getElementById('preview-imagem');
  if (url) { img.src = url; img.style.display = 'block'; }
  else { img.style.display = 'none'; }
}

function toast(msg, tipo = 'sucesso') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast-msg ${tipo}`;
  t.innerHTML = `<i class="bi bi-${tipo === 'sucesso'
    ? 'check-circle-fill text-success'
    : 'exclamation-triangle-fill text-danger'}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

/* ══════════════════════════════════════════
   UPLOAD DE IMAGEM LOCAL
══════════════════════════════════════════ */

function dragOver(e) {
  e.preventDefault();
  document.getElementById('upload-area').classList.add('dragover');
}

function dragLeave(e) {
  document.getElementById('upload-area').classList.remove('dragover');
}

function dropImagem(e) {
  e.preventDefault();
  document.getElementById('upload-area').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) uploadImagem(file);
}

async function uploadImagem(file) {
  if (!file) return;

  const tiposOk = ['image/jpeg','image/png','image/webp','image/gif'];
  if (!tiposOk.includes(file.type)) {
    toast('Tipo não permitido. Use JPG, PNG, WebP ou GIF.', 'erro');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast('Imagem muito grande. Máximo: 5 MB.', 'erro');
    return;
  }

  const prog   = document.getElementById('upload-progress');
  const status = document.getElementById('upload-status');
  prog.style.display = 'block';
  status.textContent = 'Enviando imagem…';

  const form = new FormData();
  form.append('imagem', file);
  form.append('senha', SENHA_ADMIN);

  try {
    const res  = await fetch('upload-imagem.php', { method: 'POST', body: form });
    const json = await res.json();

    if (json.ok) {
      document.getElementById('f-imagem').value = json.url;
      previewImg();
      status.textContent = '✅ ' + json.nome;
      toast('Imagem salva em assets/imgs/!', 'sucesso');
    } else {
      status.textContent = '❌ ' + json.erro;
      toast('Erro no upload: ' + json.erro, 'erro');
    }
  } catch(e) {
    status.textContent = '❌ Falha na conexão.';
    toast('Erro: ' + e.message, 'erro');
  }
}