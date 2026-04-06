(() => {
  // =========================
  // CONFIGURAÇÕES DO CLIENTE
  // =========================
  // Formato: 55 + DDD + número (somente dígitos)
  // Ex.: 5511999999999
  const WHATSAPP_NUMBER = "5511959118648";
  const EMAIL = "contato@alphasec.com.br";
  const CIDADE = "Santo André - SP";

  function waLink(message) {
    const text = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  }

  // Ano no footer
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

    el.setAttribute("href", waLink(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });

  // -------------------------
  // Botão voltar ao topo
  // -------------------------
  const toTop = document.getElementById("toTop");
  const toggleTop = () => {
    if (!toTop) return;
    const show = window.scrollY > 500;
    toTop.classList.toggle("show", show);
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
  // Cookies (robusto)
  // -------------------------
  const banner = document.getElementById("cookieBanner");
  const btnAceitar = document.getElementById("cookieAceitar");
  const btnRecusar = document.getElementById("cookieRecusar");

  const STORAGE_KEY = "alphasec_cookie_consent";

  function showBanner() {
    if (!banner) return;
    banner.classList.add("show");
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("show");
  }

  function getConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // se o navegador bloquear localStorage, só esconde por sessão
    }
  }

  // Se nunca decidiu, mostra.
  if (banner) {
    const consent = getConsent();
    if (!consent) {
      // espera a página estabilizar (evita conflito com CSS carregando)
      window.setTimeout(showBanner, 600);
    }
  }

  if (btnAceitar) {
    btnAceitar.addEventListener("click", () => {
      setConsent("accepted");
      hideBanner();
    });
  }

  if (btnRecusar) {
    btnRecusar.addEventListener("click", () => {
      setConsent("declined");
      hideBanner();
    });
  }

  // -------------------------
  // E-mail helpers (opcional)
  // -------------------------
  document.querySelectorAll("a[data-email]").forEach((a) => {
    a.setAttribute("href", `mailto:${EMAIL}`);
  });

  // -------------------------
  // Formulário de contato — envio via PHP
  // -------------------------
  const contatoForm = document.getElementById("contatoForm");
  if (contatoForm) {
    contatoForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const btn = document.getElementById("btnEnviar");
      const feedback = document.getElementById("formFeedback");

      btn.disabled = true;
      btn.textContent = "Enviando…";
      feedback.className = "mt-3 d-none alert";
      feedback.textContent = "";

      try {
        const res = await fetch("enviar-contato.php", {
          method: "POST",
          body: new FormData(contatoForm),
        });

        const data = await res.json();

        feedback.textContent = data.mensagem;
        feedback.classList.remove("d-none");

        if (data.sucesso) {
          feedback.classList.add("alert-success");
          contatoForm.reset();
        } else {
          feedback.classList.add("alert-danger");
        }
      } catch {
        feedback.classList.remove("d-none");
        feedback.classList.add("alert-danger");
        feedback.textContent =
          "Erro de conexão. Tente novamente ou fale pelo WhatsApp.";
      } finally {
        btn.disabled = false;
        btn.textContent = "Enviar mensagem";
      }
    });
  }
})();
