# Fugindo das Dívidas

Jogo educativo de simulação de sobrevivência financeira, desenvolvido para o SENAC.
🎮 Jogue agora: https://jogo-fugindo-das-dividas-senac.onrender.com/

## O Jogo

Você é um jovem aprendiz com **R$ 800** no bolso e precisa sobreviver **30 dias** equilibrando:

- **Lazer** (0-100)
- **Alimentação** (0-100)
- **Investimentos** (0-100)

Se qualquer status chegar a zero ou o dinheiro acabar, é **game over**.

## Como Jogar

1. Acesse o jogo (pelo navegador ou escaneando o QR code, se estiver rodando num evento)
2. Preencha nome, turma e e-mail no cadastro
3. Deslize os cards para a **direita** (aceitar) ou **esquerda** (negar)
4. Cuidado: algumas cartas são **obrigatórias** (não dá pra negar)
5. Sobreviva até o dia 30 com todos os status acima de 50

## Tipos de Cartas

### Cartas Normais
Escolha entre aceitar ou negar. Cada decisão afeta seus status e seu dinheiro.

### Cartas Obrigatórias (`forced: true`)
Não podem ser negadas. Incluem:
- Contas (luz, celular)
- Dívidas
- Cartas que só dão ganho (sem custo)
- Eventos especiais

### Eventos Especiais
Aparecem como cartas obrigatórias com consequência futura: você paga agora e sofre a penalidade só daqui a alguns dias.

Exemplo: o "Golpe do Pix" custa R$ 100 na hora, mas em 3 dias tira -10 de todos os status.

### Eventos Aleatórios
Aparecem como avisos rápidos (não consomem um dia do calendário). Podem ser bons ou ruins.

### Tigrinho
10% de chance por dia, a partir do dia 4. Se você aceitar, entram 3 cartas obrigatórias em sequência e, no fim, você perde -20 em todos os status, além de penalidades permanentes nos ganhos e gastos futuros.

## Modos de Dificuldade

| Modo | Como ativar | Dinheiro | Status iniciais | Dificuldade |
|---|---|---|---|---|
| Normal | Qualquer nome | R$ 800 | 60 / 60 / 40 | ×1 |
| Difícil | Nome contém "67" | R$ 400 | 40 / 40 / 30 | ×1,5 |
| Hardcore | Nome contém "6767" | R$ 200 | 20 / 20 / 20 | ×3 |

## Compartilhar o resultado

Ao terminar uma partida — vencendo ou perdendo — dá pra baixar uma imagem PNG com o resultado (nome, turma, média dos status, saldo final e modo de jogo), pronta pra postar no LinkedIn ou salvar de lembrança. O botão "Baixar imagem" aparece na tela final, ao lado do link do LinkedIn.

## Tecnologia

- HTML5 + CSS3 + JavaScript (Vanilla JS, sem framework de front)
- Font Awesome 6.5.1
- Google Fonts (Inter)
- Node.js + Express (backend)
- Sequelize + PostgreSQL (banco de dados em produção)

## Como Rodar

### Só o frontend, sem backend
```bash
npx serve public
```
O jogo funciona normalmente — só que o resultado final não é salvo em nenhum banco (a tentativa de envio falha silenciosamente).

### Com o backend completo
```bash
npm install
npm start        # Servidor em http://localhost:3000
npm test         # Roda os testes automatizados da API
```
Sem a variável `DATABASE_URL` configurada, o servidor usa armazenamento em memória (bom pra testar local, mas os dados somem a cada reinício). Veja `.env.example` para as variáveis necessárias.

## Estrutura

```
jogosenac/
├── server.js              # Backend Express + API
├── package.json           # Dependências
├── .env.example           # Modelo das variáveis de ambiente
├── public/                # Tudo que é servido publicamente
│   ├── index.html         # HTML (4 telas)
│   ├── styles.css         # Estilização dark mode
│   ├── img/                # Imagens do jogo
│   └── js/
│       ├── utils.js               # Helpers puros
│       ├── state.js               # Estado global do jogo
│       ├── main.js                # Inicialização e listeners
│       ├── export.js              # Imagem PNG, JSON local, envio pra API
│       ├── data/
│       │   ├── cards.js               # Cartas de decisão
│       │   ├── eventosEspeciais.js    # 9 eventos especiais
│       │   └── eventosAleatorios.js   # ~113 eventos aleatórios
│       ├── game/
│       │   ├── logic.js               # check, apply, nextDay etc.
│       │   └── cardsEngine.js         # makeCard, renderCard, swipe
│       └── ui/
│           ├── render.js              # render, finish, confete
│           └── screens.js             # show, startGame, telas
├── test/
│   └── test.js             # Testes automatizados da API
├── AGENTS.md
└── README.md
```

## Backend / API

O `server.js` serve os arquivos estáticos do jogo (a partir de `public/`) e expõe a API de resultados no mesmo serviço.

### Endpoints

- `POST /api/resultados` — salva um resultado (nome, turma, média, saldo, modo, se venceu)
- `GET /api/resultados?chave=SUACHAVE` — ranking em HTML, ordenado por média (protegido pela chave)

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL. Sem ela, usa armazenamento em memória |
| `RESULTADOS_KEY` | Chave que protege o `GET /api/resultados` |
| `PORT` | Porta do servidor (padrão: 3000) |

### Deploy no Render

1. Sobe o código pra um repositório no GitHub
2. No painel do Render: **New → Web Service**, conectando ao repositório
3. Build command: `npm install` — Start command: `node server.js`
4. Cria um banco **PostgreSQL** gratuito: **New → PostgreSQL**
5. No Web Service, aba Environment, adiciona:
   - `DATABASE_URL` → a **Internal Database URL** do banco criado (o Web Service e o banco rodam na mesma rede do Render)
   - `RESULTADOS_KEY` → uma chave secreta de verdade, não um valor óbvio
6. Deploy — frontend, API e banco ficam no mesmo serviço, sem problema de CORS
7. Ranking em: `https://seu-app.onrender.com/api/resultados?chave=SUACHAVE`

## Números do Jogo

- ~30 cartas de decisão
- 9 eventos especiais com consequência atrasada
- ~113 eventos aleatórios
- 3 modos de dificuldade
- 30 dias de sobrevivência
