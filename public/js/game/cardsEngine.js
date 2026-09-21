function showTiger() {
  const el = $("card");
  el.style.transform = "";
  el.classList.remove("swiping", "swipe-right", "swipe-left");
  cardLocked = false;
  el.innerHTML =
    '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> ACEITAR</div>' +
    '<div class="swipe-overlay deny"><i class="fa-solid fa-xmark"></i> NEGAR</div>' +
    '<div class="card-content">' +
    '<span class="tag">EVENTO ESPECIAL</span>' +
    '<h3><img src="/img/tigrinho.jpg" alt="Tigrinho" class="tigrinho-img big"> A carta do Tigrinho</h3>' +
    '<p>Caiu uma notificação no celular. "Ganhe dinheiro fácil!"</p>' +
    '<div class="panel danger"><b><i class="fa-solid fa-triangle-exclamation"></i>Ludopatia</b><p>Se aceitar, as próximas <b>3 cartas são obrigatórias</b> — sem recusa. Dá pra se recuperar depois, mas vão haver cosequências permanentes.</p></div>' +
    '</div>' +
    '<div class="swipe-hint"><span class="hint-left"><i class="fa-solid fa-arrow-left"></i> Negar</span><span class="hint-right">Aceitar <i class="fa-solid fa-arrow-right"></i></span></div>';

  setSwipeCallbacks(function () {
    S.tiger = 3;
    S.tigerPenalty = {lazer: -30, food: -30, inv: -40};
    S.tigerGainMul = 0.85;
    S.tigerCostMul = 1.2;
    nextDay();
  }, function () {
    S.tigerCooldown = 5;
    nextDay();
  });
}

function showSecretToast(msg, isGood) {
  const toast = document.createElement("div");
  toast.className = "secret-toast " + (isGood ? "good" : "bad");
  toast.innerHTML = "<span>" + (isGood ? '<i class="fa-solid fa-clover"></i>' : '<i class="fa-solid fa-skull"></i>') + "</span> " + msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 400) }, 3500);
}

let _prevMouseMove = null;
let _prevMouseUp = null;
let _prevMouseDown = null;
let _prevTouchStart = null;
let _prevTouchMove = null;
let _prevTouchEnd = null;

function setSwipeCallbacks(onAccept, onDeny) {
  onSwipeAccept = onAccept;
  onSwipeDeny = onDeny;
}

function initSwipe() {
  const el = $("card");
  if (!el) return;

  if (_prevMouseMove) window.removeEventListener("mousemove", _prevMouseMove);
  if (_prevMouseUp) window.removeEventListener("mouseup", _prevMouseUp);
  if (_prevMouseDown) el.removeEventListener("mousedown", _prevMouseDown);
  if (_prevTouchStart) el.removeEventListener("touchstart", _prevTouchStart);
  if (_prevTouchMove) el.removeEventListener("touchmove", _prevTouchMove);
  if (_prevTouchEnd) el.removeEventListener("touchend", _prevTouchEnd);

  function onStart(ex, ey) {
    if (cardLocked || swipeProcessing) return;
    swipeSx = ex; swipeDx = 0; swipeDragging = true;
    el.classList.add("swiping");
  }
  function onMove(ex, ey) {
    if (!swipeDragging) return;
    swipeDx = ex - swipeSx;
    const rot = swipeDx * 0.08;
    el.style.transform = "translateX(" + swipeDx + "px) rotate(" + rot + "deg)";
    const pct = Math.min(1, Math.abs(swipeDx) / swipeThreshold);
    const overlayR = el.querySelector(".swipe-overlay.accept");
    const overlayL = el.querySelector(".swipe-overlay.deny");
    if (overlayR) overlayR.style.opacity = swipeDx > 0 ? pct : 0;
    if (overlayL) overlayL.style.opacity = swipeDx < 0 ? pct : 0;
  }
  function onEnd() {
    if (!swipeDragging) return;
    swipeDragging = false;
    el.classList.remove("swiping");
    const overlayR = el.querySelector(".swipe-overlay.accept");
    const overlayL = el.querySelector(".swipe-overlay.deny");
    if (Math.abs(swipeDx) >= swipeThreshold) {
      if (swipeDx > 0 || onSwipeDeny) {
        cardLocked = true;
        swipeProcessing = true;
      }
      if (swipeDx > 0) {
        el.classList.add("swipe-right");
        setTimeout(() => { swipeProcessing = false; onSwipeAccept && onSwipeAccept() }, 180);
      } else if (onSwipeDeny) {
        el.classList.add("swipe-left");
        setTimeout(() => { swipeProcessing = false; onSwipeDeny() }, 180);
      } else {
        el.style.transform = ""; if (overlayR) overlayR.style.opacity = 0; if (overlayL) overlayL.style.opacity = 0;
      }
    } else {
      el.style.transform = "";
      if (overlayR) overlayR.style.opacity = 0;
      if (overlayL) overlayL.style.opacity = 0;
    }
  }

  _prevTouchStart = e => { e.preventDefault(); const t = e.touches[0]; onStart(t.clientX, t.clientY) };
  _prevTouchMove = e => { e.preventDefault(); const t = e.touches[0]; onMove(t.clientX, t.clientY) };
  _prevTouchEnd = e => { e.preventDefault(); onEnd() };
  _prevMouseMove = e => { onMove(e.clientX, e.clientY) };
  _prevMouseUp = () => onEnd();
  _prevMouseDown = e => { onStart(e.clientX, e.clientY) };

  el.addEventListener("touchstart", _prevTouchStart, {passive: false});
  el.addEventListener("touchmove", _prevTouchMove, {passive: false});
  el.addEventListener("touchend", _prevTouchEnd, {passive: false});
  el.addEventListener("mousedown", _prevMouseDown);
  window.addEventListener("mousemove", _prevMouseMove);
  window.addEventListener("mouseup", _prevMouseUp);
}

