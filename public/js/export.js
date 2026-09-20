function saveWinData() {
  const avg = Math.round((S.lazer + S.food + S.inv) / 3);
  const data = {
    nome: S.name,
    turma: S.turma,
    salarioRestante: S.money,
    status: avg,
    modo: S.mode || "normal"
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vitoria_" + S.name.replace(/\s+/g, "_") + ".json";
  a.click();
  URL.revokeObjectURL(url);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function generateShareImage(data) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext("2d");

  document.fonts.ready.then(() => {
    ctx.fillStyle = "#0f0f13";
    ctx.fillRect(0, 0, 800, 450);

    ctx.fillStyle = "#facc15";
    ctx.fillRect(0, 0, 800, 6);

    ctx.textAlign = "center";
    ctx.font = "bold 36px Inter, sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.fillText("FUGINDO DAS DÍVIDAS", 400, 55);

    ctx.font = "13px Inter, sans-serif";
    ctx.fillStyle = "#555";
    ctx.fillText("Simulação SENAC — 30 dias de sobrevivência financeira", 400, 78);

    ctx.fillStyle = "#18181f";
    roundRect(ctx, 100, 110, 600, 270, 12);
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    roundRect(ctx, 100, 110, 600, 270, 12);
    ctx.stroke();

    ctx.font = "bold 18px Inter, sans-serif";
    ctx.fillStyle = data.venceu ? "#22c55e" : "#ef4444";
    ctx.fillText(data.venceu ? "VITÓRIA" : "DERROTA", 400, 155);

    ctx.textAlign = "left";
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = "#facc15";
    ctx.fillText("RESULTADO", 135, 200);

    ctx.font = "16px Inter, sans-serif";
    ctx.fillStyle = "#eee";
    const lines = [
      "Nome:   " + data.nome,
      "Turma:  " + data.turma,
      "Média:  " + data.media + "/100",
      "Saldo:  " + money(data.dinheiro),
      "Modo:   " + data.modo,
      "Data:   " + new Date().toLocaleDateString("pt-BR")
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, 135, 235 + i * 34);
    });

    ctx.textAlign = "center";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillStyle = "#333";
    ctx.fillText("resultado_" + data.nome.replace(/\s+/g, "_") + ".png", 400, 425);

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultado_" + data.nome.replace(/\s+/g, "_") + ".png";
    a.click();
  });
}

function sendResultToServer(data) {
  console.trace("sendResultToServer chamado", data);
  return fetch("/api/resultados", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
}
