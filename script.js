(()=>{
"use strict";
const $=id=>document.getElementById(id);
const clamp=(n)=>Math.max(0,Math.min(100,n));
const money=n=>"R$ "+Math.max(0,Math.round(n)).toLocaleString("pt-BR");
const tigrinho='<img src="/img/tigrinho.jpg" alt="Tigrinho" class="tigrinho-img">';

let S={};
let currentCard=null;
let cardLocked=false;
let onSwipeAccept=null;
let onSwipeDeny=null;
let swipeSx=0,swipeDx=0,swipeDragging=false;
let swipeProcessing=false;
const swipeThreshold=100;
let consecutiveDenies=0;
let permanentGainMul=1;
let permanentCostMul=1;
let introDone=false;
let pendingConsequences=[];

const specialEvents=[
  {id:"golpe_pix",name:"Golpe do Pix",emoji:'<i class="fa-solid fa-credit-card"></i>',
   msg:"Caiu um pix fantasma na tua conta. Algu\u00e9m errou e quer o dinheiro de volta \u2014 com juros.",
   desc:"Transferiram R$ 80 por engano. Agora t\u00e3o cobrando R$ 100. Tu paga ou vira d\u00edvida.",
   cost:100,e:{lazer:-8,food:-8,inv:-5},
   consequence:{days:3,msg:"Golpe do Pix: juros acumularam! Perda de status.",e:{lazer:-10,food:-10,inv:-10}}},
  {id:"emprestimo_fantasma",name:"Empr\u00e9stimo Fantasma",emoji:'<i class="fa-solid fa-mobile-screen"></i>',
   msg:"Um app pegou seus dados e fez um empr\u00e9stimo no teu nome. R$ 100 aprovados, mas tu n\u00e3o pediu.",
   desc:"Notifica\u00e7\u00e3o: \"Empr\u00e9stimo liberado!\" O app j\u00e1 come\u00e7ou a descontar do teu saldo.",
   cost:80,e:{lazer:-10,food:-5,inv:-8},
   consequence:{days:5,msg:"Empr\u00e9stimo Fantasma: cobran\u00e7a continuou! Mais preju\u00edzo.",e:{lazer:-15,food:-10,inv:-12}}},
  {id:"promocao_fake",name:"Promo\u00e7\u00e3o Golpista",emoji:'<i class="fa-solid fa-tag"></i>',
   msg:"50% OFF em tudo! Clicou e o app ativou uma assinatura de R$ 40/m\u00eas no teu nome.",
   desc:"Parecia bom demais. Era. Agora tu t\u00e1 pagando sem usar.",
   cost:40,e:{lazer:-5,food:-5,inv:-5},
   consequence:{days:2,msg:"Assinatura golpista cobrou de novo! -R$ 40.",e:{money:-40,lazer:-3}}},
  {id:"divida_familiar",name:"Pediu pra M\u00e3e",emoji:'<i class="fa-solid fa-user"></i>',
   msg:"Sua m\u00e3e emprestou R$ 30 mas disse que vai cobrar todo dia at\u00e9 voltar.",
   desc:"D\u00edvida familiar. N\u00e3o tem app que resolva. Paga ou perde o almo\u00e7o de domingo.",
   cost:30,e:{lazer:-5,food:-5,inv:-3},
   consequence:{days:2,msg:"M\u00e3e cobrou de novo! D\u00edvida familiar n\u00e3o perdoa.",e:{lazer:-8,food:-8}}},
  {id:"clonagem_cartao",name:"Clonaram teu Cart\u00e3o",emoji:'<i class="fa-solid fa-credit-card"></i>',
   msg:"Compra suspeita de R$ 100! Seu cart\u00e3o foi clonado em Florian\u00f3polis.",
   desc:"Tu t\u00e1 no Senac mas o banco acha que tu t\u00e1 viajando. Preju\u00edzo certo.",
   cost:100,e:{lazer:-10,food:-8,inv:-5},
   consequence:{days:7,msg:"Clonagem do cart\u00e3o: banco cobrou mais juros!",e:{money:-50,lazer:-8,food:-5}}},
  {id:"celular_roubado",name:"Celular Roubado",emoji:'<i class="fa-solid fa-mobile-screen"></i>',
   msg:"Te arrancaram o celular na sa\u00edda do Senac. Sem volta, sem chance.",
   desc:"Precisa de celular novo. Plano, chip, capa... tudo de novo.",
   cost:80,e:{lazer:-12,food:-5,inv:-8},
   consequence:{days:4,msg:"Celular roubado: sem ele tu perdeu prazos e contatos.",e:{lazer:-10,inv:-8}}},
  {id:"material_escolar",name:"Material Escolar Emergencial",emoji:'<i class="fa-solid fa-book"></i>',
   msg:"Caderno acabou, caneta estourou e o livro precisa ser trocado. Tudo de uma vez.",
   desc:"M\u00eas de provas e o material n\u00e3o aguenta. Comprar tudo pesa no bolso.",
   cost:50,e:{lazer:-5,food:-5,inv:-3},
   consequence:{days:3,msg:"Material escolar: precisou comprar mais coisas.",e:{money:-30,inv:-5}}},
  {id:"aniversario_amigo",name:"Anivers\u00e1rio do Amigo",emoji:'<i class="fa-solid fa-cake-candles"></i>',
   msg:"Teu melhor amigo t\u00e1 fazendo anivers\u00e1rio. Presente, transporte e contribui\u00e7\u00e3o pra festa.",
   desc:"Amizade \u00e9 car\u00edssima. Mas tu n\u00e3o pode faltar no anivers\u00e1rio do parceiro.",
   cost:45,e:{lazer:-8,food:-3,inv:-3},
   consequence:{days:5,msg:"Anivers\u00e1rio do amigo: rol\u00ea extra que n\u00e3o esperavas.",e:{lazer:-5,food:-5}}},
  {id:"vale_refeicao_estourado",name:"Vale Refei\u00e7\u00e3o Estourado",emoji:'<i class="fa-solid fa-utensils"></i>',
   msg:"Gastou todo o vale refei\u00e7\u00e3o na segunda. Restante do m\u00eas sem comida decente.",
   desc:"Marmita saindo do bolso todo dia. OVR n\u00e3o cobre mais nada.",
   cost:30,e:{food:-10,lazer:-5,inv:-3},
   consequence:{days:3,msg:"Vale estourado: semana inteira sem comida boa.",e:{food:-12,lazer:-5}}}
];
let activeSpecial=null;
let specialMandatoryLeft=0;

const randomEvents=[
  {name:"Pix Fantasma",emoji:'<i class="fa-solid fa-money-bill-transfer"></i>',msg:"Caiu um pix de R$ 40 na tua conta. Tu não sabe de onde veio.",e:{money:40,lazer:5},type:"good",minDay:3},
  {name:"Desconto Escondido",emoji:'<i class="fa-solid fa-tag"></i>',msg:"O mercado tava com promoção e economizou R$ 30.",e:{money:30,food:5},type:"good",minDay:2},
  {name:"Amigo Te Pagou",emoji:'<i class="fa-solid fa-handshake"></i>',msg:"Teu amigo lembrou que te devia R$ 25 e mandou o pix.",e:{money:25,lazer:5},type:"good",minDay:3},
  {name:"Cashback Surpresa",emoji:'<i class="fa-solid fa-percent"></i>',msg:"O app devolveu R$ 15 da tua última compra.",e:{money:15,inv:3},type:"good",minDay:4},
  {name:"Mesada da Vó",emoji:'<i class="fa-solid fa-heart"></i>',msg:"Tua avó te mandou R$ 50. Compra um lanche, neto.",e:{money:50,lazer:5,food:5},type:"good",minDay:2},
  {name:"Lanche Grátis",emoji:'<i class="fa-solid fa-cookie"></i>',msg:"A dona da padaria te deu um pão de queijo grátis.",e:{food:10,lazer:3},type:"good",minDay:2},
  {name:"Multa de Trânsito",emoji:'<i class="fa-solid fa-car-burst"></i>',msg:"Estacionou na área proibida. Multa de R$ 50.",e:{money:-50,lazer:-8},type:"bad",minDay:3},
  {name:"Conta Esquecida",emoji:'<i class="fa-solid fa-file-invoice"></i>',msg:"Esqueceu de pagar uma conta. Juros de R$ 35.",e:{money:-35,inv:-5},type:"bad",minDay:4},
  {name:"Celular Trincou",emoji:'<i class="fa-solid fa-mobile-screen"></i>',msg:"O celular escapou e trincou. Conserto: R$ 80.",e:{money:-80,lazer:-10},type:"bad",minDay:5},
  {name:"Golpe do PIX",emoji:'<i class="fa-solid fa-triangle-exclamation"></i>',msg:"Clicou num link falso. R$ 60 sumiram.",e:{money:-60,lazer:-5,inv:-8},type:"bad",minDay:4},
  {name:"Remédio Emergencial",emoji:'<i class="fa-solid fa-pills"></i>',msg:"Passou mal e comprou remédio. R$ 30.",e:{money:-30,food:-5},type:"bad",minDay:2},
  {name:"Conserto da Bike",emoji:'<i class="fa-solid fa-bicycle"></i>',msg:"A corrente quebrou. Conserto: R$ 25.",e:{money:-25,lazer:-3},type:"bad",minDay:3},
  {name:"Vazamento em Casa",emoji:'<i class="fa-solid fa-droplet"></i>',msg:"O cano estourou. Encanador: R$ 70.",e:{money:-70,lazer:-8,inv:-3},type:"bad",minDay:6},
  {name:"Comida Estragada",emoji:'<i class="fa-solid fa-skull-crossbones"></i>',msg:"A marmita tava estragada. Passou mal.",e:{food:-15,lazer:-5},type:"bad",minDay:2},
  {name:"Achou na Rua",emoji:'<i class="fa-solid fa-magnifying-glass"></i>',msg:"Achou R$ 20 caído no chão. Dia de sorte!",e:{money:20,lazer:5},type:"good",minDay:2},
  {name:"Presente de Aniversário",emoji:'<i class="fa-solid fa-gift"></i>',msg:"Te deram um presente adiantado. R$ 30!",e:{money:30,lazer:8},type:"good",minDay:3},
  {name:"Gasto Fantasma",emoji:'<i class="fa-solid fa-ghost"></i>',msg:"O app cobrou uma assinatura esquecida. -R$ 25.",e:{money:-25,inv:-3},type:"bad",minDay:3},
  {name:"Bicicletada",emoji:'<i class="fa-solid fa-person-biking"></i>',msg:"Pedalou o dia todo. Exercício grátis.",e:{lazer:8,food:-2},type:"good",minDay:2},
  {name:"Noite de Estudos",emoji:'<i class="fa-solid fa-graduation-cap"></i>',msg:"Estudou a noite toda. Investe no futuro.",e:{inv:10,lazer:-5},type:"good",minDay:4},
  {name:"Rolê de Graça",emoji:'<i class="fa-solid fa-music"></i>',msg:"Show gratuito na praça. Lazer sem gastar.",e:{lazer:12,food:-1},type:"good",minDay:2},
  {name:"Estacionamento Irregular",emoji:'<i class="fa-solid fa-square-parking"></i>',msg:"Multaram o carro. R$ 40 de multa.",e:{money:-40,lazer:-5},type:"bad",minDay:4},
  {name:"Doação Voluntária",emoji:'<i class="fa-solid fa-hand-holding-heart"></i>',msg:"Doou R$ 15 pra uma causa boa.",e:{money:-15,lazer:8,inv:3},type:"good",minDay:5},
  {name:"Roubo de Bolso",emoji:'<i class="fa-solid fa-mask"></i>',msg:"Roubaram R$ 30 do teu bolso.",e:{money:-30,lazer:-8},type:"bad",minDay:3},
  {name:"Cupom de Amigo",emoji:'<i class="fa-solid fa-ticket"></i>',msg:"Cupom de R$ 15 OFF do teu amigo.",e:{money:15,food:3},type:"good",minDay:3},
  {name:"Conta de Água",emoji:'<i class="fa-solid fa-faucet-drip"></i>',msg:"Conta de água R$ 40 mais cara.",e:{money:-40,lazer:-3},type:"bad",minDay:4},
  {name:"Venda de Livro",emoji:'<i class="fa-solid fa-book-open"></i>',msg:"Vendeu um livro. R$ 20 no bolso.",e:{money:20,inv:2},type:"good",minDay:3},
  {name:"Pneu Furado",emoji:'<i class="fa-solid fa-circle-exclamation"></i>',msg:"Furou o pneu. Troca: R$ 20.",e:{money:-20,lazer:-4},type:"bad",minDay:3},
  {name:"Voluntariado",emoji:'<i class="fa-solid fa-people-group"></i>',msg:"Ajudou num projeto comunitário.",e:{lazer:6,inv:4},type:"good",minDay:5},
  {name:"Promo Relâmpago",emoji:'<i class="fa-solid fa-bolt-lightning"></i>',msg:"Economizou R$ 25 nas compras.",e:{money:25,food:5},type:"good",minDay:3},
  {name:"Consulta Médica",emoji:'<i class="fa-solid fa-stethoscope"></i>',msg:"Consulta médica: R$ 60.",e:{money:-60,lazer:-3},type:"bad",minDay:4},
  {name:"Cartão Clonado",emoji:'<i class="fa-solid fa-credit-card"></i>',msg:"Cartão clonado. Compra de R$ 45.",e:{money:-45,lazer:-8,inv:-5},type:"bad",minDay:6},
  {name:"Encontro de Graça",emoji:'<i class="fa-solid fa-heart"></i>',msg:"Encontro no parque. Zero custo.",e:{lazer:15,food:-2},type:"good",minDay:3},
  {name:"Esqueceu a Marmita",emoji:'<i class="fa-solid fa-box"></i>',msg:"Esqueceu a marmita. Comida cara.",e:{money:-20,food:-5},type:"bad",minDay:2},
  {name:"Presente dos Amigos",emoji:'<i class="fa-solid fa-people-arrows"></i>',msg:"Amigos te deram R$ 30 de presente.",e:{money:30,lazer:10},type:"good",minDay:4},
  {name:"Multa Leve",emoji:'<i class="fa-solid fa-gavel"></i>',msg:"Multa leve. -R$ 20.",e:{money:-20,lazer:-3},type:"bad",minDay:3},
  {name:"Dinheiro no Bolso Velho",emoji:'<i class="fa-solid fa-pocket"></i>',msg:"Encontrou R$ 25 no casaco velho.",e:{money:25,lazer:5},type:"good",minDay:2},
  {name:"Conta de Internet",emoji:'<i class="fa-solid fa-wifi"></i>',msg:"Internet subiu. -R$ 30.",e:{money:-30,lazer:-5},type:"bad",minDay:4},
  {name:"Troca Justa",emoji:'<i class="fa-solid fa-arrows-rotate"></i>',msg:"Trocou item com colega. Ambos ganharam.",e:{inv:5,lazer:5},type:"good",minDay:3},
  {name:"Atraso na Fila",emoji:'<i class="fa-solid fa-clock"></i>',msg:"1 hora na fila do banco.",e:{lazer:-8,inv:-2},type:"bad",minDay:3},
  {name:"Achado no Brechó",emoji:'<i class="fa-solid fa-shirt"></i>',msg:"Roupa boa por R$ 5 no brechó.",e:{money:-5,lazer:6},type:"good",minDay:3},
  {name:"Dívida Compartilhada",emoji:'<i class="fa-solid fa-people-group"></i>',msg:"Ficou responsável pela conta. -R$ 35.",e:{money:-35,lazer:-3},type:"bad",minDay:4},
  {name:"Cashback Grande",emoji:'<i class="fa-solid fa-piggy-bank"></i>',msg:"Cashback acumulou: R$ 40.",e:{money:40,inv:5},type:"good",minDay:5},
  {name:"Festa de Graça",emoji:'<i class="fa-solid fa-champagne-glasses"></i>',msg:"Festa grátis no bairro.",e:{lazer:14,food:5},type:"good",minDay:3},
  {name:"Perdeu o Ônibus",emoji:'<i class="fa-solid fa-bus-simple"></i>',msg:"Ônibus saiu. Teve que ir a pé.",e:{lazer:-6,food:-2},type:"bad",minDay:2},
  {name:"Quebrou o Fone",emoji:'<i class="fa-solid fa-headphones"></i>',msg:"Fone quebrou. Novo: R$ 30.",e:{money:-30,lazer:-5},type:"bad",minDay:3},
  {name:"Roubo de Bike",emoji:'<i class="fa-solid fa-bicycle"></i>',msg:"Roubaram tua bike. Prejuízo: R$ 100.",e:{money:-100,lazer:-15},type:"bad",minDay:7},
  {name:"Doação de Sangue",emoji:'<i class="fa-solid fa-droplet"></i>',msg:"Doadu sangue. Ganhou R$ 15 + lanche.",e:{money:15,food:8,lazer:3},type:"good",minDay:4},
  {name:"Acidente Leve",emoji:'<i class="fa-solid fa-band-aid"></i>',msg:"Machucou. Curativo: R$ 25.",e:{money:-25,lazer:-6,food:-3},type:"bad",minDay:3},
  {name:"Limpeza na Casa",emoji:'<i class="fa-solid fa-broom"></i>',msg:"Limpu a casa. Gastou R$ 15.",e:{money:-15,lazer:5,inv:3},type:"good",minDay:3},
  {name:"Torneio Online",emoji:'<i class="fa-solid fa-gamepad"></i>',msg:"Ganhou torneio. R$ 25!",e:{money:25,lazer:10},type:"good",minDay:4},
  {name:"Indenização",emoji:'<i class="fa-solid fa-comment-dots"></i>',msg:"Reclamou e ganhou R$ 20.",e:{money:20,inv:3},type:"good",minDay:5},
  {name:"Gasto Transporte",emoji:'<i class="fa-solid fa-gas-pump"></i>',msg:"Combustível subiu. -R$ 30.",e:{money:-30,lazer:-3},type:"bad",minDay:4},
  {name:"Parceria no Senac",emoji:'<i class="fa-solid fa-people-arrows"></i>',msg:"Professor deu pontos extras.",e:{inv:8,lazer:3},type:"good",minDay:3},
  {name:"Corre Corre",emoji:'<i class="fa-solid fa-person-running"></i>',msg:"Correu atrás do ônibus.",e:{lazer:-3,food:-2},type:"bad",minDay:2},
  {name:"Ajudou um Necessitado",emoji:'<i class="fa-solid fa-hand-holding-dollar"></i>',msg:"Deu R$ 10 pra quem precisava.",e:{money:-10,lazer:8,inv:4},type:"good",minDay:3},
  {name:"Estacionamento",emoji:'<i class="fa-solid fa-square-parking"></i>',msg:"Pagar estacionamento: R$ 15.",e:{money:-15,lazer:-2},type:"bad",minDay:3},
  {name:"Oferta de Emprego",emoji:'<i class="fa-solid fa-briefcase"></i>',msg:"Vaga de estágio! Manda o CV!",e:{inv:10,lazer:5},type:"good",minDay:6},
  {name:"Encomenda Extraviada",emoji:'<i class="fa-solid fa-box"></i>',msg:"Correio perdeu. R$ 35 perdidos.",e:{money:-35,lazer:-5},type:"bad",minDay:4},
  {name:"Economia no Mercado",emoji:'<i class="fa-solid fa-store"></i>',msg:"Economizou R$ 20 nas compras.",e:{money:20,food:3},type:"good",minDay:3},
  {name:"Multa de Barulho",emoji:'<i class="fa-solid fa-volume-high"></i>',msg:"Vizinha reclamou. Multa R$ 30.",e:{money:-30,lazer:-5},type:"bad",minDay:4},
  {name:"Pontos do Cartão",emoji:'<i class="fa-solid fa-credit-card"></i>',msg:"Pontos viraram R$ 20.",e:{money:20,lazer:3},type:"good",minDay:4},
  {name:"Reparo em Casa",emoji:'<i class="fa-solid fa-wrench"></i>',msg:"Torneira pingava. Reparo: R$ 35.",e:{money:-35,lazer:-3},type:"bad",minDay:4},,
  {name:"10% do garçom",emoji:'<i class="fa-solid fa-receipt"></i>',msg:"Me pergunto se esse dinheiro chega realmente até eles. -R$ 40.",e:{money:-40,lazer:-5},type:"bad",minDay:4},
  {name:"Gasto com Roupa",emoji:'<i class="fa-solid fa-shirt"></i>',msg:"Comprou roupa pro evento. -R$ 40.",e:{money:-40,lazer:-2},type:"bad",minDay:4},
  {name:"Venda de Eletrônico",emoji:'<i class="fa-solid fa-laptop"></i>',msg:"Vendeu celular velho. R$ 70!",e:{money:70,inv:5},type:"good",minDay:6},
  {name:"Multa de Velocidade",emoji:'<i class="fa-solid fa-gauge-high"></i>',msg:"Radar te multou. R$ 50.",e:{money:-50,lazer:-6},type:"bad",minDay:5},
  {name:"Compra por Impulso",emoji:'<i class="fa-solid fa-cart-shopping"></i>',msg:"Comprou desnecessário. -R$ 30.",e:{money:-30,lazer:3},type:"bad",minDay:3},
  {name:"Trabalho Voluntário",emoji:'<i class="fa-solid fa-handshake"></i>',msg:"Campanha solidária. Experiência.",e:{inv:6,lazer:4},type:"good",minDay:4},
  {name:"Enchente",emoji:'<i class="fa-solid fa-house-flood-water"></i>',msg:"Alagou. Perdeu comida. -R$ 40.",e:{money:-40,food:-10,lazer:-8},type:"bad",minDay:6},
  {name:"Bônus Pontualidade",emoji:'<i class="fa-solid fa-clock"></i>',msg:"R$ 10 por ser pontual.",e:{money:10,inv:2},type:"good",minDay:3},
  {name:"Jogo de Aposta",emoji:'<i class="fa-solid fa-dice"></i>',msg:"Perdeu R$ 20 apostando.",e:{money:-20,lazer:-5},type:"bad",minDay:4},
  {name:"Passeio no Parque",emoji:'<i class="fa-solid fa-tree"></i>',msg:"Parque público. Zero custo.",e:{lazer:10,food:-1},type:"good",minDay:2},
  {name:"Oferta Relâmpago",emoji:'<i class="fa-solid fa-bolt-lightning"></i>',msg:"Economizou R$ 15 na oferta.",e:{money:15,food:3},type:"good",minDay:3},
  {name:"Amigo Não Pagou",emoji:'<i class="fa-solid fa-user-minus"></i>',msg:"Amigo devolveu só metade. -R$ 15.",e:{money:-15,lazer:-5},type:"bad",minDay:4},
  {name:"Mini Empreendimento",emoji:'<i class="fa-solid fa-store"></i>',msg:"Vendeu bolo de pote. R$ 35!",e:{money:35,inv:5,lazer:-2},type:"good",minDay:5},
  {name:"Dentista",emoji:'<i class="fa-solid fa-tooth"></i>',msg:"Limpeza dentária: R$ 45.",e:{money:-45,lazer:-3},type:"bad",minDay:5},
  {name:"Cashback Gasolina",emoji:'<i class="fa-solid fa-gas-pump"></i>',msg:"Cashback de R$ 10.",e:{money:10,lazer:2},type:"good",minDay:3},
  {name:"Multa Zona Azul",emoji:'<i class="fa-solid fa-parking"></i>',msg:"Esqueceu o parquímetro. R$ 30.",e:{money:-30,lazer:-4},type:"bad",minDay:4},
  {name:"Coleta Seletiva",emoji:'<i class="fa-solid fa-recycle"></i>',msg:"Vendeu recicláveis. R$ 8.",e:{money:8,inv:3,lazer:2},type:"good",minDay:3},
  {name:"Roubo de Fone",emoji:'<i class="fa-solid fa-headphones"></i>',msg:"Roubaram teu fone. -R$ 25.",e:{money:-25,lazer:-6},type:"bad",minDay:3},
  {name:"Conta de Gás",emoji:'<i class="fa-solid fa-fire"></i>',msg:"Troca da botija: R$ 50.",e:{money:-50,food:-5},type:"bad",minDay:4},
  {name:"Pontos de Fidelidade",emoji:'<i class="fa-solid fa-star"></i>',msg:"Trocou pontos por R$ 20.",e:{money:20,lazer:3},type:"good",minDay:4},
  {name:"Compra Errada",emoji:'<i class="fa-solid fa-cart-shopping"></i>',msg:"Comprou o tamanho errado. -R$ 20.",e:{money:-20,lazer:-3},type:"bad",minDay:3},
  {name:"Parceria Estudantil",emoji:'<i class="fa-solid fa-user-graduate"></i>',msg:"Trabalho com nota máxima.",e:{inv:5,lazer:5},type:"good",minDay:3},
  {name:"Chuvosa",emoji:'<i class="fa-solid fa-cloud-rain"></i>',msg:"Caminhou molhado até o carro.",e:{lazer:-6,food:-2},type:"bad",minDay:2},
  {name:"Mini Curso Grátis",emoji:'<i class="fa-solid fa-laptop-code"></i>',msg:"Curso online grátis. Novo conhecimento!",e:{inv:6,lazer:2},type:"good",minDay:4},
  {name:"Divida com Amigos",emoji:'<i class="fa-solid fa-user-group"></i>',msg:"Cobraram R$ 20 do rolê.",e:{money:-20,lazer:-3},type:"bad",minDay:3},
  {name:"Dinheiro no Bolso",emoji:'<i class="fa-solid fa-coins"></i>',msg:"Encontrou R$ 8 na jaqueta.",e:{money:8,lazer:3},type:"good",minDay:2},
  {name:"Remédio",emoji:'<i class="fa-solid fa-pills"></i>',msg:"Remédio emergencial: R$ 20.",e:{money:-20,food:-3},type:"bad",minDay:3},
  {name:"Venda de Livro",emoji:'<i class="fa-solid fa-book"></i>',msg:"Vendeu livro didático. R$ 30!",e:{money:30,inv:3},type:"good",minDay:4},
  {name:"Desconto Aniversário",emoji:'<i class="fa-solid fa-cake-candles"></i>',msg:"Apps deram desconto. R$ 25!",e:{money:25,lazer:5},type:"good",minDay:3},
  {name:"Perda no Uber",emoji:'<i class="fa-solid fa-car"></i>',msg:"Esqueceu coisa no Uber. -R$ 15.",e:{money:-15,lazer:-4},type:"bad",minDay:3},
  {name:"Natação Grátis",emoji:'<i class="fa-solid fa-person-swimming"></i>',msg:"Natação na praça esportiva.",e:{lazer:10,food:-2},type:"good",minDay:4},
  {name:"Cobrança Indevida",emoji:'<i class="fa-solid fa-ban"></i>',msg:"Banco cobrou taxa fantasma. -R$ 15.",e:{money:-15,lazer:-3},type:"bad",minDay:4},
  {name:"Compra Desnecessária",emoji:'<i class="fa-solid fa-cart-plus"></i>',msg:"Comprou o que não precisava. -R$ 35.",e:{money:-35,lazer:2},type:"bad",minDay:3},
  {name:"Fio Desencapado",emoji:'<i class="fa-solid fa-plug"></i>',msg:"Eletricista: R$ 40.",e:{money:-40,lazer:-5},type:"bad",minDay:5},
  {name:"Vale-Presente",emoji:'<i class="fa-solid fa-gift"></i>',msg:"Ganhou vale-presente de R$ 30.",e:{money:30,lazer:5},type:"good",minDay:3},
  {name:"Carro Empenado",emoji:'<i class="fa-solid fa-car-burst"></i>',msg:"Mecânico: R$ 80.",e:{money:-80,lazer:-10},type:"bad",minDay:6},
  {name:"Freela Fim de Semana",emoji:'<i class="fa-solid fa-briefcase"></i>',msg:"Trabalhou no fim de semana. R$ 50!",e:{money:50,lazer:-5,inv:3},type:"good",minDay:5},
  {name:"Venda Online",emoji:'<i class="fa-solid fa-cart-shopping"></i>',msg:"Vendeu coisa velha. R$ 35!",e:{money:35,lazer:3,inv:2},type:"good",minDay:5},
  {name:"Compra no Brechó",emoji:'<i class="fa-solid fa-shirt"></i>',msg:"Comprou roupa barata. R$ 5.",e:{money:-5,lazer:4},type:"good",minDay:3}
];


function addConsequence(dayOffset,msg,e){
  pendingConsequences.push({day:S.day+dayOffset,msg:msg,e:e});
}

let usedCards=[];
  S.usedSpecials=[];
  pendingConsequences=[];
const S_=(msg,e,g)=>({msg,e:{...(e||{})},gain:g||0});
const SC=(chance,good,bad)=>({chance,good,bad});
const cards=[
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
  secret:SC(.45,S_("Chegou mais cedo e não poluiu o planeta! #gratiluz.",{inv:5,lazer:5}),S_("Quebrou o guidão, furou as rodas, descarrilhou a correia e ainda chegou atrasado.",{inv:-15,lazer:-12,food:-10}))},
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

function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active")}

function addLog(){}

function render(){
  $("day").textContent="DIA "+S.day+"/30";
  $("money").textContent=money(S.money);
  [["lazer",S.lazer],["food",S.food],["inv",S.inv]].forEach(([id,v])=>{
    $(id+"N").textContent=Math.round(v);
    $(id+"B").style.width=v+"%";
  });
  const tags=[];
  if(S.debt)tags.push('<span class="effect neg"><i class="fa-solid fa-money-bill-wave"></i> Dívida ativa</span>');
  if(S.tiger>0)tags.push('<span class="effect neg">'+tigrinho+' '+S.tiger+' cartas obrigatórias</span>');
  if(consecutiveDenies>=2)tags.push('<span class="effect neg"><i class="fa-solid fa-rotate"></i> '+consecutiveDenies+' negativas seguidas</span>');
  if(permanentGainMul<1)tags.push('<span class="effect neg"><i class="fa-solid fa-arrow-trend-down"></i> Ganhos -'+Math.round((1-permanentGainMul)*100)+'%</span>');
  if(permanentCostMul>1)tags.push('<span class="effect neg"><i class="fa-solid fa-arrow-trend-up"></i> Gastos +'+Math.round((permanentCostMul-1)*100)+'%</span>');
  pendingConsequences.forEach(pc=>{tags.push('<span class="effect neg"><i class="fa-solid fa-clock"></i> Consequência em '+(pc.day-S.day)+' dias</span>')});
  $("debuffs").innerHTML=tags.join("");
  const moodText=S.money<30?"Tá foda":S.money<80?"Apertando":S.money<150?"Se virando":"Tranquilo";
  $("mood").textContent=moodText+(S.nickname?", "+S.nickname:"");
}

function spawnConfetti(){
  const container=document.createElement("div");
  container.className="confetti-container";
  document.body.appendChild(container);
  const colors=["#facc15","#4ade80","#818cf8","#f87171","#fb923c","#38bdf8","#e879f9"];
  for(let i=0;i<60;i++){
    const piece=document.createElement("div");
    piece.className="confetti-piece";
    piece.style.left=Math.random()*100+"%";
    piece.style.background=colors[Math.floor(Math.random()*colors.length)];
    piece.style.width=(Math.random()*8+6)+"px";
    piece.style.height=(Math.random()*8+6)+"px";
    piece.style.animationDuration=(Math.random()*2+2)+"s";
    piece.style.animationDelay=(Math.random()*1.5)+"s";
    piece.style.opacity=Math.random()*.7+.3;
    container.appendChild(piece);
  }
  setTimeout(()=>container.remove(),5000);
}

function saveWinData(){
  const avg=Math.round((S.lazer+S.food+S.inv)/3);
  const data={
    nome:S.name,
    turma:S.turma,
    salarioRestante:S.money,
    status:avg,
    modo:S.mode||"normal"
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="vitoria_"+S.name.replace(/\s+/g,"_")+".json";
  a.click();
  URL.revokeObjectURL(url);
}

function finish(reason){
  show("end");
  const win=reason==="win";
  if(win)spawnConfetti();
  $("endPanel").className="panel center "+(win?"win":"danger");
  const player=S.nickname||S.name.split(" ")[0];
  $("endPanel").innerHTML=
    '<span class="tag">'+(win?"MÊS CONCLUÍDO":"FIM DE JOGO")+'</span>'+
    '<h2>'+(win?"Passou direto, "+player+"!": "Game over")+"</h2>"+
    "<p>"+S.name+" ("+S.turma+") terminou com <b>"+money(S.money)+"</b>.</p>"+
    (S.mode?'<p><span class="diff-badge '+S.mode+'">'+(S.mode==="hardcore"?'<i class="fa-solid fa-fire"></i> HARDCORE':'<i class="fa-solid fa-bolt"></i> DIFÍCIL')+'</span></p>':"")+
    '<div class="stats-summary">'+
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-gamepad"></i> '+Math.round(S.lazer)+'</span><span class="stat-label">Lazer</span></div>'+
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-utensils"></i> '+Math.round(S.food)+'</span><span class="stat-label">Alimentação</span></div>'+
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-chart-line"></i> '+Math.round(S.inv)+'</span><span class="stat-label">Investimentos</span></div>'+
    '</div>'+
    "<p>"+(win?"Deu tudo certo. Equilibrou tudo durante 30 dias. Manda bem!":reason)+"</p>"+
    (!win&&S.mode==="hardcore"?'<p style="margin-top:12px;font-size:14px;color:#facc15;font-weight:700"><i class="fa-solid fa-fire"></i> Se você perdeu no Hardcore, você só tem SABOR aura <i class="fa-solid fa-fire"></i></p>':"")+
    '<div class="linkedin-cta">'+
    '<span class="cta-icon"><i class="fa-solid fa-handshake"></i></span>'+
    '<p class="cta-title">E aí, curtiu?</p>'+
    '<p class="cta-text">Me segue no LinkedIn e conta o que achou! Isso ajuda tanto a mim quanto a você.</p>'+
    '<a href="https://www.linkedin.com/in/igor-de-souza-branco-b68630314/" target="_blank" rel="noopener" class="cta-btn"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>'+
    '</div>';
  $("restart").style.display=win?"none":"block";
  if(win)saveWinData();
}

function check(){
  if(S.lazer<=0)return finish("Seu lazer chegou a zero.");
  if(S.food<=0)return finish("Sua alimentação chegou a zero.");
  if(S.inv<=0)return finish("Seus investimentos chegaram a zero.");
  if(S.money<0)return finish("Você ficou sem dinheiro.");
  return false;
}

function apply(e,c,gain){
  const d=S.difficulty||1;
  const isHC=S.mode==="hardcore";
  const costMul=activeSpecial?activeSpecial.costMul:1;
  const gainMul=activeSpecial?activeSpecial.gainMul:1;
  S.money-=Math.round(c*d*costMul*permanentCostMul);
  if(gain){
    const g=Math.round(gain/d*gainMul*permanentGainMul);
    S.money+=(isHC&&g<10?0:g);
  }
  Object.entries(e||{}).forEach(([k,v])=>{
    if(isHC){
      v=v>0?Math.round(v*0.6):v<0?Math.round(v*1.4):v;
    }
    S[k]=clamp(S[k]+v);
  });
}


function processPendingConsequences(){
  for(let i=pendingConsequences.length-1;i>=0;i--){
    const pc=pendingConsequences[i];
    if(S.day>=pc.day){
      Object.entries(pc.e||{}).forEach(([k,v])=>{
        if(k==="money")S.money+=v;
        else S[k]=clamp(S[k]+v);
      });
      showSecretToast(pc.msg,false);
      pendingConsequences.splice(i,1);
    }
  }
}

function nextDay(){
  if(check())return;
  if(S.day>=30){
    const minStat=S.mode==="hardcore"?70:S.mode==="dificil"?55:50;
    if(S.lazer>minStat&&S.food>minStat&&S.inv>minStat) finish("win");
    else finish("Você chegou ao dia 30, mas precisa terminar com os três status acima de "+minStat+".");
    return;
  }
  S.day++;
  processPendingConsequences();
  if(S.tigerCooldown>0)S.tigerCooldown--;

  if(activeSpecial&&specialMandatoryLeft>0){
    specialMandatoryLeft--;
    if(specialMandatoryLeft<=0){
      S.lazer=clamp(S.lazer+activeSpecial.penalty.lazer);
      S.food=clamp(S.food+activeSpecial.penalty.food);
      S.inv=clamp(S.inv+activeSpecial.penalty.inv);
      showSecretToast(activeSpecial.name+": status destruídos. "+activeSpecial.penalty.lazer+" em tudo.",false);
      activeSpecial=null;
    }
  }

  if(S.debt){
    const debtAmount=S.mode==="hardcore"?15:S.mode==="dificil"?10:8;
    S.money-=Math.round(debtAmount*(S.difficulty||1));
    S.food=clamp(S.food-(S.mode==="hardcore"?4:2));
  }

  if(S.tiger===0&&S.tigerCooldown===0&&!activeSpecial&&S.day>=4){
    const tigerChance=0.05;
    const specialChance=0.08;
    const roll=Math.random();
    if(roll<tigerChance){
      render();
      showTiger();
      return;
    }else if(roll<tigerChance+specialChance){
      render();
      const available=specialEvents.filter(e=>!S.usedSpecials||!S.usedSpecials.includes(e.id));
      if(available.length>0){
        const ev=available[Math.floor(Math.random()*available.length)];
        if(!S.usedSpecials)S.usedSpecials=[];
        S.usedSpecials.push(ev.id);
        showSpecialCard(ev);
        return;
      }
    }
  }

  if(S.tiger===0&&S.tigerCooldown===0&&!activeSpecial&&S.day>=2&&Math.random()<0.15){
    render();
    if(showRandomEvent())return;
  }

  render();
  makeCard();
}

function showTiger(){
  const el=$("card");
  el.style.transform="";
  el.classList.remove("swiping","swipe-right","swipe-left");
  cardLocked=false;
  el.innerHTML=
    '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> ACEITAR</div>'+
    '<div class="swipe-overlay deny"><i class="fa-solid fa-xmark"></i> NEGAR</div>'+
    '<div class="card-content">'+
    '<span class="tag">EVENTO ESPECIAL</span>'+
    '<h3><img src="/img/tigrinho.jpg" alt="Tigrinho" class="tigrinho-img big"> A carta do Tigrinho</h3>'+
    '<p>Caiu uma notificação no celular. "Ganhe dinheiro fácil!"</p>'+
    '<div class="panel danger"><b><i class="fa-solid fa-triangle-exclamation"></i>Ludopatia</b><p>Se aceitar, as próximas <b>3 cartas são obrigatórias</b> — sem recusa. Dá pra se recuperar depois, mas vão haver cosequências permanentes.</p></div>'+
    '</div>'+
    '<div class="swipe-hint"><span class="hint-left"><i class="fa-solid fa-arrow-left"></i> Negar</span><span class="hint-right">Aceitar <i class="fa-solid fa-arrow-right"></i></span></div>';

  setSwipeCallbacks(function(){
    S.tiger=3;
    S.tigerPenalty={lazer:-20,food:-20,inv:-20};
    S.tigerGainMul=0.85;
    S.tigerCostMul=1.2;
    nextDay();
  }, function(){
    S.tigerCooldown=5;
    nextDay();
  });
}

function showSecretToast(msg,isGood){
  const toast=document.createElement("div");
  toast.className="secret-toast "+(isGood?"good":"bad");
  toast.innerHTML="<span>"+(isGood?'<i class="fa-solid fa-clover"></i>':'<i class="fa-solid fa-skull"></i>')+"</span> "+msg;
  document.body.appendChild(toast);
  setTimeout(()=>toast.classList.add("show"),10);
  setTimeout(()=>{toast.classList.remove("show");setTimeout(()=>toast.remove(),400)},3500);
}

let _prevMouseMove=null;
let _prevMouseUp=null;
let _prevTouchStart=null;
let _prevTouchMove=null;
let _prevTouchEnd=null;

function setSwipeCallbacks(onAccept,onDeny){
  onSwipeAccept=onAccept;
  onSwipeDeny=onDeny;
}

function initSwipe(){
  const el=$("card");
  if(!el)return;

  if(_prevMouseMove)window.removeEventListener("mousemove",_prevMouseMove);
  if(_prevMouseUp)window.removeEventListener("mouseup",_prevMouseUp);
  if(_prevTouchStart)el.removeEventListener("touchstart",_prevTouchStart);
  if(_prevTouchMove)el.removeEventListener("touchmove",_prevTouchMove);
  if(_prevTouchEnd)el.removeEventListener("touchend",_prevTouchEnd);

  function onStart(ex,ey){
    if(cardLocked||swipeProcessing)return;
    swipeSx=ex;swipeDx=0;swipeDragging=true;
    el.classList.add("swiping");
  }
  function onMove(ex,ey){
    if(!swipeDragging)return;
    swipeDx=ex-swipeSx;
    const rot=swipeDx*0.08;
    el.style.transform="translateX("+swipeDx+"px) rotate("+rot+"deg)";
    const pct=Math.min(1,Math.abs(swipeDx)/swipeThreshold);
    const overlayR=el.querySelector(".swipe-overlay.accept");
    const overlayL=el.querySelector(".swipe-overlay.deny");
    if(overlayR)overlayR.style.opacity=swipeDx>0?pct:0;
    if(overlayL)overlayL.style.opacity=swipeDx<0?pct:0;
  }
  function onEnd(){
    if(!swipeDragging)return;
    swipeDragging=false;
    el.classList.remove("swiping");
    const overlayR=el.querySelector(".swipe-overlay.accept");
    const overlayL=el.querySelector(".swipe-overlay.deny");
    if(Math.abs(swipeDx)>=swipeThreshold){
      if(swipeDx>0||onSwipeDeny){
        cardLocked=true;
        swipeProcessing=true;
      }
      if(swipeDx>0){
        el.classList.add("swipe-right");
        setTimeout(()=>{swipeProcessing=false;onSwipeAccept&&onSwipeAccept()},180);
      }else if(onSwipeDeny){
        el.classList.add("swipe-left");
        setTimeout(()=>{swipeProcessing=false;onSwipeDeny()},180);
      }else{
        el.style.transform="";if(overlayR)overlayR.style.opacity=0;if(overlayL)overlayL.style.opacity=0;
      }
    }else{
      el.style.transform="";
      if(overlayR)overlayR.style.opacity=0;
      if(overlayL)overlayL.style.opacity=0;
    }
  }

  _prevTouchStart=e=>{const t=e.touches[0];onStart(t.clientX,t.clientY)};
  _prevTouchMove=e=>{const t=e.touches[0];onMove(t.clientX,t.clientY)};
  _prevTouchEnd=()=>onEnd();
  _prevMouseMove=e=>{onMove(e.clientX,e.clientY)};
  _prevMouseUp=()=>onEnd();

  el.addEventListener("touchstart",_prevTouchStart,{passive:true});
  el.addEventListener("touchmove",_prevTouchMove,{passive:true});
  el.addEventListener("touchend",_prevTouchEnd);
  el.addEventListener("mousedown",e=>{onStart(e.clientX,e.clientY)});
  window.addEventListener("mousemove",_prevMouseMove);
  window.addEventListener("mouseup",_prevMouseUp);
}



function showSpecialCard(ev){
  const el=$("card");
  el.style.transform="";
  el.classList.remove("swiping","swipe-right","swipe-left");
  cardLocked=false;

  activeSpecial=ev;
  const d=S.difficulty||1;
  const adjustedCost=Math.round(ev.cost*d*permanentCostMul);

  const effects=Object.entries(ev.e||{}).map(([k,v])=>{
    const n=k==="money"?"Dinheiro":k==="lazer"?'<i class="fa-solid fa-gamepad"></i> Lazer':k==="food"?'<i class="fa-solid fa-utensils"></i> Alimentação':'<i class="fa-solid fa-chart-line"></i> Investimentos';
    const valStr=k==="money"?money(v):((v>=0?"+":"")+v);
    return '<span class="effect neg">'+valStr+" "+n+"</span>";
  }).join("");

  const consequenceText=ev.consequence?
    '<div class="panel danger" style="margin-top:8px"><b><i class="fa-solid fa-clock"></i> Consequência em '+ev.consequence.days+' dias</b><p>'+ev.consequence.msg+'</p></div>':'';

  el.innerHTML=
    '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> ACEITAR</div>'+
    '<div class="card-content">'+
    '<span class="tag">DIA '+S.day+' · EVENTO ESPECIAL</span>'+
    "<h3>"+ev.emoji+" "+ev.name+"</h3>"+
    "<p>"+ev.msg+"</p>"+
    '<div class="cost">Custa '+money(adjustedCost)+'</div>'+
    '<div class="effects">'+effects+'</div>'+
    consequenceText+
    '</div>'+
    '<p class="small">Carta obrigatória — arraste para a direita.</p>';

  setSwipeCallbacks(function(){
    S.money-=adjustedCost;
    Object.entries(ev.e||{}).forEach(([k,v])=>{
      if(k==="money")S.money+=v;
      else S[k]=clamp(S[k]+v);
    });
    if(ev.consequence){
      addConsequence(ev.consequence.days,ev.consequence.msg,ev.consequence.e);
    }
    showSecretToast(ev.name+": penalidade aplicada!",false);
    activeSpecial=null;
    render();
    if(!check())nextDay();
  },null);
}

function showRandomEvent(){
  const available=randomEvents.filter(e=>S.day>=e.minDay);
  if(available.length===0)return false;
  const ev=available[Math.floor(Math.random()*available.length)];
  const isGood=ev.type==="good";

  Object.entries(ev.e||{}).forEach(([k,v])=>{
    if(k==="money"){
      S.money+=v;
    }else{
      S[k]=clamp(S[k]+v);
    }
  });

  const el=$("card");
  el.style.transform="";
  el.classList.remove("swiping","swipe-right","swipe-left");
  cardLocked=false;

  const effects=Object.entries(ev.e||{}).map(([k,v])=>{
    const n=k==="money"?"Dinheiro":k==="lazer"?'<i class="fa-solid fa-gamepad"></i> Lazer':k==="food"?'<i class="fa-solid fa-utensils"></i> Alimentação':'<i class="fa-solid fa-chart-line"></i> Investimentos';
    const valStr=k==="money"?money(v):((v>=0?"+":"")+v);
    return '<span class="effect '+(v>=0?"pos":"neg")+'">'+valStr+" "+n+"</span>";
  }).join("");

  el.innerHTML=
    '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> OK</div>'+
    '<div class="card-content">'+
    '<span class="tag event">DIA '+S.day+' · EVENTO ALEATÓRIO</span>'+
    "<h3>"+ev.emoji+" "+ev.name+"</h3>"+
    "<p>"+ev.msg+"</p>"+
    '<div class="effects">'+effects+'</div>'+
    '</div>'+
    '<div class="swipe-hint"><span class="hint-right">Deslize pra continuar <i class="fa-solid fa-arrow-right"></i></span></div>';

  setSwipeCallbacks(function(){
    render();
    makeCard();
  },null);

  return true;
}

function makeCard(){
  let c;

  if(S.day===1&&!S.salaryDone){
    S.salaryDone=true;
    apply({food:2,inv:2},0);
    render();
    setTimeout(()=>{
      render();
      makeCard();
    },800);
    return;
  }else if(S.day===7){
    c={t:"Conta de luz",d:"A conta de luz chegou. Ninguem quer ficar no escuro.",c:50,e:{food:-5,lazer:5,inv:-10},fixed:true};
  }else if(S.day===15){
    c={t:"Ajuda em casa",d:"Contribuição mensal pra ajudar em casa. Não pagar cria conversa.",c:120,e:{food:-5,lazer:-7,inv:-7},fixed:true};
  }else if(S.day===25){
    c={t:"Recarga do Spotify",d:"Não dá pegar o busão sem música.",c:22,e:{food:-5,lazer:5,inv:-9},forced:true};
   }else{
    let available=cards.filter((_,i)=>!usedCards.includes(i));
    if(available.length===0){usedCards=[];
  S.usedSpecials=[];
  pendingConsequences=[];available=cards.slice()}
    const idx=cards.indexOf(available[Math.floor(Math.random()*available.length)]);
    usedCards.push(idx);
    c=cards[idx];
  }

  if(S.tiger>0){
    const tigerCost=Math.round(Math.min(30,S.money)*(S.difficulty||1));
    c={t:tigrinho+" Oferta obrigatória",d:"Você está na sequência do Tigrinho. Esta carta não pode ser negada.",c:tigerCost,e:{lazer:5,inv:-4,food:-3},forced:true};
  }

  renderCard(c);
}

function renderCard(c){
  currentCard=c;
  cardLocked=false;
  swipeProcessing=false;
  const el=$("card");
  el.style.transform="";
  el.classList.remove("swiping","swipe-right","swipe-left");

  const d=S.difficulty||1;
  const isHC=S.mode==="hardcore";
  const baseCost=c.c===0&&isHC?15:c.c;
  const adjustedCost=Math.round(baseCost*d*permanentCostMul);
  const rawGain=c.gain?Math.round(c.gain/d):0;
  const adjustedGain=isHC&&rawGain<10?0:Math.round(rawGain*permanentGainMul);
  const canAccept=c.forced||(adjustedGain>0||S.money>=adjustedCost);
  const canDeny=!c.fixed&&!c.forced;

  const effects=Object.entries(c.e||{}).map(([k,v])=>{
    const n=k==="lazer"?'<i class="fa-solid fa-gamepad"></i> Lazer':k==="food"?'<i class="fa-solid fa-utensils"></i> Alimentação':'<i class="fa-solid fa-chart-line"></i> Investimentos';
    let dv=v;
    if(isHC)dv=v>0?Math.round(v*0.6):v<0?Math.round(v*1.4):v;
    return '<span class="effect '+(dv>=0?"pos":"neg")+'">'+(dv>=0?"+":"")+dv+" "+n+"</span>";
  }).join("");

  $("card").innerHTML=
    (canAccept?'<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> ACEITAR</div>':'')+
    (canDeny?'<div class="swipe-overlay deny"><i class="fa-solid fa-xmark"></i> NEGAR</div>':'')+
    '<div class="card-content">'+
    '<span class="tag">DIA '+S.day+(c.fixed?" · EVENTO FIXO":c.forced&&S.tiger>0?" · TIGRINHO":c.forced?" · OBRIGATÓRIO":" · DECISÃO")+'</span>'+
    (S.mode?'<span class="diff-badge '+S.mode+'">'+(S.mode==="hardcore"?"HARDCORE":"DIFÍCIL")+'</span>':"")+
    "<h3>"+c.t+"</h3><p>"+c.d+"</p>"+
    '<div class="cost">'+(adjustedGain>0?"Você ganha "+money(adjustedGain):baseCost===0&&c.c===0?"Grátis":"Custa "+money(adjustedCost))+"</div>"+
    '<div class="effects">'+(effects||'<span class="effect">Sem alteração de status</span>')+"</div>"+
    '</div>'+
    (canAccept||canDeny?
      '<div class="swipe-hint">'+
      (canDeny?'<span class="hint-left"><i class="fa-solid fa-arrow-left"></i> Negar</span>':'<span class="hint-left"></span>')+
      (canAccept?'<span class="hint-right">Aceitar <i class="fa-solid fa-arrow-right"></i></span>':'<span class="hint-right"></span>')+
      '</div>':'<p class="small">Carta obrigatória — arraste para a direita.</p>');

  setSwipeCallbacks(function(){
    consecutiveDenies=0;
    if(c.forced){
      S.money-=Math.round(Math.min(30,S.money)*(S.difficulty||1));
      S.tiger=Math.max(0,S.tiger-1);
      if(S.tiger<=0&&S.tigerPenalty){
        S.lazer=clamp(S.lazer+S.tigerPenalty.lazer);
        S.food=clamp(S.food+S.tigerPenalty.food);
        S.inv=clamp(S.inv+S.tigerPenalty.inv);
        permanentGainMul*=S.tigerGainMul;
        permanentCostMul*=S.tigerCostMul;
        showSecretToast("Tigrinho: -20 em todos os status! Gastos +20%, ganhos -15% permanentes.",false);
        S.tigerPenalty=null;
        S.tigerGainMul=1;
        S.tigerCostMul=1;
      }
    }else{
      apply(c.e,c.c,c.gain);
      if(c.fixed&&S.day===15){
        S.debt=false;
      }
      if(c.secret&&Math.random()<c.secret.chance){
        const r=Math.random()<0.5;
        const s=r?c.secret.good:c.secret.bad;
        if(s){
          const isHC2=S.mode==="hardcore";
          Object.entries(s.e||{}).forEach(([k,v])=>{
            let dv=v;
            if(isHC2)dv=v>0?Math.round(v*0.6):v<0?Math.round(v*1.4):v;
            S[k]=clamp(S[k]+dv);
          });
          if(s.gain){
            const sg=Math.round(s.gain/(S.difficulty||1));
            S.money+=(isHC2&&sg<10?0:sg);
          }
          showSecretToast(s.msg,r);
        }
      }
    }
    render();
    if(!check())nextDay();
  }, canDeny?function(){
    consecutiveDenies++;
    if(consecutiveDenies>=3){
      const penalty=consecutiveDenies>=7?-8:consecutiveDenies>=5?-6:-4;
      const foodPenalty=consecutiveDenies>=7?-3:consecutiveDenies>=5?-2:0;
      const invPenalty=consecutiveDenies>=7?-3:0;
      S.lazer=clamp(S.lazer+penalty);
      if(foodPenalty)S.food=clamp(S.food+foodPenalty);
      if(invPenalty)S.inv=clamp(S.inv+invPenalty);
      const cardEl=$("card");
      if(cardEl){cardEl.classList.add("deny-warn");setTimeout(()=>cardEl.classList.remove("deny-warn"),300)}
      const msgs=[
        "Recusou tudo. A preguiça e o isolamento tão consumindo teus status.",
        "Ninguem é aguenta tanto tempo isolado.",
        "Sem friends, sem rolê, sem nada. Teus status tavam implorando por ação."
      ];
      showSecretToast(msgs[Math.min(consecutiveDenies-3,msgs.length-1)],false);
    }
    if(c.fixed&&S.day===15){
      S.debt=true;
    }
    render();
    if(!check())nextDay();
  }:null);
}

$("startBtn").onclick=()=>{show("register")};

function applyTheme(theme){
  document.body.classList.remove("theme-light");
  if(theme==="light")document.body.classList.add("theme-light");
}

$("look").onchange=()=>$("avatar").innerHTML='<i class="'+$("look").value+'"></i>';

function getPlayedUsers(){
  try{return JSON.parse(localStorage.getItem("fugindo_played")||"[]")}catch(e){return[]}
}
function savePlayedEmail(email){
  const list=getPlayedUsers();
  if(!list.includes(email)){list.push(email);localStorage.setItem("fugindo_played",JSON.stringify(list))}
}
function emailAlreadyPlayed(email){return getPlayedUsers().includes(email)}

function nameHasNumbersExcept67(name){
  return /[0-9]/.test(name.replace(/67/g,""));
}

function detectAurudo(name){
  if(name.includes("6767"))return "hardcore";
  if(name.includes("67"))return "dificil";
  return null;
}

function showAurudoOverlay(name,mode,callback){
  const ol=document.createElement("div");
  ol.className="aurudo-overlay";
  const isHardcore=mode==="hardcore";
  ol.innerHTML=
    '<div class="aurudo-card'+(isHardcore?" hardcore":"")+'">'+
    '<span class="aurudo-emoji">'+(isHardcore?'<i class="fa-solid fa-skull"></i>':'<i class="fa-solid fa-fire"></i>')+'</span>'+
    '<h2>'+(isHardcore?"VOCÊ É O MAIS AURUDO DO SENAC GRAVATAÍ!":name+", tu é AURUDO!")+'</h2>'+
    '<p>'+(isHardcore
      ?"Esse nome tem 6767. Isso é aura + ego ^ 1000. Modo <b>Hardcore</b> desbloqueado."
      :"O nome tem 67. Isso é rareza. Modo <b>Difícil</b> ativado.")+'</p>'+
    '<div class="aurudo-mode">'+(isHardcore?'<i class="fa-solid fa-fire"></i> MODO HARDCORE <i class="fa-solid fa-fire"></i>':'<i class="fa-solid fa-bolt"></i> MODO DIFÍCIL <i class="fa-solid fa-bolt"></i>')+'</div>'+
    '<p style="margin-top:14px;font-size:12px;color:var(--ink-sec)">'+(isHardcore
      ?"Custos x3, ganhos cortados, stats começam em 20. Boa sorte."
      :"Custos x1.5, ganhos levemente reduzidos. Dá pra virar.")+'</p>'+
    '<button class="btn primary full" style="margin-top:18px" id="aurudoContinue">Bora lá</button>'+
    '</div>';
  document.body.appendChild(ol);
  ol.querySelector("#aurudoContinue").onclick=()=>{ol.remove();callback()};
}

function showIntro(){
  const el=$("card");
  el.style.transform="";
  el.classList.remove("swiping","swipe-right","swipe-left");
  cardLocked=false;
  el.innerHTML=
    '<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> COMEÇAR</div>'+
    '<div class="card-content">'+
    '<span class="tag">DIA 1 · INÍCIO</span>'+
    '<h3><i class="fa-solid fa-briefcase"></i> Primeiro dia como jovem aprendiz</h3>'+
    '<p>O mês acabou de começar. Tem <b>'+money(S.money)+'</b> no bolso e precisa sobreviver 30 dias equilibrando lazer, alimentação e investimentos.</p>'+
    '<div class="panel"><b><i class="fa-solid fa-circle-info"></i> Regras</b>'+
    '<p>Deslize o card pra <b>direita</b> pra aceitar ou <b>esquerda</b> pra negar.<br>'+
    'Seus 3 status não podem cair a zero. Cuidado com cada decisão!</p></div>'+
    '</div>'+
    '<div class="swipe-hint"><span class="hint-right">Deslize pra começar <i class="fa-solid fa-arrow-right"></i></span></div>';

  setSwipeCallbacks(function(){
    introDone=true;
    makeCard();
  },null);
}

function startGame(){
  usedCards=[];
  S.usedSpecials=[];
  pendingConsequences=[];
  consecutiveDenies=0;
  swipeDragging=false;
  swipeProcessing=false;
  cardLocked=false;
  onSwipeAccept=null;
  onSwipeDeny=null;
  permanentGainMul=1;
  permanentCostMul=1;
  introDone=false;
  $("gameAvatar").innerHTML='<i class="'+S.look+'"></i>';
  show("game");
  initSwipe();
  render();
  showIntro();
}

$("registerBtn").onclick=()=>{
  const name=($("name").value||"").trim();
  const turma=($("turma").value||"").trim();
  const email=($("email").value||"").trim().toLowerCase();
  const theme=$("themeSelect").value;
  const err=$("regError");

  if(!name){err.textContent="Preenche o nome aí.";return}
  if(!turma){err.textContent="Qual tua turma do SENAC?";return}
  if(turma.includes("6767")||turma.includes("67")){err.textContent="Uma turma com tanta aura não existe.";return}
  if(/[a-zA-Z]/.test(turma)){err.textContent="Uma turma só pode ter números.";return}
  if(!email||!email.includes("@")){err.textContent="E-mail inválido, confere aí.";return}
  if(nameHasNumbersExcept67(name)){err.textContent="Nome não pode ter número! Só letras.";return}

  if(emailAlreadyPlayed(email)){
    err.textContent="Esse e-mail já jogou. Cada um só uma vez, mano.";
    return;
  }

  savePlayedEmail(email);
  err.textContent="";

  applyTheme(theme);

  const mode=detectAurudo(name);

  S={
    name:name,
    nickname:name.split(" ")[0],
    turma:turma,
    email:email,
    look:$("look").value,
    money:mode==="hardcore"?200:mode==="dificil"?400:800,lazer:mode==="hardcore"?20:mode==="dificil"?40:60,food:mode==="hardcore"?20:mode==="dificil"?40:60,inv:mode==="hardcore"?20:mode==="dificil"?30:40,day:1,
    debt:false,tiger:0,tigerCooldown:0,salaryDone:false,
    difficulty:mode==="hardcore"?3:mode==="dificil"?1.5:1,
    mode:mode
  };

  if(mode){
    showAurudoOverlay(name,mode,()=>startGame());
  }else{
    startGame();
  }
};

$("restart").onclick=()=>{
  document.body.classList.remove("theme-light","user-accent");
  show("start");
};

})();
