(()=>{
"use strict";
const $=id=>document.getElementById(id);
const clamp=(n)=>Math.max(0,Math.min(100,n));
const money=n=>"R$ "+Math.max(0,Math.round(n)).toLocaleString("pt-BR");
const tigrinho='<img src="tigrinho.jpg" alt="Tigrinho" class="tigrinho-img">';

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

const specialEvents=[
  {id:"golpe_pix",name:"Golpe do Pix",emoji:'<i class="fa-solid fa-credit-card"></i>',mandatory:2,
   msg:"Caiu um pix fantasma na sua conta. Agora tu ta devendo R$ 80 e as proximas 2 cartas sao obrigatorias.",
   desc:"Alguem transferiu um pix errado pra tua conta e agora quer o dinheiro de volta — com juros.",cost:80,penalty:{lazer:-20,food:-20,inv:-20},gainMul:0.7,costMul:1.4},
  {id:"emprestimo_fantasma",name:"Emprestimo Fantasma",emoji:'<i class="fa-solid fa-mobile-screen"></i>',mandatory:2,
   msg:"Um app pegou seus dados e fez um emprestimo no seu nome. Tu nao pediu mas vai pagar.",
   desc:"Notificacao: \"Emprestimo aprovado! R$ 100 na conta.\" Mas o app ja comecou a cobrar.",cost:100,penalty:{lazer:-25,food:-25,inv:-25},gainMul:0.75,costMul:1.35},
  {id:"promocao_fake",name:"Promocao Golpista",emoji:'<i class="fa-solid fa-tag"></i>',mandatory:1,
   msg:"50% OFF em tudo! Clicou e o app descontou R$ 50 de uma assinatura que tu nao assinou.",
   desc:"Oferta relampago que parecia boa demais. Era. Cobre assinatura fantasma.",cost:50,penalty:{lazer:-15,food:-15,inv:-15},gainMul:0.8,costMul:1.25},
  {id:"divida_familiar",name:"Pediu pra Mae",emoji:'<i class="fa-solid fa-user"></i>',mandatory:1,
   msg:"Sua mae emprestou R$ 40 mas disse que vai cobrar todo dia ate voltar. E ainda te xingou.",
   desc:"Divida familiar. Nao tem app que resolva. Paga ou perde o almoco de domingo.",cost:40,penalty:{lazer:-15,food:-15,inv:-15},gainMul:0.85,costMul:1.2},
  {id:"clonagem_cartao",name:"Clonaram teu Cartao",emoji:'<i class="fa-solid fa-credit-card"></i>',mandatory:2,
   msg:"Compra suspeita de R$ 150. Seu cartao foi clonado!",
   desc:"Notificacao do banco: \"Compra aprovada em Florianopolis.\" Tu ta no Senac.",cost:150,penalty:{lazer:-25,food:-20,inv:-20},gainMul:0.65,costMul:1.45},
  {id:"celular_roubado",name:"Celular Roubado",emoji:'<i class="fa-solid fa-mobile-screen"></i>',mandatory:2,
   msg:"Te arrancaram o celular na saida do Senac. Sem volta.",
   desc:"Tu tava tranquilo e do nada um cara pegou teu celular e saiu correndo. Policia nao vai fazer nada.",cost:120,penalty:{lazer:-25,food:-15,inv:-20},gainMul:0.7,costMul:1.4},
  {id:"material_escolar",name:"Material Escolar Emergencial",emoji:'<i class="fa-solid fa-book"></i>',mandatory:1,
   msg:"Caderno acabou, caneta estourou e o livro didatico precisa ser trocado.",
   desc:"Mes de provas e o material nao aguenta mais. Comprar tudo de uma vez pesa no bolso.",cost:60,penalty:{lazer:-10,food:-15,inv:-10},gainMul:0.85,costMul:1.3},
  {id:"aniversario_amigo",name:"Aniversario do Amigo",emoji:'<i class="fa-solid fa-cake-candles"></i>',mandatory:1,
   msg:"Teu melhor amigo ta fazendo aniversario. Presente, transporte e contribuicao pra festa.",
   desc:"Amizade e carissima. Mas tu nao pode faltar no aniversario do parça.",cost:55,penalty:{lazer:-15,food:-10,inv:-10},gainMul:0.85,costMul:1.25},
  {id:"vale_refeicao_estourado",name:"Vale Refeicao Estourado",emoji:'<i class="fa-solid fa-utensils"></i>',mandatory:1,
   msg:"Gastou todo o vale refeicao na segunda. Restante do mes sem comida decente.",
   desc:"Marmita de R$ 10 todo dia saindo do bolso. OVR nao cobre mais nada.",cost:50,penalty:{lazer:-10,food:-25,inv:-10},gainMul:0.85,costMul:1.25}
];
let activeSpecial=null;
let specialMandatoryLeft=0;

let usedCards=[];
const S_=(msg,e,g)=>({msg,e:{...(e||{})},gain:g||0});
const SC=(chance,good,bad)=>({chance,good,bad});
const cards=[
/* === ALIMENTAÇÃO === */
{t:"Almoço no restaurante",d:"Prato feito do dia na padaria do bairro. Comes bem, o bolso sofre um pouco.",c:18,e:{food:13,lazer:7,inv:-3},
  secret:SC(.30,S_("O garçom errou o pedido e te deu o prato maior. Win!",{food:5,lazer:3}),S_("Tinha um pelo na comida. Que nojo, véi.",{food:-4,lazer:-3}))},
{t:"Marmita de casa",d:"Mesma de sempre. Caseiro e barato, mas não é lá essas coisas.",c:5,e:{food:10,inv:5,lazer:-3},
  secret:SC(.25,S_("A marmita ficou tão boa que o colega pagou pra comer. Sério.",{food:2},10),null)},
{t:"Cozinhar pra semana",d:"Domingo na cozinha. Trabalho chato mas economiza horrores.",c:30,e:{food:27,inv:9,lazer:-9},
  secret:SC(.20,S_("Postou a receita e viralizou. Vendeu o segredo por R$ 15.",{inv:5},15),null)},
{t:"Fast-food com cupom",d:"App com desconto. Rápido e gostoso, mas tu sabe como é.",c:15,e:{food:7,lazer:7,inv:-3},
  secret:SC(.35,null,S_("Passou mal de madrugada. Perdeu o dia todo.",{food:-8,lazer:-6}))},
{t:"Lanche da tarde",d:"A fome bateu forte. Gasta agora ou segura até a noite?",c:8,e:{food:9,lazer:2,inv:-2},
  secret:SC(.20,null,S_("O lanche tava estragado. Noite no hospital.",{food:-6,lazer:-5,inv:-3}))},
{t:"Churrasco com a galera",d:"Cada um leva uma coisa. Convívio bom, comida melhor.",c:15,e:{lazer:18,food:12,inv:-5},
  secret:SC(.25,S_("Tu trouxe o melhor prato e todo mundo babou. Moral lá em cima.",{lazer:5,food:3}),null)},
{t:"Delivery preguiçoso",d:"Tava exausto, não dava pra cozinhar. Pedi pelo app.",c:25,e:{food:9,lazer:6,inv:-5},
  secret:SC(.30,null,S_("Atrasou 2 horas. Comida fria, noite perdida.",{lazer:-5,food:-4}))},
{t:"Padaria da esquina",d:"Pão com manteiga e café. Simples mas resolve.",c:6,e:{food:11,lazer:3,inv:-2},
  secret:SC(.15,S_("A dona te conheceu. Agora tu ganha desconto todo dia.",{food:3,inv:2}),null)},
{t:"Piquenique no parque",d:"Sanduíche na mão e papo bom. Não precisa de mais nada.",c:5,e:{lazer:14,food:6,inv:1},
  secret:SC(.20,S_("Achou um evento grátis no parque. Dia completo.",{lazer:5,inv:3}),null)},

/* === LAZER === */
{t:"Cinema com a turma",d:"Filme novo e pipoca. Caro mas tem vez que vale a pena.",c:25,e:{lazer:19,food:-4,inv:-5},
  secret:SC(.25,S_("O filme era sobre finanças. Até que aprendi algo.",{inv:6,lazer:3}),S_("O som estourou no meio do filme. Péssimo.",{lazer:-4}))},
{t:"Show ao vivo",d:"Banda que tu gosta. Entrada salgada mas a experiência é única.",c:40,e:{lazer:22,food:-4,inv:-7},
  secret:SC(.20,S_("Foi backstage e conheceu a banda. Dia de nunca esquecer.",{lazer:10}),S_("Choveu e tu pegou gripe na hora.",{food:-5,lazer:-8}))},
{t:"Lanchonete com os parça",d:"Rolê na lanchonete do bairro. Papo bom e combos baratos.",c:15,e:{lazer:16,food:3,inv:-5},
  secret:SC(.30,S_("Um amigo te ligou pra um freela bom. Contato é tudo.",{inv:8,lazer:3}),S_("Gastou demais e o papo não fluiu.",{lazer:-3,inv:-4}))},
{t:"Passeio de bike",d:"Rolê sem gastar nada. Ar livre e sensação de liberdade.",c:0,e:{lazer:12,food:-1,inv:4},
  secret:SC(.20,S_("Tu gravou o passeio e postou. Viralizou.",{lazer:5,inv:3}),S_("Estourou o pneu. Prejuízo.",{inv:-3,lazer:-2}))},
{t:"Banho de praia",d:"Dia de sol. Barato, longe e bom pra descomprimir.",c:5,e:{lazer:18,food:-3,inv:-2},
  secret:SC(.25,S_("Achou umas conchas raras e vendeu online.",{lazer:3,inv:2},20),S_("Queimou feio. Remédio caro.",{food:-4,lazer:-5,inv:-2}))},

/* === INVESTIMENTOS / EDUCAÇÃO === */
{t:"Curso online",d:"Aula pro currículo. Investe no futuro mas gasta agora.",c:20,e:{inv:17,lazer:-5,food:-3},
  secret:SC(.25,S_("O certificado te ajudou a pegar um freela.",{inv:5},30),null)},
{t:"Investimento arriscado",d:"Alguém promete retorno rápido. Pode ser golpe ou não.",c:35,e:{inv:24,lazer:-7,food:-6},
  secret:SC(.40,S_("Deu sorte! Rendeu o dobro.",{inv:10},50),S_("Perdeu tudo. Golpe clássico.",{inv:-15,lazer:-8,food:-5}))},
{t:"Comprar ações",d:"Ação promissora. Pode subir ou despencar.",c:25,e:{inv:18,lazer:-6,food:-4},
  secret:SC(.35,S_("Subiu 40%. Tu lucrou bem.",{inv:8},40),S_("Despencou. Prejuízo pesado.",{inv:-12,lazer:-5,food:-3}))},
{t:"Inscrição pra concurso",d:"Concurso bom. Investe agora, o retorno vem depois.",c:35,e:{inv:20,lazer:-12,food:-5},
  secret:SC(.15,S_("Tu passou! Renda garantida no futuro.",{inv:10,lazer:10,food:8},80),S_("Não foi dessa vez. Mas a experiência ajudou.",{inv:3,lazer:-3}))},
{t:"Aprender a investir",d:"Conta na corretora e estudo básico. Primeiro passo.",c:5,e:{inv:15,lazer:-6,food:-2},
  secret:SC(.30,S_("Primeiro investimento rendeu 15%. Vício bom.",{inv:5},15),null)},

/* === TRABALHO / RENDA === */
{t:"Hora extra no trampo",d:"Descansa menos, ganha mais. Troca tempo por grana.",c:0,e:{inv:10,lazer:-14,food:-7},gain:35,
  secret:SC(.30,S_("O chefe notou e te deu bonus.",{inv:3},25),S_("Exaustao total. Errou tudo no trabalho.",{lazer:-5,inv:-6}))},
{t:"Freela rapido",d:"Servico pontual. Rende bem mas tira teu tempo livre.",c:0,e:{lazer:-8,inv:6,food:-2},gain:50,
  secret:SC(.20,S_("Cliente curtiu. Ja te chamou pra proxima.",{inv:5},50),null)},
{t:"Bolo de pote",d:"Tu e a galera fizeram bolo de pote pra vender no Senac. Rendeu bem.",c:0,e:{inv:4,lazer:3,food:1},gain:30,
  secret:SC(.25,S_("Vendeu tudo em 1 hora. Virou empreendedor.",{inv:3,lazer:2}),S_("Nao vendeu nada. Sobrou bolo na sua casa.",{inv:-3,lazer:-2}))},
{t:"Mesada extra da vo",d:"Vó teve pena e soltou um dinheirinho extra. Amor de avó nao tem preco.",c:0,e:{inv:8,lazer:8,food:8},gain:60,
  secret:SC(.25,S_("Vo disse que tu e o neto favorito. Ganhou mais um pouco.",{inv:5,lazer:5},20),S_("Vo cobrou de volta no dia seguinte. Amor tem preco sim.",{inv:-5,lazer:-5}))},

/* === GASTOS FIXOS === */
{t:"Conta de luz",d:"Conta veio salgada. Banho longo custa caro.",c:35,e:{food:-4,lazer:-3,inv:-4},
  secret:SC(.20,S_("Aprendeu a economizar. Conta do mês que vem cai 40%.",{inv:5,food:3}),null)},
{t:"Recarga do celular",d:"Plano acabou. Sem internet não dá mas custa.",c:20,e:{food:-2,lazer:4,inv:7},
  secret:SC(.25,S_("Bônus de fidelidade. Crédito extra.",{inv:3},15),S_("Caiu um golpe no pix quando tu tava sem net.",{inv:-4,lazer:-3}))},

/* === ESCOLHAS === */
{t:"Aposta do dia",d:"Promessa de ganhar fácil. Pode lucrar ou queimar tudo.",c:15,e:{inv:15,lazer:-10,food:-5},gain:40,
  secret:SC(.45,S_("Deu certo. Tu saiu antes de perder.",{inv:5,lazer:5}),S_("Perdeu tudo e quis jogar mais. Vício é foda.",{inv:-15,lazer:-12,food:-8}))},
{t:"Empréstimo rápido",d:"App oferece crédito fácil. Dinheiro hoje, dívida amanhã.",c:0,e:{inv:-8,lazer:8,food:4},gain:60,
  secret:SC(.30,S_("Pagou tudo no mês. Sem juros, sem estresse.",{inv:8,lazer:3}),S_("Não pagou. Juros compostos devoraram teu salário.",{inv:-12,lazer:-8,food:-6}))},
{t:"Parcelar na feira",d:"O vendedor deixou parcelar. Pega agora, paga depois. Cilada ou estrategia?",c:20,e:{lazer:12,inv:-6,food:-2},
  secret:SC(.30,S_("Pagou tudo no prazo. Boa.",{inv:5}),S_("Perdeu o controle. Fatura explodiu.",{inv:-10,lazer:-5,food:-4}))},
{t:"Presente pra mãe",d:"Mãe merece. Amor não tem preço mas tem custo.",c:25,e:{lazer:8,food:-3,inv:-5},
  secret:SC(.20,S_("Mãe chorou de emoção. Não tem dinheiro que pague isso.",{lazer:10,food:5}),null)},
{t:"Conta no azul",d:"Saldo positivo. Motivação pra continuar.",c:0,e:{lazer:6,food:3,inv:5},
  secret:SC(.10,S_("Banco te liberou limite maior. Oportunidade.",{inv:5},0),null)},
{t:"Meta do mês",d:"Economia batida. Disciplina dá resultado.",c:0,e:{lazer:8,food:4,inv:8},
  secret:SC(.10,S_("Teu mentor ficou impressionado. Indicação de emprego.",{inv:10},60),null)},
{t:"Orçamento mensal",d:"Anotou tudo. Saber onde vai o dinheiro é poder.",c:0,e:{inv:10,lazer:-3,food:3},
  secret:SC(.15,S_("Descobriu um gasto escondido e cortou. Economia real.",{inv:5},20),null)},
{t:"Sair sem gastar",d:"Praça, papo e risada. Amizade não precisa de dinheiro.",c:0,e:{lazer:16,food:-1,inv:2},
  secret:SC(.15,S_("O rolê rendeu uma ideia de negócio. Inspiração.",{inv:8}),null)},
{t:"Abono Salarial",d:"Governo liberou. Dinheiro extra sem fazer nada.",c:0,e:{inv:4,lazer:5,food:5},gain:50,
  secret:SC(.15,S_("Abono caiu na conta. Dinheiro grátis!",{inv:3},30),S_("Gastou tudo em compra online. Arrependimento.",{lazer:-5,inv:-8}))},
{t:"Fim de semana produtivo",d:"Estudou, cozinhorganizou as contas. Dedicação.",c:0,e:{inv:12,lazer:-4,food:6},
  secret:SC(.15,S_("Teu planejamento rendeu bonus surpresa no trampo.",{inv:3,food:2},25),null)},
{t:"Namoradinha",d:"Saíste com alguém especial. Amor custa mas a alma agradece.",c:30,e:{lazer:20,food:2,inv:-9},
  secret:SC(.20,S_("A pessoa te presenteou de volta. Relação recíproca.",{lazer:5,inv:3},20),S_("Não deu certo. Dinheiro e emoção no lixo.",{lazer:-8,food:-3}))}
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
  if(S.debt)tags.push('<span class="effect neg"><i class="fa-solid fa-money-bill-wave"></i> Divida ativa</span>');
  if(S.tiger>0)tags.push('<span class="effect neg">'+tigrinho+' '+S.tiger+' cartas obrigatorias</span>');
  if(consecutiveDenies>=2)tags.push('<span class="effect neg"><i class="fa-solid fa-rotate"></i> '+consecutiveDenies+' negativas seguidas</span>');
  if(permanentGainMul<1)tags.push('<span class="effect neg"><i class="fa-solid fa-arrow-trend-down"></i> Ganhos -'+Math.round((1-permanentGainMul)*100)+'%</span>');
  if(permanentCostMul>1)tags.push('<span class="effect neg"><i class="fa-solid fa-arrow-trend-up"></i> Gastos +'+Math.round((permanentCostMul-1)*100)+'%</span>');
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
    (S.mode?'<p><span class="diff-badge '+S.mode+'">'+(S.mode==="hardcore"?'<i class="fa-solid fa-fire"></i> HARDCORE':'<i class="fa-solid fa-bolt"></i> DIFICIL')+'</span></p>':"")+
    '<div class="stats-summary">'+
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-gamepad"></i> '+Math.round(S.lazer)+'</span><span class="stat-label">Lazer</span></div>'+
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-utensils"></i> '+Math.round(S.food)+'</span><span class="stat-label">Alimentacao</span></div>'+
      '<div class="stat-item"><span class="stat-val"><i class="fa-solid fa-chart-line"></i> '+Math.round(S.inv)+'</span><span class="stat-label">Investimentos</span></div>'+
    '</div>'+
    "<p>"+(win?"Deu tudo certo. Equilibrou tudo durante 30 dias. Manda bem!":reason)+"</p>"+
    (!win&&S.mode==="hardcore"?'<p style="margin-top:12px;font-size:14px;color:#facc15;font-weight:700"><i class="fa-solid fa-fire"></i> Se voce perdeu no Hardcore, voce so tem SABOR aura <i class="fa-solid fa-fire"></i></p>':"")+
    (win?'<p style="margin-top:12px;font-size:13px;color:var(--ink-sec)"><i class="fa-solid fa-download"></i> Seus dados foram baixados em JSON.</p>':'')+
    '<div class="linkedin-cta">'+
    '<span class="cta-icon"><i class="fa-solid fa-handshake"></i></span>'+
    '<p class="cta-title">E ai, curtiu?</p>'+
    '<p class="cta-text">Me segue no LinkedIn e conta o que achou! Sua opinião me ajuda demais.</p>'+
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

function nextDay(){
  if(check())return;
  if(S.day>=30){
    const minStat=S.mode==="hardcore"?70:S.mode==="dificil"?55:50;
    if(S.lazer>minStat&&S.food>minStat&&S.inv>minStat) finish("win");
    else finish("Você chegou ao dia 30, mas precisa terminar com os três status acima de "+minStat+".");
    return;
  }
  S.day++;
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

  if(Math.random()<0.10&&S.tiger===0&&S.tigerCooldown===0&&!activeSpecial&&S.day>=4){
    render();
    showTiger();
    return;
  }

  if(Math.random()<0.08&&S.tiger===0&&S.tigerCooldown===0&&!activeSpecial&&S.day>=6){
    render();
    showRandomSpecial();
    return;
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
    '<h3><img src="tigrinho.jpg" alt="Tigrinho" class="tigrinho-img big"> A carta do Tigrinho</h3>'+
    '<p>Caiu uma notificacao no celular. "Ganhe dinheiro facil!" Sera?</p>'+
    '<div class="panel danger"><b><i class="fa-solid fa-triangle-exclamation"></i> Vasculha o bolso</b><p>Se aceitar, as proximas <b>3 cartas sao obrigatorias</b> — sem recusa. Da pra se recuperar depois, mas vai ser puxado.</p></div>'+
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

function makeCard(){
  let c;

  if(S.day===1&&!S.salaryDone){
    S.salaryDone=true;
    apply({food:3,inv:3},0,150);
    render();
    setTimeout(()=>{
      render();
      makeCard();
    },800);
    return;
  }else if(S.day===7){
    c={t:"Conta de luz",d:"A conta chegou. Nao pagar cria uma divida.",c:50,e:{food:-3,lazer:-4,inv:-4},fixed:true};
  }else if(S.day===15){
    c={t:"Ajuda em casa",d:"Contribuicao mensal pra ajudar em casa. Nao pagar cria conversa.",c:120,e:{food:-5,lazer:-7,inv:-7},fixed:true};
  }else if(S.day===22){
    c={t:"Recarga de transporte",d:"Bilhete unitario pro fim de semana. Sem isso nao vai pra lugar nenhum.",c:25,e:{food:-2,lazer:-3,inv:-3},fixed:true};
  }else{
    let available=cards.filter((_,i)=>!usedCards.includes(i));
    if(available.length===0){usedCards=[];available=cards.slice()}
    const idx=cards.indexOf(available[Math.floor(Math.random()*available.length)]);
    usedCards.push(idx);
    c=cards[idx];
  }

  if(S.tiger>0){
    const tigerCost=Math.round(Math.min(30,S.money)*(S.difficulty||1));
    c={t:tigrinho+" Oferta obrigatoria",d:"Voce esta na sequencia do Tigrinho. Esta carta nao pode ser negada.",c:tigerCost,e:{lazer:5,inv:-4,food:-3},forced:true};
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
    const n=k==="lazer"?'<i class="fa-solid fa-gamepad"></i> Lazer':k==="food"?'<i class="fa-solid fa-utensils"></i> Alimentacao':'<i class="fa-solid fa-chart-line"></i> Investimentos';
    let dv=v;
    if(isHC)dv=v>0?Math.round(v*0.6):v<0?Math.round(v*1.4):v;
    return '<span class="effect '+(dv>=0?"pos":"neg")+'">'+(dv>=0?"+":"")+dv+" "+n+"</span>";
  }).join("");

  $("card").innerHTML=
    (canAccept?'<div class="swipe-overlay accept"><i class="fa-solid fa-check"></i> ACEITAR</div>':'')+
    (canDeny?'<div class="swipe-overlay deny"><i class="fa-solid fa-xmark"></i> NEGAR</div>':'')+
    '<div class="card-content">'+
    '<span class="tag">DIA '+S.day+(c.fixed?" · EVENTO FIXO":c.forced?" · TIGRINHO":" · DECISÃO")+'</span>'+
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
        "Tu tá isolado demais. Nada de social, nada de lazer. A saúde mental cobra.",
        "Recusou tudo. A preguiça e o isolamento tão consumindo teus status.",
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
    '<h2>'+(isHardcore?"VOCÊ E O MAIS AURUDO DO SENAC!":name+", tu e AURUDO!")+'</h2>'+
    '<p>'+(isHardcore
      ?"O nome tem 6767. Isso e lendario. Modo <b>Hardcore</b> desbloqueado."
      :"O nome tem 67. Isso e rareza. Modo <b>Dificil</b> ativado.")+'</p>'+
    '<div class="aurudo-mode">'+(isHardcore?'<i class="fa-solid fa-fire"></i> MODO HARDCORE <i class="fa-solid fa-fire"></i>':'<i class="fa-solid fa-bolt"></i> MODO DIFICIL <i class="fa-solid fa-bolt"></i>')+'</div>'+
    '<p style="margin-top:14px;font-size:12px;color:var(--ink-sec)">'+(isHardcore
      ?"Custos x3, ganhos cortados, stats comecam em 20. Boa sorte."
      :"Custos x1.5, ganhos levemente reduzidos. Da pra virar.")+'</p>'+
    '<button class="btn primary full" style="margin-top:18px" id="aurudoContinue">Bora la</button>'+
    '</div>';
  document.body.appendChild(ol);
  ol.querySelector("#aurudoContinue").onclick=()=>{ol.remove();callback()};
}

function startGame(){
  usedCards=[];
  consecutiveDenies=0;
  swipeDragging=false;
  swipeProcessing=false;
  cardLocked=false;
  onSwipeAccept=null;
  onSwipeDeny=null;
  permanentGainMul=1;
  permanentCostMul=1;
  show("game");
  initSwipe();
  makeCard();
}

$("registerBtn").onclick=()=>{
  const name=($("name").value||"").trim();
  const turma=($("turma").value||"").trim();
  const email=($("email").value||"").trim().toLowerCase();
  const theme=$("themeSelect").value;
  const err=$("regError");

  if(!name){err.textContent="Preenche o nome ai.";return}
  if(!turma){err.textContent="Qual tua turma do SENAC?";return}
  if(!email||!email.includes("@")){err.textContent="Email invalido, confere ai.";return}
  if(nameHasNumbersExcept67(name)){err.textContent="Nome nao pode ter numero! So letras.";return}

  if(emailAlreadyPlayed(email)){
    err.textContent="Esse email ja jogou. Cada um so uma vez, mano.";
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
    money:mode==="hardcore"?150:300,lazer:mode==="hardcore"?20:60,food:mode==="hardcore"?20:60,inv:mode==="hardcore"?20:40,day:1,
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
