# AGENTS.md

## Visao Geral
**Fugindo das Dividas** — Jogo educativo de simulacao de sobrevivencia financeira. O jovem aprendiz gerencia R$ 800 durante 30 dias, tomando decisoes que afetam lazer, alimentacao e investimentos.

## Tecnologia
- HTML5 + CSS3 + JavaScript (Vanilla JS)
- Font Awesome 6.5.1 (icones)
- Google Fonts (Inter)
- Arquivo estatico — basta abrir `index.html` no navegador

## Estrutura do Projeto
```
jogosenac/
├── index.html    # Estrutura HTML (4 telas: start, register, game, end)
├── script.js     # Toda a logica do jogo (~965 linhas)
├── styles.css    # Estilizacao dark mode com animacoes
├── tigrinho.jpg  # Imagem do Tigrinho
├── README.md     # Documentacao do projeto
└── AGENTS.md     # Este arquivo
```

## Arquitetura do Codigo

### Telas (Screens)
O jogo usa 4 `<section>` com classes CSS para controle de visibilidade:
- `#start` — Tela inicial (botao iniciar)
- `#register` — Cadastro (nome, turma, email, tema, avatar)
- `#game` — Tela principal (cards, stats, barras, debuffs)
- `#end` — Tela de fim de jogo (resultado + confetti + LinkedIn CTA)

Troca de telas: `show(id)` adiciona/remove classe `active`.

### Estado do Jogo (`S`)
Objeto global com:
```js
S = {
  name: string,           // Nome do personagem
  nickname: string,       // Primeiro nome (usado internamente)
  turma: string,          // Turma do SENAC
  email: string,          // Email (controle de duplicata)
  money: number,          // Dinheiro disponivel (comeca com 800)
  lazer: number,          // Status de lazer (0-100, comeca 60)
  food: number,           // Status de alimentacao (0-100, comeca 60)
  inv: number,            // Status de investimentos (0-100, comeca 40)
  day: number,            // Dia atual (1-30)
  debt: boolean,          // Se tem divida ativa (ajuda em casa dia 15)
  tiger: number,          // Cartas obrigatorias restantes do Tigrinho
  tigerCooldown: number,  // Cooldown (5 dias) apos ignorar Tigrinho
  salaryDone: boolean,    // Se ja recebeu o primeiro salario (dia 1)
  usedSpecials: array,    // IDs dos eventos especiais ja usados
  difficulty: number,     // Multiplicador de dificuldade (1/1.5/3)
  mode: string|null       // "hardcore"|"dificil"|null
}
```

### Multiplicadores Permanentes
Apos certos eventos (Tigrinho), multiplicadores afetam todos os custos/ganhos:
- `permanentGainMul` — Reduz ganhos (ex: 0.85 = -15%)
- `permanentCostMul` — Aumenta gastos (ex: 1.2 = +20%)

### Cards (decisoes)
- Array `cards[]` com ~30 opcoes categorizadas
- Categorias: alimentacao, lazer, investimento, trabalho, gastos fixos, escolhas
- Cada card tem: `{t, d, c, e, gain?, secret?, forced?}`
- Cards fixos nos dias 7 (conta de luz), 15 (ajuda em casa), 22 (transporte)
- Dia 1: salario automatico (+2 food, +2 inv)
- **Cards de conta/divida**: `forced:true` (obrigatorio, so aceitar)
- **Cards que so dao ganho** (c:0 sem custo): `forced:true` (obrigatorio)

### Cards Forcados (`forced:true`)
Cartas que o jogador NAO pode negar:
- Conta de luz (cards array)
- Recarga do celular (cards array)
- Conta no azul, Meta do mes, Orcamento mensal, Sair sem gastar, Fim de semana produtivo
- Cartas do Tigrinho (durante sequencia)
- Eventos especiais (sempre obrigatorios)

### Eventos Especiais (specialEvents) — COM CONSEQUENCIA DELAY
Array com 9 eventos que aparecem como **cards proprios** (obrigatorios):
- Golpe do Pix, Emprestimo Fantasma, Promocao Golpista
- Pediu mae, Clonaram Cartao, Celular Roubado
- Material Escolar, Aniversario do Amigo, Vale Refeicao Estourado

Cada evento tem:
- `cost` — custo para aceitar
- `e` — efeitos imediatos nos status
- `consequence` — penalidade futura: `{days, msg, e}`
- A consequence aparece automaticamente via `pendingConsequences`

Exemplo: "Golpe do Pix" custa R$ 100 agora, mas em 3 dias da -10 em todos os status.

