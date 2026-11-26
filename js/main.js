/* =========================================================
   r1g0d // portfólio — terminal, boot, WAF e mini CTF
   JS puro, sem dependências.
   ========================================================= */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* =========================================================
     1. ARMAZENAMENTO SEGURO
     ========================================================= */
  const store = {
    get(k, fallback) {
      try {
        const v = localStorage.getItem(k);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch { /* aba privada */ }
    },
    remove(k) {
      try {
        localStorage.removeItem(k);
      } catch { /* aba privada */ }
    }
  };

  /* =========================================================
     1b. IDIOMA (PT / EN / ES)
     O HTML está em português. Os textos em EN e ES ficam em js/i18n.js,
     indexados pelo conteúdo original em PT. Os textos do terminal usam L().
     ========================================================= */
  const LANGS = ["pt", "en", "es"];
  const LANG_HTML = { pt: "pt-BR", en: "en", es: "es" };

  function detectLang() {
    const saved = store.get("r1-lang", null);
    if (LANGS.includes(saved)) return saved;
    const prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "pt"];
    for (const p of prefs) {
      const code = String(p).slice(0, 2).toLowerCase();
      if (LANGS.includes(code)) return code;
    }
    return "pt";
  }

  let lang = detectLang();
  const L = (pt, en, es) => ({ pt, en, es }[lang]);
  const dim = (s) => '<span class="t-dim">' + s + "</span>";
  const red = (s) => '<span class="t-red">' + s + "</span>";

  const STATIC = window.STATIC_I18N || {};
  const normKey = (s) => s.replace(/\s+/g, " ").trim();
  const INLINE_TAGS = ["STRONG", "BR", "SPAN", "A", "CODE"];
  const leaves = [];
  const attrLeaves = [];

  (function collectI18n() {
    const sel = ".skip, .boot__skip, header *, main *, footer *, #breach-overlay *";
    document.querySelectorAll(sel).forEach((el) => {
      if (el.closest("#term-out, #boot-log, #breach-log, pre, svg, script")) return;
      if (!Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      if (Array.from(el.children).some((c) => !INLINE_TAGS.includes(c.tagName))) return;
      if (leaves.some((l) => l.el.contains(el))) return;
      leaves.push({ el, key: normKey(el.innerHTML) });
    });
    document.querySelectorAll("pre.finding__poc").forEach((el) => {
      leaves.push({ el, key: normKey(el.textContent), orig: el.textContent, text: true });
    });
    document.querySelectorAll("[title], [aria-label]").forEach((el) => {
      if (el.closest("svg")) return;
      ["title", "aria-label"].forEach((attr) => {
        const v = el.getAttribute(attr);
        if (v) attrLeaves.push({ el, attr, key: v });
      });
    });
  })();

  const META = {
    desc: {
      pt: "João V. Rigo (r1g0d): Analista de Segurança da Informação Jr., Pentester e Red Team em formação, com base em infraestrutura, redes e Linux.",
      en: "João V. Rigo (r1g0d): Junior Information Security Analyst, Pentester and Red Team in training, with a background in infrastructure, networks and Linux.",
      es: "João V. Rigo (r1g0d): Analista de Seguridad de la Información Jr., Pentester y Red Team en formación, con base en infraestructura, redes y Linux."
    },
    share: {
      pt: "Analista de Segurança da Informação Jr., Pentester e Red Team em formação. Entre no sistema.",
      en: "Junior Information Security Analyst, Pentester and Red Team in training. Enter the system.",
      es: "Analista de Seguridad de la Información Jr., Pentester y Red Team en formación. Entra al sistema."
    }
  };

  function applyLangToPage() {
    document.documentElement.lang = LANG_HTML[lang];
    for (const x of leaves) {
      const v = lang === "pt" ? (x.orig !== undefined ? x.orig : x.key) : STATIC[lang] && STATIC[lang][x.key];
      if (v === undefined) continue;
      if (x.text) { x.el.textContent = v; continue; }
      x.el.innerHTML = v;
      if (x.el.dataset && "text" in x.el.dataset) x.el.dataset.text = x.el.textContent;
      if (x.el.classList.contains("glitch-h")) x.el.setAttribute("aria-label", x.el.textContent);
    }
    for (const x of attrLeaves) {
      const v = lang === "pt" ? x.key : STATIC[lang] && STATIC[lang]["@" + x.key];
      if (v !== undefined) x.el.setAttribute(x.attr, v);
    }
    const set = (q, v) => { const m = document.querySelector(q); if (m) m.setAttribute("content", v); };
    set('meta[name="description"]', META.desc[lang]);
    set('meta[property="og:description"]', META.share[lang]);
    set('meta[name="twitter:description"]', META.share[lang]);
    document.querySelectorAll("[data-lang]").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false");
    });
    const menuTxt = document.querySelector(".topbar__menu-text");
    const navEl = document.getElementById("topbar-nav");
    if (menuTxt) menuTxt.textContent = navEl && navEl.classList.contains("is-open") ? L("[fechar]", "[close]", "[cerrar]") : "[menu]";
  }

  function setLang(next) {
    if (!LANGS.includes(next)) return;
    lang = next;
    store.set("r1-lang", next);
    applyLangToPage();
  }

  applyLangToPage();

  /* =========================================================
     2. ESTADO DO MINI CTF (3 FLAGS -> ROOT)
     ========================================================= */
  const hash = (s) => {
    let x = 5381;
    for (const c of s) x = ((x << 5) + x + c.codePointAt(0)) >>> 0;
    return x.toString(16);
  };

  const FLAGS = { "c96cc0d3": 1, "38211079": 2, "def0a54e": 3 };
  const FLAG2_B64 = "cjFnMGR7YzBuczBsM18xc180X3NoM2xsfQ==";
  const FLAG3_B64 = "cjFnMGR7cHIxdl8zc2NfdjFhX3N1ZDB9";

  let found = store.get("r1-flags", []);
  if (!Array.isArray(found)) found = [];
  found = [...new Set(found.filter((n) => n === 1 || n === 2 || n === 3))];

  const isRoot = () => found.length >= 3;

  /* =========================================================
     3. CHUVA MATRIX (MODO ROOT)
     ========================================================= */
  const matrixCanvas = $("#matrix-canvas");
  const matrix = (() => {
    if (!matrixCanvas || !matrixCanvas.getContext) {
      return { start() {}, stop() {} };
    }
    const ctx = matrixCanvas.getContext("2d");
    const GLYPHS = "0123456789abcdef";
    const FONT_SIZE = 15;
    let rafId = null;
    let drops = [];

    function resize() {
      matrixCanvas.width = window.innerWidth;
      matrixCanvas.height = window.innerHeight;
      const cols = Math.max(1, Math.floor(matrixCanvas.width / FONT_SIZE));
      const next = new Array(cols);
      for (let i = 0; i < cols; i++) {
        next[i] = i < drops.length ? drops[i] : Math.floor(Math.random() * -40);
      }
      drops = next;
    }

    function draw() {
      if (document.hidden) return;

      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      ctx.font = `${FONT_SIZE}px "IBM Plex Mono", monospace`;

      for (let i = 0; i < drops.length; i += 3) {
        const y = drops[i] * FONT_SIZE;
        if (y > 0) {
          const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          ctx.fillStyle = Math.random() > 0.92 ? "#E6E3DA" : "#FF1E3C";
          ctx.fillText(ch, i * FONT_SIZE, y);
        }
        if (y > matrixCanvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    window.addEventListener("resize", () => {
      if (rafId !== null) resize();
    }, { passive: true });

    return {
      start() {
        if (rafId !== null) return;
        resize();
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        rafId = setInterval(draw, 90);
      },
      stop() {
        if (rafId !== null) {
          clearInterval(rafId);
          rafId = null;
        }
        ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      }
    };
  })();

  /* =========================================================
     4. CONTROLE DE ANIMAÇÕES (INICIA ATIVO)
     ========================================================= */
  let animsEnabled = true;

  function applyAnims(enabled) {
    animsEnabled = Boolean(enabled);
    const animBtn = $("#toggle-anim");
    if (animsEnabled) {
      document.body.classList.remove("no-anim");
      if (animBtn) {
        animBtn.setAttribute("aria-pressed", "true");
        const txt = animBtn.querySelector(".btn-anim__text");
        if (txt) txt.textContent = "anim [ON]";
      }
      if (isRoot()) matrix.start();
    } else {
      document.body.classList.add("no-anim");
      if (animBtn) {
        animBtn.setAttribute("aria-pressed", "false");
        const txt = animBtn.querySelector(".btn-anim__text");
        if (txt) txt.textContent = "anim [OFF]";
      }
      matrix.stop();
    }
  }

  const reduceMq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  applyAnims(!(reduceMq && reduceMq.matches));
  if (reduceMq && reduceMq.addEventListener) {
    reduceMq.addEventListener("change", (e) => applyAnims(!e.matches));
  }

  const animBtn = $("#toggle-anim");
  if (animBtn) {
    animBtn.addEventListener("click", () => applyAnims(!animsEnabled));
  }

  /* =========================================================
     5. MENU MOBILE (TOPBAR)
     ========================================================= */
  const menuBtn = $("#menu-toggle");
  const nav = $("#topbar-nav");
  if (menuBtn && nav) {
    function toggleMenu(open) {
      const isOpen = open !== undefined ? open : !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", isOpen);
      menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      const txt = menuBtn.querySelector(".topbar__menu-text");
      if (txt) txt.textContent = isOpen ? L("[fechar]", "[close]", "[cerrar]") : "[menu]";
    }

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => toggleMenu(false));
    });

    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target) && nav.classList.contains("is-open")) {
        toggleMenu(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        toggleMenu(false);
      }
    });
  }

  /* =========================================================
     6. REFERÊNCIAS DO TERMINAL & SINCRONIZAÇÃO DE ROOT
     ========================================================= */
  const counter = $("#flag-counter");
  const termBox = $("#terminal");
  const termTitle = $("#term-title");
  const termPrompt = $("#term-prompt");
  const out = $("#term-out");
  const form = $("#term-form");
  const input = $("#term-input");
  const historyLog = [];
  let hIdx = 0;
  let busy = false;

  function print(html, cls) {
    if (!out) return;
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.innerHTML = html;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
  }

  /* =========================================================
     7. SEQUÊNCIA PÓS-ROOT (SISTEMA COMPROMETIDO)
     ========================================================= */
  const breachOverlay = $("#breach-overlay");
  const breachLog = $("#breach-log");
  const breachCta = $("#breach-cta");
  const breachTimer = $("#breach-timer");
  const breachContactBtn = $("#breach-contact-btn");
  const breachReadBtn = $("#breach-read-btn");
  const breachCloseBtn = $("#breach-close-btn");

  const breachSteps = () => [
    [L("[ 0.0s ] Bypass de autenticação concluído ...... OK", "[ 0.0s ] Authentication bypass complete ....... OK", "[ 0.0s ] Bypass de autenticación completado ... OK"), "b-ok", 0],
    [L("[ 0.6s ] Escalonando contexto: uid=0(root) ...... OK", "[ 0.6s ] Escalating context: uid=0(root) ....... OK", "[ 0.6s ] Escalando contexto: uid=0(root) ...... OK"), "b-ok", 550],
    [L("[ 1.2s ] Injetando payload no DOM & CRT ......... OK", "[ 1.2s ] Injecting payload into DOM & CRT ...... OK", "[ 1.2s ] Inyectando payload en DOM y CRT ...... OK"), "b-ok", 1150],
    [L("[ 1.8s ] Desbloqueando /root/contratar.txt ...... OK", "[ 1.8s ] Unlocking /root/contratar.txt ......... OK", "[ 1.8s ] Desbloqueando /root/contratar.txt .... OK"), "b-ok", 1750],
    [L("[ 2.4s ] Modo Red Team & Matrix ativados ........ OVERRIDE", "[ 2.4s ] Red Team & Matrix mode enabled ...... OVERRIDE", "[ 2.4s ] Modo Red Team y Matrix activados .... OVERRIDE"), "b-sig", 2350]
  ];

  let breachTimers = [];
  let breachCountdown = null;

  function clearBreachTimers() {
    breachTimers.forEach((id) => clearTimeout(id));
    breachTimers = [];
    if (breachCountdown !== null) {
      clearInterval(breachCountdown);
      breachCountdown = null;
    }
  }

  function closeBreach() {
    if (!breachOverlay || breachOverlay.hidden) return;
    clearBreachTimers();
    breachOverlay.hidden = true;
    if (input && !input.readOnly) input.focus({ preventScroll: true });
  }

  function playBreachSequence() {
    if (!breachOverlay || !breachLog || !breachCta) return;
    clearBreachTimers();
    breachLog.innerHTML = "";
    breachCta.hidden = true;
    breachOverlay.hidden = false;

    if (!animsEnabled) {
      breachSteps().forEach(([txt, cls]) => {
        const span = document.createElement("span");
        span.className = cls;
        span.textContent = txt + "\n";
        breachLog.appendChild(span);
      });
      if (breachTimer) breachTimer.textContent = "00:00.0";
      breachCta.hidden = false;
      if (breachContactBtn) breachContactBtn.focus();
      return;
    }

    const startTime = performance.now();
    const DURATION = 3000;
    if (breachTimer) breachTimer.textContent = "00:03.0";

    breachCountdown = setInterval(() => {
      const left = Math.max(0, DURATION - (performance.now() - startTime));
      if (breachTimer) breachTimer.textContent = `00:0${(left / 1000).toFixed(1)}`;
      if (left <= 0) {
        clearInterval(breachCountdown);
        breachCountdown = null;
      }
    }, 100);

    breachSteps().forEach(([txt, cls, delay]) => {
      const id = setTimeout(() => {
        const span = document.createElement("span");
        span.className = cls;
        span.textContent = txt + "\n";
        breachLog.appendChild(span);
        hitGlitch();
      }, delay);
      breachTimers.push(id);
    });

    const finishId = setTimeout(() => {
      if (breachTimer) breachTimer.textContent = "00:00.0";
      breachCta.hidden = false;
      document.body.classList.add("is-frame-hit");
      setTimeout(() => document.body.classList.remove("is-frame-hit"), 220);
      if (breachContactBtn) breachContactBtn.focus();
    }, DURATION);
    breachTimers.push(finishId);
  }

  if (breachCloseBtn) {
    breachCloseBtn.addEventListener("click", closeBreach);
  }

  if (breachReadBtn) {
    breachReadBtn.addEventListener("click", () => {
      closeBreach();
      if (termBox) {
        termBox.scrollIntoView({ behavior: animsEnabled ? "smooth" : "auto", block: "center" });
      }
      setTimeout(() => typeAndRun("cat /root/contratar.txt"), 180);
    });
  }

  if (breachOverlay) {
    breachOverlay.addEventListener("click", (e) => {
      if (e.target === breachOverlay) closeBreach();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && breachOverlay && !breachOverlay.hidden) {
      closeBreach();
    }
  });

  function syncRootState({ animate = false } = {}) {
    if (isRoot()) {
      document.body.classList.add("is-root");
      if (counter) {
        counter.textContent = "root";
        counter.classList.add("is-root");
      }
      if (termTitle) termTitle.textContent = "root@r1g0d: ~";
      if (termPrompt) termPrompt.textContent = "root@r1g0d:~#";
      if (animsEnabled) matrix.start();
      if (animate) playBreachSequence();
    } else {
      document.body.classList.remove("is-root");
      if (counter) {
        counter.textContent = `flags ${found.length}/3`;
        counter.classList.remove("is-root");
      }
      if (termTitle) termTitle.textContent = "r1g0d@kali: ~";
      if (termPrompt) termPrompt.textContent = "r1g0d@kali:~$";
      matrix.stop();
      closeBreach();
    }
  }

  syncRootState({ animate: false });

  // FLAG 2: está no console para quem inspeciona o DevTools.
  console.log(
    "%cr1g0d",
    "font: 48px VT323, monospace; color: #FF1E3C; text-shadow: 3px 0 #19E6FF;"
  );
  console.log(
    "%cVocê abriu o console. Bom instinto.\nFLAG 2/3 (base64): " + FLAG2_B64 +
    "\nDecodifique e cole diretamente no terminal.",
    "font: 13px monospace; color: #E6E3DA;"
  );

  /* =========================================================
     8. BOOT
     ========================================================= */
  const boot = $("#boot");
  const bootLog = $("#boot-log");
  const BOOT_LINES = [
    [L("[    0.000] r1g0d kernel 6.6.6-redteam inicializando", "[    0.000] r1g0d kernel 6.6.6-redteam starting", "[    0.000] r1g0d kernel 6.6.6-redteam iniciando"), "ok"],
    [L("[    0.112] montando /dev/curiosidade ........ ok", "[    0.112] mounting /dev/curiosity .......... ok", "[    0.112] montando /dev/curiosidad ......... ok"), "ok"],
    [L("[    0.204] carregando módulos: nmap burp metasploit python bash", "[    0.204] loading modules: nmap burp metasploit python bash", "[    0.204] cargando módulos: nmap burp metasploit python bash"), "ok"],
    [L("[    0.391] verificando escopo autorizado ..... ok", "[    0.391] checking authorized scope ........ ok", "[    0.391] verificando alcance autorizado ... ok"), "ok"],
    [L("[    0.518] firewall corporativo detectado .... contornando", "[    0.518] corporate firewall detected ..... bypassing", "[    0.518] firewall corporativo detectado .. eludiendo"), "err"],
    [L("[    0.702] identidade: João V. Rigo // handle r1g0d", "[    0.702] identity: João V. Rigo // handle r1g0d", "[    0.702] identidad: João V. Rigo // handle r1g0d"), "ok"],
    [L("[    0.811] classe: Red Team & Pentester entry-level", "[    0.811] class: entry-level Red Team & Pentester", "[    0.811] clase: Red Team y Pentester entry-level"), "ok"],
    [L("[    0.930] canal aberto. bem-vindo.", "[    0.930] channel open. welcome.", "[    0.930] canal abierto. bienvenido."), "ok"]
  ];

  let bootDone = false;

  function endBoot() {
    if (bootDone) return;
    bootDone = true;
    try { sessionStorage.setItem("r1-boot", "1"); } catch { /* aba privada */ }
    if (boot) {
      boot.classList.add("is-out");
      setTimeout(() => { boot.remove(); }, 420);
    }
    document.removeEventListener("keydown", endBoot);
    setTimeout(startTerminal, 0);
  }

  if (!boot || !bootLog || document.documentElement.classList.contains("no-boot")) {
    if (boot) boot.remove();
    bootDone = true;
    setTimeout(startTerminal, 0);
  } else {
    boot.addEventListener("click", endBoot);
    document.addEventListener("keydown", endBoot);
    BOOT_LINES.forEach(([txt, cls], i) => {
      setTimeout(() => {
        if (bootDone) return;
        const span = document.createElement("span");
        span.className = cls;
        span.textContent = txt + "\n";
        bootLog.appendChild(span);
      }, 160 + i * 210);
    });
    setTimeout(endBoot, 160 + BOOT_LINES.length * 210 + 450);
  }

  /* =========================================================
     9. COMANDOS DO TERMINAL
     ========================================================= */
  const CV = "assets/curriculo.pdf";
  const CV_NAME = "Joao_Victor_Rigo_Curriculo.pdf";
  const COMMANDS = {
    help() {
      const base = [
        red(L("Comandos disponíveis", "Available commands", "Comandos disponibles")),
        "  whoami            " + L("quem sou eu", "who I am", "quién soy"),
        "  id                " + L("usuário e privilégios atuais", "current user and privileges", "usuario y privilegios actuales"),
        "  cat missoes.log   " + L("experiência profissional", "work experience", "experiencia profesional"),
        "  ls findings/      " + L("projetos", "projects", "proyectos"),
        "  cat tr1gg3r       " + L("detalhe do TR1GG3R SIEM", "TR1GG3R SIEM details", "detalle de TR1GG3R SIEM"),
        "  cat portfolio     " + L("detalhe deste portfólio", "about this portfolio", "detalle de este portafolio"),
        "  nmap -sV r1g0d   " + L("skills", "skills", "habilidades"),
        "  certs             " + L("certificações e trilha", "certifications and learning path", "certificaciones y ruta"),
        "  contato           " + L("como falar comigo", "how to reach me", "cómo contactarme"),
        "  cv                " + L("baixar currículo em PDF", "download resume (PDF)", "descargar currículum (PDF)"),
        "  ls                " + L("lista de arquivos", "list files", "lista de archivos"),
        "  flags             " + L("quantas flags você achou", "how many flags you found", "cuántas flags encontraste"),
        "  reset -flags      " + L("zerar progresso das flags", "reset flag progress", "reiniciar el progreso de las flags"),
        "  lang pt|en|es     " + L("trocar o idioma", "change the language", "cambiar el idioma"),
        "  anim              " + L("ativar/desativar animações", "turn animations on/off", "activar/desactivar animaciones"),
        "  reboot            " + L("reiniciar o boot", "restart the boot sequence", "reiniciar el arranque"),
        "  cd ../            " + L("voltar ao topo da página", "back to the top of the page", "volver al inicio de la página"),
        "  clear             " + L("limpar a tela", "clear the screen", "limpiar la pantalla")
      ];

      if (isRoot()) {
        base.push(
          "",
          red(L("[PRIVILÉGIO ROOT ATIVO — COMANDOS DESTRAVADOS]", "[ROOT PRIVILEGE ACTIVE — COMMANDS UNLOCKED]", "[PRIVILEGIO ROOT ACTIVO — COMANDOS DESBLOQUEADOS]")),
          "  ls /root                   " + L("listar diretório restrito /root", "list the restricted /root directory", "listar el directorio restringido /root"),
          "  cat /root/contratar.txt    " + L("diferenciais para recrutadores", "highlights for recruiters", "diferenciales para reclutadores"),
          "  cat .shadow                " + L("ler arquivo protegido diretamente", "read the protected file directly", "leer el archivo protegido directamente"),
          "  breach                     " + L("rever sequência de sistema comprometido", "replay the system-compromised sequence", "ver de nuevo la secuencia de sistema comprometido")
        );
      } else {
        base.push(
          "",
          dim(L("CTF: há 3 flags escondidas. Digite", "CTF: there are 3 hidden flags. Type", "CTF: hay 3 flags escondidas. Escribe")) + " hint " +
          dim(L("e cole as flags direto no terminal.", "and paste the flags straight into the terminal.", "y pega las flags directo en la terminal."))
        );
      }

      return base.join("\n");
    },

    id() {
      if (isRoot()) {
        return red("uid=0(root) gid=0(root)") + " groups=0(root),1337(redteam),4444(compromised)";
      }
      return "uid=1000(visitante) gid=1000(visitante) groups=1000(visitante) " +
        dim(L("[conquiste as 3 flags para uid=0]", "[capture the 3 flags to get uid=0]", "[consigue las 3 flags para uid=0]"));
    },

    whoami() {
      const header = isRoot()
        ? red("root") + " " + dim(L("[uid=0 // sessão elevada de João V. Rigo · r1g0d]", "[uid=0 // elevated session of João V. Rigo · r1g0d]", "[uid=0 // sesión elevada de João V. Rigo · r1g0d]"))
        : red("João V. Rigo") + " " + dim("[r1g0d]");

      return [
        header,
        L("Red Team & Pentester entry-level em formação, com base em infraestrutura e redes.",
          "Entry-level Red Team & Pentester in training, with a background in infrastructure and networks.",
          "Red Team y Pentester entry-level en formación, con base en infraestructura y redes."),
        "",
        dim(L("local     ", "location  ", "ubicación ")) + "Franca, SP",
        dim(L("formação  ", "education ", "formación ")) + L("Engenharia de Software (Unifran), em andamento", "Software Engineering (Unifran), in progress", "Ingeniería de Software (Unifran), en curso"),
        dim("labs      ") + "TryHackMe, PortSwigger Web Security Academy, HackTheBox",
        dim(L("projetos  ", "projects  ", "proyectos ")) + L("TR1GG3R SIEM (IDS/SIEM em Python puro), este portfólio, Solo Nativo", "TR1GG3R SIEM (IDS/SIEM in pure Python), this portfolio, Solo Nativo", "TR1GG3R SIEM (IDS/SIEM en Python puro), este portafolio, Solo Nativo"),
        dim(L("buscando  ", "looking for", "buscando  ")) + " " + L("oportunidades em Red Team e Pentest", "opportunities in Red Team and Pentest", "oportunidades en Red Team y Pentest"),
        "",
        dim(L("fora do terminal: mestre de D&amp;D e dev do Dungeon of Goblins, RPG de texto em Python/Flask.",
              "outside the terminal: D&amp;D dungeon master and dev of Dungeon of Goblins, a text RPG in Python/Flask.",
              "fuera de la terminal: master de D&amp;D y dev de Dungeon of Goblins, un RPG de texto en Python/Flask."))
      ].join("\n");
    },

    "ls /root"() {
      if (!isRoot()) {
        return red(L("ls: impossível abrir diretório '/root': Permissão negada", "ls: cannot open directory '/root': Permission denied", "ls: no se puede abrir el directorio '/root': Permiso denegado")) + "\n" +
          dim(L("Conquiste as 3 flags do CTF para escalar privilégio.", "Capture the 3 CTF flags to escalate privileges.", "Consigue las 3 flags del CTF para escalar privilegios."));
      }
      return red("contratar.txt") + "   .bash_history   id_ed25519.pub";
    },

    "cat /root/contratar.txt"() {
      if (!isRoot()) {
        return red(L("cat: /root/contratar.txt: Permissão negada", "cat: /root/contratar.txt: Permission denied", "cat: /root/contratar.txt: Permiso denegado")) + "\n" +
          dim(L("Arquivo restrito ao superusuário (uid=0). Digite", "File restricted to the superuser (uid=0). Type", "Archivo restringido al superusuario (uid=0). Escribe")) + " hint " +
          dim(L("para começar.", "to get started.", "para empezar."));
      }
      return [
        red("========================================================="),
        red(L("  /root/contratar.txt — POR QUE TRAZER O r1g0d PRO TIME", "  /root/contratar.txt — WHY BRING r1g0d ONTO THE TEAM", "  /root/contratar.txt — POR QUÉ SUMAR A r1g0d AL EQUIPO")),
        red("========================================================="),
        "",
        red(L("01. BASE REAL DE INFRAESTRUTURA (2 ANOS)", "01. REAL INFRASTRUCTURE BACKGROUND (2 YEARS)", "01. BASE REAL DE INFRAESTRUCTURA (2 AÑOS)")),
        ...L(
          ["    Não aprendi redes e sistemas apenas em slides. Sustentei ambientes",
           "    críticos na Positivo Tecnologia, no Projeto Sabesp (30 unidades",
           "    descentralizadas) e na Magazine Luiza (Netshoes). Hoje, no Grupo",
           "    J.Arantes, desenvolvo sistemas e integro APIs (Supabase, Vercel, GitHub).",
           "    Sei como uma rede corporativa funciona e onde ela costuma falhar."],
          ["    I did not learn networks and systems from slides alone. I supported",
           "    critical environments at Positivo Tecnologia, on the Sabesp project",
           "    (30 decentralized sites) and at Magazine Luiza (Netshoes). Today, at",
           "    Grupo J.Arantes, I build systems and integrate APIs (Supabase, Vercel, GitHub).",
           "    I know how a corporate network works and where it tends to fail."],
          ["    No aprendí redes y sistemas solo con diapositivas. Sostuve entornos",
           "    críticos en Positivo Tecnologia, en el proyecto Sabesp (30 unidades",
           "    descentralizadas) y en Magazine Luiza (Netshoes). Hoy, en Grupo",
           "    J.Arantes, desarrollo sistemas e integro APIs (Supabase, Vercel, GitHub).",
           "    Sé cómo funciona una red corporativa y dónde suele fallar."]
        ),
        "",
        red(L("02. MENTALIDADE OFENSIVA & CONSTRUTOR DE FERRAMENTAS", "02. OFFENSIVE MINDSET & TOOL BUILDER", "02. MENTALIDAD OFENSIVA Y CONSTRUCTOR DE HERRAMIENTAS")),
        ...L(
          ["    Desenvolvi do zero o TR1GG3R SIEM (IDS/WAF/SIEM em Python puro,",
           "    zero dependências externas) e pratico continuamente no TryHackMe,",
           "    HackTheBox e PortSwigger Web Security Academy (trilha eJPT)."],
          ["    I built TR1GG3R SIEM from scratch (IDS/WAF/SIEM in pure Python,",
           "    zero external dependencies) and I practice continuously on TryHackMe,",
           "    HackTheBox and PortSwigger Web Security Academy (eJPT path)."],
          ["    Desarrollé desde cero TR1GG3R SIEM (IDS/WAF/SIEM en Python puro,",
           "    cero dependencias externas) y practico continuamente en TryHackMe,",
           "    HackTheBox y PortSwigger Web Security Academy (ruta eJPT)."]
        ),
        "",
        red(L("03. AUTONOMIA & COMUNICAÇÃO TÉCNICA", "03. AUTONOMY & TECHNICAL COMMUNICATION", "03. AUTONOMÍA Y COMUNICACIÓN TÉCNICA")),
        ...L(
          ["    Acostumado a atuar sob SLA, documentar achados com clareza e",
           "    traduzir risco técnico em impacto de negócio."],
          ["    Used to working under SLAs, documenting findings clearly and",
           "    translating technical risk into business impact."],
          ["    Acostumbrado a trabajar bajo SLA, documentar hallazgos con claridad y",
           "    traducir el riesgo técnico en impacto de negocio."]
        ),
        "",
        dim(L("Pronto para somar em Pentest Júnior, Red Team ou AppSec:", "Ready to join as Junior Pentester, Red Team or AppSec:", "Listo para sumar en Pentest Júnior, Red Team o AppSec:")),
        'e-mail    <a href="mailto:r11gg0d@gmail.com?subject=Oportunidade%20-%20r1g0d">r11gg0d@gmail.com</a>',
        'linkedin  <a href="https://www.linkedin.com/in/jvrigo/" target="_blank" rel="noopener">linkedin.com/in/jvrigo</a>',
        L("currículo ", "resume    ", "currículum") + ' <a href="' + CV + '" download="' + CV_NAME + '">' + L("baixar PDF completo", "download full PDF", "descargar PDF completo") + "</a>"
      ].join("\n");
    },

    breach() {
      if (!isRoot()) {
        return red(L("breach: acesso negado.", "breach: access denied.", "breach: acceso denegado.")) + " " +
          dim(L("Requer privilégio root (3/3 flags).", "Requires root privilege (3/3 flags).", "Requiere privilegio root (3/3 flags)."));
      }
      playBreachSequence();
      return red("[ROOT]") + " " + L("Reexecutando sequência de sistema comprometido...", "Replaying the system-compromised sequence...", "Repitiendo la secuencia de sistema comprometido...");
    },

    "cat missoes.log"() {
      return [
        red("[2026-10 → " + L("atual", "present", "actual") + "]") + "   Grupo J.Arantes · " + L("Assistente de Sistemas Jr.", "Junior Systems Assistant", "Asistente de Sistemas Jr."),
        red("[2025-10 → 2026-03]") + " Positivo Tecnologia · " + L("Técnico de Suporte Pleno (N2 - Field Service)", "Mid-level Support Technician (L2 - Field Service)", "Técnico de Soporte Pleno (N2 - Field Service)"),
        red("[2024-09 → 2025-02]") + " Solutis (Projeto Sabesp) · " + L("Analista de Suporte Pleno", "Mid-level Support Analyst", "Analista de Soporte Pleno"),
        red("[2022-11 → 2024-09]") + " Magazine Luiza (Netshoes) · " + L("Operações Especiais / Suporte", "Special Operations / Support", "Operaciones Especiales / Soporte"),
        red("[2021-02 → 2022-01]") + " Jussara S.A. · " + L("Aprendiz de T.I", "IT Apprentice", "Aprendiz de T.I."),
        "",
        '<a href="#missoes">' + L("Ver detalhes na página", "See details on the page", "Ver detalles en la página") + "</a>"
      ].join("\n");
    },

    "ls findings/"() {
      return [
        red("tr1gg3r") + "       " + L("IDS/WAF → SIEM em Python puro", "IDS/WAF → SIEM in pure Python", "IDS/WAF → SIEM en Python puro") + "      " + dim(L("severidade: alta", "severity: high", "severidad: alta")),
        "portfolio     " + L("este site, WAF simulado e mini CTF", "this site, simulated WAF and mini CTF", "este sitio, WAF simulado y mini CTF") + "   " + dim(L("severidade: média", "severity: medium", "severidad: media")),
        "solo-nativo   " + L("plataforma educacional (Unifran)", "educational platform (Unifran)", "plataforma educativa (Unifran)") + "   " + dim(L("severidade: informativa", "severity: informational", "severidad: informativa")),
        "",
        dim(L("Use", "Use", "Usa")) + " cat tr1gg3r " + dim(L("ou veja", "or see", "o mira")) + ' <a href="#findings">' + L("a seção de projetos", "the projects section", "la sección de proyectos") + "</a>."
      ].join("\n");
    },

    "cat tr1gg3r"() {
      return [
        "$ trigger_siem --status",
        "[SCAN] SQL Injection ......... " + red(L("BLOQUEADO", "BLOCKED", "BLOQUEADO")) + " + " + L("alerta disparado", "alert fired", "alerta disparada"),
        "[SCAN] XSS .................... " + red(L("BLOQUEADO", "BLOCKED", "BLOQUEADO")) + " + " + L("registrado", "logged", "registrado"),
        "[SCAN] Brute Force ............ " + L("IP banido (300s) após 5 tentativas", "IP banned (300s) after 5 attempts", "IP baneada (300s) tras 5 intentos"),
        "[SCAN] Path Traversal ......... " + red(L("BLOQUEADO", "BLOCKED", "BLOQUEADO")),
        "[SCAN] " + L("Scanner detectado ...... sqlmap / nikto / hydra / nmap", "Scanner detected ....... sqlmap / nikto / hydra / nmap", "Escáner detectado ...... sqlmap / nikto / hydra / nmap"),
        "[LOG]  " + L("alerta por e-mail + rate limiting via SQLite", "email alert + rate limiting via SQLite", "alerta por correo + rate limiting vía SQLite"),
        "[OK]   " + L("0 dependências externas", "0 external dependencies", "0 dependencias externas"),
        "",
        '<a href="https://github.com/r1g00d/trigger_siem" target="_blank" rel="noopener">github.com/r1g00d/trigger_siem</a>'
      ].join("\n");
    },

    "cat portfolio"() {
      return [
        ...L(
          ["Portfólio interativo: aplicação web estática com WAF simulado,",
           "detecção de SQLi, NoSQLi, XSS, LFI, RCE e SSTI, CSP restritiva",
           "e desafios de enumeração e escalonamento de privilégios."],
          ["Interactive portfolio: static web app with a simulated WAF,",
           "detection of SQLi, NoSQLi, XSS, LFI, RCE and SSTI, a strict CSP",
           "and enumeration and privilege escalation challenges."],
          ["Portafolio interactivo: aplicación web estática con WAF simulado,",
           "detección de SQLi, NoSQLi, XSS, LFI, RCE y SSTI, CSP restrictiva",
           "y desafíos de enumeración y escalada de privilegios."]
        ),
        '<a href="https://github.com/r1g00d/r1g00d.github.io" target="_blank" rel="noopener">github.com/r1g00d/r1g00d.github.io</a>'
      ].join("\n");
    },

    "cat solo-nativo"() {
      return [
        L("Plataforma educacional de geografia, biomas e geopolítica brasileira.",
          "Educational platform on Brazilian geography, biomes and geopolitics.",
          "Plataforma educativa sobre geografía, biomas y geopolítica de Brasil."),
        L("Product Owner e dev. UML, BPMN, ABNT.", "Product Owner and developer. UML, BPMN, ABNT documentation.", "Product Owner y dev. UML, BPMN, documentación ABNT.")
      ].join("\n");
    },

    "nmap -sv r1g0d"() {
      return [
        dim("Starting Nmap ( r1g0d edition )\nHost is up (0.0013s latency)."),
        "PORT       STATE     SERVICE      VERSION",
        '22/tcp     <span class="t-red">open</span>      linux        Kali Linux, Bash Scripting',
        '53/tcp     <span class="t-red">open</span>      ' + L("redes       ", "networking  ", "redes       ") + " TCP/IP, DNS, DHCP, VPN",
        '80/tcp     <span class="t-red">open</span>      web-pentest  Burp Suite, OWASP Top 10',
        '389/tcp    <span class="t-red">open</span>      windows      PowerShell, Active Directory',
        '443/tcp    <span class="t-red">open</span>      python       ' + L("automação, stdlib", "automation, stdlib", "automatización, stdlib"),
        '1337/tcp   <span class="t-red">open</span>      offensive    Nmap, Metasploit, HTB, THM',
        '8080/tcp   <span class="t-red">open</span>      osint        Shodan, Sherlock, Maigret',
        '9200/tcp   <span class="t-amber">filtered</span>  siem         Sentinel, Splunk, QRadar',
        '31337/tcp  <span class="t-amber">filtered</span>  c++          ' + L("em estudo", "learning", "en estudio"),
        "",
        dim(L("open = uso no dia a dia · filtered = em estudo", "open = used day to day · filtered = learning", "open = uso diario · filtered = en estudio"))
      ].join("\n");
    },

    certs() {
      return [
        red("[x]") + " Pre Security (TryHackMe)   " + L("concluído", "completed", "completado"),
        '<span class="t-amber">[~]</span> Jr. Penetration Tester / Cyber Security 101 (TryHackMe)',
        '<span class="t-amber">[~]</span> eJPT                       ' + L("em preparação", "in preparation", "en preparación"),
        dim("[ ]") + " CompTIA Security+          " + L("no caminho", "on the roadmap", "en la ruta"),
        dim("[ ]") + " OSCP                       " + L("próximo alvo", "next target", "próximo objetivo")
      ].join("\n");
    },

    contato() {
      return [
        'e-mail    <a href="mailto:r11gg0d@gmail.com">r11gg0d@gmail.com</a>',
        'linkedin  <a href="https://www.linkedin.com/in/jvrigo/" target="_blank" rel="noopener">linkedin.com/in/jvrigo</a>',
        'github    <a href="https://github.com/r1g00d" target="_blank" rel="noopener">github.com/r1g00d</a>',
        'thm       <a href="https://tryhackme.com/p/r11gg0d" target="_blank" rel="noopener">tryhackme.com/p/r11gg0d</a>',
        L("currículo ", "resume    ", "currículum") + ' <a href="' + CV + '" download="' + CV_NAME + '">' + L("baixar PDF", "download PDF", "descargar PDF") + "</a>"
      ].join("\n");
    },

    cv() {
      notifyCvDownload("Comando 'cv' no Terminal");
      const a = document.createElement("a");
      a.href = CV;
      a.download = CV_NAME;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return L("Baixando currículo...", "Downloading resume...", "Descargando currículum...") + " " +
        dim("(" + L("se não começar, ", "if it does not start, ", "si no empieza, ") + '<a href="' + CV + '" download="' + CV_NAME + '">' + L("clique aqui", "click here", "haz clic aquí") + "</a>)");
    },

    clear() {
      if (out) out.innerHTML = "";
      return null;
    },

    reboot() {
      window.location.reload();
      return L("Reinicializando sistema...", "Rebooting system...", "Reiniciando el sistema...");
    },

    anim() {
      applyAnims(!animsEnabled);
      return L("Animações: ", "Animations: ", "Animaciones: ") +
        '<span class="' + (animsEnabled ? "t-red" : "t-dim") + '">' +
        (animsEnabled ? L("ATIVADAS [ON]", "ON [ON]", "ACTIVADAS [ON]") : L("DESATIVADAS [OFF]", "OFF [OFF]", "DESACTIVADAS [OFF]")) + "</span>";
    },

    "lang"() {
      return L("Idioma atual: ", "Current language: ", "Idioma actual: ") + red(lang.toUpperCase()) + "\n" +
        dim(L("Use", "Use", "Usa") + " lang pt, lang en " + L("ou", "or", "o") + " lang es.");
    },
    "lang pt"() { setLang("pt"); return red("[lang]") + " Português do Brasil."; },
    "lang en"() { setLang("en"); return red("[lang]") + " English."; },
    "lang es"() { setLang("es"); return red("[lang]") + " Español."; },

    "cd ../"() {
      window.scrollTo({ top: 0, behavior: animsEnabled ? "smooth" : "auto" });
      return red(L("Subindo diretório:", "Moving up a directory:", "Subiendo de directorio:")) + " " + (isRoot() ? "root@r1g0d:~#" : "r1g0d@kali:~$");
    },

    ls() {
      return isRoot()
        ? 'findings/   missoes.log   tr1gg3r   portfolio   solo-nativo   <span class="t-red">/root/</span>'
        : "findings/   missoes.log   tr1gg3r   portfolio   solo-nativo";
    },

    "ls -a"() {
      return isRoot()
        ? '.   ..   <span class="t-red">.shadow</span>   findings/   missoes.log   tr1gg3r   portfolio   solo-nativo   <span class="t-red">/root/</span>'
        : '.   ..   <span class="t-red">.shadow</span>   findings/   missoes.log   tr1gg3r   portfolio   solo-nativo';
    },
    "ls -la"() { return COMMANDS["ls -a"](); },

    "cat .shadow"() {
      if (isRoot()) {
        return red("[uid=0] FLAG 3/3:") + " " + atob(FLAG3_B64);
      }
      return red(L("cat: .shadow: Permissão negada", "cat: .shadow: Permission denied", "cat: .shadow: Permiso denegado")) + "\n" +
        dim(L("Só root lê isso. Ou alguém com privilégio emprestado.", "Only root reads this. Or someone with borrowed privilege.", "Solo root lee esto. O alguien con privilegio prestado."));
    },

    "sudo cat .shadow"() {
      return [
        dim(L("[sudo] senha para visitante: ********", "[sudo] password for visitante: ********", "[sudo] contraseña para visitante: ********")),
        L("Escalonamento de privilégio bem-sucedido.", "Privilege escalation successful.", "Escalada de privilegios exitosa."),
        "",
        red("FLAG 3/3:") + " " + atob(FLAG3_B64)
      ].join("\n");
    },

    "sudo hire r1g0d"() {
      return [
        dim(L("[sudo] senha para recrutador: ********", "[sudo] password for recruiter: ********", "[sudo] contraseña para reclutador: ********")),
        L("Permissão concedida. Abrindo canal...", "Permission granted. Opening channel...", "Permiso concedido. Abriendo canal..."),
        '<a href="mailto:r11gg0d@gmail.com?subject=Oportunidade%20-%20r1g0d">r11gg0d@gmail.com</a>'
      ].join("\n");
    },

    hint() {
      const tips = [
        L("flag 1: todo recon começa lendo o que está exposto. Ctrl+U.", "flag 1: every recon starts by reading what is exposed. Ctrl+U.", "flag 1: todo recon empieza leyendo lo que está expuesto. Ctrl+U."),
        L("flag 2: desenvolvedores deixam rastros no console (F12).", "flag 2: developers leave traces in the console (F12).", "flag 2: los desarrolladores dejan rastros en la consola (F12)."),
        L("flag 3: nem todo arquivo aparece no ls. E nem todo arquivo se lê sem privilégio.", "flag 3: not every file shows up in ls. And not every file can be read without privilege.", "flag 3: no todo archivo aparece en ls. Y no todo archivo se lee sin privilegio.")
      ];
      const pending = [1, 2, 3].filter((n) => !found.includes(n));
      if (!pending.length) return L("Você já tem root. Digite ", "You already have root. Type ", "Ya tienes root. Escribe ") + red("cat /root/contratar.txt") + ".";
      return pending.map((n) => dim(tips[n - 1])).join("\n");
    },

    flags() {
      return `Flags: ${found.length}/3 ` +
        (found.length ? dim("(" + [...found].sort().map((n) => "#" + n).join(" ") + ")") : "");
    },

    "reset -flags"() {
      const hadAny = found.length > 0;
      found = [];
      store.remove("r1-flags");
      syncRootState({ animate: false });
      if (!hadAny) {
        return dim(L("Nenhuma flag estava registrada. Progresso em 0/3.", "No flag was registered. Progress at 0/3.", "Ninguna flag estaba registrada. Progreso en 0/3."));
      }
      return [
        red("[CTF]") + " " + L("Progresso zerado: ", "Progress reset: ", "Progreso reiniciado: ") + '<span class="t-amber">flags 0/3</span>.',
        dim(L("Privilégio revertido para visitante (uid=1000).", "Privilege reverted to visitor (uid=1000).", "Privilegio revertido a visitante (uid=1000)."))
      ].join("\n");
    },

    exit() { return dim(L("Não existe saída. Só Ctrl+W.", "There is no exit. Only Ctrl+W.", "No hay salida. Solo Ctrl+W.")); },

    "rm -rf /"() {
      hitGlitch();
      return red(L("Boa tentativa.", "Nice try.", "Buen intento.")) + " " +
        dim(L("Este sistema está fora do escopo autorizado.", "This system is outside the authorized scope.", "Este sistema está fuera del alcance autorizado."));
    }
  };

  /* =========================================================
     10. ALIASES
     ========================================================= */
  const ALIAS = {
    "?": "help", ajuda: "help", ayuda: "help",
    "cat missoes": "cat missoes.log", missoes: "cat missoes.log",
    "experiencia": "cat missoes.log", "experiência": "cat missoes.log", experience: "cat missoes.log",
    "ls findings": "ls findings/", findings: "ls findings/", projetos: "ls findings/", projects: "ls findings/", proyectos: "ls findings/",
    "cat findings/tr1gg3r": "cat tr1gg3r", "cat findings/solo-nativo": "cat solo-nativo", "cat findings/portfolio": "cat portfolio",
    nmap: "nmap -sv r1g0d", "nmap r1g0d": "nmap -sv r1g0d", skills: "nmap -sv r1g0d", habilidades: "nmap -sv r1g0d",
    curriculo: "cv", "currículo": "cv", resume: "cv", "currículum": "cv", curriculum: "cv", cls: "clear", contact: "contato", contacto: "contato", logout: "exit",
    cd: "cd ../", "cd ..": "cd ../", "..": "cd ../", "../": "cd ../",
    "cd ~": "cd ../", "cd /": "cd ../", topo: "cd ../", top: "cd ../",
    "ls /root/": "ls /root", "ls root": "ls /root", "ls root/": "ls /root",
    "cat /root/contratar": "cat /root/contratar.txt",
    "cat contratar.txt": "cat /root/contratar.txt",
    "contratar.txt": "cat /root/contratar.txt",
    contratar: "cat /root/contratar.txt", hire: "cat /root/contratar.txt",
    reset: "reset -flags", "reset --flags": "reset -flags", "reset flags": "reset -flags",
    idioma: "lang", language: "lang"
  };

  /* =========================================================
     11. SUBMISSÃO DE FLAGS
     ========================================================= */
  function submitFlag(arg) {
    const clean = arg.trim().replace(/^['"]|['"]$/g, "");
    let target = clean;
    if (clean === FLAG2_B64) target = atob(FLAG2_B64);
    else if (clean === FLAG3_B64) target = atob(FLAG3_B64);
    target = target.replace(/^r1g00d\{/i, "r1g0d{");

    const n = FLAGS[hash(target)];
    if (!n) return red(L("Flag inválida.", "Invalid flag.", "Flag inválida.")) + " " + dim(L("Formato: r1g0d{...}", "Format: r1g0d{...}", "Formato: r1g0d{...}"));
    if (found.includes(n)) return L(`Flag #${n} já registrada. ${found.length}/3.`, `Flag #${n} already registered. ${found.length}/3.`, `Flag #${n} ya registrada. ${found.length}/3.`);

    found.push(n);
    store.set("r1-flags", found);
    hitGlitch();

    if (found.length === 3) {
      syncRootState({ animate: true });
      return [
        '<span class="t-red">#############################################</span>',
        red(L("#        ACESSO ROOT CONCEDIDO  3/3         #", "#        ROOT ACCESS GRANTED  3/3           #", "#        ACCESO ROOT CONCEDIDO  3/3         #")),
        '<span class="t-red">#############################################</span>',
        "",
        L("Prompt elevado para ", "Prompt elevated to ", "Prompt elevado a ") + red("root@r1g0d:~#") + ".",
        L("Novos comandos destravados: ", "New commands unlocked: ", "Nuevos comandos desbloqueados: ") + red("ls /root") + L(" e ", " and ", " y ") + red("cat /root/contratar.txt") + ".",
        L("Contato direto: ", "Direct contact: ", "Contacto directo: ") + '<a href="mailto:r11gg0d@gmail.com?subject=Peguei%20as%203%20flags">r11gg0d@gmail.com</a>'
      ].join("\n");
    }

    syncRootState({ animate: false });
    return '<span class="t-cyan">' + L(`Flag #${n} aceita!`, `Flag #${n} accepted!`, `¡Flag #${n} aceptada!`) + "</span> " + found.length + "/3.";
  }

  /* =========================================================
     12. WAF DE BRINQUEDO
     ========================================================= */
  let intrusions = Math.floor(Number(store.get("r1-intrusions", 0)));
  if (!Number.isFinite(intrusions) || intrusions < 0) intrusions = 0;
  intrusions = Math.min(intrusions, 9999);

  const THREATS = [
    { kind: "tool", re: [/\b(sqlmap|havij|jsql|nosqlmap|commix)\b/] },
    { kind: "sqli", re: [
      /['"]\s*(or|and)\s+\S/,
      /\b(or|and)\s+['"]?\w+['"]?\s*(=|<|>|like\b)\s*['"]?\w+/,
      /\bunion\b[\s\S]{0,20}\bselect\b/,
      /\bselect\b[\s\S]+\bfrom\b/,
      /\b(insert\s+into|delete\s+from|drop\s+(table|database|schema)|truncate\s+table|alter\s+table|create\s+table)\b/,
      /\bupdate\s+\w+\s+set\b/,
      /;\s*(drop|select|insert|update|delete|shutdown|exec|waitfor)\b/,
      /['"]\s*(--|#|\/\*)/,
      /\b(sleep|pg_sleep|benchmark|load_file|extractvalue|updatexml|group_concat)\s*\(/,
      /\bwaitfor\s+delay\b|\binto\s+(out|dump)file\b|\border\s+by\s+\d+/,
      /\b(information_schema|sqlite_master|pg_catalog|mysql\.user|sysobjects|xp_cmdshell|pg_shadow)\b/,
      /\b1\s*=\s*1\b/
    ] },
    { kind: "nosql", re: [
      /\{\s*["']?\$(ne|gt|gte|lt|lte|in|nin|regex|where|or|and|exists)\b/,
      /\[\$(ne|gt|gte|lt|lte|regex|where)\]/
    ] },
    { kind: "xss", re: [
      /<\s*\/?\s*(script|img|svg|iframe|object|embed|body|style|link|meta|video|audio|details|marquee|input|form|math|base)\b/,
      /\bon(error|load|click|mouseover|mouseenter|focus|toggle|begin|start)\s*=/,
      /\b(javascript|vbscript)\s*:/,
      /\bdata:text\/html/,
      /\b(alert|prompt|confirm)\s*\(/,
      /\bdocument\.(cookie|domain|location|write)|\bwindow\.location|\beval\s*\(|\bfromcharcode\b/
    ] },
    { kind: "path", re: [
      /(\.\.[\/\\]\s*){2,}/,
      /\.\.[\/\\]+\w*(etc|proc|root|windows|passwd|shadow)/,
      /\/etc\/(passwd|shadow|hosts|sudoers|group|issue)\b/,
      /\/proc\/(self|\d+)/,
      /\b(id_rsa|id_ed25519|authorized_keys|known_hosts|wp-config|web\.config)\b/,
      /(^|[\s\/\\])(\.htpasswd|\.htaccess|\.bash_history|\.aws\/credentials|\.git\/(config|head))\b/,
      /(^|[\s\/\\])\.env(\.\w+)?(\s|$)/,
      /\b(file|php|gopher|dict|ftp|jar|expect|phar):\/\//,
      /\bwindows[\/\\]system32\b|\bboot\.ini\b/
    ] },
    { kind: "cmd", re: [
      /\$\(|`/,
      /(;|\|\|?|&&)\s*(nc|ncat|netcat|bash|sh|zsh|dash|curl|wget|python3?|perl|php|ruby|powershell|pwsh|cmd|nslookup|ping|whoami|id|uname|cat|ls|rm|chmod|echo|sleep)\b/,
      /\/dev\/tcp\//,
      /\b(nc|ncat|netcat)\b\s+(\S+\s+)*\d{2,5}\b/,
      /\bbash\s+-i\b/,
      /^\s*(printenv|env|export\s+-p)\s*$/
    ] },
    { kind: "ssti", re: [
      /\$\{[^}]*\}/,
      /\{\{[^}]*\}\}/,
      /<%[\s\S]*?%>/,
      /#\{[^}]*\}/
    ] }
  ];

  function payloadVariants(s) {
    const base = [s.toLowerCase()];
    let cur = base[0];
    for (let i = 0; i < 2; i++) {
      try {
        const d = decodeURIComponent(cur.replace(/\+/g, " "));
        if (d === cur) break;
        base.push(d);
        cur = d;
      } catch { break; }
    }
    return base
      .concat(base.map((v) => v.replace(/\/\*[\s\S]*?\*\//g, " ")))
      .map((v) => v.replace(/\s+/g, " "));
  }

  function detectThreat(line) {
    const variants = payloadVariants(line);
    for (const t of THREATS) {
      for (const v of variants) {
        if (t.re.some((re) => re.test(v))) return t.kind;
      }
    }
    return null;
  }

  // Cada campo tem as 3 versões: pt, en, es. O idioma é escolhido em playTaunt.
  const TAUNTS = {
    tool: {
      label: { pt: "scanner automático (sqlmap & cia)", en: "automated scanner (sqlmap & co)", es: "escáner automático (sqlmap y cía)" },
      verb: { pt: "varrendo parâmetros", en: "scanning parameters", es: "escaneando parámetros" },
      error: {
        pt: "0 parâmetros injetáveis em 0 formulários. Este terminal não fala SQL, fala português.",
        en: "0 injectable parameters in 0 forms. This terminal does not speak SQL, it speaks English.",
        es: "0 parámetros inyectables en 0 formularios. Esta terminal no habla SQL, habla español."
      },
      quips: {
        pt: [
          "sqlmap --batch --dump  →  dumped: nada. Nem uma tabela. Nem um byte.",
          "Uma ferramenta de milhares de estrelas no GitHub contra um index.html. Equilibrado.",
          "Reconhecimento primeiro, ferramenta depois. Teria economizado essa viagem."
        ],
        en: [
          "sqlmap --batch --dump  →  dumped: nothing. Not a table. Not a byte.",
          "A tool with thousands of GitHub stars against an index.html. Fair fight.",
          "Recon first, tool later. It would have saved you the trip."
        ],
        es: [
          "sqlmap --batch --dump  →  dumped: nada. Ni una tabla. Ni un byte.",
          "Una herramienta con miles de estrellas en GitHub contra un index.html. Pelea pareja.",
          "Primero reconocimiento, después herramienta. Te habrías ahorrado el viaje."
        ]
      }
    },
    sqli: {
      label: { pt: "SQL injection", en: "SQL injection", es: "SQL injection" },
      verb: { pt: "extraindo dados", en: "extracting data", es: "extrayendo datos" },
      error: {
        pt: "ERRO 1146: a tabela 'segredos' não existe. O site é HTML estático: não há banco de dados.",
        en: "ERROR 1146: table 'secrets' does not exist. The site is static HTML: there is no database.",
        es: "ERROR 1146: la tabla 'secretos' no existe. El sitio es HTML estático: no hay base de datos."
      },
      quips: {
        pt: [
          "SELECT dignidade FROM visitante;  →  0 rows returned",
          "' OR '1'='1  →  parabéns, 1 continua igual a 1. A matemática segue intacta.",
          "Nível da tentativa: tutorial de YouTube de 2012.",
          "DROP TABLE expectativas;  →  executado. Essa tabela, sim, existia.",
          "O banco que você procura está de férias. Desde que nunca foi criado."
        ],
        en: [
          "SELECT dignity FROM visitor;  →  0 rows returned",
          "' OR '1'='1  →  congratulations, 1 is still equal to 1. Math remains intact.",
          "Attempt level: 2012 YouTube tutorial.",
          "DROP TABLE expectations;  →  executed. That table did exist.",
          "The database you are looking for is on vacation. Since it was never created."
        ],
        es: [
          "SELECT dignidad FROM visitante;  →  0 rows returned",
          "' OR '1'='1  →  felicidades, 1 sigue siendo igual a 1. Las matemáticas siguen intactas.",
          "Nivel del intento: tutorial de YouTube de 2012.",
          "DROP TABLE expectativas;  →  ejecutado. Esa tabla sí existía.",
          "La base de datos que buscas está de vacaciones. Desde que nunca fue creada."
        ]
      }
    },
    nosql: {
      label: { pt: "NoSQL injection", en: "NoSQL injection", es: "NoSQL injection" },
      verb: { pt: "consultando coleção", en: "querying collection", es: "consultando colección" },
      error: {
        pt: "MongoServerError: sem servidor, sem coleção, sem documentos. Só HTML.",
        en: "MongoServerError: no server, no collection, no documents. Just HTML.",
        es: "MongoServerError: sin servidor, sin colección, sin documentos. Solo HTML."
      },
      quips: {
        pt: [
          '{"$ne": null}  →  "$ne" de "não encontrou nada".',
          "db.users.find({})  →  db is not defined. Nem o db existe.",
          "Trocou o SQL pelo JSON e continuou sem banco. Criativo, ao menos."
        ],
        en: [
          '{"$ne": null}  →  "$ne" as in "not even close".',
          "db.users.find({})  →  db is not defined. Not even the db exists.",
          "Swapped SQL for JSON and still no database. Creative, at least."
        ],
        es: [
          '{"$ne": null}  →  "$ne" de "no encontró nada".',
          "db.users.find({})  →  db is not defined. Ni la db existe.",
          "Cambió el SQL por JSON y sigue sin base de datos. Creativo, al menos."
        ]
      }
    },
    xss: {
      label: { pt: "XSS (cross-site scripting)", en: "XSS (cross-site scripting)", es: "XSS (cross-site scripting)" },
      verb: { pt: "injetando script", en: "injecting script", es: "inyectando script" },
      error: {
        pt: "Seu payload foi impresso como texto puro. Nada executa aqui, e a CSP bloqueia script inline.",
        en: "Your payload was printed as plain text. Nothing runs here, and the CSP blocks inline scripts.",
        es: "Tu payload se imprimió como texto plano. Aquí no se ejecuta nada, y la CSP bloquea scripts inline."
      },
      quips: {
        pt: [
          "alert(1)  →  o único alerta deste site é vermelho e é este.",
          "Content-Security-Policy: script-src 'self'. O navegador ignorou você educadamente.",
          "A tag virou texto. Ficou até bonito."
        ],
        en: [
          "alert(1)  →  the only alert on this site is red, and this is it.",
          "Content-Security-Policy: script-src 'self'. The browser politely ignored you.",
          "The tag became text. It even looks nice."
        ],
        es: [
          "alert(1)  →  la única alerta de este sitio es roja y es esta.",
          "Content-Security-Policy: script-src 'self'. El navegador te ignoró educadamente.",
          "La etiqueta se volvió texto. Hasta quedó bonito."
        ]
      }
    },
    path: {
      label: { pt: "path traversal / arquivo sensível", en: "path traversal / sensitive file", es: "path traversal / archivo sensible" },
      verb: { pt: "subindo diretórios", en: "climbing directories", es: "subiendo directorios" },
      error: {
        pt: "Você chegou à raiz de um site estático. Lá em cima só tem index.html, css/ e js/.",
        en: "You reached the root of a static site. Up there is only index.html, css/ and js/.",
        es: "Llegaste a la raíz de un sitio estático. Allá arriba solo hay index.html, css/ y js/."
      },
      quips: {
        pt: [
          "/etc/passwd  →  esse arquivo não mora aqui. Quem hospeda é o GitHub Pages.",
          "../../../  →  três níveis acima e continua no mesmo lugar: lugar nenhum.",
          "Procurando .env? As únicas variáveis de ambiente daqui são as flags, e elas estão mais bem escondidas que isso."
        ],
        en: [
          "/etc/passwd  →  that file does not live here. GitHub Pages is the host.",
          "../../../  →  three levels up and still in the same place: nowhere.",
          "Looking for .env? The only environment variables here are the flags, and they are better hidden than that."
        ],
        es: [
          "/etc/passwd  →  ese archivo no vive aquí. El anfitrión es GitHub Pages.",
          "../../../  →  tres niveles arriba y sigues en el mismo lugar: ninguno.",
          "¿Buscando .env? Las únicas variables de entorno de aquí son las flags, y están mejor escondidas que eso."
        ]
      }
    },
    cmd: {
      label: { pt: "injeção de comando", en: "command injection", es: "inyección de comandos" },
      verb: { pt: "abrindo shell reverso", en: "opening reverse shell", es: "abriendo shell reverso" },
      error: {
        pt: "Nenhum processo foi criado. O terminal só imprime texto, não executa nada.",
        en: "No process was created. The terminal only prints text, it executes nothing.",
        es: "No se creó ningún proceso. La terminal solo imprime texto, no ejecuta nada."
      },
      quips: {
        pt: [
          "nc -lvnp 4444  →  conectado em 127.0.0.1. Em você mesmo.",
          "; whoami  →  visitante. Sempre visitante.",
          "Shell reverso recebido: era um espelho."
        ],
        en: [
          "nc -lvnp 4444  →  connected to 127.0.0.1. To yourself.",
          "; whoami  →  visitante. Always visitante.",
          "Reverse shell received: it was a mirror."
        ],
        es: [
          "nc -lvnp 4444  →  conectado a 127.0.0.1. A ti mismo.",
          "; whoami  →  visitante. Siempre visitante.",
          "Shell reverso recibido: era un espejo."
        ]
      }
    },
    ssti: {
      label: { pt: "injeção de template/expressão", en: "template/expression injection", es: "inyección de plantilla/expresión" },
      verb: { pt: "avaliando expressão", en: "evaluating expression", es: "evaluando expresión" },
      error: {
        pt: "Sem template engine, sem JNDI, sem milagre. A expressão voltou do jeito que chegou.",
        en: "No template engine, no JNDI, no miracle. The expression came back the way it arrived.",
        es: "Sin motor de plantillas, sin JNDI, sin milagros. La expresión volvió tal como llegó."
      },
      quips: {
        pt: [
          "{{7*7}}  →  {{7*7}}. Aqui 7*7 continua sendo 7*7.",
          "${jndi:ldap://...}  →  nenhum Java foi ferido nesta operação.",
          "Tentou Log4Shell num site sem Java. Ousado."
        ],
        en: [
          "{{7*7}}  →  {{7*7}}. Here 7*7 is still 7*7.",
          "${jndi:ldap://...}  →  no Java was harmed in this operation.",
          "Tried Log4Shell on a site with no Java. Bold."
        ],
        es: [
          "{{7*7}}  →  {{7*7}}. Aquí 7*7 sigue siendo 7*7.",
          "${jndi:ldap://...}  →  ningún Java resultó herido en esta operación.",
          "Probó Log4Shell en un sitio sin Java. Audaz."
        ]
      }
    }
  };

  function verdict(n) {
    if (n === 1) return L("Primeira tentativa. Vou fingir que foi curiosidade.", "First attempt. I will pretend it was curiosity.", "Primer intento. Voy a fingir que fue curiosidad.");
    if (n === 2) return L("Segunda tentativa. Já está virando hobby.", "Second attempt. It is becoming a hobby.", "Segundo intento. Ya se está volviendo un pasatiempo.");
    if (n < 5) return L("Tentativa #" + n + ". Respeito a persistência.", "Attempt #" + n + ". I respect the persistence.", "Intento #" + n + ". Respeto la persistencia.");
    return L("Tentativa #" + n + ". Se é pra atacar, que seja com escopo e contrato: digite sudo hire r1g0d.",
             "Attempt #" + n + ". If you are going to attack, do it with scope and a contract: type sudo hire r1g0d.",
             "Intento #" + n + ". Si vas a atacar, que sea con alcance y contrato: escribe sudo hire r1g0d.");
  }

  const wait = (ms) => (animsEnabled ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

  async function playTaunt(kind, payload) {
    const T = TAUNTS[kind];
    if (!T || !input) return;
    busy = true;
    input.readOnly = true;
    intrusions = Math.min(intrusions + 1, 9999);
    store.set("r1-intrusions", intrusions);

    const shown = esc(payload.length > 72 ? payload.slice(0, 72) + "…" : payload);
    if (animsEnabled) {
      if (termBox) termBox.classList.add("is-taunt");
      hitGlitch();
    }

    try {
      print('<span class="t-red">[WAF]</span> ' + L("payload interceptado: ", "payload intercepted: ", "payload interceptado: ") + '<span class="t-amber">' + shown + "</span>");
      await wait(350);
      print('<span class="t-red">[WAF]</span> ' + L("classificação: ", "classification: ", "clasificación: ") + esc(T.label[lang]));
      await wait(450);

      const bar = document.createElement("p");
      bar.className = "taunt-bar";
      bar.setAttribute("aria-hidden", "true");
      if (out) out.appendChild(bar);
      const W = 20;
      const frames = animsEnabled ? 14 : 1;
      for (let i = 1; i <= frames; i++) {
        const filled = Math.round((i / frames) * W);
        bar.textContent = "[WAF] " + T.verb[lang] + "  [" + "█".repeat(filled) + "░".repeat(W - filled) + "] " + Math.round((i / frames) * 100) + "%";
        if (out) out.scrollTop = out.scrollHeight;
        await wait(60);
      }

      await wait(200);
      print('<span class="t-red">[SYS]</span> ' + esc(T.error[lang]));
      await wait(450);
      const quips = T.quips[lang];
      print('<span class="t-cyan">&gt;</span> ' + esc(quips[(intrusions - 1) % quips.length]));
      await wait(500);
      print(
        '<span class="t-red">╔════════════════════════════╗\n' +
        L("║   ACESSO NEGADO  //  :)    ║\n", "║   ACCESS DENIED  //  :)    ║\n", "║   ACCESO DENEGADO  //  :)  ║\n") +
        "╚════════════════════════════╝</span>"
      );
      await wait(250);
      print('<span class="t-dim">[WAF] ' + L("autorização para atacar este site: nenhuma encontrada.", "authorization to attack this site: none found.", "autorización para atacar este sitio: ninguna encontrada.") + "</span>");
      print('<span class="t-dim">' + esc(verdict(intrusions)) + "</span>");
    } finally {
      if (termBox) termBox.classList.remove("is-taunt");
      busy = false;
      input.readOnly = false;
      input.focus({ preventScroll: true });
    }
  }

  /* =========================================================
     13. EXECUÇÃO E ATALHOS DO TERMINAL
     ========================================================= */
  function run(raw) {
    const line = raw.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    if (!line) return;
    print(esc(line), isRoot() ? "cmd cmd--root" : "cmd");
    historyLog.push(line);
    hIdx = historyLog.length;

    const threat = detectThreat(line);
    if (threat) { playTaunt(threat, line); return; }

    if (line === FLAG2_B64 || line === FLAG3_B64) { print(submitFlag(line)); return; }
    const flagMatch = line.match(/r1g0{1,2}d\{[^}]+\}/i);
    if (flagMatch) { print(submitFlag(flagMatch[0])); return; }

    const lower = line.toLowerCase().replace(/\s+/g, " ");

    if (lower.startsWith("submit ")) { print(submitFlag(line.slice(7))); return; }
    if (lower === "submit") { print(dim(L("Cole a flag r1g0d{...} direto ou use submit &lt;flag&gt;", "Paste the flag r1g0d{...} directly or use submit &lt;flag&gt;", "Pega la flag r1g0d{...} directo o usa submit &lt;flag&gt;"))); return; }

    const key = hasOwn(ALIAS, lower) ? ALIAS[lower] : lower;
    const fn = hasOwn(COMMANDS, key) ? COMMANDS[key] : null;
    if (fn) {
      const res = fn();
      if (res !== null) print(res);
    } else if (lower.startsWith("sudo ")) {
      print(red(L("visitante não está no arquivo sudoers.", "visitante is not in the sudoers file.", "visitante no está en el archivo sudoers.")) + " " + dim(L("Este incidente será reportado.", "This incident will be reported.", "Este incidente será reportado.")));
    } else {
      print(red(L("comando não encontrado:", "command not found:", "comando no encontrado:")) + " " + esc(line.split(" ")[0]) + "\n" + dim(L("Digite", "Type", "Escribe")) + " help " + dim(L("ou use os botões abaixo.", "or use the buttons below.", "o usa los botones de abajo.")));
    }
  }

  function typeAndRun(cmd) {
    if (busy || !input) return;
    if (!animsEnabled) { run(cmd); return; }
    busy = true;
    input.readOnly = true;
    input.value = "";
    let i = 0;
    const t = setInterval(() => {
      input.value = cmd.slice(0, ++i);
      if (i >= cmd.length) {
        clearInterval(t);
        setTimeout(() => {
          input.value = "";
          busy = false;
          input.readOnly = false;
          run(cmd);
        }, 120);
      }
    }, 28);
  }

  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (busy) return;
      const v = input.value;
      input.value = "";
      run(v);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        if (hIdx > 0) { hIdx--; input.value = historyLog[hIdx]; }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (hIdx < historyLog.length - 1) { hIdx++; input.value = historyLog[hIdx]; }
        else { hIdx = historyLog.length; input.value = ""; }
        e.preventDefault();
      } else if (e.key === "Tab" && !e.shiftKey) {
        const v = input.value.toLowerCase();
        if (!v) return;
        const rootOnly = ["ls /root", "cat /root/contratar.txt", "breach", "cat .shadow"];
        const keys = Object.keys(COMMANDS)
          .concat("submit ")
          .filter((k) => k.startsWith(v) && (isRoot() || !rootOnly.includes(k)));
        if (!keys.length) return;
        let lcp = keys[0];
        for (const k of keys) { while (!k.startsWith(lcp)) lcp = lcp.slice(0, -1); }
        if (lcp.length > v.length) { input.value = lcp; e.preventDefault(); }
      } else if (e.key === "l" && e.ctrlKey) {
        if (out) out.innerHTML = "";
        e.preventDefault();
      }
    });
  }

  document.querySelectorAll("[data-cmd]").forEach((b) => {
    b.addEventListener("click", () => typeAndRun(b.dataset.cmd));
  });

  document.querySelectorAll("[data-lang]").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.dataset.lang === lang) return;
      setLang(b.dataset.lang);
      print(red("[lang]") + " " + L("Português do Brasil.", "English.", "Español."));
    });
  });

  /* =========================================================
     14. EFEITOS VISUAIS (GLITCH), EASTER EGG E VOLTAR AO TOPO
     ========================================================= */
  const title = $(".glitch");

  function hitGlitch() {
    if (!animsEnabled || !title) return;
    title.classList.add("is-hit");
    setTimeout(() => title.classList.remove("is-hit"), 900);
  }

  if (title) title.addEventListener("click", hitGlitch);

  const SCRAMBLE = "!<>-_/[]{}=+*^?#01";

  function scramble(el) {
    const final = el.dataset.text;
    if (!animsEnabled || !final) return;
    const total = 14;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      let result = "";
      for (let i = 0; i < final.length; i++) {
        result += (final[i] === " " || i < (frame / total) * final.length)
          ? final[i]
          : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      }
      el.textContent = result;
      if (frame >= total) { clearInterval(timer); el.textContent = final; }
    }, 38);
  }

  function flicker(el) {
    if (!animsEnabled) return;
    el.classList.remove("is-glitching");
    void el.offsetWidth;
    el.classList.add("is-glitching");
    setTimeout(() => el.classList.remove("is-glitching"), 520);
  }

  const heads = document.querySelectorAll("h2");
  heads.forEach((h) => {
    h.dataset.text = h.textContent;
    h.setAttribute("aria-label", h.textContent);
    h.classList.add("glitch-h");
    h.addEventListener("mouseenter", () => flicker(h));
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (animsEnabled) {
          scramble(en.target);
          flicker(en.target);
        }
      });
    }, { threshold: 0.6 });
    heads.forEach((h) => io.observe(h));
  }

  function frameGlitch() {
    if (animsEnabled && !document.hidden && !document.getElementById("boot")) {
      document.body.classList.add("is-frame-hit");
      hitGlitch();
      setTimeout(() => document.body.classList.remove("is-frame-hit"), 220);
    }
    setTimeout(frameGlitch, 5000 + Math.random() * 6000);
  }
  setTimeout(frameGlitch, 3500);

  // Easter Egg (Hackers, 1995)
  const planetEgg = $("#planet-egg");
  const planetQuoteEl = $("#planet-quote");
  if (planetEgg) {
    const QUOTES = [
      { html: "&ldquo;HACK THE PLANET!&rdquo;", text: "“HACK THE PLANET!”" },
      { html: "&ldquo;Mess with the best, die like the rest.&rdquo;", text: "“Mess with the best, die like the rest.”" },
      { html: "&ldquo;Never send a boy to do a machine's job.&rdquo;", text: "“Never send a boy to do a machine's job.”" },
      { html: "&ldquo;Zero Cool? You're the one that crashed 1,507 systems in one day!&rdquo;", text: "“Zero Cool? You're the one that crashed 1,507 systems in one day!”" }
    ];
    let qIdx = 0;

    function triggerPlanet() {
      qIdx = (qIdx + 1) % QUOTES.length;
      const item = QUOTES[qIdx];
      if (planetQuoteEl) planetQuoteEl.textContent = item.text;
      hitGlitch();
      print('<span class="t-red">[HACKERS // 1995]</span> ' + item.html);
      if (animsEnabled && !document.body.classList.contains("is-frame-hit")) {
        document.body.classList.add("is-frame-hit");
        setTimeout(() => document.body.classList.remove("is-frame-hit"), 220);
      }
    }

    planetEgg.addEventListener("click", triggerPlanet);
    planetEgg.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        triggerPlanet();
      }
    });
  }

  // Botão Voltar ao Topo (cd ~)
  const btnTop = $("#btn-top");
  if (btnTop) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 350) {
            btnTop.classList.add("is-visible");
          } else {
            btnTop.classList.remove("is-visible");
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    btnTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: animsEnabled ? "smooth" : "auto" });
    });
  }

  /* =========================================================
     15. INICIALIZAÇÃO DO TERMINAL
     ========================================================= */
  let started = false;
  function startTerminal() {
    if (started) return;
    started = true;
    print('<span class="t-dim">r1g0d OS 6.6.6 · tty1</span>');
    print('<span class="t-red">Hello, friend.</span>');
    print(L("Bem-vindo. Digite ", "Welcome. Type ", "Bienvenido. Escribe ") + red("help") + L(" ou clique num dos botões abaixo.", " or click one of the buttons below.", " o haz clic en uno de los botones de abajo."));
    if (isRoot()) {
      print(red(L("[ROOT ATIVO]", "[ROOT ACTIVE]", "[ROOT ACTIVO]")) + " " + L("Sessão elevada restaurada. Digite ", "Elevated session restored. Type ", "Sesión elevada restaurada. Escribe ") + red("cat /root/contratar.txt") + L(" ou ", " or ", " o ") + red("help") + ".");
    } else if (found.length) {
      print(dim(L("Sessão anterior: " + found.length + "/3 flags encontradas.", "Previous session: " + found.length + "/3 flags found.", "Sesión anterior: " + found.length + "/3 flags encontradas.")));
    }
  }

  /* =========================================================
     16. TELEMETRIA: NOTIFICAR DOWNLOAD DE CURRÍCULO POR E-MAIL
     ========================================================= */
  const CV_WEBHOOK_URL = "https://api.web3forms.com/submit";
  const CV_ACCESS_KEY = "999344be-ff34-478a-a3df-a555e7daf164";
  let cvNotifiedInSession = false;

  function notifyCvDownload(origem) {
    if (cvNotifiedInSession || !CV_ACCESS_KEY || CV_ACCESS_KEY === "COLE_SUA_ACCESS_KEY_AQUI") return;
    cvNotifiedInSession = true;

    const payload = {
      access_key: CV_ACCESS_KEY,
      subject: "[r1g0d.github.io] Alguém baixou seu currículo!",
      from_name: "r1g0d Portfolio Telemetry",
      origem: origem,
      modo_root: isRoot() ? "SIM (Conquistou 3/3 flags!)" : `Não (${found.length}/3 flags)`,
      tentativas_waf: String(intrusions),
      referrer: document.referrer || "Acesso direto",
      idioma: navigator.language || "desconhecido",
      tela: `${window.innerWidth}x${window.innerHeight}`,
      horario: new Date().toLocaleString("pt-BR")
    };

    fetch(CV_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => { /* falha silenciosa se houver bloqueador */ });
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href*="curriculo.pdf"]');
    if (!link) return;
    const origem = link.closest(".topbar") ? "Header (Topbar)"
      : link.closest("#contato") ? "Seção Contato"
      : link.closest("#terminal") ? "Link dentro do Terminal"
      : "Página";
    notifyCvDownload(origem);
  });

})();