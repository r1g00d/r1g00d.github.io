/* =========================================================
   r1g00d // portfólio — terminal, boot, WAF e mini CTF
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
     2. ESTADO DO MINI CTF (3 FLAGS -> ROOT)
     ========================================================= */
  const hash = (s) => {
    let x = 5381;
    for (const c of s) x = ((x << 5) + x + c.codePointAt(0)) >>> 0;
    return x.toString(16);
  };

  const FLAGS = { "191bc2e3": 1, "b1084e89": 2, "f9e0615e": 3 };
  const FLAG2_B64 = "cjFnMDBke2MwbnMwbDNfMXNfNF9zaDNsbH0=";
  const FLAG3_B64 = "cjFnMDBke3ByMXZfM3NjX3YxYV9zdWQwfQ==";

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
    const GLYPHS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンR1G00D#$*+";
    const FONT_SIZE = 15;
    let rafId = null;
    let lastTick = 0;
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

    function draw(now) {
      rafId = window.requestAnimationFrame(draw);
      if (document.hidden || now - lastTick < 42) return;
      lastTick = now;

      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      ctx.font = `${FONT_SIZE}px "IBM Plex Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
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
        lastTick = 0;
        rafId = window.requestAnimationFrame(draw);
      },
      stop() {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
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

  applyAnims(true);

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
      if (txt) txt.textContent = isOpen ? "[fechar]" : "[menu]";
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

  const BREACH_STEPS = [
    ["[ 0.0s ] Bypass de autenticação concluído ...... OK", "b-ok", 0],
    ["[ 0.6s ] Escalonando contexto: uid=0(root) ...... OK", "b-ok", 550],
    ["[ 1.2s ] Injetando payload no DOM & CRT ......... OK", "b-ok", 1150],
    ["[ 1.8s ] Desbloqueando /root/contratar.txt ...... OK", "b-ok", 1750],
    ["[ 2.4s ] Modo Red Team & Matrix ativados ........ OVERRIDE", "b-sig", 2350]
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
      BREACH_STEPS.forEach(([txt, cls]) => {
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

    BREACH_STEPS.forEach(([txt, cls, delay]) => {
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
      if (termTitle) termTitle.textContent = "root@r1g00d: ~";
      if (termPrompt) termPrompt.textContent = "root@r1g00d:~#";
      if (animsEnabled) matrix.start();
      if (animate) playBreachSequence();
    } else {
      document.body.classList.remove("is-root");
      if (counter) {
        counter.textContent = `flags ${found.length}/3`;
        counter.classList.remove("is-root");
      }
      if (termTitle) termTitle.textContent = "r1g00d@kali: ~";
      if (termPrompt) termPrompt.textContent = "r1g00d@kali:~$";
      matrix.stop();
      closeBreach();
    }
  }

  syncRootState({ animate: false });

  // FLAG 2: está no console para quem inspeciona o DevTools.
  console.log(
    "%cr1g00d",
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
    ["[    0.000] r1g00d kernel 6.6.6-redteam inicializando", "ok"],
    ["[    0.112] montando /dev/curiosidade ........ ok", "ok"],
    ["[    0.204] carregando módulos: nmap burp metasploit python bash", "ok"],
    ["[    0.391] verificando escopo autorizado ..... ok", "ok"],
    ["[    0.518] firewall corporativo detectado .... contornando", "err"],
    ["[    0.702] identidade: João V. Rigo // handle r1g00d", "ok"],
    ["[    0.811] classe: Red Team & Pentester entry-level", "ok"],
    ["[    0.930] canal aberto. bem-vindo.", "ok"]
  ];

  let bootDone = false;

  function endBoot() {
    if (bootDone) return;
    bootDone = true;
    if (boot) {
      boot.classList.add("is-out");
      setTimeout(() => { boot.remove(); }, 420);
    }
    document.removeEventListener("keydown", endBoot);
    setTimeout(startTerminal, 0);
  }

  if (!boot || !bootLog) {
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

  const COMMANDS = {
    help() {
      const base = [
        '<span class="t-red">Comandos disponíveis</span>',
        "  whoami            quem sou eu",
        "  id                usuário e privilégios atuais",
        "  cat missoes.log   experiência profissional",
        "  ls findings/      projetos",
        "  cat tr1gg3r       detalhe do TR1GG3R SIEM",
        "  nmap -sV r1g00d   skills",
        "  certs             certificações e trilha",
        "  contato           como falar comigo",
        "  cv                baixar currículo em PDF",
        "  ls                lista de arquivos",
        "  flags             quantas flags você achou",
        "  reset -flags      zerar progresso das flags",
        "  anim              ativar/desativar animações",
        "  reboot            reiniciar o boot",
        "  cd ~              voltar ao topo da página",
        "  clear             limpar a tela"
      ];

      if (isRoot()) {
        base.push(
          "",
          '<span class="t-red">[PRIVILÉGIO ROOT ATIVO — COMANDOS DESTRAVADOS]</span>',
          "  ls /root                   listar diretório restrito /root",
          "  cat /root/contratar.txt    diferenciais para recrutadores",
          "  cat .shadow                ler arquivo protegido diretamente",
          "  breach                     rever sequência de sistema comprometido"
        );
      } else {
        base.push(
          "",
          '<span class="t-dim">CTF: há 3 flags escondidas. Digite</span> hint <span class="t-dim">e cole as flags direto no terminal.</span>'
        );
      }

      return base.join("\n");
    },

    id() {
      if (isRoot()) {
        return '<span class="t-red">uid=0(root) gid=0(root)</span> groups=0(root),1337(redteam),4444(compromised)';
      }
      return 'uid=1000(visitante) gid=1000(visitante) groups=1000(visitante) <span class="t-dim">[conquiste as 3 flags para uid=0]</span>';
    },

    whoami() {
      const header = isRoot()
        ? '<span class="t-red">root</span> <span class="t-dim">[uid=0 // sessão elevada de João V. Rigo · r1g00d]</span>'
        : '<span class="t-red">João V. Rigo</span> <span class="t-dim">[r1g00d]</span>';

      return [
        header,
        "Red Team & Pentester entry-level em formação, base em infraestrutura e redes.",
        "",
        '<span class="t-dim">local     </span>Franca, SP',
        '<span class="t-dim">formação  </span>Engenharia de Software (Unifran), em andamento',
        '<span class="t-dim">labs      </span>TryHackMe, PortSwigger Web Security Academy, HackTheBox',
        '<span class="t-dim">projetos  </span>TR1GG3R SIEM (IDS/SIEM em Python puro), Solo Nativo',
        '<span class="t-dim">buscando  </span>oportunidades em Red Team e Pentest',
        "",
        '<span class="t-dim">fora do terminal: mestre de D&amp;D e dev do Dungeon of Goblins, RPG de texto em Python/Flask.</span>'
      ].join("\n");
    },

    "ls /root"() {
      if (!isRoot()) {
        return '<span class="t-red">ls: impossível abrir diretório \'/root\': Permissão negada</span>\n<span class="t-dim">Conquiste as 3 flags do CTF para escalar privilégio.</span>';
      }
      return '<span class="t-red">contratar.txt</span>   .bash_history   id_ed25519.pub';
    },

    "cat /root/contratar.txt"() {
      if (!isRoot()) {
        return '<span class="t-red">cat: /root/contratar.txt: Permissão negada</span>\n<span class="t-dim">Arquivo restrito ao superusuário (uid=0). Digite</span> hint <span class="t-dim">para começar.</span>';
      }
      return [
        '<span class="t-red">=========================================================</span>',
        '<span class="t-red">  /root/contratar.txt — POR QUE TRAZER O r1g00d PRO TIME</span>',
        '<span class="t-red">=========================================================</span>',
        "",
        '<span class="t-red">01. BASE REAL DE INFRAESTRUTURA (2 ANOS)</span>',
        "    Não aprendi redes e sistemas apenas em slides. Sustentei ambientes",
        "    críticos no Grupo J.Arantes, Positivo Tecnologia, Projeto Sabesp",
        "    (30 unidades descentralizadas) e Magazine Luiza (Netshoes).",
        "    Sei como uma rede corporativa funciona e onde ela costuma falhar.",
        "",
        '<span class="t-red">02. MENTALIDADE OFENSIVA & CONSTRUTOR DE FERRAMENTAS</span>',
        "    Desenvolvi do zero o TR1GG3R SIEM (IDS/WAF/SIEM em Python puro,",
        "    zero dependências externas) e pratico continuamente no TryHackMe,",
        "    HackTheBox e PortSwigger Web Security Academy (trilha eJPT).",
        "",
        '<span class="t-red">03. AUTONOMIA & COMUNICAÇÃO TÉCNICA</span>',
        "    Acostumado a atuar sob SLA, documentar achados com clareza e",
        "    traduzir risco técnico em impacto de negócio.",
        "",
        '<span class="t-dim">Pronto para somar em Pentest Júnior, Red Team ou AppSec:</span>',
        'e-mail    <a href="mailto:r11gg0d@gmail.com?subject=Oportunidade%20-%20r1g00d">r11gg0d@gmail.com</a>',
        'linkedin  <a href="https://www.linkedin.com/in/jvrigo/" target="_blank" rel="noopener">linkedin.com/in/jvrigo</a>',
        'currículo <a href="' + CV + '" download="Joao_Victor_Rigo_Curriculo.pdf">baixar PDF completo</a>'
      ].join("\n");
    },

    breach() {
      if (!isRoot()) {
        return '<span class="t-red">breach: acesso negado.</span> <span class="t-dim">Requer privilégio root (3/3 flags).</span>';
      }
      playBreachSequence();
      return '<span class="t-red">[ROOT]</span> Reexecutando sequência de sistema comprometido...';
    },

    "cat missoes.log"() {
      return [
        '<span class="t-red">[2026-10 → atual]</span>   Grupo J.Arantes · Assistente de Sistemas Jr.',
        '<span class="t-red">[2025-10 → atual]</span>   Positivo Tecnologia · Técnico de Suporte Jr. (Field Service)',
        '<span class="t-red">[2024-09 → 2025-02]</span> Solutis (Projeto Sabesp) · Analista de Suporte Pleno',
        '<span class="t-red">[2022-11 → 2024-09]</span> Magazine Luiza (Netshoes) · Operações Especiais / Suporte',
        '<span class="t-red">[2021-02 → 2022-01]</span> Jussara S.A. · Aprendiz de T.I',
        "",
        '<a href="#missoes">Ver detalhes na página</a>'
      ].join("\n");
    },

    "ls findings/"() {
      return [
        '<span class="t-red">tr1gg3r</span>       IDS/WAF → SIEM em Python puro      <span class="t-dim">severidade: alta</span>',
        'solo-nativo   plataforma educacional (Unifran)   <span class="t-dim">severidade: informativa</span>',
        "",
        '<span class="t-dim">Use</span> cat tr1gg3r <span class="t-dim">ou veja</span> <a href="#findings">a seção de projetos</a>.'
      ].join("\n");
    },

    "cat tr1gg3r"() {
      return [
        "$ trigger_siem --status",
        '[SCAN] SQL Injection ......... <span class="t-red">BLOQUEADO</span> + alerta disparado',
        '[SCAN] XSS .................... <span class="t-red">BLOQUEADO</span> + registrado',
        '[SCAN] Brute Force ............ IP banido (300s) após 5 tentativas',
        '[SCAN] Path Traversal ......... <span class="t-red">BLOQUEADO</span>',
        "[SCAN] Scanner detectado ...... sqlmap / nikto / hydra / nmap",
        "[LOG]  alerta por e-mail + rate limiting via SQLite",
        "[OK]   0 dependências externas",
        "",
        '<a href="https://github.com/r1g00d/trigger_siem" target="_blank" rel="noopener">github.com/r1g00d/trigger_siem</a>'
      ].join("\n");
    },

    "cat solo-nativo"() {
      return [
        "Plataforma educacional de geografia, biomas e geopolítica brasileira.",
        "Product Owner e dev. UML, BPMN, ABNT.",
        '<a href="https://github.com/r1g00d/solo-nativo" target="_blank" rel="noopener">github.com/r1g00d/solo-nativo</a>'
      ].join("\n");
    },

    "nmap -sv r1g00d"() {
      return [
        '<span class="t-dim">Starting Nmap ( r1g00d edition )\nHost is up (0.0013s latency).</span>',
        "PORT       STATE     SERVICE      VERSION",
        '22/tcp     <span class="t-red">open</span>      linux        Kali Linux, Bash Scripting',
        '53/tcp     <span class="t-red">open</span>      redes        TCP/IP, DNS, DHCP, VPN',
        '80/tcp     <span class="t-red">open</span>      web-pentest  Burp Suite, OWASP Top 10',
        '389/tcp    <span class="t-red">open</span>      windows      PowerShell, Active Directory',
        '443/tcp    <span class="t-red">open</span>      python       automação, stdlib',
        '1337/tcp   <span class="t-red">open</span>      offensive    Nmap, Metasploit, HTB, THM',
        '8080/tcp   <span class="t-red">open</span>      osint        Shodan, Sherlock, Maigret',
        '9200/tcp   <span class="t-amber">filtered</span>  siem         Sentinel, Splunk, QRadar',
        '31337/tcp  <span class="t-amber">filtered</span>  c++          em estudo',
        "",
        '<span class="t-dim">open = uso no dia a dia · filtered = em estudo</span>'
      ].join("\n");
    },

    certs() {
      return [
        '<span class="t-red">[x]</span> Pre Security (TryHackMe)   concluído',
        '<span class="t-amber">[~]</span> eJPT                       em andamento',
        '<span class="t-dim">[ ]</span> CompTIA Security+          no caminho',
        '<span class="t-dim">[ ]</span> OSCP                       próximo alvo'
      ].join("\n");
    },

    contato() {
      return [
        'e-mail    <a href="mailto:r11gg0d@gmail.com">r11gg0d@gmail.com</a>',
        'linkedin  <a href="https://www.linkedin.com/in/jvrigo/" target="_blank" rel="noopener">linkedin.com/in/jvrigo</a>',
        'github    <a href="https://github.com/r1g00d" target="_blank" rel="noopener">github.com/r1g00d</a>',
        'thm       <a href="https://tryhackme.com/p/r11gg0d" target="_blank" rel="noopener">tryhackme.com/p/r11gg0d</a>',
        'currículo <a href="' + CV + '" download="Joao_Victor_Rigo_Curriculo.pdf">baixar PDF</a>'
      ].join("\n");
    },

    cv() {
      const a = document.createElement("a");
      a.href = CV;
      a.download = "Joao_Victor_Rigo_Curriculo.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return 'Baixando currículo... <span class="t-dim">(se não começar, <a href="' + CV + '" download="Joao_Victor_Rigo_Curriculo.pdf">clique aqui</a>)</span>';
    },

    clear() {
      if (out) out.innerHTML = "";
      return null;
    },

    reboot() {
      window.location.reload();
      return "Reinicializando sistema...";
    },

    anim() {
      applyAnims(!animsEnabled);
      return `Animações: <span class="${animsEnabled ? "t-red" : "t-dim"}">${animsEnabled ? "ATIVADAS [ON]" : "DESATIVADAS [OFF]"}</span>`;
    },

    "cd ~"() {
      window.scrollTo({ top: 0, behavior: animsEnabled ? "smooth" : "auto" });
      return '<span class="t-red">Voltando ao início:</span> ' + (isRoot() ? "root@r1g00d:~#" : "r1g00d@kali:~$");
    },

    ls() {
      return isRoot()
        ? 'findings/   missoes.log   tr1gg3r   solo-nativo   <span class="t-red">/root/</span>'
        : "findings/   missoes.log   tr1gg3r   solo-nativo";
    },

    "ls -a"() {
      return isRoot()
        ? '.   ..   <span class="t-red">.shadow</span>   findings/   missoes.log   tr1gg3r   solo-nativo   <span class="t-red">/root/</span>'
        : '.   ..   <span class="t-red">.shadow</span>   findings/   missoes.log   tr1gg3r   solo-nativo';
    },
    "ls -la"() { return COMMANDS["ls -a"](); },

    "cat .shadow"() {
      if (isRoot()) {
        return '<span class="t-red">[uid=0] FLAG 3/3:</span> ' + atob(FLAG3_B64);
      }
      return '<span class="t-red">cat: .shadow: Permissão negada</span>\n<span class="t-dim">Só root lê isso. Ou alguém com privilégio emprestado.</span>';
    },

    "sudo cat .shadow"() {
      return [
        '<span class="t-dim">[sudo] senha para visitante: ********</span>',
        "Escalonamento de privilégio bem-sucedido.",
        "",
        '<span class="t-red">FLAG 3/3:</span> ' + atob(FLAG3_B64)
      ].join("\n");
    },

    "sudo hire r1g00d"() {
      return [
        '<span class="t-dim">[sudo] senha para recrutador: ********</span>',
        "Permissão concedida. Abrindo canal...",
        '<a href="mailto:r11gg0d@gmail.com?subject=Oportunidade%20-%20r1g00d">r11gg0d@gmail.com</a>'
      ].join("\n");
    },

    hint() {
      const tips = [
        "flag 1: todo recon começa lendo o que está exposto. Ctrl+U.",
        "flag 2: desenvolvedores deixam rastros no console (F12).",
        "flag 3: nem todo arquivo aparece no ls. E nem todo arquivo se lê sem privilégio."
      ];
      const pending = [1, 2, 3].filter((n) => !found.includes(n));
      if (!pending.length) return 'Você já tem root. Digite <span class="t-red">cat /root/contratar.txt</span>.';
      return pending.map((n) => '<span class="t-dim">' + tips[n - 1] + "</span>").join("\n");
    },

    flags() {
      return `Flags: ${found.length}/3 ` +
        (found.length ? '<span class="t-dim">(' + [...found].sort().map((n) => "#" + n).join(" ") + ")</span>" : "");
    },

    "reset -flags"() {
      const hadAny = found.length > 0;
      found = [];
      store.remove("r1-flags");
      syncRootState({ animate: false });
      if (!hadAny) {
        return '<span class="t-dim">Nenhuma flag estava registrada. Progresso em 0/3.</span>';
      }
      return [
        '<span class="t-red">[CTF]</span> Progresso zerado: <span class="t-amber">flags 0/3</span>.',
        '<span class="t-dim">Privilégio revertido para visitante (uid=1000).</span>'
      ].join("\n");
    },

    exit() { return '<span class="t-dim">Não existe saída. Só Ctrl+W.</span>'; },

    "rm -rf /"() {
      hitGlitch();
      return '<span class="t-red">Boa tentativa.</span> <span class="t-dim">Este sistema está fora do escopo autorizado.</span>';
    }
  };

  /* =========================================================
     10. ALIASES
     ========================================================= */
  const ALIAS = {
    "?": "help", ajuda: "help",
    "cat missoes": "cat missoes.log", missoes: "cat missoes.log",
    "experiencia": "cat missoes.log", "experiência": "cat missoes.log",
    "ls findings": "ls findings/", findings: "ls findings/", projetos: "ls findings/",
    "cat findings/tr1gg3r": "cat tr1gg3r", "cat findings/solo-nativo": "cat solo-nativo",
    nmap: "nmap -sv r1g00d", "nmap r1g00d": "nmap -sv r1g00d", skills: "nmap -sv r1g00d",
    curriculo: "cv", "currículo": "cv", cls: "clear", contact: "contato", logout: "exit",
    cd: "cd ~", "cd /": "cd ~", topo: "cd ~", top: "cd ~",
    "ls /root/": "ls /root", "ls root": "ls /root", "ls root/": "ls /root",
    "cat /root/contratar": "cat /root/contratar.txt",
    "cat contratar.txt": "cat /root/contratar.txt",
    "contratar.txt": "cat /root/contratar.txt",
    contratar: "cat /root/contratar.txt",
    reset: "reset -flags", "reset --flags": "reset -flags", "reset flags": "reset -flags"
  };

  /* =========================================================
     11. SUBMISSÃO DE FLAGS
     ========================================================= */
  function submitFlag(arg) {
    const clean = arg.trim().replace(/^['"]|['"]$/g, "");
    let target = clean;
    if (clean === FLAG2_B64) target = atob(FLAG2_B64);
    else if (clean === FLAG3_B64) target = atob(FLAG3_B64);

    const n = FLAGS[hash(target)];
    if (!n) return '<span class="t-red">Flag inválida.</span> <span class="t-dim">Formato: r1g00d{...}</span>';
    if (found.includes(n)) return `Flag #${n} já registrada. ${found.length}/3.`;

    found.push(n);
    store.set("r1-flags", found);
    hitGlitch();

    if (found.length === 3) {
      syncRootState({ animate: true });
      return [
        '<span class="t-red">#############################################</span>',
        '<span class="t-red">#        ACESSO ROOT CONCEDIDO  3/3         #</span>',
        '<span class="t-red">#############################################</span>',
        "",
        'Prompt elevado para <span class="t-red">root@r1g00d:~#</span>.',
        'Novos comandos destravados: <span class="t-red">ls /root</span> e <span class="t-red">cat /root/contratar.txt</span>.',
        'Contato direto: <a href="mailto:r11gg0d@gmail.com?subject=Peguei%20as%203%20flags">r11gg0d@gmail.com</a>'
      ].join("\n");
    }

    syncRootState({ animate: false });
    return `<span class="t-cyan">Flag #${n} aceita!</span> ${found.length}/3.`;
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

  const TAUNTS = {
    tool: {
      label: "scanner automático (sqlmap & cia)",
      verb: "varrendo parâmetros",
      error: "0 parâmetros injetáveis em 0 formulários. Este terminal não fala SQL, fala português.",
      quips: [
        "sqlmap --batch --dump  →  dumped: nada. Nem uma tabela. Nem um byte.",
        "Uma ferramenta de milhares de estrelas no GitHub contra um index.html. Equilibrado.",
        "Reconhecimento primeiro, ferramenta depois. Teria economizado essa viagem."
      ]
    },
    sqli: {
      label: "SQL injection",
      verb: "extraindo dados",
      error: "ERRO 1146: a tabela 'segredos' não existe. O site é HTML estático: não há banco de dados.",
      quips: [
        "SELECT dignidade FROM visitante;  →  0 rows returned",
        "' OR '1'='1  →  parabéns, 1 continua igual a 1. A matemática segue intacta.",
        "Nível da tentativa: tutorial de YouTube de 2012.",
        "DROP TABLE expectativas;  →  executado. Essa tabela, sim, existia.",
        "O banco que você procura está de férias. Desde que nunca foi criado."
      ]
    },
    nosql: {
      label: "NoSQL injection",
      verb: "consultando coleção",
      error: "MongoServerError: sem servidor, sem coleção, sem documentos. Só HTML.",
      quips: [
        '{"$ne": null}  →  "$ne" de "não encontrou nada".',
        "db.users.find({})  →  db is not defined. Nem o db existe.",
        "Trocou o SQL pelo JSON e continuou sem banco. Criativo, ao menos."
      ]
    },
    xss: {
      label: "XSS (cross-site scripting)",
      verb: "injetando script",
      error: "Seu payload foi impresso como texto puro. Nada executa aqui, e a CSP bloqueia script inline.",
      quips: [
        "alert(1)  →  o único alerta deste site é vermelho e é este.",
        "Content-Security-Policy: script-src 'self'. O navegador ignorou você educadamente.",
        "A tag virou texto. Ficou até bonito."
      ]
    },
    path: {
      label: "path traversal / arquivo sensível",
      verb: "subindo diretórios",
      error: "Você chegou à raiz de um site estático. Lá em cima só tem index.html, css/ e js/.",
      quips: [
        "/etc/passwd  →  esse arquivo não mora aqui. Quem hospeda é o GitHub Pages.",
        "../../../  →  três níveis acima e continua no mesmo lugar: lugar nenhum.",
        "Procurando .env? As únicas variáveis de ambiente daqui são as flags, e elas estão mais bem escondidas que isso."
      ]
    },
    cmd: {
      label: "injeção de comando",
      verb: "abrindo shell reverso",
      error: "Nenhum processo foi criado. O terminal só imprime texto, não executa nada.",
      quips: [
        "nc -lvnp 4444  →  conectado em 127.0.0.1. Em você mesmo.",
        "; whoami  →  visitante. Sempre visitante.",
        "Shell reverso recebido: era um espelho."
      ]
    },
    ssti: {
      label: "injeção de template/expressão",
      verb: "avaliando expressão",
      error: "Sem template engine, sem JNDI, sem milagre. A expressão voltou do jeito que chegou.",
      quips: [
        "{{7*7}}  →  {{7*7}}. Aqui 7*7 continua sendo 7*7.",
        "${jndi:ldap://...}  →  nenhum Java foi ferido nesta operação.",
        "Tentou Log4Shell num site sem Java. Ousado."
      ]
    }
  };

  function verdict(n) {
    if (n === 1) return "Primeira tentativa. Vou fingir que foi curiosidade.";
    if (n === 2) return "Segunda tentativa. Já está virando hobby.";
    if (n < 5) return "Tentativa #" + n + ". Respeito a persistência.";
    return "Tentativa #" + n + ". Se é pra atacar, que seja com escopo e contrato: digite sudo hire r1g00d.";
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
      print('<span class="t-red">[WAF]</span> payload interceptado: <span class="t-amber">' + shown + "</span>");
      await wait(350);
      print('<span class="t-red">[WAF]</span> classificação: ' + esc(T.label));
      await wait(450);

      const bar = document.createElement("p");
      bar.className = "taunt-bar";
      bar.setAttribute("aria-hidden", "true");
      if (out) out.appendChild(bar);
      const W = 20;
      const frames = animsEnabled ? 14 : 1;
      for (let i = 1; i <= frames; i++) {
        const filled = Math.round((i / frames) * W);
        bar.textContent = "[WAF] " + T.verb + "  [" + "█".repeat(filled) + "░".repeat(W - filled) + "] " + Math.round((i / frames) * 100) + "%";
        if (out) out.scrollTop = out.scrollHeight;
        await wait(60);
      }

      await wait(200);
      print('<span class="t-red">[SYS]</span> ' + esc(T.error));
      await wait(450);
      print('<span class="t-cyan">&gt;</span> ' + esc(T.quips[(intrusions - 1) % T.quips.length]));
      await wait(500);
      print(
        '<span class="t-red">╔════════════════════════════╗\n' +
        "║   ACESSO NEGADO  //  :)    ║\n" +
        "╚════════════════════════════╝</span>"
      );
      await wait(250);
      print('<span class="t-dim">[WAF] autorização para atacar este site: nenhuma encontrada.</span>');
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

    const flagMatch = line.match(/r1g00d\{[^}]+\}/i);
    if (flagMatch) { print(submitFlag(flagMatch[0])); return; }

    const lower = line.toLowerCase().replace(/\s+/g, " ");

    if (lower.startsWith("submit ")) { print(submitFlag(line.slice(7))); return; }
    if (lower === "submit") { print('<span class="t-dim">Cole a flag r1g00d{...} direto ou use submit &lt;flag&gt;</span>'); return; }

    const key = hasOwn(ALIAS, lower) ? ALIAS[lower] : lower;
    const fn = hasOwn(COMMANDS, key) ? COMMANDS[key] : null;
    if (fn) {
      const res = fn();
      if (res !== null) print(res);
    } else if (lower.startsWith("sudo ")) {
      print('<span class="t-red">visitante não está no arquivo sudoers.</span> <span class="t-dim">Este incidente será reportado.</span>');
    } else {
      print('<span class="t-red">comando não encontrado:</span> ' + esc(line.split(" ")[0]) + '\n<span class="t-dim">Digite</span> help <span class="t-dim">ou use os botões abaixo.</span>');
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
          run(cmd);
          busy = false;
          input.readOnly = false;
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
    print('<span class="t-dim">r1g00d OS 6.6.6 · tty1</span>');
    print('Bem-vindo. Digite <span class="t-red">help</span> ou clique num dos botões abaixo.');
    if (isRoot()) {
      print('<span class="t-red">[ROOT ATIVO]</span> Sessão elevada restaurada. Digite <span class="t-red">cat /root/contratar.txt</span> ou <span class="t-red">help</span>.');
    } else if (found.length) {
      print('<span class="t-dim">Sessão anterior: ' + found.length + "/3 flags encontradas.</span>");
    }
  }

})();