const $ = id => document.getElementById(id);
const clamp = n => Math.max(0, Math.min(100, n));
const money = n => "R$ " + Math.max(0, Math.round(n)).toLocaleString("pt-BR");

function nameHasNumbersExcept67(name) {
  return /[0-9]/.test(name.replace(/67/g, ""));
}

function detectAurudo(name) {
  if (name.includes("6767")) return "hardcore";
  if (name.includes("67")) return "dificil";
  return null;
}
