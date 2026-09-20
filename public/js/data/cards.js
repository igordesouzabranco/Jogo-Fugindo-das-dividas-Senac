const S_ = (msg, e, g) => ({msg, e: {...(e || {})}, gain: g || 0});
const SC = (chance, good, bad) => ({chance, good, bad});

const cards = [
/* === ALIMENTAÇÃO === */
{t:"Almoço no restaurante",d:"Prato feito do dia na padaria do bairro. Comes bem, o bolso sofre um pouco.",c:18,e:{food:13,lazer:7,inv:-3},
  secret:SC(.30,S_("O garçom errou o pedido e te deu o prato maior. Win!",{food:5,lazer:3}),S_("Tinha um pelo na comida. Que nojo, véi.",{food:-4,lazer:-3}))},
{t:"Marmita de casa",d:"Mesma de sempre. Caseiro e barato, mas não é lá essas coisas.",c:5,e:{food:10,inv:5,lazer:-3},
  secret:SC(.25,S_("A marmita ficou tão boa que o colega pagou pra comer. Sério.",{food:2},10),null)},
{t:"Cozinhar pra semana",d:"Domingo na cozinha. Trabalho chato mas economiza horrores.",c:30,e:{food:18,inv:6,lazer:-7},
  secret:SC(.20,S_("Postou a receita e viralizou. Vendeu o segredo por R$ 15.",{inv:5},15),null)},
{t:"Fast-food com cupom",d:"App com desconto. Rápido e gostoso, mas tu sabe como é.",c:35,e:{food:7,lazer:7,inv:-3},
  secret:SC(.35,null,S_("Passou mal de madrugada. Perdeu o dia todo.",{food:-8,lazer:-6}))},
{t:"Lanche da tarde",d:"A fome bateu forte. Gasta agora ou segura até a noite?",c:8,e:{food:9,lazer:2,inv:-2},
  secret:SC(.20,null,S_("O lanche tava estragado. Noite no hospital.",{food:-6,lazer:-5,inv:-3}))},
{t:"Churrasco com a galera",d:"Cada um leva uma coisa. Convívio bom, comida melhor.",c:45,e:{lazer:12,food:8,inv:-3},
  secret:SC(.25,S_("Tu trouxe o melhor prato e todo mundo babou. Farmou aura.",{lazer:5,food:3}),null)},
{t:"Delivery preguiçoso",d:"Tava exausto, não dava pra cozinhar. Pedi pelo app.",c:60,e:{food:9,lazer:6,inv:-5},
  secret:SC(.30,null,S_("Atrasou 2 horas. Comida fria, noite perdida.",{lazer:-5,food:-4}))},
{t:"Padaria da esquina",d:"Pão com manteiga e café. Simples mas resolve.",c:6,e:{food:11,lazer:3,inv:-2},
  secret:SC(.15,S_("A dona te reconheceu. Agora tu ganha desconto todo dia.",{food:3,inv:2}),null)},
{t:"Piquenique no parque",d:"Sanduíche na mão e papo bom. Não precisa de mais nada.",c:5,e:{lazer:14,food:6,inv:1},
  secret:SC(.20,S_("Achou uma nota de 20 no chão. Já foi direto pro CDB.",{lazer:5,inv:10}),null)},

/* === LAZER === */
{t:"Cinema com a turma",d:"Filme novo e pipoca. Caro mas tem vez que vale a pena.",c:25,e:{lazer:19,food:-4,inv:-5},
  secret:SC(.25,S_("Foram ver Jogos Vorazes: Amanhecer na Colheita. Boa escolha.",{inv:6,lazer:3}),S_("O filme era horrivel. Nota 2 no Letterboxd.",{inv:-5,lazer:-10}))},
{t:"Show ao vivo",d:"Banda que tu gosta. Entrada salgada mas a experiência é única.",c:40,e:{lazer:15,food:-3,inv:-5},
  secret:SC(.20,S_("Foi backstage e conheceu a banda. Dia de nunca esquecer.",{lazer:10}),S_("Choveu e tu pegou gripe na hora.",{food:-5,lazer:-8}))},
{t:"Lanchonete com os parça",d:"Rolê na lanchonete do bairro. Papo bom e combos baratos.",c:15,e:{lazer:16,food:3,inv:-5}},
{t:"Passeio de bike",d:"Rolê sem gastar nada. Ar livre e sensação de liberdade.",c:0,e:{lazer:12,food:-1,inv:4},
  secret:SC(.20,S_("Tu gravou o passeio e postou. Viralizou.",{lazer:5,inv:3}),S_("Os Fans amaram tanto, mas essa vida não é pra você. Vamo Rosa!",{lazer:-10}))},
{t:"Banho de praia",d:"Dia de sol. Barato, longe e bom pra descomprimir.",c:5,e:{lazer:18,food:-3,inv:-2},
  secret:SC(.25,S_("Achou umas conchas raras e vendeu online.",{lazer:3,inv:2},20),S_("Queimou feio. Remédio caro.",{food:-4,lazer:-5,inv:-2}))},

/* === INVESTIMENTOS / EDUCAÇÃO === */
{t:"Curso online",d:"Aula pro currículo. Investe no futuro mas gasta agora.",c:20,e:{inv:17,lazer:-5,food:-3},
  secret:SC(.25,S_("O certificado te ajudou a pegar um freela.",{inv:5},30),null)},
{t:"Investimento arriscado",d:"Alguém promete retorno rápido. Pode ser golpe ou não.",c:35,e:{inv:16,lazer:-5,food:-4},
  secret:SC(.40,S_("Deu sorte! Rendeu o dobro.",{inv:10},50),S_("Perdeu tudo. Golpe clássico.",{inv:-15,lazer:-8,food:-5}))},
{t:"Comprar ações",d:"Ação promissora. Pode subir ou despencar.",c:25,e:{inv:18,lazer:-6,food:-4},
  secret:SC(.35,S_("Subiu 40%. Tu lucrou bem.",{inv:8},40),S_("Despencou. Prejuízo pesado.",{inv:-12,lazer:-5,food:-3}))},
{t:"Inscrição pro ENEM",d:"Investe agora, o retorno vem depois.",c:35,e:{inv:14,lazer:-8,food:-3},
  secret:SC(.15,S_("Tu passou! Vaga garantida no UniSenac.",{inv:10,lazer:10,food:8}),S_("Não foi dessa vez. Não adianta ver resumão um dia antes da prova.",{inv:-10,lazer:-5}))},
{t:"Aprender a investir",d:"Conta na corretora e estudo básico. Primeiro passo.",c:5,e:{inv:15,lazer:-6,food:-2},
  secret:SC(.30,S_("Primeiro investimento rendeu 15%. Vício bom.",{inv:5},15),null,S_("Tentou fazer day-trade. Você é CLT meu filho.",{inv:-10,lazer:-5}))},

/* === TRABALHO / RENDA === */
{t:"Bico rápido",d:"Serviço pontual. Rende bem mas tira teu tempo livre.",c:0,e:{lazer:-10,inv:8,food:-2},gain:30,
  secret:SC(.20,S_("Cliente curtiu. Já te chamou pra próxima.",{inv:5},50),null)},
{t:"Morango cravejado",d:"Tu e a galera fizeram morango cravejado pra vender na escola. Rendeu bem.",c:0,e:{inv:3,lazer:2,food:1},gain:18,
  secret:SC(.25,S_("Vendeu tudo em 1 hora. Morangudo.",{inv:3,lazer:2}),S_("Fez errado a receita. Quebrou os dentes de uma colega.",{inv:-10,lazer:-5}))},
{t:"Mesada extra da vó",d:"Vó teve pena e soltou um dinheirinho extra. Amor de avó não tem preço.",c:0,e:{inv:5,lazer:5,food:5},gain:35,
  secret:SC(.25,S_("Vó disse que tu é o neto favorito. Ganhou mais um pouco.",{inv:5,lazer:5},20))},

/* === GASTOS FIXOS === */
{t:"Conta de luz",d:"Conta veio salgada. Banho longo custa caro.",c:35,e:{food:-4,lazer:-3,inv:-4},forced:true,
  secret:SC(.20,S_("Aprendeu a economizar. Conta do mês que vem cai 40%.",{inv:5,food:3}),null)},
{t:"Recarga do celular",d:"Plano acabou. Não tem como se comunicar sem internet.",c:20,e:{food:-2,lazer:3,inv:5},forced:true,
  secret:SC(.25,S_("Bônus de fidelidade. Crédito extra.",{inv:3},15),S_("Ficou vendo brainrot e gastou todos os dados.",{inv:-10,lazer:-5}))},

/* === ESCOLHAS === */
{t:"Ir de bicicleta pro trabalho",d:"Você não usa ela desde o oitavo ano. O que pode dar de errado?",c:0,e:{lazer:-10},
  secret:SC(.45,S_("Chegou mais cedo e não poluiu o planeta! #gratiluz.",{inv:5,lazer:5}),S_("Quebrou o guidão, furou as rodas, descarrilou a correia e ainda chegou atrasado.",{inv:-15,lazer:-12,food:-10}))},
{t:"Presente pra mãe",d:"Mãe merece. Amor não tem preço mas tem custo.",c:75,e:{lazer:8,food:-3,inv:-5},
  secret:SC(.20,S_("Mãe chorou de emoção. Não tem dinheiro que pague isso.",{lazer:10,food:5}),null)},
{t:"Conta de água com desconto",d:"Quem diria que tomar um banho rápido não tem beneficios.",c:45,e:{lazer:-5,inv:7},forced:true,
  secret:SC(.10,S_("Os banhos foram tão rápidos que não funcionaram. O Rexona te abandonou dessa vez.",{lazer:-10}),null)},
{t:"Orçamento mensal",d:"Anotou tudo. Já sabe quanto que vai gastar.",c:0,e:{inv:6,lazer:-2,food:2},forced:true,
  secret:SC(.15,S_("Descobriu uma assinatura escondida e cancelou.",{inv:5},20),null)},
{t:"Sair sem gastar",d:"Praça, papo e risada. Amizade não precisa de dinheiro.",c:0,e:{lazer:10,food:-1,inv:2},forced:true,
  secret:SC(.15,S_("O rolê rendeu uma ideia de investimento. Seus investimentos vão crescer.",{inv:8}),null)},
{t:"",d:"Dinheiro extra pelo seu esforço.",c:0,e:{inv:8,lazer:5,food:0},gain:30,
  secret:SC(.15,S_("Usou o dinheiro sabiamente!",{inv:5},30),S_("Imprevisto em casa. Nem deu pra curtir o bônus direito. AFF",{lazer:-8,inv:-10}))},
{t:"Fim de semana produtivo",d:"Estudou, cozinhou e organizou o quarto. Dedicação.",c:0,e:{inv:0,lazer:5,food:0},forced:true,
  secret:SC(.15,S_("Investiu no Tesouro Direto.",{inv:15}),S_("O seu investimento era no Banco Master, perdeu tudo KKKKK", {inv:-20}))},
{t:"Namoradinha",d:"Saíste com alguém especial. Amor custa mas a alma agradece.",c:60,e:{lazer:20,food:2,inv:-9},
  secret:SC(.20,S_("A pessoa te presenteou de volta. Relação recíproca.",{lazer:5,inv:3},20),S_("Levou um ghosting brabo. Dinheiro e emoção no lixo.",{lazer:-15,food:-8}))}
];

let usedCards = [];
S.usedSpecials = [];
pendingConsequences = [];
