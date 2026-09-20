function show(id) {
  document.querySelectorAll(".screen").forEach(x => x.classList.remove("active"));
  $(id).classList.add("active");
}

function applyTheme(theme) {
  document.body.classList.remove("theme-light");
  if (theme === "light") document.body.classList.add("theme-light");
}

function getPlayedUsers() {
  try { return JSON.parse(localStorage.getItem("fugindo_played") || "[]"); } catch (e) { return []; }
}
function savePlayedEmail(email) {
  const list = getPlayedUsers();
  if (!list.includes(email)) { list.push(email); localStorage.setItem("fugindo_played", JSON.stringify(list)); }
}
function emailAlreadyPlayed(email) { return getPlayedUsers().includes(email); }

function showAurudoOverlay(name, mode, callback) {
  const ol = document.createElement("div");
  ol.className = "aurudo-overlay";
  const isHardcore = mode === "hardcore";
  ol.innerHTML =
    '<div class="aurudo-card' + (isHardcore ? " hardcore" : "") + '">' +
    '<span class="aurudo-emoji">' + (isHardcore ? '<i class="fa-solid fa-skull"></i>' : '<i class="fa-solid fa-fire"></i>') + '</span>' +
    '<h2>' + (isHardcore ? "VOCÊ É O MAIS AURUDO DO SENAC GRAVATAÍ!" : name + ", tu é AURUDO!!!") + '</h2>' +
    '<p>' + (isHardcore
      ? "Esse nome tem 6767. Isso é aura + ego ^ 1000. Modo <b>Hardcore</b> desbloqueado."
      : "O nome tem 67. Isso é rareza. Modo <b>Difícil</b> ativado.") + '</p>' +
    '<div class="aurudo-mode">' + (isHardcore ? '<i class="fa-solid fa-fire"></i> MODO HARDCORE <i class="fa-solid fa-fire"></i>' : '<i class="fa-solid fa-bolt"></i> MODO DIFÍCIL <i class="fa-solid fa-bolt"></i>') + '</div>' +
    '<p style="margin-top:14px;font-size:12px;color:var(--ink-sec)">' + (isHardcore
      ? "Custos x3, ganhos cortados, stats começam em 20. Boa sorte."
      : "Custos x1.5, ganhos levemente reduzidos. Dá pra virar.") + '</p>' +
    '<button class="btn primary full" style="margin-top:18px" id="aurudoContinue">Bora lá</button>' +
    '</div>';
  document.body.appendChild(ol);
  ol.querySelector("#aurudoContinue").onclick = () => { ol.remove(); callback(); };
}

function showIntro() {
  const el = $("card");
  el.style.transform = "";
  el.classList.remove("swiping", "swipe-right", "swipe-left");
  cardLocked = false;
  el.innerHTML =
    '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> COMEÇAR</div>' +
    '<div class="card-content">' +
    '<span class="tag">DIA 1 · INÍCIO</span>' +
    '<h3><i class="fa-solid fa-briefcase"></i> Primeiro dia como jovem aprendiz</h3>' +
    '<p>O mês acabou de começar. Tem <b>' + money(S.money) + '</b> no bolso e precisa sobreviver 30 dias equilibrando lazer, alimentação e investimentos.</p>' +
    '<div class="panel"><b><i class="fa-solid fa-circle-info"></i> Regras</b>' +
    '<p>Deslize o card pra <b>direita</b> pra aceitar ou <b>esquerda</b> pra negar.<br>' +
    'Seus 3 status não podem cair a zero. Cuidado com cada decisão!</p></div>' +
    '</div>' +
    '<div class="swipe-hint"><span class="hint-right">Deslize pra começar <i class="fa-solid fa-arrow-right"></i></span></div>';

  setSwipeCallbacks(function () {
    introDone = true;
    makeCard();
  }, null);
}

function startGame() {
  usedCards = [];
  S.usedSpecials = [];
  pendingConsequences = [];
  consecutiveDenies = 0;
  swipeDragging = false;
  swipeProcessing = false;
  cardLocked = false;
  onSwipeAccept = null;
  onSwipeDeny = null;
  permanentGainMul = 1;
  permanentCostMul = 1;
  introDone = false;
  $("gameAvatar").innerHTML = '<i class="' + S.look + '"></i>';
  show("game");
  initSwipe();
  render();
  showIntro();
}
