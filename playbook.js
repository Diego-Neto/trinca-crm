// ═══════════════════════════════════════════════════
// PLAYBOOK DE CADENCIA — 9 Etapas x 7 ICPs
// ═══════════════════════════════════════════════════

var PB_TAG_TO_ICP = {
  'PERFIL-EMPRESARIA':'empresario','PERFIL-LIBERAL':'liberal','PERFIL-INVESTIDOR':'investidor',
  'PERFIL-SERVIDOR':'servidor','PERFIL-ASSALARIADO':'assalariado','PERFIL-HERDEIRO':'herdeiro','PERFIL-JOVEM':'jovem',
  'PERFIL-DIVORCIADO':'divorciado','PERFIL-APOSENTADO':'aposentado'
};

var PB_ICPS = {
  empresario:{nome:'Empresario(a)',icon:'\uD83D\uDC54',
    dor:'Quer crescer sem pagar custo de banco. Caixa apertado. Emprestimos e cartao corroendo a margem. Quer patrimonio com o dinheiro que ja gasta — so no lugar certo.',
    gatilho:'capital de giro sem banco',
    onde:'FACIAP, CDL, ACICLA, grupos de networking empresarial',
    tip:'Fale em custo de capital e ROI. Nunca parcela.'},
  liberal:{nome:'Prof. Liberal',icon:'\u2695\uFE0F',
    dor:'Renda alta, patrimonio concentrado no consultorio/escritorio. Nao sabe como diversificar sem parar de atender. Quer imovel fisico fora da profissao.',
    gatilho:'patrimonio fora do consultorio',
    onde:'Grupos de medicos, dentistas, advogados, contadores, arquitetos',
    tip:'Renda variavel = medo de compromisso fixo. Mostre a flexibilidade.'},
  investidor:{nome:'Investidor',icon:'\uD83D\uDCCA',
    dor:'Tem CDB/Tesouro/acoes. Quer imovel fisico na carteira sem resgatar nada. Entende de rentabilidade — quer ver o numero comparado.',
    gatilho:'diversificacao em ativo fisico',
    onde:'Grupos de financas, investimentos, empreendedorismo',
    tip:'Fale de TIR, nao de parcela. Mostre como o consorcio bate a renda fixa em queda.'},
  servidor:{nome:'Servidor Publico',icon:'\uD83C\uDFDB\uFE0F',
    dor:'Estabilidade de renda garantida, mas patrimonio parado. Nunca conseguiu acumular. Quer sair do aluguel ou ter o segundo imovel.',
    gatilho:'renda estavel que nao gera patrimonio',
    onde:'Grupos de servidores, concurseiros, prefeituras, federais',
    tip:'Estabilidade = capacidade de planejamento longo. Use isso.'},
  assalariado:{nome:'Assalariado CLT',icon:'\uD83D\uDCBC',
    dor:'Paga aluguel todo mes — dinheiro que some. Quer o primeiro imovel mas nao tem entrada. Sente que nunca vai conseguir.',
    gatilho:'sair do aluguel sem entrada',
    onde:'Grupos de CLT, RH, financas pessoais',
    tip:'Use FGTS como ponte emocional — e dinheiro "parado" que pode trabalhar.'},
  herdeiro:{nome:'Herdeiro(a)',icon:'\uD83C\uDFE0',
    dor:'Recebeu montante (heranca, venda de imovel, rescisao). Nao quer errar a primeira grande decisao financeira. Medo de perder o que recebeu.',
    gatilho:'alavancar montante com seguranca',
    onde:'Indicacao direta, networking pessoal',
    tip:'Delicado. Seja o especialista que resolve o problema familiar — nao o vendedor.'},
  jovem:{nome:'Jovem Adulto',icon:'\uD83D\uDE80',
    dor:'22-32 anos. Quer comecar a construir patrimonio agora. Nao tem entrada grande. Sente que e "cedo demais" — mas e exatamente o momento certo.',
    gatilho:'comecar patrimonio sem entrada',
    onde:'Instagram, grupos de empreendedorismo jovem, faculdades',
    tip:'Sonho > produto. Conecte ao imovel dos sonhos, nao a parcela.'}
};

