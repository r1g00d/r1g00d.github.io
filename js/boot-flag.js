// Marca a página como "com JS". Sem JS, o overlay de boot nunca aparece.
document.documentElement.classList.add("js");

// Pula o boot para quem prefere menos movimento ou já viu nesta sessão.
try {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || sessionStorage.getItem("r1-boot")) {
    document.documentElement.classList.add("no-boot");
  }
} catch (e) { /* armazenamento bloqueado: o boot roda normalmente */ }
