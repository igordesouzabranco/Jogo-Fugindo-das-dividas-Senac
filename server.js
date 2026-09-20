require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// === Database abstraction ===
let db;
let sequelize;

if (process.env.DATABASE_URL) {
  // Production: PostgreSQL via Sequelize
  const { Sequelize, DataTypes } = require("sequelize");
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
  });

  const Resultado = sequelize.define("Resultado", {
    nome: { type: DataTypes.STRING, allowNull: false },
    turma: { type: DataTypes.STRING },
    media: { type: DataTypes.INTEGER },
    salarioRestante: { type: DataTypes.FLOAT },
    modo: { type: DataTypes.STRING },
    venceu: { type: DataTypes.BOOLEAN },
    createdAt: { type: DataTypes.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") }
  });

  db = {
    async create(data) {
      const r = await Resultado.create(data);
      return r.toJSON();
    },
    async findAll({ order }) {
      const rows = await Resultado.findAll({ order });
      return rows.map(r => r.toJSON());
    }
  };
} else {
  // Local testing: in-memory storage
  let idCounter = 1;
  const rows = [];
  db = {
    async create(data) {
      const row = { id: idCounter++, ...data, createdAt: new Date().toISOString() };
      rows.push(row);
      return row;
    },
    async findAll({ order }) {
      const sorted = [...rows];
      if (order && order[0]) {
        const [field, dir] = order[0];
        sorted.sort((a, b) => {
          if (dir === "DESC") return (b[field] || 0) - (a[field] || 0);
          return (a[field] || 0) - (b[field] || 0);
        });
      }
      return sorted;
    }
  };
}

// === API Routes ===
app.post("/api/resultados", async (req, res) => {
  try {
    const r = await db.create(req.body);
    res.status(201).json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/resultados", async (req, res) => {
  const key = req.query.chave;
  if (key !== process.env.RESULTADOS_KEY) {
    return res.status(403).send("Acesso negado");
  }
  const resultados = await db.findAll({ order: [["media", "DESC"]] });
  let html = "<html><head><title>Ranking — Fugindo das Dívidas</title></head><body>";
  html += "<h1>Ranking — Fugindo das Dívidas</h1>";
  html += "<table border='1' cellpadding='8' cellspacing='0'>";
  html += "<tr><th>#</th><th>Nome</th><th>Turma</th><th>Média</th><th>Saldo</th><th>Modo</th><th>Venceu</th><th>Data</th></tr>";
  resultados.forEach((r, i) => {
    html += "<tr><td>" + (i + 1) + "</td><td>" + r.nome + "</td><td>" + r.turma + "</td><td>" + r.media + "</td><td>" + r.salarioRestante + "</td><td>" + r.modo + "</td><td>" + (r.venceu ? "Sim" : "Não") + "</td><td>" + r.createdAt + "</td></tr>";
  });
  html += "</table></body></html>";
  res.send(html);
});

// === Serve static files (game) ===
app.use(express.static(path.join(__dirname, "public")));

// === Start ===
async function start() {
  if (process.env.DATABASE_URL) {
    await sequelize.sync();
  }
  app.listen(PORT, () => {
    const dbType = process.env.DATABASE_URL ? "PostgreSQL (Sequelize)" : "In-Memory (test)";
    console.log("Servidor rodando na porta " + PORT + " — banco: " + dbType);
  });
}
start();