var PB_STAGES = [
  {id:'frio',nome:'Lead Frio',icon:'\uD83C\uDFAF',tag:'CADENCIA-ATIVA',
   desc:'Nunca respondeu. Ligacao primeiro — WPP e fallback. You are a sifter, not an alchemist. 3 tentativas de ligacao antes de mudar canal.',
   steps:['Liga de manha — ligacao primeiro (Aaron Ross).','Se nao atendeu: WPP em 15min — curiosity gap, nao pitch.','Objetivo unico: gerar resposta ou agendar diagnostico.','Nunca dois contatos no mesmo canal no mesmo dia.'],
   scripts:{
    empresario:'"Sabe quanto um empresario perde por ano pagando juros de banco pra girar o caixa? Em media R$48 mil. Pessoas como voce ja resolveram isso — eu sou o Diego, da Realize, e em 2 minutos te mostro como."',
    liberal:'"Se voce parar de atender 3 meses, qual e sua protecao patrimonial fora do consultorio? A maioria dos profissionais liberais que atendo nao tinha — ate resolver. Eu sou o Diego, da Realize. 15 minutos essa semana?"',
    investidor:'"Sua carteira tem papel, tem renda fixa — mas quanto do seu patrimonio sobrevive a uma crise imobiliaria? Investidores como voce ja adicionaram essa camada. Eu sou o Diego, da Realize. 2 minutos?"',
    servidor:'"Voce tem a renda mais estavel do pais — mas em 10 anos, qual e o patrimonio que sobra? Servidores como voce ja transformaram estabilidade em tijolo. Eu sou o Diego, da Realize. Dois minutinhos?"',
    assalariado:'"Quanto voce pagou de aluguel nos ultimos 12 meses? Esse dinheiro sumiu. Pessoas na sua situacao ja redirecionaram isso pra patrimonio proprio. Eu sou o Diego, da Realize. 2 minutos pra te mostrar como?"',
    herdeiro:'"Um montante parado perde pra inflacao todo mes — e a pior decisao e nao decidir. Pessoas como voce ja transformaram isso em renda de aluguel segura. Eu sou o Diego, da Realize. 15 minutos?"',
    jovem:'"Com 25 anos, cada mes que passa sem construir patrimonio custa caro la na frente. Jovens como voce ja comecaram — sem entrada grande. Eu sou o Diego, da Realize. 2 minutos?"'
   },
   cad:[
    {d:'D1 \u2600',l:'Ligacao manha — CURIOSIDADE',a:'Canal primario. Curiosity gap puro. CHAMP nos primeiros 90s se atendeu. Objetivo: gerar interesse. Taxa: 1:7 ICP / 1:10 geral.'},
    {d:'D1 \uD83C\uDF19',l:'WPP tarde — CURIOSIDADE',a:'Fallback se nao atendeu. "Tentei te ligar — [curiosity gap com dor do ICP]. Quinta ou sexta ficam bom?" Sem mencionar produto.'},
    {d:'D2',l:'WPP — DOR',a:'Ancora na dor especifica do ICP. "Voce sabia que [dado real sobre a dor]?" Uma pergunta que incomoda. Sem mencionar D1.'},
    {d:'D4',l:'Ligacao — CUSTO DA INACAO',a:'Angulo: quanto custa nao agir. "Cada mes que passa, [custo concreto da inacao pro ICP]." Se nao atendeu: sem WPP hoje. Registra no CRM.'},
    {d:'D7',l:'Instagram — PROVA SOCIAL',a:'Curte > comenta algo genuino > DM com case: "Vi seu post. Atendi alguem na sua situacao que [resultado concreto]. Quando tiver 15min?"'},
    {d:'D9',l:'WPP — URGENCIA',a:'Gatilho de escassez real: "Grupo novo abrindo / condicao especial ate [data]. Lembrei de voce." So se verdadeiro.'},
    {d:'D11',l:'Ligacao — URGENCIA FINAL',a:'Tom completamente diferente. Muda o gatilho. Ultima tentativa ativa. "Antes de encerrar seu contato, queria te dar uma ultima oportunidade."'},
    {d:'D12',l:'WPP — BREAK-UP',a:'"[Nome], nao quero insistir. Se um dia esse cenario mudar, to aqui. Tudo de bom pra voce." > GELADEIRA D30+. Tom respeitoso, porta aberta.'}
   ],
   objs:[
    {q:'"Nao tenho interesse"',s:'Nao sabe o que voce faz — rejeita a imagem, nao o produto.',d:'Curiosity gap + porta aberta. Nunca defende.\n"Faz sentido — a maioria pensa que consorcio e compra parcelada. O que faco e diferente: alavancagem patrimonial sem juros. Se um dia esse contexto mudar, to aqui."'},
    {q:'"Agora nao e bom momento"',s:'Agenda ou prioridade? Separa antes de responder.',d:'"E mais a agenda cheia ou esse assunto nao esta no radar agora? Pergunto porque a resposta muda o que posso fazer."\nSe prioridade: "Se voce seguir do jeito que esta por 12 meses — o que voce sente que pode travar?"'},
    {q:'"Me manda material"',s:'Fuga — nao quer parar a conversa agora.',d:'"Seria generico demais. O que faco depende do cenario de cada pessoa. 15 minutos. Quinta ou sexta?"'},
    {q:'"Consorcio demora muito pra contemplar"',s:'Confunde consorcio de compra com estrategia patrimonial.',d:'"A maioria pensa isso — porque pensa em consorcio antigo. Aqui a logica e diferente: lance estrategico + FGTS + fundo de reserva. Pessoas que atendo foram contempladas em 3-8 meses. 15 minutos pra te mostrar como funciona?"'},
    {q:'"E se eu perder o emprego?"',s:'Medo de compromisso longo sem protecao.',d:'"Pergunta justa — e a primeira que todo mundo faz. O consorcio tem seguro e fundo de reserva. E se voce compara: aluguel voce paga do mesmo jeito e nao sobra nada. Aqui pelo menos constroi patrimonio. Posso te mostrar a protecao em 5 minutos."'},
    {q:'"Ja tive experiencia ruim com consorcio"',s:'Trauma de modelo antigo ou administradora ruim.',d:'"Entendo — muita gente passou por isso com administradoras pequenas ou sem estrategia de lance. O que faco e completamente diferente: planejamento patrimonial com as maiores administradoras do pais. Me conta o que aconteceu — te mostro como evitamos isso."'}
   ],
   crm:'DOR: desconhecida\nSTATUS: D[X] \u00B7 [canal] \u00B7 sem resposta\nPROXIMO: [canal] \u00B7 D[X+1] \u00B7 [horario]',
   lo:'2 WPPs frios personalizados. Sem ligar. Alimenta pipeline.',
   hi:'4 ligacoes + WPP fallback + Instagram D7. Cadencia completa.'},

  {id:'sinalizou',nome:'Sinalizou',icon:'\uD83D\uDCAC',tag:'RESPONDEU',
   desc:'Respondeu em qualquer canal. Cadencia encerrada. Modo conversa — responde ao que ela/ele trouxe. People buy on emotion and justify with logic.',
   steps:['Para a cadencia imediatamente.','Responde ao que ela/ele trouxe — nunca ignora o contexto.','Objetivo: CHAMP + diagnostico agendado na mesma conversa.','CTA sempre com duas opcoes. Nunca pergunta aberta.'],
   scripts:{
    empresario:'"Que bom que respondeu! Pra eu entender o seu momento: a empresa esta em crescimento, consolidando o que tem, ou reorganizando o caixa? Pergunto porque o que faco funciona diferente pra cada cenario."',
    liberal:'"Otimo! Voce ja tem algum imovel de investimento alem do consultorio/escritorio, ou esta construindo o primeiro patrimonio fisico fora da sua area?"',
    investidor:'"Boa! Voce ja tem ativos financeiros — o que falta na sua carteira que papel nao consegue entregar?"',
    servidor:'"Que bom! Voce esta pensando em sair do aluguel, ou ja tem imovel e quer o proximo passo no patrimonio?"',
    assalariado:'"Oi! Voce esta pagando aluguel hoje? Quanto voce pagou nos ultimos 12 meses — e onde esta esse dinheiro agora?"',
    herdeiro:'"Otimo que respondeu! O montante que voce tem — esta alocado em alguma coisa agora ou esta em conta parada esperando uma decisao?"',
    jovem:'"Que bom! Me fala: qual e sua renda mensal hoje e em quanto tempo voce quer ter o primeiro patrimonio fisico?"'
   },
   cad:[
    {d:'Resp.',l:'Resposta imediata',a:'Responde ao que ele/ela trouxe + pergunta CHAMP na mesma mensagem. Maximo 5min de delay.'},
    {d:'+24h',l:'Ancora na dor',a:'Retoma a dor que revelou com angulo novo. "Voce mencionou [X] — isso ainda esta pesando?" Nunca "oi tudo bem".'},
    {d:'+48h',l:'Alterna canal — Ligacao',a:'Liga. Tom: verificando, nao cobrando. "So confirmando se recebeu — queria entender melhor o que voce falou sobre [dor]."'},
    {d:'+72h',l:'Prova social',a:'WPP com case real. "Atendi alguem na sua situacao que [resultado]. Quando posso te mostrar como funciona?"'},
    {d:'+96h',l:'Custo da inacao',a:'"Voce mencionou [dor]. Cada mes que passa sem resolver, [custo concreto]. So quero que voce tenha essa clareza."'},
    {d:'+120h',l:'CTA final ou Geladeira',a:'"[Nome], ultima mensagem sobre isso. Se fizer sentido, me avisa. Se nao — sem problema nenhum, to aqui quando o momento mudar." Se nao responder > GELADEIRA.'}
   ],
   objs:[
    {q:'"Vou pensar"',s:'Objecao escondida — nao verbalizou o que trava.',d:'"A ideia em si faz sentido pra voce?" Se sim: "O que falta pra ir em frente?" A resposta aponta o Ten (Certeza) fraco.'},
    {q:'Parou de responder',s:'Perdeu urgencia — ancora na dor revelada.',d:'"Voce mencionou [X] — ainda e prioridade pra voce?" Uma frase. Sem cobrar. Sem "oi sumiu".'},
    {q:'"Manda mais informacao"',s:'Fuga de decisao — nao se sente segura/o ainda.',d:'"Posso mandar — mas seria generico. O que realmente ajuda e ver os numeros do seu cenario. 20 minutos. Quinta ou sexta?"'}
   ],
   crm:'DOR: [o que revelou]\nSTATUS: [canal] [data] \u00B7 dor: [X]\nPROXIMO: agendar diagnostico \u00B7 CTA duas opcoes',
   lo:'Manda a pergunta de qualificacao. Uma frase. Sem ligar.',
   hi:'CHAMP completo + fecha diagnostico na mesma conversa.'},

  {id:'parou',nome:'Respondeu & Parou',icon:'\u23F8',tag:'RESPONDEU-PARADO',
   desc:'Respondeu antes, revelou algo real, sumiu. Voce tem municao — usa. Ancora na dor que ela/ele revelou. Nunca volta a cadencia fria.',
   steps:['Ancora na ultima dor que ela/ele verbalizou — nao no protocolo.','Formula: [dor revelada] + [contexto externo novo] + [CTA direto].','48h silencio > alterna canal.','Sem resposta > Geladeira D30+.'],
   scripts:{
    empresario:'"[Nome], voce mencionou [dor/contexto]. Com a Selic onde esta, o custo do capital so aumentou. 15 minutos essa semana pra te mostrar como outros empresarios resolveram isso sem banco. Quinta ou sexta?"',
    liberal:'"Dr(a). [Nome], voce falou em patrimonio fora do consultorio. Abriu um grupo com condicoes que encaixam exatamente nesse perfil. Quando posso te mostrar em 15 minutos?"',
    investidor:'"[Nome], voce mencionou diversificar. Com renda fixa onde esta, imovel via consorcio voltou a ser a opcao mais eficiente. 15 minutos essa semana?"',
    servidor:'"[Nome], voce falou em sair do aluguel. Com o INCC subindo, esperar ficou mais caro mes a mes. Quinta ou sexta, 15 minutos?"',
    assalariado:'"[Nome], voce mencionou o aluguel. Em 12 meses voce paga R$ X que some. Tenho uma opcao que redireciona isso pra patrimonio. 15 minutos?"',
    herdeiro:'"[Nome], o montante parado perde pra inflacao todo mes que passa. Tenho uma estrutura que resolve isso com seguranca. Quando posso te mostrar?"',
    jovem:'"[Nome], voce mencionou que quer comecar logo. Abriu um grupo novo com entrada que cabe no seu orcamento agora. Quinta ou sexta?"'
   },
   cad:[
    {d:'P1',l:'Ancora na dor',a:'[Dor revelada] + contexto novo + CTA duas opcoes. Uma mensagem so.'},
    {d:'+48h',l:'Alterna canal',a:'Ligacao. Tom: verificando. "So confirmando se recebeu minha mensagem."'},
    {d:'+96h',l:'Geladeira',a:'Tag GELADEIRA. Reativa D30+ com gancho externo — nunca menciona o passado.'}
   ],
   objs:[
    {q:'Silencio depois de ter respondido',s:'Perdeu urgencia ou surgiu obstaculo.',d:'"Voce mencionou [X] — ainda e prioridade?" Ancora sempre. Nunca "oi tudo bem?".'},
    {q:'"To muito ocupada/o"',s:'Voce nao e urgente o suficiente ainda.',d:'"Entendo. Quando seria o momento — semana que vem ou no mes que vem?" Define data. Volta com agenda.'},
    {q:'"Vou te chamar quando estiver pronta/o"',s:'Educacao — nao vai chamar.',d:'"Pra nao perder o timing — posso te dar um toque em [data]? Sem compromisso nenhum."'}
   ],
   crm:'DOR: [o que revelou antes de parar]\nSTATUS: parou apos [data] \u00B7 dor: [X]\nPROXIMO: ancora + contexto \u00B7 [canal] \u00B7 [data]',
   lo:'WPP ancora na dor. Uma frase. Sem ligar.',
   hi:'WPP ancora + ligacao fallback 48h + CRM atualizado.'},

  {id:'agendado',nome:'Diagnostico Agendado',icon:'\uD83D\uDCC5',tag:'DIAGNOSTICO-AG',
   desc:'Reuniao marcada. Dois trabalhos: garantir presenca e chegar com a dor mapeada. Show rate medio do mercado: 70%. Voce protege esse numero.',
   steps:['Confirma em ate 5min apos agendar — cria compromisso real.','Lembrete 24h antes (17h-19h) com o valor da reuniao, nao so horario.','Lembrete da manha: curto, link, nada mais.','Prepara abertura SPIN baseada no CHAMP que voce ja coletou.'],
   scripts:{
    empresario:'"[Nome], confirmado: [dia], [hora]. Vai ser pratico — olho o cenario da empresa e te mostro como outros empresarios na mesma situacao resolveram isso. Qualquer imprevisto, me avisa aqui."',
    liberal:'"Dr(a). [Nome], confirmado. Vou preparar uma analise especifica pro seu perfil de renda e patrimonio. Qualquer imprevisto me avisa."',
    investidor:'"[Nome], confirmado. Trago os numeros comparando consorcio vs sua alocacao atual em renda fixa. Qualquer imprevisto me avisa."',
    servidor:'"[Nome], confirmado: [dia], [hora]. Trago a simulacao personalizada pro seu perfil de renda estavel. Ate la!"',
    assalariado:'"[Nome], confirmado. Trago a comparacao: continuar pagando aluguel vs construir patrimonio. Os numeros vao falar por si. Ate [dia]!"',
    herdeiro:'"[Nome], confirmado. Vou mostrar como estruturar o montante de forma segura com projecao de 5 e 10 anos. Qualquer imprevisto me avisa."',
    jovem:'"[Nome], confirmado! Vou mostrar os numeros de quem comecou na sua idade — os resultados em 10 anos sao impossiveis de ignorar. Ate [dia]!"'
   },
   cad:[
    {d:'D0 -5min',l:'Confirmacao imediata',a:'"[Dia], [hora]. Se surgir imprevisto, so me avisa aqui. Ate la!" — em ate 5min apos agendar.'},
    {d:'D-1 noite',l:'Lembrete 17h-19h',a:'Valor da reuniao, nao so horario. "Vai ser pratico — olho seu cenario e mostro como outros resolveram."'},
    {d:'Manha',l:'Lembrete do dia',a:'"E hoje. [Hora]. Link: [link]." Curto. So isso.'}
   ],
   objs:[
    {q:'Cancela vespera (1o)',s:'Primeiro cancelamento — sem drama.',d:'"Sem problemas! Essa semana ainda ou na semana que vem?" Duas opcoes. Sem ressentimento.'},
    {q:'Cancela 2a vez',s:'Objecao de prioridade — nomeia diretamente.',d:'"Segunda vez que nao conseguimos. Sendo direto: o que esta travando esses 20 minutos?"'},
    {q:'Nao confirma o lembrete',s:'Risco de no-show — age antes.',d:'Liga 1h antes: "So confirmando nossa conversa de hoje as [hora]. Tudo certo?"'}
   ],
   crm:'DOR: [dor CHAMP que motivou o agendamento]\nSTATUS: agendado [dia] [hora] \u00B7 confirmou: sim/nao\nPROXIMO: lembrete D-1 \u00B7 preparar abertura SPIN',
   lo:'Manda so o lembrete de confirmacao. Nada mais.',
   hi:'Confirma + prepara abertura SPIN completa com dor mapeada.'},

  {id:'diagnostico',nome:'Em Diagnostico',icon:'\uD83D\uDD0D',tag:'REUNIAO-ATIVA',
   desc:'Modo Closer ativo. SPIN + Trinca da Certeza. Voce nao vende produto — revela a dor dela/dele pra ela/ele mesma/o. Ela/ele fala 70% do tempo.',
   steps:['Abre com a dor que revelou no CHAMP — nunca com pitch.','SPIN: Situacao > Problema > Implicacao > Necessidade.','Ela/ele fala 70% do tempo. Voce pergunta — nao despeja.','So apresenta quando ela/ele articulou a propria dor.'],
   scripts:{
    empresario:'"[Nome], voce mencionou [dor]. Como isso esta afetando o caixa da empresa na pratica hoje? Me conta mais."',
    liberal:'"O que acontece com sua renda se voce parar de atender por 3 meses? Tem alguma protecao patrimonial fora da sua area profissional?"',
    investidor:'"Voce tem [ativos]. Se o cenario de juros mudar, quanto do seu patrimonio esta protegido em ativo fisico neste momento?"',
    servidor:'"Voce tem estabilidade de renda garantida. Em 10 anos, qual e o seu patrimonio se voce seguir exatamente do jeito que esta hoje?"',
    assalariado:'"Quanto voce pagou de aluguel nos ultimos 12 meses? Consegue me dizer agora onde esta esse dinheiro?"',
    herdeiro:'"O montante que voce recebeu — qual seria a pior coisa que poderia acontecer com ele nos proximos 3 anos se ficar parado?"',
    jovem:'"Daqui a 10 anos voce tem entre 32 e 42 anos. Se continuar do jeito que esta, qual e seu patrimonio nessa data?"'
   },
   cad:[
    {d:'0-10min',l:'Situacao',a:'Confirma e aprofunda o CHAMP. Sem pitch ainda.'},
    {d:'10-25min',l:'Problema + Implicacao',a:'Planta a dor com perguntas. Ela/ele articula — voce nao fala por ela/ele.'},
    {d:'25-40min',l:'Necessidade + Solucao',a:'So agora apresenta. Usa as palavras dela/dele — nao seu script.'},
    {d:'40-60min',l:'Fechamento',a:'Three Tens (Tres Certezas) check + CTA ou proposta na hora.'}
   ],
   objs:[
    {q:'"Quanto custa / qual a parcela?"',s:'Pulou pro preco antes de entender o valor.',d:'"Boa pergunta — depende do credito e prazo. Deixa eu entender o seu cenario antes de simular o numero certo." [Volta pro SPIN]'},
    {q:'"Ja conheco consorcio"',s:'Conhece o produto antigo — nao a estrategia.',d:'"O que voce sabia sobre usar consorcio como ferramenta de investimento patrimonial — nao de compra parcelada?"'},
    {q:'"Preciso ver os numeros"',s:'Quer proposta antes do diagnostico completo.',d:'"Posso simular agora. Pra te dar o numero certo, preciso de: qual credito voce imagina e em qual prazo."'}
   ],
   crm:'DOR: [dor verbalizada por ela/ele no diagnostico]\nSTATUS: diagnostico [data] \u00B7 SPIN: completo/parcial\nPROXIMO: proposta [data] OU fechar na hora',
   lo:'NAO faz diagnostico. Uma ligacao ruim no estado baixo destroi mais do que nao ligar.',
   hi:'SPIN completo + Three Tens check + tenta fechar na reuniao.'},

  {id:'proposta',nome:'Proposta Enviada',icon:'\uD83D\uDCCB',tag:'PROPOSTA-ENVIADA',
   desc:'Simulacao foi. Seu trabalho agora: descobrir onde travou — nao cobrar resposta. Never ask "what did you think?" — ask what\'s missing.',
   steps:['Nao pergunta "o que achou?". Pergunta o que falta pra avancar.','48h silencio > ancora na dor do diagnostico, nao na proposta.','96h > alterna canal.','Identifica o Ten fraco antes de qualquer contorno.'],
   scripts:{
    empresario:'"[Nome], voce teve tempo de olhar a simulacao. Uma pergunta direta: o que ficou faltando pra voce se sentir segura/o pra avancar?"',
    liberal:'"Dr(a). [Nome], analisou os numeros. O que ficou em aberto pra voce?"',
    investidor:'"[Nome], comparou com sua carteira atual. O que ainda nao fechou pra voce tomar a decisao?"',
    servidor:'"[Nome], olhou os numeros. O que ficou faltando pra isso fazer sentido completo?"',
    assalariado:'"[Nome], viu a simulacao. O que esta pesando mais: o valor da parcela, o prazo, ou outra coisa?"',
    herdeiro:'"[Nome], viu como o montante trabalha na simulacao. O que ainda te segura?"',
    jovem:'"[Nome], viu os numeros em 10 anos. O que ainda nao convenceu completamente?"'
   },
   cad:[
    {d:'+24h',l:'Check-in de valor',a:'"Conseguiu olhar a simulacao? Fico a disposicao pra qualquer duvida."'},
    {d:'+48h',l:'Pergunta o obstaculo',a:'"O que ficou faltando pra voce se sentir segura/o pra avancar?" Direto. Sem cobrar.'},
    {d:'+72h',l:'Ligacao',a:'Alterna canal. Tom diagnostico: "Quero entender o que ainda esta em aberto."'},
    {d:'+120h',l:'Urgencia real',a:'So se verdadeira: "O grupo fecha semana que vem. Quero garantir sua vaga se fizer sentido."'}
   ],
   objs:[
    {q:'"Parcela ficou alta"',s:'Ten #3 — medo de nao sustentar o compromisso.',d:'"Quanto voce paga de aluguel ou juros hoje por mes? Se a parcela for menor — voce nao gasta mais, redireciona." Se alta: simula carta menor.'},
    {q:'"Preciso falar com marido/socia/o/contador"',s:'Influenciador invisivel entrou no jogo.',d:'"Posso te mandar um resumo de 3 pontos pra facilitar essa conversa? > Envia. > Quando voces conversarem, qual seria o melhor momento pra uma call rapida com os dois?"'},
    {q:'"Vou pensar mais um pouco"',s:'Ultima barreira ou objecao oculta.',d:'"De 0 a 10, onde voce esta pra avancar nisso?" Se 7+: "O que falta pra ir de [X] pra 10?"'}
   ],
   crm:'DOR: [dor do diagnostico]\nSTATUS: proposta [data] \u00B7 R$[credito] \u00B7 parcela R$[X]\nPROXIMO: follow-up obstaculo [data+48h]',
   lo:'Manda o check-in de valor. Uma mensagem.',
   hi:'Check-in + obstaculo + prepara contorno do Ten fraco.'},

  {id:'negociacao',nome:'Negociacao',icon:'\uD83D\uDD25',tag:'NEGOCIACAO',
   desc:'Objecionando = considerando. Quem nao quer comprar some — nao objeta. Identifica o Ten (Certeza) fraco e reconstroi. Maximo 3 loops.',
   steps:['Todo "nao" aponta um Ten fraco: produto (#1), voce (#2) ou ela/ele mesma/o (#3).','Diagnostico: "Se o [obstaculo] nao fosse questao — voce avancaria?"','Loop maximo 3x. Depois: Thresholds (Limiares).','Act as if — sua certeza absoluta e contagiante.'],
   scripts:{
    empresario:'"Sobre a estrategia em si — faz sentido pra voce? Voce gosta da ideia?" Se sim: "O que esta impedindo voce de avancar hoje?"',
    liberal:'"Ter patrimonio fisico fora do consultorio faz sentido pra voce?" Se sim: "O que ainda esta em aberto que nao fechou?"',
    investidor:'"Adicionar imovel fisico a carteira sem resgatar renda fixa — faz sentido?" Se sim: "O que falta pra voce fechar isso?"',
    servidor:'"Usar sua estabilidade de renda pra construir patrimonio agora — faz sentido pra voce?" Se sim: "O que ainda te segura?"',
    assalariado:'"Parar de pagar aluguel e comecar a construir — faz sentido pra voce?" Se sim: "O que falta pra isso acontecer?"',
    herdeiro:'"Alavancar o montante de forma estruturada e segura — faz sentido?" Se sim: "O que ainda te preocupa?"',
    jovem:'"Comecar a construir patrimonio agora enquanto o tempo trabalha pra voce — faz sentido?" Se sim: "O que falta pra dar esse passo?"'
   },
   cad:[
    {d:'Loop 1',l:'Isola a objecao',a:'"A ideia faz sentido? Voce gosta?" — separa produto de acao (Ten #1 vs acao).'},
    {d:'Loop 2',l:'Money Aside',a:'"Se [obstaculo] nao fosse questao — voce avancaria?" — identifica o Ten exato.'},
    {d:'Loop 3',l:'Utter Sincerity',a:'"Voce me disse que faz sentido. O que estou sentindo e que tem algo que ainda nao veio a tona. Posso perguntar o que e?"'},
    {d:'Thresh.',l:'Threshold',a:'"De 0 a 10 — onde voce esta? O que falta pra 10?"'}
   ],
   objs:[
    {q:'"Parcela alta"',s:'Ten #3 — medo de nao sustentar.',d:'Simula carta menor. "Posso simular um credito que caiba no seu caixa sem apertar. Me fala: qual valor te deixaria confortavel?"'},
    {q:'"Preciso de mais tempo"',s:'Custo da inacao nao ficou claro.',d:'"Enquanto espera — aluguel/juros/custo de banco continua. Esperar 12 meses tem um numero real. Posso te mostrar quanto custa essa espera?"'},
    {q:'"Vou pesquisar outras opcoes"',s:'Ten #2 fraco ou comparacao sem criterio.',d:'"Otimo. Me conta: o que voce vai pesquisar — qual a principal variavel pra voce? Dependendo do criterio, posso te mostrar a comparacao agora."'}
   ],
   crm:'DOR: [confirmada no diagnostico]\nSTATUS: objecao [qual] \u00B7 Ten [#1/#2/#3]\nPROXIMO: loop [1/2/3] \u00B7 [canal] \u00B7 [data]',
   lo:'NAO negocia no estado baixo. Follow-up leve. Uma frase.',
   hi:'Loop completo + Threshold + fecha se estado 9+.'},

  {id:'fechamento',nome:'Fechamento',icon:'\u2705',tag:'FECHADO',
   desc:'Ela/ele disse sim. A venda nao acabou — comeca a blindagem contra buyer\'s remorse (arrependimento do comprador). As 48h seguintes determinam cliente ou cancelamento.',
   steps:['Celebra com ela/ele — a conquista e dela/dele.','Nomeia o remorse antes de aparecer: "E normal uma voz questionar..."','Mensagem de boas-vindas ate 2h apos assinar.','Reforco D+1 ancorando na conquista — nao no produto.'],
   scripts:{
    empresario:'"[Nome], a partir de agora voce esta construindo patrimonio com o caixa da empresa trabalhando pra voce, nao contra. Me avisa qualquer duvida que surgir — to aqui."',
    liberal:'"Dr(a). [Nome], hoje voce separou patrimonio pessoal do consultorio. Decisao que a maioria deixa pra depois — voce fez agora. Parabens."',
    investidor:'"[Nome], carteira completa: papel + tijolo. Voce tem a camada fisica que faltava, sem resgatar nada. Estrategia certa."',
    servidor:'"[Nome], voce transformou estabilidade de renda em patrimonio concreto. Em [prazo], esse investimento vai estar la."',
    assalariado:'"[Nome], voce parou de construir o patrimonio do dono e comecou a construir o seu. Essa e a virada real."',
    herdeiro:'"[Nome], voce alavancou o montante de forma estruturada e segura. Missao cumprida — com inteligencia."',
    jovem:'"[Nome], voce comecou cedo. Isso e o maior diferencial que existe em patrimonio. Em 10 anos voce vai olhar pra tras e agradecer essa decisao de hoje."'
   },
   cad:[
    {d:'+2h',l:'Boas-vindas + blindagem',a:'Celebra + nomeia: "E normal uma voz questionar — quando aparecer, me chama antes de qualquer coisa."'},
    {d:'+24h',l:'Reforco D+1',a:'"O que voce fez ontem vai fazer diferenca em [prazo]. Qualquer duvida — fala comigo antes de pesquisar em qualquer outro lugar."'},
    {d:'+7d',l:'Check-in semana 1',a:'"Tudo certo com a documentacao? Alguma duvida surgiu?" — monitora sinais de remorse.'}
   ],
   objs:[
    {q:'"Estou pensando em cancelar"',s:'Buyer\'s remorse. Influenciador ou duvida oculta.',d:'[I Feel Your Pain] "Fico feliz que me falou antes de qualquer coisa. O que mudou desde [dia]?" — descobre o gatilho antes de defender.'},
    {q:'"Meu/minha [familiar/socio] nao gostou"',s:'Influenciador apareceu pos-fechamento.',d:'"Completamente justo. Posso fazer uma call rapida com voces dois essa semana? Quero que todo mundo esteja confortavel com a decisao."'},
    {q:'Duvida sobre contemplacao',s:'Ten #1 ressurgindo pos-assinatura.',d:'Reeduca com os numeros do diagnostico. "E voce tem [prazo] de protecao via fundo de reserva — esta coberta/o."'}
   ],
   crm:'DOR: [dor que motivou o fechamento]\nSTATUS: FECHADO [data] \u00B7 R$[credito] \u00B7 parcela R$[X]\nPROXIMO: boas-vindas +2h \u00B7 reforco D+1',
   lo:'Manda boas-vindas mesmo no estado baixo. Obrigatorio.',
   hi:'Boas-vindas + D+1 reforco + agenda check-in semana 1.'},

  {id:'nutricao',nome:'Nutricao',icon:'\uD83C\uDF31',tag:'NUTRICAO',
   desc:'Lead nao esta pronto agora mas tem potencial real. Nao e frio — ja revelou dor. O timing nao e seu, e dele. Conteudo educativo + presenca passiva ate o momento certo.',
   steps:['Registre a data de retorno estimada pelo lead','Envie conteudo educativo quinzenal (artigo, case, video)','Monitore interacao — se abriu/respondeu, pode estar pronto','Nunca pressione. Presenca > insistencia.'],
   scripts:{
    empresario:'"[Nome], vi essa analise sobre custo de capital pra empresarios em 2026 — lembrei do que voce mencionou. Quando fizer sentido conversar, to aqui."',
    liberal:'"Dr(a). [Nome], esse caso de um [profissao] que estruturou patrimonio fora do consultorio pode te interessar. Sem pressa — quando for o momento."',
    investidor:'"[Nome], a Selic mudou de novo. Pra quem tem carteira em renda fixa, o calculo muda. Tenho os numeros atualizados quando quiser ver."',
    servidor:'"[Nome], saiu um dado novo sobre patrimonio de servidores vs setor privado. Interessante pra quem ta planejando. Te mando?"',
    assalariado:'"[Nome], esse conteudo sobre como sair do aluguel sem entrada grande teve muita procura. Lembrei de voce — vale dar uma olhada."',
    herdeiro:'"[Nome], esse material sobre planejamento patrimonial pos-heranca pode ajudar na sua decisao. Sem pressa."',
    jovem:'"[Nome], esse case de quem comecou com 25 anos e onde esta hoje com 35 e inspirador. Quando quiser conversar, to aqui."'
   },
   cad:[
    {d:'D15',l:'Conteudo educativo',a:'Artigo, case ou video relevante pro ICP. Tom: "lembrei de voce". Sem CTA de venda.'},
    {d:'D30',l:'Prova social',a:'Case de sucesso do mesmo perfil. "Fulano na sua situacao fez X". Naturalidade.'},
    {d:'D45',l:'Check-in leve',a:'"O cenario mudou de la pra ca? Quando fizer sentido, a porta ta aberta."'},
    {d:'D60',l:'Gancho externo',a:'Noticia do mercado, mudanca de Selic, produto novo. Ponte pra reabrir conversa.'}
   ],
   cadPosAguardando:[
    {d:'R-7',l:'Aquecimento pre-retorno',a:'"[Nome], semana que vem chega a data que voce mencionou. Vi um caso parecido com o seu que pode te interessar — te mando?" Tom leve, conteudo relevante.'},
    {d:'R-3',l:'Ancora na dor + dado novo',a:'"Lembra que voce falou sobre [dor]? Desde nossa conversa, [dado novo do mercado/Selic/INCC]. Quinta ou sexta pra gente retomar?"'},
    {d:'R-1',l:'CTA direto',a:'"[Nome], amanha e o dia que voce marcou. Tenho 15 minutos as [hora] ou [hora] — qual fica melhor pra voce?" Duas opcoes. Sem pressao.'}
   ],
   objs:[
    {q:'"Nao e o momento"',s:'Timing genuino — respeite.',d:'"Entendo perfeitamente. Posso te dar um toque em [data]? Sem compromisso — so pra nao perder o timing."'},
    {q:'Nao responde conteudo',s:'Nao esta engajado — pode estar frio.',d:'Mantenha 1 toque por mes. Se 3 meses sem resposta, mova pra Geladeira.'},
    {q:'"Ja resolvi de outra forma"',s:'Foi pra concorrente ou mudou de ideia.',d:'"Que bom que resolveu! Se precisar do proximo patrimonio, to aqui." Move pra PERDIDO com motivo.'}
   ],
   crm:'DOR: [dor original]\nSTATUS: NUTRICAO · retorno: [data]\nPROXIMO: conteudo D[X] · [tipo conteudo]',
   lo:'Nutricao e tarefa perfeita pro estado baixo. Organiza, programa, sem pressao.',
   hi:'Prepara 4 conteudos personalizados por ICP de uma vez. Batch mode.'},

  {id:'geladeira',nome:'Geladeira',icon:'\uD83E\uDDCA',tag:'GELADEIRA',
   desc:'R$4,5M esperando o momento certo. Nao e lixo — e pipeline latente. You are a sifter, not an alchemist. Gancho sempre externo. Nunca menciona o passado.',
   steps:['Agenda reativacao: D30+ (frio/sinalizou) ou D60+ (negociacao).','Gancho sempre externo — algo que mudou no mercado, no produto, no contexto.','Nunca menciona tentativas anteriores.','2 tentativas sem resposta > PERDIDO-DEFINITIVO.'],
   scripts:{
    empresario:'"[Nome], saiu uma atualizacao no consorcio essa semana que muda o jogo pra empresarios que querem capital sem banco. Lembrei de voce."',
    liberal:'"Dr(a). [Nome], com a Selic se movendo, consorcio voltou a ser a opcao mais eficiente pra patrimonio fora da clinica/escritorio. Quando posso te mostrar?"',
    investidor:'"[Nome], surgiu uma janela de grupo com as condicoes que voce estava analisando. Antes de fechar, pensei em voce."',
    servidor:'"[Nome], abriu um grupo novo com parcelas que encaixam exatamente em quem tem renda estavel como a sua. Vale 10 minutos?"',
    assalariado:'"[Nome], o INCC desse mes veio alto. Quem espera mais um ano vai pagar mais pelo mesmo credito. Lembrei de voce."',
    herdeiro:'"[Nome], surgiu uma estrutura de grupo que se encaixa exatamente no montante que voce tem disponivel. Posso te mostrar?"',
    jovem:'"[Nome], abriu um grupo novo com entrada que cabe no seu orcamento agora. E o timing certo pra voce comecar."'
   },
   cad:[
    {d:'D30+',l:'Gancho externo #1',a:'Mercado/produto/prova social. Sem mencionar passado. Como se fosse primeiro contato.'},
    {d:'D90+',l:'Gancho diferente #2',a:'Angulo completamente diferente. Silencio total > PERDIDO-DEFINITIVO com motivo registrado.'},
    {d:'D60+ neg.',l:'Negociacao parada',a:'Nomeia o obstaculo que ficou em aberto + entrega resolucao. So 2 tentativas.'}
   ],
   objs:[
    {q:'Responde mas nao e hora ainda',s:'Timing genuino ou padrao de evitacao?',d:'"Quando seria o momento — proximo trimestre ou no ano que vem?" Define data concreta. Volta com agenda.'},
    {q:'Nao responde nenhuma tentativa',s:'Nao quer dizer que nao — mas nao quer avancar.',d:'2 tentativas > PERDIDO-DEFINITIVO. Libera espaco pro proximo. You are a sifter.'},
    {q:'"Ja resolvi de outra forma"',s:'Foi pra concorrente ou resolveu diferente.',d:'"Que bom! Me conta — foi por qual caminho? Quando quiser o proximo patrimonio, to aqui."'}
   ],
   crm:'DOR: [original + obstaculo se negociacao]\nSTATUS: GELADEIRA \u00B7 reativacao: [data]\nPROXIMO: gancho [externo/dor] \u00B7 [canal] \u00B7 [data]',
   lo:'Geladeira e tarefa do estado baixo — organiza reativacoes sem pressao.',
   hi:'Prepara ganchos personalizados por ICP pros proximos 30 dias.'}
];