### Eventos Aleatorios (randomEvents)
Array com ~113 eventos curtos que aparecem como overlays (nao consomem dia):
- Bons: achou dinheiro, cashback, amigo pagou, desconto, etc.
- Maus: multas, consertos, roubos, contas esquecidas, etc.
- Cada evento tem `minDay` (dia minimo) e `type` ("good"/"bad")
- 15% de chance por dia (a partir do dia 2)
- Efeitos aplicados imediatamente ao card

### Sistema de Consequencias com Delay (`pendingConsequences`)
- `addConsequence(dayOffset, msg, e)` — agenda penalidade futura
- `processPendingConsequences()` — processa no inicio de cada `nextDay()`
- Tag visual mostrando "Consequencia em X dias" no painel de debuffs

### Sistema de Swipe
- `initSwipe()` configura listeners de touch/mouse no card
- `onStart` -> `onMove` -> `onEnd` processam o arrasto
- Threshold: 100px para aceitar/negar
- Cards `forced:true` so aceitam swipe pra direita

### Condicoes de Fim de Jogo
**Derrota** (funcao `check()`):
- Lazer <= 0
- Alimentacao <= 0
- Investimentos <= 0
- Dinheiro < 0

**Vitoria** (funcao `nextDay()`):
- Dia 30 E lazer > 50 E alimentacao > 50 E investimentos > 50
- No Hardcore: minimo 70 em cada
- No Dificil: minimo 55 em cada

### Modos de Dificuldade
- **Normal**: stats 60/60/40, dinheiro 800, dificuldade x1
- **Dificil** (nome com "67"): stats 40/40/30, dinheiro 400, dificuldade x1.5
- **Hardcore** (nome com "6767"): stats 20/20/20, dinheiro 200, dificuldade x3

## Convencoes de Codigo

### JavaScript
- IIFE auto-invocada `(()=>{ ... })()` para escopo isolado
- `$()` = `document.getElementById()` (atalho)
- `clamp(n)` = limita valor entre 0-100
- `money(n)` = formata para "R$ X"
- `S_(msg, e, g)` = helper para eventos secretos
- `SC(chance, good, bad)` = helper para chance de evento secreto
- `addConsequence(days, msg, e)` = agenda penalidade futura

### CSS
- Variaveis CSS em `:root` para cores e dimensoes
- Tema dark com accent dourado (#facc15)
- Tema light disponivel (`body.theme-light`)
- Animacoes via `@keyframes` (cardIn, fadeSlide, toastIn, etc.)
- Responsive: `@media(max-width:380px)` para telas pequenas

### HTML
- Semantica minima (main, section, div)
- IDs descritivos: `startBtn`, `lazerB`, `foodB`, `invB`
- Font Awesome para todos os icones (sem emojis)

## Como Rodar
```bash
# Simplesmente abrir no navegador:
start index.html

# Ou usar um servidor local (opcional):
npx serve .
python -m http.server 8000
```

## Cuidados ao Editar

1. **initSwipe()**: Sempre limpa listeners antigos.

2. **Cards**: Ao adicionar cards ao array `cards[]`, manter a estrutura: `{t, d, c, e, gain?, secret?, forced?}`.

3. **Cards forcados**: Usar `forced:true` para cartas que nao podem ser negadas (contas, dividas, ganho puro).

4. **Eventos fixos**: Dias 7, 15, 22 tem eventos fixos em `makeCard()`. Nao alterar sem verificar.

5. **Eventos especiais**: Ao adicionar ao `specialEvents[]`, incluir `consequence:{days,msg,e}` para penalidade delay.

6. **Eventos aleatorios**: Ao adicionar ao `randomEvents[]`, incluir `minDay` (dia minimo) e `type` ("good"/"bad").

7. **Icones**: Usar sempre Font Awesome (`<i class="fa-solid fa-xxx"></i>`), nunca emojis.

8. **Ganhos**: Manter ganhos de cartas de trabalho modestos (gain 18-35 maximo).

## Funcionalidades Principais
- Sistema de swipe (touch + mouse)
- ~30 cartas de decisao com eventos secretos
- 9 eventos especiais com consequencia delay
- ~113 eventos aleatorios (overlay, sem consumir dia)
- Evento Tigrinho (10% chance, a partir do dia 4)
- Eventos especiais (8% chance, a partir do dia 4)
- Sistema de divida (nao pagar ajudade no dia 15)
- Multiplicadores permanentes apos Tigrinho
- Cards obrigatorios (contas, dividas, ganho puro)
- Confetti ao vencer
- Toast notifications para eventos secretos e consequencias
- 3 modos de dificuldade (Normal, Dificil, Hardcore)
