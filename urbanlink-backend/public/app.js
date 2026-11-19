(() => {
  const SESSION_KEY = "urbanlink.session";
  const USERS_KEY = "urbanlink.users";
  const page = document.body.dataset.page || "inicio";

  const readJson = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  const session = () => readJson(SESSION_KEY, null);
  const initialFor = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "UL";

  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;

    mount.innerHTML = `
      <a class="skip-link" href="#main-content">Pular para o conteúdo</a>
      <header class="site-header">
        <div class="header-inner">
          <div class="header-account">
            <button class="account-button" type="button" id="account-button" aria-expanded="false" aria-controls="account-menu" aria-label="Abrir menu da conta">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M5.8 19c.9-3 3.1-4.6 6.2-4.6s5.3 1.6 6.2 4.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
            </button>
            <div class="account-menu" id="account-menu" hidden></div>
          </div>
          <nav class="primary-nav" id="primary-nav" aria-label="Navegação principal">
            <a href="index.html" ${page === "inicio" ? 'aria-current="page"' : ""}>Início</a>
            <details class="nav-dropdown">
              <summary>Rastrear</summary>
              <div class="nav-dropdown-menu"><a href="rastreio.html" ${page === "rastreio" ? 'aria-current="page"' : ""}>Acompanhar pedido</a></div>
            </details>
            <details class="nav-dropdown">
              <summary>Envio</summary>
              <div class="nav-dropdown-menu"><a href="envio.html" ${page === "envio" ? 'aria-current="page"' : ""}>Calcular envio</a></div>
            </details>
            <details class="nav-dropdown">
              <summary>Parcerias</summary>
              <div class="nav-dropdown-menu"><a href="entregador.html" ${page === "entregador" ? 'aria-current="page"' : ""}>Seja entregador</a><a href="ponto-de-entrega.html" ${page === "ponto" ? 'aria-current="page"' : ""}>Seja ponto de entrega</a></div>
            </details>
            <details class="nav-dropdown">
              <summary>Contato</summary>
              <div class="nav-dropdown-menu"><a href="contato.html" ${page === "contato" ? 'aria-current="page"' : ""}>Fale com a equipe</a><a href="contato.html#ajuda">Central de ajuda</a></div>
            </details>
            <a class="flow-link" href="index.html#sobre">URBANFLOW</a>
          </nav>
          <a class="brand" href="index.html" aria-label="UrbanLink — início"><img src="assets/logo.png" alt="UrbanLink"></a>
          <button class="menu-toggle" type="button" id="menu-toggle" aria-label="Abrir navegação" aria-expanded="false" aria-controls="primary-nav">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>
      </header>
    `;

    updateAccountMenu();
    const nav = document.getElementById("primary-nav");
    const menuToggle = document.getElementById("menu-toggle");
    const accountButton = document.getElementById("account-button");
    const accountMenu = document.getElementById("account-menu");

    menuToggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Fechar navegação" : "Abrir navegação");
    });

    accountButton?.addEventListener("click", () => {
      const open = accountButton.getAttribute("aria-expanded") !== "true";
      accountButton.setAttribute("aria-expanded", String(open));
      accountMenu.hidden = !open;
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".header-account")) {
        accountMenu.hidden = true;
        accountButton.setAttribute("aria-expanded", "false");
      }
      if (!event.target.closest(".nav-dropdown")) {
        nav.querySelectorAll(".nav-dropdown[open]").forEach((dropdown) => dropdown.removeAttribute("open"));
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        accountMenu.hidden = true;
        accountButton.setAttribute("aria-expanded", "false");
        nav.querySelectorAll(".nav-dropdown[open]").forEach((dropdown) => dropdown.removeAttribute("open"));
      }
    });
    document.querySelector("main")?.setAttribute("id", "main-content");
  }

  function updateAccountMenu() {
    const button = document.getElementById("account-button");
    const menu = document.getElementById("account-menu");
    if (!button || !menu) return;
    const user = session();

    if (user?.email) {
      button.innerHTML = `<span class="account-initials" aria-hidden="true">${escapeHtml(initialFor(user.name))}</span><span class="sr-only">Abrir menu de ${escapeHtml(user.name || "conta")}</span>`;
      menu.innerHTML = `
        <div class="account-menu-head"><span class="account-avatar">${escapeHtml(initialFor(user.name))}</span><span><strong>${escapeHtml(user.name || "Minha conta")}</strong><small>${escapeHtml(user.email)}</small></span></div>
        <div class="account-menu-links"><a href="conta.html#pedidos">▣ &nbsp; Meus pedidos</a><a href="conta.html#configuracoes">⚙ &nbsp; Configurações</a><button type="button" class="signout-link" id="signout-button">↪ &nbsp; Sair da conta</button></div>
      `;
      document.getElementById("signout-button")?.addEventListener("click", () => {
        localStorage.removeItem(SESSION_KEY);
        location.href = "index.html";
      });
    } else {
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M5.8 19c.9-3 3.1-4.6 6.2-4.6s5.3 1.6 6.2 4.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span class="sr-only">Abrir menu da conta</span>`;
      menu.innerHTML = `<div class="account-menu-head"><span class="account-avatar">UL</span><span><strong>Olá, visitante</strong><small>Acesse sua área UrbanLink</small></span></div><div class="account-menu-links"><a href="login.html">Entrar na conta</a><a href="cadastro.html">Criar uma conta</a></div>`;
    }
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;
    mount.innerHTML = `
      <footer class="site-footer">
        <div class="footer-main container">
          <div class="footer-brand"><a href="index.html"><img src="assets/logo.png" alt="UrbanLink"></a><p>Logística urbana que aproxima pessoas, negócios e oportunidades.</p></div>
          <div class="footer-column"><h2>Explore</h2><a href="envio.html">Calcular envio</a><a href="rastreio.html">Rastrear pedido</a><a href="contato.html">Fale com a equipe</a></div>
          <div class="footer-column"><h2>Faça parte</h2><a href="entregador.html">Seja entregador</a><a href="ponto-de-entrega.html">Seja ponto de entrega</a><a href="login.html">Acessar minha conta</a></div>
        </div>
        <div class="footer-bottom container"><span>© ${new Date().getFullYear()} UrbanLink. Interface demonstrativa.</span><span>Feita para conectar melhor a cidade.</span></div>
      </footer>
    `;
  }

  function bindForms() {
    document.querySelectorAll("form[data-success]:not(#login-form):not(#register-form)").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const response = form.querySelector(".form-response");
        if (response) {
          response.textContent = form.dataset.success;
          response.hidden = false;
        }
        form.reset();
      });
    });

    const loginForm = document.getElementById("login-form");
    loginForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!loginForm.reportValidity()) return;
      const formData = new FormData(loginForm);
      const email = String(formData.get("email")).trim().toLowerCase();
      const users = readJson(USERS_KEY, []);
      const storedUser = users.find((user) => user.email === email);
      const fallbackName = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      const signedIn = { name: storedUser?.name || fallbackName || "Pessoa UrbanLink", email, document: storedUser?.document || "" };
      localStorage.setItem(SESSION_KEY, JSON.stringify(signedIn));
      const response = loginForm.querySelector(".form-response");
      response.textContent = loginForm.dataset.success;
      response.hidden = false;
      setTimeout(() => location.href = "conta.html", 550);
    });

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      const password = registerForm.elements.password;
      const confirmation = registerForm.elements["password-confirm"];
      const validateConfirmation = () => confirmation.setCustomValidity(password.value === confirmation.value ? "" : "As senhas precisam ser iguais.");
      password.addEventListener("input", validateConfirmation);
      confirmation.addEventListener("input", validateConfirmation);
    }
    registerForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const password = registerForm.elements.password;
      const confirmation = registerForm.elements["password-confirm"];
      confirmation.setCustomValidity(password.value === confirmation.value ? "" : "As senhas precisam ser iguais.");
      if (!registerForm.reportValidity()) return;
      const formData = new FormData(registerForm);
      const newUser = {
        name: String(formData.get("name")).trim(),
        email: String(formData.get("email")).trim().toLowerCase(),
        document: String(formData.get("document")).trim(),
        phone: String(formData.get("phone")).trim()
      };
      const users = readJson(USERS_KEY, []).filter((user) => user.email !== newUser.email);
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      const response = registerForm.querySelector(".form-response");
      response.textContent = registerForm.dataset.success;
      response.hidden = false;
      setTimeout(() => location.href = "conta.html", 650);
    });

    document.querySelectorAll(".password-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.closest(".password-field")?.querySelector("input");
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
        button.textContent = show ? "◌" : "◉";
      });
    });

    document.querySelectorAll("input[name='zip']").forEach((input) => {
      input.addEventListener("input", () => {
        const digits = input.value.replace(/\D/g, "").slice(0, 8);
        input.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
      });
    });

    const pointForm = document.querySelector(".partner-form");
    const dayInputs = pointForm?.querySelectorAll("input[name='days']");
    if (dayInputs?.length) {
      const updateDaysValidity = () => dayInputs[0].setCustomValidity([...dayInputs].some((input) => input.checked) ? "" : "Selecione ao menos um dia de funcionamento.");
      dayInputs.forEach((input) => input.addEventListener("change", updateDaysValidity));
      pointForm.addEventListener("submit", updateDaysValidity, true);
    }
  }

  function bindQuoteCalculator() {
    const form = document.getElementById("quote-form");
    const list = document.getElementById("package-list");
    const template = document.getElementById("package-template");
    const addButton = document.getElementById("add-package");
    if (!form || !list || !template || !addButton) return;

    const updatePackages = () => {
      const cards = [...list.querySelectorAll("[data-package]")];
      cards.forEach((card, index) => {
        card.querySelector("[data-package-number]").textContent = String(index + 1);
        const remove = card.querySelector(".remove-package");
        remove.hidden = cards.length === 1;
      });
      document.getElementById("package-count").textContent = `${cards.length} ${cards.length === 1 ? "pacote" : "pacotes"}`;
      addButton.disabled = cards.length >= 4;
      addButton.setAttribute("aria-disabled", String(cards.length >= 4));
    };

    addButton.addEventListener("click", () => {
      if (list.querySelectorAll("[data-package]").length >= 4) return;
      list.append(template.content.cloneNode(true));
      updatePackages();
      list.lastElementChild?.querySelector("input")?.focus();
    });
    list.addEventListener("click", (event) => {
      const remove = event.target.closest(".remove-package");
      if (!remove) return;
      remove.closest("[data-package]")?.remove();
      updatePackages();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const cards = [...list.querySelectorAll("[data-package]")];
      const weight = cards.reduce((sum, card) => sum + Number(card.querySelector("[name='weight']").value || 0), 0);
      const type = form.querySelector("[name='delivery-type']:checked")?.value || "local";
      const base = type === "local" ? 17.9 : 29.9;
      const total = base + (weight * (type === "local" ? 3.4 : 4.6)) + Math.max(cards.length - 1, 0) * 3.25;
      const price = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total);
      const result = document.getElementById("quote-result");
      document.getElementById("quote-price").textContent = price;
      document.getElementById("quote-summary").textContent = `${cards.length} ${cards.length === 1 ? "pacote" : "pacotes"} · ${weight.toLocaleString("pt-BR")} kg · ${type === "local" ? "entrega local" : "entrega nacional"}.`;
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function bindTracking() {
    const form = document.getElementById("tracking-form");
    if (!form) return;
    const input = form.elements["tracking-code"];
    const result = document.getElementById("tracking-result");
    const empty = document.getElementById("tracking-empty");
    const codeOutput = document.getElementById("result-tracking-code");
    const demoCode = "UL-4829-1750";
    const showResult = (code) => {
      codeOutput.textContent = code.toUpperCase();
      result.hidden = false;
      empty.hidden = true;
    };
    document.querySelector("[data-demo-code]")?.addEventListener("click", () => {
      input.value = demoCode;
      showResult(demoCode);
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      showResult(input.value.trim());
    });
    if (input.value) showResult(input.value);
  }

  function bindAccountSettings() {
    const form = document.getElementById("account-form");
    if (!form) return;
    const user = session();
    if (user) {
      form.elements.name.value = user.name || "";
      form.elements.email.value = user.email || "";
      form.elements.document.value = user.document || "";
      form.elements.phone.value = user.phone || "";
      document.getElementById("account-name").textContent = user.name || "Minha conta";
      document.getElementById("account-email").textContent = user.email || "";
      document.getElementById("account-document").textContent = user.document ? `Documento: ${user.document}` : "Conta demonstrativa";
      document.querySelector(".account-profile-avatar").textContent = initialFor(user.name);
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const updated = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim().toLowerCase(),
        document: form.elements.document.value.trim(),
        phone: form.elements.phone.value.trim()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      const users = readJson(USERS_KEY, []).filter((entry) => entry.email !== updated.email && entry.email !== user?.email);
      users.push(updated);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      document.getElementById("account-name").textContent = updated.name;
      document.getElementById("account-email").textContent = updated.email;
      document.getElementById("account-document").textContent = updated.document ? `Documento: ${updated.document}` : "Conta demonstrativa";
      document.querySelector(".account-profile-avatar").textContent = initialFor(updated.name);
      const response = form.querySelector(".form-response");
      response.textContent = "Seus dados foram atualizados neste navegador.";
      response.hidden = false;
      updateAccountMenu();
    });
    document.getElementById("account-page-signout")?.addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      location.href = "index.html";
    });
  }

  renderHeader();
  renderFooter();
  bindForms();
  bindQuoteCalculator();
  bindTracking();
  bindAccountSettings();
})();
