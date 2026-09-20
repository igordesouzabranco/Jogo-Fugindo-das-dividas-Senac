function addConsequence(dayOffset, msg, e) {
  pendingConsequences.push({day: S.day + dayOffset, msg: msg, e: e});
}

function check() {
  if (S.lazer <= 0) return finish("Seu lazer chegou a zero.");
  if (S.food <= 0) return finish("Sua alimentação chegou a zero.");
  if (S.inv <= 0) return finish("Seus investimentos chegaram a zero.");
  if (S.money < 0) return finish("Você ficou sem dinheiro.");
  return false;
}

function apply(e, c, gain) {
  const d = S.difficulty || 1;
  const isHC = S.mode === "hardcore";
  const costMul = activeSpecial ? activeSpecial.costMul : 1;
  const gainMul = activeSpecial ? activeSpecial.gainMul : 1;
  S.money -= Math.round(c * d * costMul * permanentCostMul);
  if (gain) {
    const g = Math.round(gain / d * gainMul * permanentGainMul);
    S.money += (isHC && g < 10 ? 0 : g);
  }
  Object.entries(e || {}).forEach(([k, v]) => {
    if (isHC) {
      v = v > 0 ? Math.round(v * 0.6) : v < 0 ? Math.round(v * 1.4) : v;
    }
    S[k] = clamp(S[k] + v);
  });
}

function processPendingConsequences() {
  for (let i = pendingConsequences.length - 1; i >= 0; i--) {
    const pc = pendingConsequences[i];
    if (S.day >= pc.day) {
      Object.entries(pc.e || {}).forEach(([k, v]) => {
        if (k === "money") S.money += v;
        else S[k] = clamp(S[k] + v);
      });
      showSecretToast(pc.msg, false);
      pendingConsequences.splice(i, 1);
    }
  }
}

function nextDay() {
  if (check()) return;
  if (S.day >= 30) {
    const minStat = S.mode === "hardcore" ? 70 : S.mode === "dificil" ? 55 : 50;
    if (S.lazer > minStat && S.food > minStat && S.inv > minStat) finish("win");
    else finish("Você chegou ao dia 30, mas precisa terminar com os três status acima de " + minStat + ".");
    return;
  }
  S.day++;
  processPendingConsequences();
  if (S.tigerCooldown > 0) S.tigerCooldown--;

  if (activeSpecial && specialMandatoryLeft > 0) {
    specialMandatoryLeft--;
    if (specialMandatoryLeft <= 0) {
      S.lazer = clamp(S.lazer + activeSpecial.penalty.lazer);
      S.food = clamp(S.food + activeSpecial.penalty.food);
      S.inv = clamp(S.inv + activeSpecial.penalty.inv);
      showSecretToast(activeSpecial.name + ": status destruídos. " + activeSpecial.penalty.lazer + " em tudo.", false);
      activeSpecial = null;
    }
  }

  if (S.debt) {
    const debtAmount = S.mode === "hardcore" ? 15 : S.mode === "dificil" ? 10 : 8;
    S.money -= Math.round(debtAmount * (S.difficulty || 1));
    S.food = clamp(S.food - (S.mode === "hardcore" ? 4 : 2));
  }

  if (S.tiger === 0 && S.tigerCooldown === 0 && !activeSpecial && S.day >= 4) {
    const tigerChance = 0.05;
    const specialChance = 0.08;
    const roll = Math.random();
    if (roll < tigerChance) {
      render();
      showTiger();
      return;
    } else if (roll < tigerChance + specialChance) {
      render();
      const available = specialEvents.filter(e => !S.usedSpecials || !S.usedSpecials.includes(e.id));
      if (available.length > 0) {
        const ev = available[Math.floor(Math.random() * available.length)];
        if (!S.usedSpecials) S.usedSpecials = [];
        S.usedSpecials.push(ev.id);
        showSpecialCard(ev);
        return;
      }
    }
  }

  if (S.tiger === 0 && S.tigerCooldown === 0 && !activeSpecial && S.day >= 2 && Math.random() < 0.15) {
    render();
    if (showRandomEvent()) return;
  }

  render();
  makeCard();
}
