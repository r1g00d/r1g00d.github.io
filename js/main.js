/* =========================================================
   r1g00d // portfólio — terminal, boot e mini CTF
   JS puro, sem dependências.
   ========================================================= */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel) => document.querySelector(sel);

  /* ---------- armazenamento seguro (pode falhar em aba privada) ---------- */
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage, segue */ } },
    sessionSeen() {
      try { const s = sessionStorage.getItem("r1-boot"); sessionStorage.setItem("r1-boot", "1"); return !!s; }
      catch { return false; }
    }
  };

  /* =========================================================
     BOOT
     ========================================================= */
  const boot = $("#boot");
  const bootLog = $("#boot-log");
  const BOOT_LINES = [
    ["[    0.000] r1g00d kernel 6.6.6-redteam inicializando", "ok"],
    ["[    0.112] montando /dev/curiosidade ........ ok", "ok"],
    ["[    0.204] carregando módulos: nmap burp metasploit python bash", "ok"],
    ["[    0.391] verificando escopo autorizado ..... ok", "ok"],
    ["[    0.518] firewall corporativo detectado .... contornando", "err"],
    ["[    0.702] identidade: João Victor Rigo // handle r1g00d", "ok"],
    ["[    0.811] classe: Red Team entry-level", "ok"],
    ["[    0.930] canal aberto. bem-vindo.", "ok"]
  ];

  let bootDone = false;
  function endBoot() {
    if (bootDone) return;
    bootDone = true;
    boot.classList.add("is-out");
    setTimeout(() => { boot.remove(); }, 420);
    document.removeEventListener("keydown", endBoot);
    setTimeout(startTerminal, 0);
  }

  if (reduced || store.sessionSeen()) {
    boot.remove();
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
     MINI CTF
     ========================================================= */
  const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.codePointAt(0)) >>> 0; return x.toString(16); };
  const FLAGS = { "191bc2e3": 1, "b1084e89": 2, "f9e0615e": 3 };
  const FLAG2_B64 = "cjFnMDBke2MwbnMwbDNfMXNfNF9zaDNsbH0=";
  const FLAG3_B64 = "cjFnMDBke3ByMXZfM3NjX3YxYV9zdWQwfQ==";
  let found = store.get("r1-flags", []);
  if (!Array.isArray(found)) found = [];
  found = found.filter((n) => n === 1 || n === 2 || n === 3);
  const counter = $("#flag-counter");

  function renderCounter() {
    if (found.length >= 3) {
      counter.textContent = "root";
      counter.classList.add("is-root");
      document.body.classList.add("is-root");
    } else {
      counter.textContent = `flags ${found.length}/3`;
    }
  }
  renderCounter();

  // FLAG 2: está no console. Quem abre o DevTools encontra.
  console.log(
    "%cr1g00d",
    "font: 48px VT323, monospace; color: #FF1E3C; text-shadow: 3px 0 #19E6FF;"
  );
  console.log(
    "%cVocê abriu o console. Bom instinto.\nFLAG 2/3 (base64): " + FLAG2_B64 +
    "\nDecodifique e envie no terminal: submit <flag>",
    "font: 13px monospace; color: #E6E3DA;"
  );

  /* =========================================================
     TERMINAL
     ========================================================= */
  const out = $("#term-out");
  const form = $("#term-form");
  const input = $("#term-input");
  const history = [];
  let hIdx = 0;
  let busy = false;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function print(html, cls) {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.innerHTML = html;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
  }

  const CV = "assets/curriculo.pdf";

  const COMMANDS = {
    help() {
      return [
        '<span class="t-red">Comandos disponíveis</span>',
        "  whoami            quem sou eu",
        "  cat missoes.log   experiência profissional",
        "  ls findings/      projetos",
        "  cat tr1gg3r       detalhe do TR1GG3R SIEM",
        "  nmap -sV r1g00d   skills",
        "  certs             certificações e trilha",
        "  contato           como falar comigo",
        "  cv                baixar currículo em PDF",
        "  ls                lista de arquivos",
        "  flags             quantas flags você achou",
        "  clear             limpar a tela",
        "",
        '<span class="t-dim">CTF: há 3 flags escondidas no site. Use</span> hint <span class="t-dim">e</span> submit &lt;flag&gt;<span class="t-dim">.</span>'
      ].join("\n");
    },

    whoami() {
      return [
        '<span class="t-red">João Victor Rigo</span> <span class="t-dim">[r1g00d]</span>',
        "Red Team entry-level em formação, base em infraestrutura e redes.",
        "",
        '<span class="t-dim">local     </span>Franca, SP',
        '<span class="t-dim">formação  </span>Engenharia da Computação (Unifran), em andamento',
        '<span class="t-dim">prática   </span>HackTheBox, TryHackMe, PortSwigger Academy',
        '<span class="t-dim">programa  </span>Hackers do Bem',
        '<span class="t-dim">buscando  </span>pentest real, com supervisão',
        "",
        '<span class="t-dim">fora do terminal: mestre de D&amp;D e dev do Dungeon of Goblins, RPG de texto em Python/Flask.</span>'
      ].join("\n");
    },

    "cat missoes.log"() {
      return [
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
      return 'Plataforma educacional de geografia, biomas e geopolítica brasileira.\nProduct Owner e dev. UML, BPMN, ABNT.\n<a href="https://github.com/r1g00d/solo-nativo" target="_blank" rel="noopener">github.com/r1g00d/solo-nativo</a>';
    },

    "nmap -sv r1g00d"() {
      return [
        '<span class="t-dim">Starting Nmap ( r1g00d edition )\nHost is up (0.0013s latency).</span>',
        "PORT       STATE     SERVICE      VERSION",
        '22/tcp     <span class="t-red">open</span>      linux        Kali, Bash',
        '53/tcp     <span class="t-red">open</span>      redes        TCP/IP, DNS, DHCP, VPN',
        '80/tcp     <span class="t-red">open</span>      web-pentest  Burp Suite, PortSwigger',
        '389/tcp    <span class="t-red">open</span>      windows      Win 10/11, Active Directory',
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
      return 'Baixando currículo... <span class="t-dim">(se não começar, <a href="' + CV + '" download>clique aqui</a>)</span>';
    },

    clear() { out.innerHTML = ""; return null; },

    ls() { return "findings/   missoes.log   tr1gg3r   solo-nativo"; },

    "ls -a"() { return '.   ..   <span class="t-red">.shadow</span>   findings/   missoes.log   tr1gg3r   solo-nativo'; },
    "ls -la"() { return COMMANDS["ls -a"](); },

    "cat .shadow"() { return '<span class="t-red">cat: .shadow: Permissão negada</span>\n<span class="t-dim">Só root lê isso. Ou alguém com privilégio emprestado.</span>'; },

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
      if (!pending.length) return "Você já tem root. Nada mais a esconder.";
      return pending.map((n) => '<span class="t-dim">' + tips[n - 1] + "</span>").join("\n");
    },

    flags() {
      return `Flags: ${found.length}/3 ` + (found.length ? '<span class="t-dim">(' + [...found].sort().map((n) => "#" + n).join(" ") + ")</span>" : "");
    },

    exit() { return '<span class="t-dim">Não existe saída. Só Ctrl+W.</span>'; },

    "rm -rf /"() {
      hitGlitch();
      return '<span class="t-red">Boa tentativa.</span> <span class="t-dim">Este sistema está fora do escopo autorizado.</span>';
    }
  };

  // apelidos
  const ALIAS = {
    "?": "help", ajuda: "help",
    "cat missoes": "cat missoes.log", missoes: "cat missoes.log", experiencia: "cat missoes.log",
    "ls findings": "ls findings/", findings: "ls findings/", projetos: "ls findings/",
    "cat findings/tr1gg3r": "cat tr1gg3r", "cat findings/solo-nativo": "cat solo-nativo",
    nmap: "nmap -sv r1g00d", "nmap r1g00d": "nmap -sv r1g00d", skills: "nmap -sv r1g00d",
    curriculo: "cv", "currículo": "cv", cls: "clear", contact: "contato", logout: "exit"
  };

  function submitFlag(arg) {
    const n = FLAGS[hash(arg.trim())];
    if (!n) return '<span class="t-red">Flag inválida.</span> <span class="t-dim">Formato: r1g00d{...}</span>';
    if (found.includes(n)) return `Flag ${n} já registrada. ${found.length}/3.`;
    found.push(n);
    store.set("r1-flags", found);
    renderCounter();
    hitGlitch();
    if (found.length === 3) {
      return [
        '<span class="t-red">#############################################</span>',
        '<span class="t-red">#        ACESSO ROOT CONCEDIDO  3/3         #</span>',
        '<span class="t-red">#############################################</span>',
        "",
        "Você leu o código, abriu o console e escalou privilégio.",
        "Pensa como atacante. Vamos conversar:",
        '<a href="mailto:r11gg0d@gmail.com?subject=Peguei%20as%203%20flags">r11gg0d@gmail.com</a>'
      ].join("\n");
    }
    return `<span class="t-cyan">Flag ${n} aceita.</span> ${found.length}/3.`;
  }

  function run(raw) {
    const line = raw.trim();
    if (!line) return;
    print(esc(line), "cmd");
    history.push(line);
    hIdx = history.length;

    const lower = line.toLowerCase().replace(/\s+/g, " ");
    if (lower.startsWith("submit ")) { print(submitFlag(line.slice(7))); return; }
    if (lower === "submit") { print('<span class="t-dim">Uso: submit r1g00d{...}</span>'); return; }

    const key = ALIAS[lower] || lower;
    const fn = COMMANDS[key];
    if (fn) {
      const res = fn();
      if (res !== null) print(res);
    } else if (lower.startsWith("sudo ")) {
      print('<span class="t-red">visitante não está no arquivo sudoers.</span> <span class="t-dim">Este incidente será reportado.</span>');
    } else {
      print('<span class="t-red">comando não encontrado:</span> ' + esc(line.split(" ")[0]) + '\n<span class="t-dim">Digite</span> help <span class="t-dim">ou use os botões abaixo.</span>');
    }
  }

  // digita o comando na tela antes de executar (botões para quem não usa terminal)
  function typeAndRun(cmd) {
    if (busy) return;
    if (reduced) { run(cmd); return; }
    busy = true;
    input.readOnly = true;
    input.value = "";
    let i = 0;
    const t = setInterval(() => {
      input.value = cmd.slice(0, ++i);
      if (i >= cmd.length) {
        clearInterval(t);
        setTimeout(() => { input.value = ""; run(cmd); busy = false; input.readOnly = false; }, 120);
      }
    }, 28);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (busy) return;
    const v = input.value;
    input.value = "";
    run(v);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      if (hIdx > 0) { hIdx--; input.value = history[hIdx]; }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; }
      else { hIdx = history.length; input.value = ""; }
      e.preventDefault();
    } else if (e.key === "Tab" && !e.shiftKey) {
      const v = input.value.toLowerCase();
      if (!v) return;
      const keys = Object.keys(COMMANDS).concat("submit ").filter((k) => k.startsWith(v) && !k.includes("shadow"));
      if (!keys.length) return;
      let lcp = keys[0];
      for (const k of keys) { while (!k.startsWith(lcp)) lcp = lcp.slice(0, -1); }
      // só captura o Tab quando há o que completar; senão o foco segue normalmente
      if (lcp.length > v.length) { input.value = lcp; e.preventDefault(); }
    } else if (e.key === "l" && e.ctrlKey) {
      out.innerHTML = "";
      e.preventDefault();
    }
  });

  document.querySelectorAll("[data-cmd]").forEach((b) => {
    b.addEventListener("click", () => typeAndRun(b.dataset.cmd));
  });

  /* ---------- glitch sob demanda ---------- */
  const title = $(".glitch");
  function hitGlitch() {
    if (reduced || !title) return;
    title.classList.add("is-hit");
    setTimeout(() => title.classList.remove("is-hit"), 900);
  }
  title && title.addEventListener("click", hitGlitch);

  /* ---------- mensagem inicial ---------- */
  let started = false;
  function startTerminal() {
    if (started) return;
    started = true;
    print('<span class="t-dim">r1g00d OS 6.6.6 · tty1</span>');
    print('Bem-vindo. Digite <span class="t-red">help</span> ou clique num dos botões abaixo.');
    if (found.length) print('<span class="t-dim">Sessão anterior: ' + found.length + "/3 flags encontradas.</span>");
  }
})();