function showSpecialCard(ev) {
  const el = $("card");
  el.style.transform = "";
  el.classList.remove("swiping", "swipe-right", "swipe-left");
  cardLocked = false;

  activeSpecial = ev;
  const d = S.difficulty || 1;
  const adjustedCost = Math.round(ev.cost * d * permanentCostMul);

  const effects = Object.entries(ev.e || {}).map(([k, v]) => {
    const n = k === "money" ? "Dinheiro" : k === "lazer" ? '<i class="fa-solid fa-gamepad"></i> Lazer' : k === "food" ? '<i class="fa-solid fa-utensils"></i> Alimentação' : '<i class="fa-solid fa-chart-line"></i> Investimentos';
    const valStr = k === "money" ? money(v) : ((v >= 0 ? "+" : "") + v);
    return '<span class="effect neg">' + valStr + " " + n + "</span>";
  }).join("");

  const consequenceText = ev.consequence ?
    '<div class="panel danger" style="margin-top:8px"><b><i class="fa-solid fa-clock"></i> Consequência em ' + ev.consequence.days + ' dias</b><p>' + ev.consequence.msg + '</p></div>' : '';

  el.innerHTML =
    '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> ACEITAR</div>' +
    '<div class="card-content">' +
    '<span class="tag">DIA ' + S.day + ' · EVENTO ESPECIAL</span>' +
    "<h3>" + ev.emoji + " " + ev.name + "</h3>" +
    "<p>" + ev.msg + "</p>" +
    '<div class="cost">Custa ' + money(adjustedCost) + "</div>" +
    '<div class="effects">' + effects + "</div>" +
    consequenceText +
    "</div>" +
    '<p class="small">Carta obrigatória — arraste para a direita.</p>';

  setSwipeCallbacks(function () {
    S.money -= adjustedCost;
    Object.entries(ev.e || {}).forEach(([k, v]) => {
      if (k === "money") S.money += v;
      else S[k] = clamp(S[k] + v);
    });
    if (ev.consequence) {
      addConsequence(ev.consequence.days, ev.consequence.msg, ev.consequence.e);
    }
    showSecretToast(ev.name + ": penalidade aplicada!", false);
    activeSpecial = null;
    render();
    if (!check()) nextDay();
  }, null);
}

function showRandomEvent() {
  const available = randomEvents.filter(e => S.day >= e.minDay);
  if (available.length === 0) return false;
  const ev = available[Math.floor(Math.random() * available.length)];
  const isGood = ev.type === "good";

  Object.entries(ev.e || {}).forEach(([k, v]) => {
    if (k === "money") {
      S.money += v;
    } else {
      S[k] = clamp(S[k] + v);
    }
  });

  const el = $("card");
  el.style.transform = "";
  el.classList.remove("swiping", "swipe-right", "swipe-left");
  cardLocked = false;

  const effects = Object.entries(ev.e || {}).map(([k, v]) => {
    const n = k === "money" ? "Dinheiro" : k === "lazer" ? '<i class="fa-solid fa-gamepad"></i> Lazer' : k === "food" ? '<i class="fa-solid fa-utensils"></i> Alimentação' : '<i class="fa-solid fa-chart-line"></i> Investimentos';
    const valStr = k === "money" ? money(v) : ((v >= 0 ? "+" : "") + v);
    return '<span class="effect ' + (v >= 0 ? "pos" : "neg") + '">' + valStr + " " + n + "</span>";
  }).join("");

  el.innerHTML =
    '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> OK</div>' +
    '<div class="card-content">' +
    '<span class="tag event">DIA ' + S.day + ' · EVENTO ALEATÓRIO</span>' +
    "<h3>" + ev.emoji + " " + ev.name + "</h3>" +
    "<p>" + ev.msg + "</p>" +
    '<div class="effects">' + effects + "</div>" +
    "</div>" +
    '<div class="swipe-hint"><span class="hint-right">Deslize pra continuar <i class="fa-solid fa-arrow-right"></i></span></div>';

  setSwipeCallbacks(function () {
    render();
    makeCard();
  }, null);

  return true;
}

