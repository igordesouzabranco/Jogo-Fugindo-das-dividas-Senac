$("startBtn").onclick = () => show("register");

$("registerBtn").onclick = () => {
  const name = ($("name").value || "").trim();
  const turma = ($("turma").value || "").trim();
  const email = ($("email").value || "").trim().toLowerCase();
  const theme = $("themeSelect").value;
  const err = $("regError");

  if (!name) { err.textContent = "Preenche o nome aí."; return; }
  if (!turma) { err.textContent = "Qual tua turma do SENAC?"; return; }
  if (turma.includes("6767") || turma.includes("67")) { err.textContent = "Uma turma com tanta aura não existe."; return; }
  if (/[a-zA-Z]/.test(turma)) { err.textContent = "Uma turma só pode ter números."; return; }
  if (!email || !email.includes("@")) { err.textContent = "E-mail inválido, confere aí."; return; }
  if (nameHasNumbersExcept67(name)) { err.textContent = "Nome não pode ter número! Só letras."; return; }

  if (emailAlreadyPlayed(email)) {
    err.textContent = "Esse e-mail já jogou. Cada um só uma vez, mano.";
    return;
  }

  savePlayedEmail(email);
  err.textContent = "";

  applyTheme(theme);

  const mode = detectAurudo(name);

  S = {
    name: name,
    nickname: name.split(" ")[0],
    turma: turma,
    email: email,
    look: $("look").value,
    money: mode === "hardcore" ? 200 : mode === "dificil" ? 400 : 800,
    lazer: mode === "hardcore" ? 20 : mode === "dificil" ? 40 : 60,
    food: mode === "hardcore" ? 20 : mode === "dificil" ? 40 : 60,
    inv: mode === "hardcore" ? 20 : mode === "dificil" ? 30 : 40,
    day: 1,
    debt: false, tiger: 0, tigerCooldown: 0, salaryDone: false,
    difficulty: mode === "hardcore" ? 3 : mode === "dificil" ? 1.5 : 1,
    mode: mode
  };

  if (mode) {
    showAurudoOverlay(name, mode, () => startGame());
  } else {
    startGame();
  }
};

$("restart").onclick = () => {
  document.body.classList.remove("theme-light", "user-accent");
  show("start");
};

$("look").onchange = () => $("avatar").innerHTML = '<i class="' + $("look").value + '">';
