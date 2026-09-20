# Fugindo das Dividas

Jogo educativo de simulacao de sobrevivencia financeira desenvolvido para o SENAC.

## O Jogo



Voce e um jovem aprendiz com **R$ 800** no bolso e precisa sobreviver **30 dias** equilibrando:
- **Lazer** (0-100)
- **Alimentacao** (0-100)
- **Investimentos** (0-100)

Se qualquer status chegar a zero ou o dinheiro acabar, e **game over**.

## Como Jogar

1. Abra `index.html` no navegador
2. Preencha nome, turma e email
3. Deslize os cards pra **direita** (aceitar) ou **esquerda** (negar)
4. Cuidado: algumas cartas sao **obrigatorias** (nao pode negar)
5. Sobreviva ate o dia 30 com todos os status acima de 50

## Tipos de Cartas

### Cartas Normais
Escolha entre aceitar ou negar. Cada decisao afeta seus status e dinheiro.

### Cartas Obrigatorias (`forced:true`)
Nao podem ser negadas. Incluem:
- Contas (luz, celular)
- Dividas
- Cartas que so dao ganho (sem custo)
- Eventos especiais

### Eventos Especiais
Aparecem como cards obrigatorios com consequencia futura. Voce paga agora e sofre penalidade daqui a X dias.

Exemplo: "Golpe do Pix" custa R$ 100 agora, mas em 3 dias perde -10 em todos os status.

### Eventos Aleatorios
Aparecem como overlays rapidos (nao consomem dia). Pode ser bons ou ruins.

### Tigrinho
10% de chance por dia (dia 4+). Se aceitar, 3 cartas sao obrigatorias e no final perde -20 em todos os status + penalidades permanentes.

## Modos de Dificuldade

| Modo | Nome | Dinheiro | Stats Iniciais | Dificuldade |
|------|------|----------|----------------|-------------|
| Normal | Qualquer | R$ 800 | 60/60/40 | x1 |
| Dificil | Contem "67" | R$ 400 | 40/40/30 | x1.5 |
| Hardcore | Contem "6767" | R$ 200 | 20/20/20 | x3 |

## Tecnologia

- HTML5 + CSS3 + JavaScript (Vanilla JS)
- Font Awesome 6.5.1
- Google Fonts (Inter)
- Node.js + Express (backend)
- Sequelize + PostgreSQL (banco de dados)

## Como Rodar

### Frontend apenas (sem backend)
```bash
start index.html
# Ou servidor local
npx serve .
```

### Com backend completo
```bash
npm install
npm start        # Servidor em http://localhost:3000
npm test         # Testa API (vitória + derrota → /api/resultados)
```

## Estrutura

```
jogosenac/
├── index.html        # HTML (4 telas)
├── styles.css        # Estilização dark mode
├── server.js         # Backend Express + API
├── package.json      # Dependências
├── .env.example      # Variáveis de ambiente
├── img/              # Imagens do jogo
├── js/
│   ├── utils.js              # Helpers puros
│   ├── state.js              # Estado global do jogo
│   ├── data/
│   │   ├── eventosEspeciais.js   # 9 eventos especiais
│   │   ├── eventosAleatorios.js  # ~113 eventos aleatórios
│   │   └── cards.js              # Cartas de decisão
│   ├── game/
│   │   ├── logic.js              # check, apply, nextDay, etc.
│   │   └── cardsEngine.js        # makeCard, renderCard, swipe
│   ├── ui/
│   │   ├── render.js             # render, finish, confetti
│   │   └── screens.js            # show, startGame, aurudo
│   └── export.js                 # PNG share, save JSON, API POST
├── test/
│   └── test.js                   # Teste automatizado da API
├── AGENTS.md
└── README.md

## Backend / API

O servidor `server.js` serve os arquivos estáticos do jogo e expõe a API de resultados.

### Endpoints

- `POST /api/resultados` — Salva resultado (nome, turma, média, salário, modo, venceu)
- `GET /api/resultados?chave=SECRET` — Ranking HTML (protegido por chave query)

### Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL (Render fornece automaticamente) |
| `RESULTADOS_KEY` | Chave para proteger GET /api/resultados |
| `PORT` | Porta do servidor (padrão: 3000) |

### Deploy no Render

1. Push o código para um repositório GitHub
2. No Render Dashboard, crie um **New Web Service** conectando ao repositório
3. Build command: `npm install` — Start command: `node server.js`
4. Crie um banco **PostgreSQL** gratuito no Render
5. No Web Service, adicione as variáveis de ambiente:
   - `DATABASE_URL` → cole a string do PostgreSQL criado
   - `RESULTADOS_KEY` → defina uma chave secreta (ex: `segredo123`)
6. Deploy. O frontend, API e banco ficam no mesmo serviço (sem CORS)
7. Para ver o ranking: `https://seu-app.onrender.com/api/resultados?chave=segredo123`

## Numeros do Jogo

- ~30 cartas de decisao
- 9 eventos especiais com consequencia delay
- ~113 eventos aleatorios
- 3 modos de dificuldade
- 30 dias de sobrevivencia