function makeCard() {
  let c;

  if (S.day === 1 && !S.salaryDone) {
    S.salaryDone = true;
    apply({food: 2, inv: 2}, 0);
    render();
    setTimeout(() => {
      render();
      makeCard();
    }, 800);
    return;
  } else if (S.day === 7) {
    c = {t: "Conta de luz", d: "A conta de luz chegou. Bandeira tarifária subiu de novo — ninguém tanka essa inflação.", c: 35, e: {food: -3, lazer: -2, inv: -6}, fixed: true,
      secret:SC(.20,S_("Aprendeu a economizar. Conta do mês que vem cai 40%. +aura.",{inv:5,food:3}),null)};
  } else if (S.day === 15) {
    c = {t: "Ajuda em casa", d: "Contribuição mensal pra ajudar em casa. Não pagar cria conversa.", c: 120, e: {food: -5, lazer: -7, inv: -7}, fixed: true};
  } else if (S.day === 25) {
    c = {t: "Recarga do Spotify", d: "Assinatura venceu. Sem música no busão é tipo ir de corpo sem alma.", c: 13, e: {food: -2, lazer: 4, inv: -4}, forced: true,
      secret:SC(.25,S_("Playlist viralizou entre os parça. Farmou aura no algoritmo.",{inv:3,lazer:3},10),S_("Ficou ouvindo a mesma playlist por 3 meses seguidos. O algoritmo tá cringe.",{lazer:-4}))};
  } else {
    let available = cards.filter((_, i) => !usedCards.includes(i));
    if (available.length === 0) {
      usedCards = [];
      S.usedSpecials = [];
      pendingConsequences = [];
      available = cards.slice();
    }
    const idx = cards.indexOf(available[Math.floor(Math.random() * available.length)]);
    usedCards.push(idx);
    c = cards[idx];
  }

  if (S.tiger > 0) {
    const tigerCost = Math.round(Math.min(30, S.money) * (S.difficulty || 1));
    c = {t: tigrinho + " Oferta obrigatória", d: "Você está na sequência do Tigrinho. Esta carta não pode ser negada.", c: tigerCost, e: {lazer: 5, inv: -4, food: -3}, forced: true};
  }

  renderCard(c);
}

