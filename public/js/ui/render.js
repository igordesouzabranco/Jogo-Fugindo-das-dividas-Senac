function render() {
  $("day").textContent = "DIA " + S.day + "/30";
  $("money").textContent = money(S.money);
  [["lazer", S.lazer], ["food", S.food], ["inv", S.inv]].forEach(([id, v]) => {
    $(id + "N").textContent = Math.round(v);
    $(id + "B").style.width = v + "%";
  });
  const tags = [];
  if (S.debt) tags.push('<span class="effect neg"><i class="fa-solid fa-money-bill-wave"></i> Dívida ativa</span>');
  if (S.tiger > 0) tags.push('<span class="effect neg">' + tigrinho + ' ' + S.tiger + ' cartas obrigatórias</span>');
  if (consecutiveDenies >= 2) tags.push('<span class="effect neg"><i class="fa-solid fa-rotate"></i> ' + consecutiveDenies + ' negativas seguidas</span>');
  if (permanentGainMul < 1) tags.push('<span class="effect neg"><i class="fa-solid fa-arrow-trend-down"></i> Ganhos -' + Math.round((1 - permanentGainMul) * 100) + '%</span>');
  if (permanentCostMul > 1) tags.push('<span class="effect neg"><i class="fa-solid fa-arrow-trend-up"></i> Gastos +' + Math.round((permanentCostMul - 1) * 100) + '%</span>');
  pendingConsequences.forEach(pc => { tags.push('<span class="effect neg"><i class="fa-solid fa-clock"></i> Consequência em ' + (pc.day - S.day) + ' dias</span>') });
  $("debuffs").innerHTML = tags.join("");
  const moodText = S.money < 30 ? "Tá foda" : S.money < 80 ? "Apertando" : S.money < 150 ? "Se virando" : "Tranquilo";
  $("mood").textContent = moodText + (S.nickname ? ", " + S.nickname : "");
}

function addLog() {}

function spawnConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);
  const colors = ["#facc15", "#4ade80", "#818cf8", "#f87171", "#fb923c", "#38bdf8", "#e879f9"];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 8 + 6) + "px";
    piece.style.height = (Math.random() * 8 + 6) + "px";
    piece.style.animationDuration = (Math.random() * 2 + 2) + "s";
    piece.style.animationDelay = (Math.random() * 1.5) + "s";
    piece.style.opacity = Math.random() * .7 + .3;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 5000);
}

function finish(reason) {
  show("end");
  const win = reason === "win";
  if (win) spawnConfetti();

  const avg = Math.round((S.lazer + S.food + S.inv) / 3);

  $("endPanel").className = "panel center " + (win ? "win" : "danger");
  const player = S.nickname || S.name.split(" ")[0];
  $("endPanel").innerHTML =
    '<span class="tag">' + (win ? "MÊS CONCLUÍDO" : "FIM DE JOGO") + '</span>' +
    '<h2>' + (win ? "Passou direto, " + player + "!" : "Game over") + "</h2>" +
    "<p>" + S.name + " (" + S.turma + ") terminou com <b>" + money(S.money) + "</b>.</p>" +
    (S.mode ? '<p><span class="diff-badge ' + S.mode + '">' + (S.mode === "hardcore" ? '<i class="fa-solid fa-fire"></i> HARDCORE' : '<i class="fa-solid fa-bolt"></i> DIFÍCIL') + '</span></p>' : "") +
    '<div class="stats-summary">' +
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-gamepad"></i> ' + Math.round(S.lazer) + '</span><span class="stat-label">Lazer</span></div>' +
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-utensils"></i> ' + Math.round(S.food) + '</span><span class="stat-label">Alimentação</span></div>' +
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-chart-line"></i> ' + Math.round(S.inv) + '</span><span class="stat-label">Investimentos</span></div>' +
    '</div>' +
    '<button class="btn primary full" id="shareImageBtn" style="margin-top:14px"><i class="fa-solid fa-download"></i> Baixar imagem</button>' +
    "<p>" + (win ? "Deu tudo certo. Equilibrou tudo durante 30 dias. Manda bem!" : reason) + "</p>" +
    (!win && S.mode === "hardcore" ? '<p style="margin-top:12px;font-size:14px;color:#facc15;font-weight:700"><i class="fa-solid fa-fire"></i> Se você perdeu no Hardcore, você só tem SABOR aura <i class="fa-solid fa-fire"></i></p>' : "") +
    '<div class="linkedin-cta">' +
    '<span class="cta-icon"><i class="fa-solid fa-handshake"></i></span>' +
    '<p class="cta-title">E aí, curtiu?</p>' +
    '<p class="cta-text">Me segue no LinkedIn e conta o que achou! Isso ajuda tanto a mim quanto a você.</p>' +
    '<a href="https://www.linkedin.com/in/igor-de-souza-branco-b68630314/" target="_blank" rel="noopener" class="cta-btn"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>' +
    "</div>";

  $("restart").style.display = win ? "none" : "block";

  const btn = $("shareImageBtn");
  if (btn) {
    btn.onclick = () => generateShareImage({
      nome: S.name,
      turma: S.turma,
      media: avg,
      dinheiro: S.money,
      modo: S.mode || "normal",
      venceu: win
    });
  }

  if (win) saveWinData();

  sendResultToServer({
    nome: S.name,
    turma: S.turma,
    media: avg,
    salarioRestante: S.money,
    modo: S.mode || "normal",
    venceu: win
  }).catch(() => {});
  return true;
}
