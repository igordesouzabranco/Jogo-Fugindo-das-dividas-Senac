const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const PORT = 3463;
const SECRET = "segredo123";
const BASE_HOST = "127.0.0.1";
const BASE = "http://" + BASE_HOST + ":" + PORT;

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlPath, BASE);
    const req = http.request({
      hostname: BASE_HOST, port: PORT,
      path: parsed.pathname + parsed.search, method,
      headers: body ? {"Content-Type":"application/json","Content-Length":Buffer.byteLength(JSON.stringify(body))} : {}
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await request("GET", "/");
      return true;
    } catch (e) { /* not ready */ }
  }
  return false;
}

async function main() {
  console.log("=== Teste API — Fugindo das Dívidas ===\n");

  const server = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, PORT: String(PORT), RESULTADOS_KEY: SECRET, DATABASE_URL: "" }
  });

  let stderr = "";
  server.stderr.on("data", (d) => { stderr += d.toString(); });
  server.on("error", (e) => { console.error("Server spawn error:", e); });

  const ready = await waitForServer();
  if (!ready) {
    console.error("FALHA: Servidor não iniciou a tempo");
    if (stderr) console.error("Stderr:", stderr);
    server.kill();
    process.exit(1);
  }
  console.log("1. Servidor iniciado — OK");

  // POST vitória
  const victory = await request("POST", "/api/resultados", {
    nome: "João Silva", turma: "201", media: 72,
    salarioRestante: 350, modo: "normal", venceu: true
  });
  console.log("2. POST vitória — status:", victory.status, victory.status === 201 ? "OK" : "FALHA");
  const vData = JSON.parse(victory.body);
  console.log("   Tem ID:", vData.id !== undefined ? "OK" : "FALHA");

  // POST derrota
  const defeat = await request("POST", "/api/resultados", {
    nome: "Maria Santos", turma: "302", media: 38,
    salarioRestante: -45, modo: "dificil", venceu: false
  });
  console.log("3. POST derrota — status:", defeat.status, defeat.status === 201 ? "OK" : "FALHA");

  // POST hardcore
  const hcWin = await request("POST", "/api/resultados", {
    nome: "Pedro 6767 Costa", turma: "105", media: 85,
    salarioRestante: 120, modo: "hardcore", venceu: true
  });
  console.log("4. POST hardcore — status:", hcWin.status, hcWin.status === 201 ? "OK" : "FALHA");

  // GET sem chave
  const noKey = await request("GET", "/api/resultados");
  console.log("5. GET sem chave — status:", noKey.status, noKey.status === 403 ? "OK (bloqueado)" : "FALHA");

  // GET com chave
  const withKey = await request("GET", "/api/resultados?chave=" + SECRET);
  const hasData = withKey.body.includes("João Silva") && withKey.body.includes("Maria Santos") && withKey.body.includes("Pedro");
  const hasTable = withKey.body.includes("<table");
  const p1 = withKey.body.indexOf("Pedro");
  const p2 = withKey.body.indexOf("João");
  const p3 = withKey.body.indexOf("Maria");
  const ordered = p1 < p2 && p2 < p3;
  console.log("6. GET com chave — status:", withKey.status, withKey.status === 200 ? "OK" : "FALHA");
  console.log("   Tabela presente:", hasTable ? "OK" : "FALHA");
  console.log("   Dados presentes:", hasData ? "OK" : "FALHA");
  console.log("   Ordem (média desc):", ordered ? "OK" : "FALHA");

  server.kill();
  console.log("\n=== Teste concluído ===");
}

main().catch(e => { console.error("Erro:", e); process.exit(1); });