function renderCard(c) {
  currentCard = c;
  cardLocked = false;
  swipeProcessing = false;
  const el = $("card");
  el.style.transform = "";
  el.classList.remove("swiping", "swipe-right", "swipe-left");

  const d = S.difficulty || 1;
  const isHC = S.mode === "hardcore";
  const baseCost = c.c === 0 && isHC ? 15 : c.c;
  const adjustedCost = Math.round(baseCost * d * permanentCostMul);
  const rawGain = c.gain ? Math.round(c.gain / d) : 0;
  const adjustedGain = isHC && rawGain < 10 ? 0 : Math.round(rawGain * permanentGainMul);
  const canAccept = c.forced || (adjustedGain > 0 || S.money >= adjustedCost);
  const canDeny = !c.fixed && !c.forced;

  const effects = Object.entries(c.e || {}).map(([k, v]) => {
    const n = k === "lazer" ? '<i class="fa-solid fa-gamepad"></i> Lazer' : k === "food" ? '<i class="fa-solid fa-utensils"></i> Alimentação' : '<i class="fa-solid fa-chart-line"></i> Investimentos';
    let dv = v;
    if (isHC) dv = v > 0 ? Math.round(v * 0.6) : v < 0 ? Math.round(v * 1.4) : v;
    return '<span class="effect ' + (dv >= 0 ? "pos" : "neg") + '">' + (dv >= 0 ? "+" : "") + dv + " " + n + "</span>";
  }).join("");

  $("card").innerHTML =
    (canAccept ? '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> ACEITAR</div>' : '') +
    (canDeny ? '<div class="swipe-overlay deny"><i class="fa-solid fa-xmark"></i> NEGAR</div>' : '') +
    '<div class="card-content">' +
    '<span class="tag">DIA ' + S.day + (c.fixed ? " · EVENTO FIXO" : c.forced && S.tiger > 0 ? " · TIGRINHO" : c.forced ? " · OBRIGATÓRIO" : " · DECISÃO") + '</span>' +
    (S.mode ? '<span class="diff-badge ' + S.mode + '">' + (S.mode === "hardcore" ? "HARDCORE" : "DIFÍCIL") + '</span>' : "") +
    "<h3>" + c.t + "</h3><p>" + c.d + "</p>" +
    '<div class="cost">' + (adjustedGain > 0 ? "Você ganha " + money(adjustedGain) : baseCost === 0 && c.c === 0 ? "Grátis" : "Custa " + money(adjustedCost)) + "</div>" +
    '<div class="effects">' + (effects || '<span class="effect">Sem alteração de status</span>') + "</div>" +
    "</div>" +
    (canAccept || canDeny ?
      '<div class="swipe-hint">' +
      (canDeny ? '<span class="hint-left"><i class="fa-solid fa-arrow-left"></i> Negar</span>' : '<span class="hint-left"></span>') +
      (canAccept ? '<span class="hint-right">Aceitar <i class="fa-solid fa-arrow-right"></i></span>' : '<span class="hint-right"></span>') +
      "</div>" : '<p class="small">Carta obrigatória — arraste para a direita.</p>');

  setSwipeCallbacks(function () {
    consecutiveDenies = 0;
    if (c.forced) {
      S.money -= Math.round(Math.min(30, S.money) * (S.difficulty || 1));
      S.tiger = Math.max(0, S.tiger - 1);
      if (S.tiger <= 0 && S.tigerPenalty) {
        S.lazer = clamp(S.lazer + S.tigerPenalty.lazer);
        S.food = clamp(S.food + S.tigerPenalty.food);
        S.inv = clamp(S.inv + S.tigerPenalty.inv);
        permanentGainMul *= S.tigerGainMul;
        permanentCostMul *= S.tigerCostMul;
        showSecretToast("Tigrinho: -30/40 em todos os status! Gastos +20%, ganhos -15% permanentes.", false);
        S.tigerPenalty = null;
        S.tigerGainMul = 1;
        S.tigerCostMul = 1;
      }
    } else {
      apply(c.e, c.c, c.gain);
      if (c.fixed && S.day === 15) {
        S.debt = false;
      }
      if (c.secret && Math.random() < c.secret.chance) {
        const r = Math.random() < 0.5;
        const s = r ? c.secret.good : c.secret.bad;
        if (s) {
          const isHC2 = S.mode === "hardcore";
          Object.entries(s.e || {}).forEach(([k, v]) => {
            let dv = v;
            if (isHC2) dv = v > 0 ? Math.round(v * 0.6) : v < 0 ? Math.round(v * 1.4) : v;
            S[k] = clamp(S[k] + dv);
          });
          if (s.gain) {
            const sg = Math.round(s.gain / (S.difficulty || 1));
            S.money += (isHC2 && sg < 10 ? 0 : sg);
          }
          showSecretToast(s.msg, r);
        }
      }
    }
    render();
    if (!check()) nextDay();
  }, canDeny ? function () {
    consecutiveDenies++;
    if (consecutiveDenies >= 3) {
      const penalty = consecutiveDenies >= 7 ? -8 : consecutiveDenies >= 5 ? -6 : -4;
      const foodPenalty = consecutiveDenies >= 7 ? -3 : consecutiveDenies >= 5 ? -2 : 0;
      const invPenalty = consecutiveDenies >= 7 ? -3 : 0;
      S.lazer = clamp(S.lazer + penalty);
      if (foodPenalty) S.food = clamp(S.food + foodPenalty);
      if (invPenalty) S.inv = clamp(S.inv + invPenalty);
      const cardEl = $("card");
      if (cardEl) { cardEl.classList.add("deny-warn"); setTimeout(() => cardEl.classList.remove("deny-warn"), 300) }
      const msgs = [
        "Recusou tudo. A preguiça e o isolamento tão consumindo teus status.",
        "Ninguem aguenta tanto tempo isolado.",
        "Sem friends, sem rolê, sem nada. Teus status tavam implorando por ação."
      ];
      showSecretToast(msgs[Math.min(consecutiveDenies - 3, msgs.length - 1)], false);
    }
    if (c.fixed && S.day === 15) {
      S.debt = true;
    }
    render();
    if (!check()) nextDay();
  } : null);
}
