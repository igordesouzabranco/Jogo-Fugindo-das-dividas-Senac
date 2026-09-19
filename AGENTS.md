# AGENTS.md

## Visão Geral
**Fugindo das Dívidas** — Jogo educativo de simulação de sobrevivência financeira. O jogador gerencia R$ 800 durante 30 dias, tomando decisões que afetam lazer, alimentação e investimentos.

## Tecnologia
- HTML5 + CSS3 + JavaScript (Vanilla JS)
- Sem frameworks ou dependências externas
- Google Fonts (Inter) como única CDN
- Arquivo estático — basta abrir `index.html` no navegador

## Estrutura do Projeto
```
jogosenac/
├── index.html    # Estrutura HTML (3 telas: start, game, end)
├── script.js     # Toda a lógica do jogo (~484 linhas)
├── styles.css    # Estilização dark mode com animações
└── AGENTS.md     # Este arquivo
```

## Arquitetura do Código

### Telas (Screens)
O jogo usa 3 `<section>` com classes CSS para controle de visibilidade:
- `#start` — Tela inicial (criação de personagem + botão iniciar)
- `#game` — Tela principal (cards, stats, barras)
- `#end` — Tela de fim de jogo (resultado + LinkedIn CTA)

Troca de telas: `show(id)` adiciona/remove classe `active`.

### Estado do Jogo (`S`)
Objeto global com:
```js
S = {
  name: string,      // Nome do personagem
  money: number,     // Dinheiro disponível (começa com 800)
  lazer: number,     // Status de lazer (0-100, começa 60)
  food: number,      // Status de alimentação (0-100, começa 60)
  inv: number,       // Status de investimentos (0-100, começa 40)
  day: number,       // Dia atual (1-30)
  debt: boolean,     // Se tem dívida ativa
  tiger: number,     // Cartas obrigatórias restantes do Tigrinho
  tigerCooldown: number, // Cooldown após ignorar Tigrinho
  salaryDone: boolean // Se já recebeu o primeiro salário
}
```

### Cards
- Array `cards[]` com ~50 opções categorizadas
- Cada card tem: título, descrição, custo, efeitos nos stats, e evento secreto opcional
- Cards fixos nos dias 7 (luz), 15 (aluguel), 22 (transporte)
- Dia 1: salário automático de R$ 800

### Sistema de Swipe
- `initSwipe()` configura listeners de touch/mouse no card
- `onStart` → `onMove` → `onEnd` processam o arrasto
- Threshold: 100px para aceitar/negar
- **Importante**: `initSwipe()` remove listeners antigos antes de adicionar novos (evita memory leak)
- Variáveis `_prev*` guardam referências dos listeners para cleanup

### Condições de Fim de Jogo
**Derrota** (função `check()`):
- Lazer ≤ 0
- Alimentação ≤ 0
- Investimentos ≤ 0
- Dinheiro < 0

**Vitoria** (função `nextDay()`):
- Dia 30 E lazer > 50 E alimentação > 50 E investimentos > 50

## Convenções de Código

### JavaScript
- IIFE auto-invocada `(()=>{ ... })()` para escopo isolado
- `$()` = `document.getElementById()` (atalho)
- `clamp(n)` = limita valor entre 0-100
- `money(n)` = formata para "R$ X"
- `S_(msg, e, g)` = helper para eventos secretos
- `SC(chance, good, bad)` = helper para chance de evento secreto
- Sem `let`/`const` desnecessários — reutiliza variáveis do escopo
- Sem comments no código (convenção do projeto)

### CSS
- Variáveis CSS em `:root` para cores e dimensões
- Tema dark com accent dourado (#facc15)
- Animações via `@keyframes` (shimmer, float, confetti, etc.)
- Bordas arredondadas (border-radius: 16-20px)
- Glassmorphism sutil nos cards e painéis
- Responsive: `@media(max-width:380px)` para telas pequenas

### HTML
- Semântica mínima (main, section, div)
- IDs descritivos: `startBtn`, `lazerB`, `foodB`, `invB`
- Emoji como ícones (sem biblioteca de ícones)

## Como Rodar
```bash
# Simplesmente abrir no navegador:
start index.html

# Ou usar um servidor local (opcional):
npx serve .
python -m http.server 8000
```

## Cuidados ao Editar

1. **initSwipe()**: Sempre limpa listeners antigos. Se adicionar novos event listeners, siga o mesmo padrão com variáveis `_prev*`.

2. **Cards**: Ao adicionar cards ao array `cards[]`, manter a estrutura: `{t, d, c, e, gain?, secret?}`. O campo `gain` é para cards que dão dinheiro (trabalho/renda).

3. **Eventos fixos**: Dias 1, 7, 15, 22 têm eventos especiais. Não alterar sem verificar a lógica em `makeCard()`.

4. **Card forçado (Tigrinho)**: Cards com `forced:true` não podem ser negados. O callback de deny é `null`.

5. **LinkedIn**: URL do LinkedIn está na função `finish()`. Atualizar se necessário.

## Funcionalidades Principais
- Sistema de swipe (touch + mouse)
- Eventos secretos com % de chance
- Evento especial "Tigrinho" (10% chance, a partir do dia 4)
- Sistema de dívida (não pagar aluguel no dia 15)
- Confetti ao vencer
- Toast notifications para eventos secretos
- Partículas flutuantes na tela inicial