function getPlaybookStage(lead) {
  var s = lead.status, f = lead.fluxo || 'FRIO';
  if (s === 'GANHO') return 'fechamento';
  if (s === 'GELADEIRA') return 'geladeira';
  if (s === 'PROPOSTA-ENVIADA') return f === 'NEGOCIACAO' ? 'negociacao' : 'proposta';
  if (s === 'AGUARDANDO-DIAGNOSTICO') return 'agendado';
  if (s === 'NUTRICAO') return 'nutricao';
  if (s === 'CADENCIA-ATIVA' || s === 'NOVO') {
    if (f === 'SINALIZOU') return 'sinalizou';
    if (f === 'NEGOCIACAO') return 'negociacao';
    return 'frio';
  }
  return 'frio';
}

function getPlaybookICP(lead) {
  if (!lead.tags) return null;
  for (var i = 0; i < lead.tags.length; i++) {
    if (PB_TAG_TO_ICP[lead.tags[i]]) return PB_TAG_TO_ICP[lead.tags[i]];
  }
  return null;
}

var _pbLeadId = null, _pbSi = 0, _pbIi = null;

function openPlaybook(leadId) {
  _pbLeadId = leadId;
  var lead = DB.getLeads().find(function(l) { return l.id === leadId; });
  if (!lead) return;
  var stageId = getPlaybookStage(lead);
  var icpId = getPlaybookICP(lead);
  _pbSi = PB_STAGES.findIndex(function(s) { return s.id === stageId; });
  if (_pbSi < 0) _pbSi = 0;
  _pbIi = icpId || null;
  var autoDetected = stageId || icpId;
  document.getElementById('pb-auto-info').style.display = autoDetected ? 'inline-flex' : 'none';
  renderPlaybookContent();
  document.getElementById('modal-playbook').classList.add('open');
}

