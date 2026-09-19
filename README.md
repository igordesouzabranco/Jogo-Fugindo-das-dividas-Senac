# Fugindo das Dividas

Jogo educativo de simulacao de sobrevivencia financeira desenvolvido para o SENAC.

## O Jogo

https://igordesouzabranco.github.io/Jogo-Fugindo-das-dividas-Senac/

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
- Arquivo estatico (sem dependencias)

## Como Rodar

```bash
# Abrir direto no navegador
start index.html

# Ou servidor local
npx serve .
python -m http.server 8000
```

## Estrutura

```
jogosenac/
├── index.html      # HTML (4 telas)
├── script.js       # Logica do jogo (~965 linhas)
├── styles.css      # Estilizacao dark mode
├── tigrinho.jpg    # Imagem do Tigrinho
├── AGENTS.md       # Documentacao tecnica
└── README.md       # Este arquivo
```

## Numeros do Jogo

- ~30 cartas de decisao
- 9 eventos especiais com consequencia delay
- ~113 eventos aleatorios
- 3 modos de dificuldade
- 30 dias de sobrevivencia
