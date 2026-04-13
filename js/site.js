(() => {
  // -------------------------
  // Bloqueio de download de imagens
  // -------------------------
  document.addEventListener("contextmenu", e => {
    if (e.target.tagName === "IMG") e.preventDefault();
  });
  document.addEventListener("dragstart", e => {
    if (e.target.tagName === "IMG") e.preventDefault();
  });

  // =========================
  // CONFIGURAÇÕES DO CLIENTE
  // =========================
  const WHATSAPP_NUMBER = "5511959118648";
  const EMAIL = "contato@alphasec.com.br";
  const CIDADE = "Atendimento Nacional";

  function waLink(message) {
    const text = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  }

  // Ano no footer
  document.querySelectorAll(".ano").forEach(el => el.textContent = new Date().getFullYear());
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  // -------------------------
  // WhatsApp links
  // -------------------------
  const defaultMsg = `Olá! Vim pelo site da Alphasec. Quero um orçamento.\n\nCidade: ${CIDADE}`;

  const waButtons = [
    "floatWhatsapp",
    "navWhatsapp",
    "heroWhatsapp",
    "ctaWhatsapp",
    "ctaWhatsapp2",
    "contatoWhatsapp",
    "topbarWhatsapp",
    "locacaoWhatsapp",
  ];

  waButtons.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    let msg = defaultMsg;
    if (id === "locacaoWhatsapp") {
      msg = `Olá! Vim pelo site da Alphasec. Quero informações sobre locação.\n\nCidade: ${CIDADE}`;
    }
    if (id !== "ctaWhatsapp") {
      el.setAttribute("href", waLink(msg));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });

  // CTA do hero — mensagem dinâmica conforme os selects
  const ctaWhatsapp = document.getElementById("ctaWhatsapp");
  if (ctaWhatsapp) {
    function updateCtaLink() {
      const ambiente = document.getElementById("selectAmbiente");
      const solucao  = document.getElementById("selectSolucao");
      const ambienteVal = (ambiente && ambiente.value) ? ambiente.value : null;
      const solucaoVal  = (solucao  && solucao.value)  ? solucao.value  : null;

      let msg;
      if (ambienteVal && solucaoVal) {
        msg = `Olá! Vim pelo site da Alphasec. Quero um orçamento para um ambiente ${ambienteVal}, com ${solucaoVal}.`;
      } else if (ambienteVal) {
        msg = `Olá! Vim pelo site da Alphasec. Quero um orçamento para um ambiente ${ambienteVal}.`;
      } else if (solucaoVal) {
        msg = `Olá! Vim pelo site da Alphasec. Quero um orçamento com a solução ${solucaoVal}.`;
      } else {
        msg = defaultMsg;
      }

      ctaWhatsapp.setAttribute("href", waLink(msg));
      ctaWhatsapp.setAttribute("target", "_blank");
      ctaWhatsapp.setAttribute("rel", "noopener noreferrer");
    }

    const selAmbiente = document.getElementById("selectAmbiente");
    const selSolucao  = document.getElementById("selectSolucao");
    if (selAmbiente) selAmbiente.addEventListener("change", updateCtaLink);
    if (selSolucao)  selSolucao.addEventListener("change", updateCtaLink);
    updateCtaLink();
  }

  // -------------------------
  // HERO SLIDER
  // -------------------------
  function initHeroSlider(heroEl) {
    const slides = heroEl.querySelectorAll(".hero-slide");
    const dots   = heroEl.querySelectorAll(".hero-dot");
    if (!slides.length) return;

    let current = 0;

    function goTo(idx) {
      slides[current].classList.remove("active");
      if (dots.length) dots[current].classList.remove("active");
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add("active");
      if (dots.length) dots[current].classList.add("active");
    }

    // Inicia primeiro slide
    goTo(0);

    // Auto-play
    let timer = setInterval(() => goTo(current + 1), 5500);

    // Clique nos indicadores
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        clearInterval(timer);
        goTo(i);
        timer = setInterval(() => goTo(current + 1), 5500);
      });
    });

    // Pausa ao focar o hero (acessibilidade)
    heroEl.addEventListener("mouseenter", () => clearInterval(timer));
    heroEl.addEventListener("mouseleave", () => {
      timer = setInterval(() => goTo(current + 1), 5500);
    });
  }

  document.querySelectorAll(".hero, .page-hero").forEach(initHeroSlider);

  // -------------------------
  // Botão voltar ao topo
  // -------------------------
  const toTop = document.getElementById("toTop");
  const toggleTop = () => {
    if (!toTop) return;
    toTop.classList.toggle("show", window.scrollY > 500);
  };
  window.addEventListener("scroll", toggleTop, { passive: true });
  toggleTop();
  if (toTop) {
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // -------------------------
  // Reveal animation (scroll)
  // -------------------------
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("show");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // -------------------------
  // Formulário de locação → WhatsApp
  // -------------------------
  const locacaoForm = document.getElementById("locacaoForm");
  if (locacaoForm) {
    locacaoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(locacaoForm));
      const msg = `Olá! Vim pelo site da Alphasec. Quero simular um plano de locação.\n\nNome: ${data.nome || "-"}\nTipo de local: ${data.tipo || "-"}\nQtd. câmeras: ${data.qtd || "-"}\nNecessidade: ${data.necessidade || "-"}\n\nCidade: ${CIDADE}`;
      window.open(waLink(msg), "_blank", "noopener,noreferrer");
    });
  }

  // -------------------------
  // Formulário de contato — envio via PHP
  // -------------------------
  const contatoForm = document.getElementById("contatoForm");
  if (contatoForm) {
    contatoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const startedAt = Date.now();
      const btn = document.getElementById("btnEnviar");
      const feedback = document.getElementById("formFeedback");
      btn.disabled = true;
      btn.textContent = "Enviando…";
      feedback.className = "mt-3 d-none alert";
      feedback.textContent = "";
      try {
        console.groupCollapsed("[Contato] Envio iniciado");
        console.log("Endpoint:", "enviar-contato.php");

        const res = await fetch("enviar-contato.php", {
          method: "POST",
          body: new FormData(contatoForm),
        });

        const raw = await res.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          data = {
            sucesso: false,
            mensagem: raw && raw.trim()
              ? `Falha no envio: ${raw.trim().slice(0, 220)}`
              : "Erro ao processar o envio no servidor.",
          };
        }

        console.log("HTTP status:", res.status, res.statusText);
        console.log("Resposta bruta:", raw);
        console.log("Resposta parseada:", data);
        if (data.request_id) {
          console.log("Request ID:", data.request_id);
        }
        if (data.debug) {
          console.log("Debug PHP:", data.debug);
        }
        console.log("Tempo total (ms):", Date.now() - startedAt);
        console.groupEnd();

        feedback.textContent = data.mensagem;
        feedback.classList.remove("d-none");
        if (res.ok && data.sucesso) {
          feedback.classList.add("alert-success");
          contatoForm.reset();
        } else {
          feedback.classList.add("alert-danger");
        }
      } catch {
        console.groupCollapsed("[Contato] Erro de rede no envio");
        console.error("Falha ao chamar enviar-contato.php");
        console.log("Tempo até erro (ms):", Date.now() - startedAt);
        console.groupEnd();
        feedback.classList.remove("d-none");
        feedback.classList.add("alert-danger");
        feedback.textContent = "Erro de conexão. Tente novamente em alguns instantes.";
      } finally {
        btn.disabled = false;
        btn.textContent = "Enviar mensagem";
      }
    });
  }

  // -------------------------
  // Cookies
  // -------------------------
  const banner    = document.getElementById("cookieBanner");
  const btnAceitar = document.getElementById("cookieAceitar");
  const btnRecusar = document.getElementById("cookieRecusar");
  const STORAGE_KEY = "alphasec_cookie_consent";

  function getConsent() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } }
  function setConsent(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* noop */ } }

  if (banner && !getConsent()) {
    window.setTimeout(() => banner.classList.add("show"), 700);
  }
  if (btnAceitar) btnAceitar.addEventListener("click", () => { setConsent("accepted"); banner.classList.remove("show"); });
  if (btnRecusar) btnRecusar.addEventListener("click", () => { setConsent("declined"); banner.classList.remove("show"); });

  // -------------------------
  // E-mail helpers
  // -------------------------
  document.querySelectorAll("a[data-email]").forEach((a) => {
    a.setAttribute("href", `mailto:${EMAIL}`);
  });
})();
