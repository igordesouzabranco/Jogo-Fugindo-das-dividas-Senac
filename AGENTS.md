# AGENTS.md

## Visao Geral
**Fugindo das Dividas** — Jogo educativo de simulacao de sobrevivencia financeira. O jovem aprendiz gerencia R$ 300 durante 30 dias, tomando decisoes que afetam lazer, alimentacao e investimentos.

## Tecnologia
- HTML5 + CSS3 + JavaScript (Vanilla JS)
- Font Awesome 6.5.1 (icones)
- Google Fonts (Inter)
- Arquivo estatico — basta abrir `index.html` no navegador

## Estrutura do Projeto
```
jogosenac/
├── index.html    # Estrutura HTML (3 telas: start, register, game, end)
├── script.js     # Toda a logica do jogo
├── styles.css    # Estilizacao dark mode com animacoes
├── tigrinho.jpg  # Imagem do Tigrinho
└── AGENTS.md     # Este arquivo
```

## Arquitetura do Codigo

### Telas (Screens)
O jogo usa 4 `<section>` com classes CSS para controle de visibilidade:
- `#start` — Tela inicial (botao iniciar)
- `#register` — Cadastro (nome, turma, email, tema)
- `#game` — Tela principal (cards, stats, barras)
- `#end` — Tela de fim de jogo (resultado + LinkedIn CTA)

Troca de telas: `show(id)` adiciona/remove classe `active`.

### Estado do Jogo (`S`)
Objeto global com:
```js
S = {
  name: string,      // Nome do personagem
  nickname: string,  // Primeiro nome (usado internamente)
  money: number,     // Dinheiro disponivel (comeca com 300)
  lazer: number,     // Status de lazer (0-100, comeca 60)
  food: number,      // Status de alimentacao (0-100, comeca 60)
  inv: number,       // Status de investimentos (0-100, comeca 40)
  day: number,       // Dia atual (1-30)
  debt: boolean,     // Se tem divida ativa
  tiger: number,     // Cartas obrigatorias restantes do Tigrinho
  tigerCooldown: number, // Cooldown apos ignorar Tigrinho
  salaryDone: boolean // Se ja recebeu o primeiro salario
}
```

### Multiplicadores Permanentes
Apos certos eventos (Tigrinho), multiplicadores afetam todos os custos/ganhos:
- `permanentGainMul` — Reduz ganhos (ex: 0.85 = -15%)
- `permanentCostMul` — Aumenta gastos (ex: 1.2 = +20%)

### Cards
- Array `cards[]` com ~30 opcoes categorizadas
- Cada card tem: titulo, descricao, custo, efeitos nos stats, e evento secreto opcional
- Cards fixos nos dias 7 (luz), 15 (ajuda em casa), 22 (transporte)
- Dia 1: salario automatico de R$ 150
- Custos realistas para jovem de 16 anos no RS

### Eventos Especiais (specialEvents)
Array com 10 eventos obrigatorios que podem ser ativados aleatoriamente:
- Golpe do Pix, Emprestimo Fantasma, Promocao Golpista
- Pediu pra Mae, Clonaram Cartao, Celular Roubado
- Material Escolar, Aniversario do Amigo, Vale Refeicao Estourado

Cada evento tem: `gainMul`, `costMul` (apenas durante o evento) e `penalty` (ao final).

### Sistema de Swipe
- `initSwipe()` configura listeners de touch/mouse no card
- `onStart` -> `onMove` -> `onEnd` processam o arrasto
- Threshold: 100px para aceitar/negar

### Condicoes de Fim de Jogo
**Derrota** (funcao `check()`):
- Lazer <= 0
- Alimentacao <= 0
- Investimentos <= 0
- Dinheiro < 0

**Vitoria** (funcao `nextDay()`):
- Dia 30 E lazer > 50 E alimentacao > 50 E investimentos > 50

## Convencoes de Codigo

### JavaScript
- IIFE auto-invocada `(()=>{ ... })()` para escopo isolado
- `$()` = `document.getElementById()` (atalho)
- `clamp(n)` = limita valor entre 0-100
- `money(n)` = formata para "R$ X"
- `S_(msg, e, g)` = helper para eventos secretos
- `SC(chance, good, bad)` = helper para chance de evento secreto

### CSS
- Variaveis CSS em `:root` para cores e dimensoes
- Tema dark com accent dourado (#facc15)
- Animacoes via `@keyframes`
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

2. **Cards**: Ao adicionar cards ao array `cards[]`, manter a estrutura: `{t, d, c, e, gain?, secret?}`.

3. **Eventos fixos**: Dias 1, 7, 15, 22 tem eventos especiais. Nao alterar sem verificar `makeCard()`.

4. **Card forcado (Tigrinho)**: Cards com `forced:true` nao podem ser negados.

5. **Icones**: Usar sempre Font Awesome (`<i class="fa-solid fa-xxx"></i>`), nunca emojis.

## Funcionalidades Principais
- Sistema de swipe (touch + mouse)
- Eventos secretos com % de chance
- Evento especial "Tigrinho" (10% chance, a partir do dia 4)
- Sistema de divida (nao pagar ajudade no dia 15)
- Multiplicadores permanentes apos Tigrinho
- 10 eventos especiais variados
- Confetti ao vencer
- Toast notifications para eventos secretos
