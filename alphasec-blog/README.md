# 📰 Blog Alphasec — Guia de Instalação e Uso

## O que foi criado

```
blog/
├── index.html         → Página do blog (lista de artigos)
├── post.html          → Página individual de cada artigo
├── admin.html         → Painel de gerenciamento (protegido por senha)
├── salvar-post.php    → API PHP que salva os posts
└── posts/
    └── posts.json     → Banco de dados dos artigos (formato JSON)

SECAO-INDEX-BLOG.html  → Trecho HTML/CSS/JS para colar no index.html do site
```

---

## Instalação (passo a passo)

### 1. Copie a pasta `blog/` para o seu servidor
Coloque a pasta `blog/` dentro da raiz do site (mesmo nível que `index.html`).

### 2. Ajuste as permissões da pasta `posts/`
No servidor, garanta que o PHP possa escrever na pasta:
```bash
chmod 755 blog/posts/
chmod 644 blog/posts/posts.json
```

### 3. Defina a senha do admin
Abra `blog/admin.html` e `blog/salvar-post.php`.
Em **ambos os arquivos**, altere a senha padrão `alphasec2025` para uma senha forte.

No `admin.html`:
```javascript
const SENHA_ADMIN = 'SuaSenhaForteAqui';
```

No `salvar-post.php`:
```php
define('SENHA_CORRETA', 'SuaSenhaForteAqui');
```

### 4. Adicione a seção blog ao index.html
Abra `SECAO-INDEX-BLOG.html` e copie o conteúdo.
Cole no `index.html` principal **após a seção "Nosso Processo"**.

### 5. Adicione o link "Blog" na navbar de todas as páginas
Nas páginas `index.html`, `quem-somos.html`, `servicos.html`, `locacao.html` e `contato.html`,
adicione no menu:
```html
<li class="nav-item">
  <a class="nav-link" href="blog/index.html">Blog</a>
</li>
```

---

## Como o cliente usa (sem tocar em código)

### Acessar o painel
1. Abrir o navegador e ir para: `https://seusite.com.br/blog/admin.html`
2. Digitar a senha e clicar em **Entrar**

### Criar um novo artigo
1. Clicar em **"Novo Artigo"**
2. Preencher os campos:
   - **Título**: O título do artigo
   - **Resumo**: Aparece nos cards da listagem (máx. 200 caracteres)
   - **Categoria**: Selecionar da lista
   - **Data**: Quando o artigo será publicado
   - **URL da imagem**: Copiar o link de uma foto (Unsplash, Google Fotos, etc.)
   - **Conteúdo**: Escrever o texto com o editor (botões de formatação disponíveis)
3. Clicar em **"Salvar artigo"** — pronto, está publicado!

### Editar um artigo existente
1. Na lista, clicar no botão **"Editar"** ao lado do artigo
2. Alterar o que quiser
3. Clicar em **"Salvar artigo"**

### Excluir um artigo
1. Na lista, clicar no ícone de **lixeira** ao lado do artigo
2. Confirmar a exclusão

---

## Dica: Imagens gratuitas

O cliente pode usar o **Unsplash** (https://unsplash.com):
1. Buscar o assunto desejado (ex: "security camera")
2. Clicar na foto
3. Clicar com botão direito → "Copiar endereço da imagem"
4. Colar no campo "URL da imagem"

---

## Estrutura de cada artigo (posts.json)

```json
{
  "id": "123456789",
  "titulo": "Título do artigo",
  "slug": "titulo-do-artigo",
  "resumo": "Resumo curto para os cards",
  "conteudo": "<p>Conteúdo HTML completo do artigo</p>",
  "imagem": "https://url-da-imagem.jpg",
  "categoria": "CFTV",
  "autor": "Equipe Alphasec",
  "data": "2025-05-20",
  "destaque": false
}
```

---

## Observação sobre hospedagem

Este blog funciona com **qualquer hospedagem PHP** (hostinger, locaweb, kinghost, etc.).
Não precisa de banco de dados — tudo é salvo no arquivo `posts/posts.json`.

Se o servidor **não suportar PHP**, o painel admin ainda funciona,
mas ao salvar ele fará o **download automático do `posts.json`** para o computador.
Nesse caso, o cliente precisaria fazer upload manual do arquivo.

---

## Segurança

- A senha está em texto simples — suficiente para uso pessoal/pequeno negócio.
- Para mais segurança em produção, considere:
  - Mover `admin.html` para uma URL não óbvia
  - Adicionar autenticação HTTP Basic no servidor
  - Implementar rate limiting no `salvar-post.php`