function renderPlaybookContent() {
  var stage = PB_STAGES[_pbSi];
  var icp = _pbIi ? PB_ICPS[_pbIi] : null;
  var icpId = _pbIi;
  var lead = _pbLeadId ? DB.getLeads().find(function(l) { return l.id === _pbLeadId; }) : null;

  // Stage tabs
  var stageTabs = PB_STAGES.map(function(s,i) {
    return '<button class="pb-stab' + (i===_pbSi?' on':'') + '" onclick="_pbSi=' + i + ';renderPlaybookContent()">' + s.icon + ' ' + s.nome + '</button>';
  }).join('');

  // ICP tabs
  var icpKeys = Object.keys(PB_ICPS);
  var icpTabs = '<button class="pb-icp' + (!_pbIi?' on':'') + '" onclick="_pbIi=null;renderPlaybookContent()">Geral</button>' +
    icpKeys.map(function(k) {
      return '<button class="pb-icp' + (_pbIi===k?' on':'') + '" onclick="_pbIi=\'' + k + '\';renderPlaybookContent()">' + PB_ICPS[k].icon + ' ' + PB_ICPS[k].nome + '</button>';
    }).join('');

  // Desc (strategic context)
  var descHtml = stage.desc ? '<div class="pb-desc">' + stage.desc + '</div>' : '';

  // Script section — now from stage.scripts[icpId]
  var scriptText = icp && icpId && stage.scripts && stage.scripts[icpId] ? stage.scripts[icpId] : '';
  var script = scriptText ? '<div class="pb-sec"><div class="pb-sh on" onclick="pbToggleSec(this)"><span class="pb-shlb">\uD83D\uDCAC Script ' + icp.nome + '</span><span class="pb-shar">\u203A</span></div><div class="pb-sbody on"><div class="pb-script">' + scriptText + '</div>' + (icp.tip ? '<div style="font-size:10px;color:var(--yellow);margin-top:6px">\uD83D\uDCA1 ' + icp.tip + '</div>' : '') + '</div></div>' : '';

  // Steps
  var stepsHtml = '<div class="pb-sec"><div class="pb-sh on" onclick="pbToggleSec(this)"><span class="pb-shlb">\u2705 Passos da Etapa</span><span class="pb-shar">\u203A</span></div><div class="pb-sbody on"><ul class="pb-steps">' + stage.steps.map(function(s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div></div>';

  // Cadence — rich format {d, l, a}
  var cadHtml = '';
  if (stage.cad && stage.cad.length) {
    var cadItems = stage.cad.map(function(c) {
      return '<div class="pb-cad-item"><div class="pb-cad-d">' + c.d + '</div><div class="pb-cad-body"><div class="pb-cad-l">' + c.l + '</div><div class="pb-cad-a">' + c.a + '</div></div></div>';
    }).join('');
    cadHtml = '<div class="pb-sec"><div class="pb-sh" onclick="pbToggleSec(this)"><span class="pb-shlb">\uD83D\uDCDE Cadencia (' + stage.cad.length + ' touchpoints)</span><span class="pb-shar">\u203A</span></div><div class="pb-sbody"><div class="pb-cad-list">' + cadItems + '</div></div></div>';
  }

  // Cadencia pos-Aguardando (pre-retorno)
  if (stage.cadPosAguardando && stage.cadPosAguardando.length) {
    var posItems = stage.cadPosAguardando.map(function(c) {
      return '<div class="pb-cad-item"><div class="pb-cad-d">' + c.d + '</div><div class="pb-cad-body"><div class="pb-cad-l">' + c.l + '</div><div class="pb-cad-a">' + c.a + '</div></div></div>';
    }).join('');
    cadHtml += '<div class="pb-sec"><div class="pb-sh" onclick="pbToggleSec(this)"><span class="pb-shlb">\u23F0 Cadencia Pre-Retorno (' + stage.cadPosAguardando.length + ' toques)</span><span class="pb-shar">\u203A</span></div><div class="pb-sbody"><div class="pb-cad-list">' + posItems + '</div></div></div>';
  }

  // Objections — with signal (s) and diagnosis (d)
  var objHtml = '';
  if (stage.objs && stage.objs.length) {
    var objItems = stage.objs.map(function(o) {
      var dText = o.d ? o.d.replace(/\n/g, '<br>') : '';
      return '<div class="pb-oc" onclick="this.classList.toggle(\'on\')"><div class="pb-oq">' + o.q + '</div>' +
        (o.s ? '<div class="pb-os">\uD83D\uDD0D ' + o.s + '</div>' : '') +
        '<div class="pb-od">' + dText + '</div></div>';
    }).join('');
    objHtml = '<div class="pb-sec"><div class="pb-sh" onclick="pbToggleSec(this)"><span class="pb-shlb">\uD83D\uDEE1\uFE0F Objecoes (' + stage.objs.length + ')</span><span class="pb-shar">\u203A</span></div><div class="pb-sbody">' + objItems + '</div></div>';
  }

  // CRM template
  var crmHtml = '<div class="pb-sec"><div class="pb-sh" onclick="pbToggleSec(this)"><span class="pb-shlb">\uD83D\uDCCB Template CRM</span><span class="pb-shar">\u203A</span></div><div class="pb-sbody"><div class="pb-crm">' + stage.crm + '</div></div></div>';

  // Estado (lo/hi)
  var stateHtml = '<div class="pb-sec"><div class="pb-sh" onclick="pbToggleSec(this)"><span class="pb-shlb">\uD83E\uDDE0 Estado Mental</span><span class="pb-shar">\u203A</span></div><div class="pb-sbody"><div class="pb-eg"><div class="pb-ec lo"><b>\u2B07 Estado 4-6 (dias dificeis)</b>' + stage.lo + '</div><div class="pb-ec hi"><b>\u2B06 Estado 7-9 (dias ideais)</b>' + stage.hi + '</div></div></div></div>';

  // DOR do lead
  var leadDor = lead && lead.dor ? '<div class="pb-dor">"' + esc(lead.dor.slice(0,120)) + '"</div>' : '';

  // ICP info with 'onde' field
  var icpInfo = '';
  if (icp) {
    icpInfo = '<div class="pb-dor" style="border-color:rgba(139,92,246,0.5)">\uD83C\uDFAF ' + icp.dor +
      (icp.onde ? '<br><span style="font-size:10px;color:var(--text-muted)">\uD83D\uDCCD Onde encontrar: ' + icp.onde + '</span>' : '') +
      '</div>';
  }

  document.getElementById('playbook-content').innerHTML =
    '<div class="pb-sw"><div class="pb-stabs">' + stageTabs + '</div></div>' +
    '<div class="pb-head"><span class="pb-icon">' + stage.icon + '</span><span class="pb-stt">' + stage.nome + '</span><span class="pb-tag">' + stage.tag + '</span></div>' +
    descHtml +
    leadDor +
    '<div class="pb-sw" style="padding:0 0 6px"><div class="pb-icps">' + icpTabs + '</div></div>' +
    icpInfo +
    '<div class="pb-wrap">' + script + stepsHtml + cadHtml + objHtml + crmHtml + stateHtml + '</div>';
}

function pbToggleSec(el) {
  el.classList.toggle('on');
  var body = el.nextElementSibling;
  if (body) body.classList.toggle('on');
}
