# r1g0d.github.io

Portfólio interativo de **João Victor Rigo (r1g0d)**, Analista de Segurança da Informação Jr. | Pentester | Red Team, de Franca, SP.

**Acesse:** https://r1g00d.github.io

## Sobre

Profissional em transição para Segurança da Informação e Pentest, com 2 anos de experiência em infraestrutura crítica, redes, hardening e resposta a incidentes. Graduando em Engenharia de Software e criador do TR1GG3R SIEM, com foco em identificação de vulnerabilidades web, análise de logs e defesa ativa.

## O que tem aqui

- Sequência de boot e um terminal interativo. Quem não usa terminal clica nos botões abaixo dele.
- WAF simulado: o terminal detecta payloads maliciosos (SQLi, NoSQLi, XSS, LFI, RCE, SSTI) e responde com bloqueio.
- Mini CTF com 3 flags de enumeração e escalonamento de privilégios. Digite `hint` no terminal para começar.
- Trilha de carreira em formato de kill chain, experiência em formato de log e projetos documentados como findings de pentest.
- Skills apresentadas como saída de `nmap`.
- CSP restritiva definida no `index.html`.

## Competências

- **Segurança ofensiva e labs:** Kali Linux, Nmap, Burp Suite, Metasploit, OWASP Top 10, OSINT (Shodan, Sherlock, Maigret), TryHackMe, HackTheBox, PortSwigger Academy.
- **Defesa e monitoramento:** hardening de S.O., políticas de segurança lógica, análise de logs, detecção de intrusão (IDS/WAF), resposta a incidentes e gestão de crises.
- **Redes e sistemas:** TCP/IP, DNS, DHCP, VPN, LAN/WLAN, Windows Server / Active Directory, PowerShell, Linux (Debian/Kali) e Bash.

## Projetos relacionados

- **TR1GG3R SIEM:** IDS/WAF/SIEM em Python puro (stdlib e SQLite, sem dependências externas). Detecta SQL Injection, XSS, Path Traversal, brute force e scanners (sqlmap, nikto, hydra, nmap), com banimento automático de IP, rate limiting, alertas por e-mail e relatórios. https://github.com/r1g00d/trigger_siem
- **Este portfólio:** aplicação web estática com WAF simulado e mini CTF.

## Contato

- E-mail: r11gg0d@gmail.com
- LinkedIn: https://www.linkedin.com/in/jvrigo/
- GitHub: https://github.com/r1g00d
- TryHackMe: https://tryhackme.com/p/r11gg0d

## Stack do site

HTML, CSS e JavaScript puros. Sem frameworks e sem build.

```
index.html          estrutura e conteúdo
css/style.css       visual (tokens no topo do arquivo)
js/main.js          boot, terminal, WAF e CTF
assets/             símbolo r1g0d e currículo em PDF
```

## Rodar localmente

Abra `index.html` no navegador. Não precisa de servidor.

## Atualizar o currículo

Substitua `assets/curriculo.pdf` mantendo o mesmo nome.

---

`[EOF]` HACK THE PLANET! 🌎⚡
