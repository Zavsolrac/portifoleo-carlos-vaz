/**
 * Merlin AI Guide · contextual wisdom + teleportation
 * ----------------------------------------------------
 * Per-language message banks:
 *   - hero / tree / grimoire / portal / summon: section-scoped greetings.
 *   - idle:       short evergreen taglines (original quick lines).
 *   - wisdom:     15 LOTR-flavoured dev aphorisms.
 *   - characters: 10 named LOTR characters mapped to dev metaphors.
 *   - tech:       10 core tech concepts retold as arcane lore.
 *
 * speakIdle() draws from the FULL random pool (idle + wisdom +
 * keyed characters + keyed tech), so every avatar click can surface
 * any flavour of lore. Characters and tech entries are prefixed
 * with their UPPERCASE keyword so the user instantly understands
 * the topic (e.g. "GANDALF — Olórin he was called…").
 *
 * Language resolution honours window.I18n.lang for pt / gl / es / en,
 * falling back to pt if the locale is unknown.
 */
const Merlin = {
  summoned: false,
  bubbleVisible: false,
  teleportTimer: null,

  messages: {
    // ─────────────────────────────────────────────────────────────
    // PORTUGUÊS
    // ─────────────────────────────────────────────────────────────
    pt: {
      hero: {
        title: "Bem-vindo, viajante",
        body: "Bem-vindo ao Portfólio de Carlos Vaz! Aqui encontrarás a Árvore do Conhecimento, os Cristais de Memória com projetos vividos, o Codex do Arquiteto e os Contratos Arcanos. Explora — cada nó tem uma história.",
      },
      tree: "Cada nó que acendes aproxima-te do ritual completo. Não tenhas pressa.",
      grimoire: "Estes manuscritos são reais. Cada repositório guarda uma batalha vencida.",
      portal: "O portal aguarda. Alianças estratégicas começam com uma mensagem honesta.",
      summon: "O ritual está completo. Eu despertava há eras, esperando por este momento.",
      idle: [
        "Um bom arquiteto desenha o silêncio entre os componentes.",
        "A IA é o familiar. Tu és o mago que define a intenção.",
        "Prompts ruins são feitiços mal pronunciados. Revê a conjuração.",
      ],
      stunned: [
        "Ai... ai. Sacode o ratão assim e até um Maia fica tonto.",
        "Estrelas... vejo estrelas. E não são as do meu chapéu.",
        "Whoa! Demasiados force-pushes no meu vestíbulo. Preciso de um instante.",
      ],
      wisdom: [
        "Um mago nunca se atrasa, meu amigo, nem chega cedo. Ele faz commit precisamente quando pretende! Lembra-te de fazer commit com frequência.",
        "Tu não passarás! ...a menos que o teu código tenha blocos try-catch adequados para o tratamento de erros.",
        "Tudo o que temos a decidir é o que fazer com o tempo que nos é dado. Sugiro começares por refatorar aquele módulo legado.",
        "Não tenho memória deste lugar... Eu, ao voltar a um código que escrevi há três semanas sem comentários no fonte.",
        "Fujam, insensatos! O servidor ficou sem memória de heap e o processo principal está a cair!",
        "Não tenhas demasiada pressa em distribuir force-pushes a torto e a direito. Nem os mais sábios conseguem prever todos os conflitos de merge.",
        "É um negócio perigoso sair pela tua porta... Pões o pé na estrada e, se não te firmares, não há como saber para onde podes ser arrastado. Como quem corre 'npm install' sem verificar os detalhes do pacote!",
        "Atalhos fazem longos atrasos. Lembra-te disto antes de copiar-colar código boilerplate que não entendes.",
        "Um componente raiz para governá-los a todos, um layout para encontrá-los. Um sistema para trazê-los todos e na árvore do DOM aprisioná-los.",
        "Mantém em segredo, mantém em segurança! Guarda as tuas chaves de API em variáveis de ambiente (.env), nunca as faças commit no repositório!",
        "O desespero só pertence aos que veem o fim para além de toda a dúvida. Nós, não. Vai em frente, limpa a cache e reconstrói o projeto!",
        "Aquele que parte uma coisa para descobrir o que é abandonou o caminho da sabedoria. A menos que seja um payload JSON comprimido — aí, podes inspecionar à vontade.",
        "A cortina cinzenta de chuva deste mundo recua, e tudo se transforma em vidro prateado... E então vês: compilado com 0 erros e 0 avisos. Magia pura.",
        "Não confies numa compilação sem erros, pois ela pode ocultar mistérios maiores. Testa sempre os teus casos-limite!",
        "Muitos dos que vivem merecem a morte. E alguns dos que morrem merecem a vida. Podes dá-la a eles? Então não tenhas tanta pressa em apagar ficheiros antigos do repositório.",
      ],
      characters: {
        frodo: "Frodo Bolseiro do Condado, o Portador do Anel. Um hobbit corajoso que levou o Um Anel até à Montanha da Perdição. Como um pequeno componente carregando o estado crítico do sistema inteiro!",
        sauron: "O Senhor das Trevas de Mordor, criador do Um Anel. Representa o derradeiro memory leak, espalhando corrupção pelo servidor da Terra-média. Mantém os olhos bem abertos!",
        gandalf: "Olórin era o seu nome no Oeste. Um Maia, portador da Chama de Anor e do Anel de Fogo, Narya. Mais sábio do que qualquer programador, guia viajantes através de Moria e funções recursivas.",
        gollum: "Sméagol, corrompido pelo Um Anel (o seu precioso). É como uma thread presa num loop infinito, obcecada por uma única variável e incapaz de a soltar.",
        aragorn: "Elessar, a Pedra-élfica, Dúnadan, herdeiro de Isildur. O verdadeiro rei de Gondor, que refatorou os cacos partidos de Narsil em Andúril, a Chama do Oeste — uma espada lendária de código limpo.",
        legolas: "Um mestre em operações assíncronas de arqueiro. Rápido, leve e acerta o alvo de imediato. A sua velocidade de renderização não tem rival entre anões ou humanos.",
        gimli: "Um guerreiro robusto da classe anão. Prefere estruturas backend sólidas e monolíticas. 'Infiel é aquele que se despede quando a estrada escurece!' — diz ele sobre arquiteturas de microsserviços.",
        elrond: "Senhor de Rivendell, que preside o Conselho de Elrond. Essencialmente o arquiteto a conduzir a reunião inicial de kickoff do projeto e a estabelecer os design tokens da Sociedade.",
        moria: "O grande reino subterrâneo dos Anões. Cuidado ao aninhar loops demasiado fundo, pois se cavares com gula e profundidade excessiva, podes despertar um Balrog de stack overflow!",
        shire: "Uma terra serena e bela, de campos verdes, tocas de hobbit e templates HTML estáticos. Sem complexos estados React — apenas paz, silêncio e boa terra arada.",
      },
      tech: {
        html: "O HTML é o esqueleto, as antigas paredes de pedra da nossa cidadela. Constrói-o de forma semântica e sólida, para que leitores de ecrã e crawlers possam navegá-lo em segurança.",
        css: "O CSS é a aura mágica, a filigrana dourada e as runas brilhantes nas paredes de pedra. Transforma layouts básicos em reinos visuais belos e premium.",
        js: "O JavaScript é a conjuração ativa. Sopra vida na arquitetura estática, transformando livros, carrosséis e sprites em artefactos vivos e interativos.",
        react: "O React é a escola de evocação de componentes. Decompõe interfaces complexas em módulos reutilizáveis e reativos, geridos por uma árvore virtual de estado.",
        node: "O Node.js é a alquimia da transmutação de backend, permitindo que feitiços JavaScript corram no servidor, construindo portais, bases de dados e APIs.",
        git: "O Git é o cronista da história. Regista cada feitiço (commit) lançado sobre o código, permitindo-te viajar no tempo se magia negra quebrar o sistema.",
        api: "As APIs são as corujas mensageiras do mundo digital. Pedem e entregam pergaminhos de dados entre reinos distantes.",
        "clean code": "Código limpo escreve-se primeiro para humanos e só depois para máquinas. Usa nomes descritivos, funções modulares e documenta o teu grimório.",
        bug: "Um bug é um goblin perdido nas paredes do código. Caça-o passo a passo com os debuggers e bani-o do repositório!",
        refactor: "Refatorar é polir a antiga espada. Melhoras a estrutura interna do código sem alterar o seu comportamento externo.",
      },
      welcome: {
        title: "Portfólio de Carlos Vaz",
        body: "Bem-vindo! Aqui podes explorar a Árvore do Conhecimento (habilidades), abrir Cristais de Memória (projetos), ler o Codex do Arquiteto (a história de Carlos) e consultar os Contratos Arcanos (serviços). Toca-me para sabedoria — ou pergunta-me pelo pergaminho.",
      },
      thinking: "Merlin medita…",
      ask: "Sussurra uma pergunta…",
      portfolio: "Este arquivo é a jornada de Carlos Vaz, Arquiteto Arcano. Cada secção esconde um capítulo: a Árvore traz o seu domínio técnico, os Cristais guardam projetos vividos, o Codex revela a sua origem e os Contratos selam o que ele pode forjar para ti.",
      services: {
        landing: { title: "Landing Page Arcana", body: "Uma página única e encantada — forjada em HTML, CSS e JavaScript — para divulgar um produto, serviço, evento ou campanha com presença marcante. Investimento a partir de €590 (R$ 3.290), pronta em cerca de uma a duas semanas. Procura o seu selo no Codex dos Contratos." },
        institucional: { title: "Site Institucional", body: "Um pequeno reino digital de várias páginas que estabelece autoridade e confiança para empresas e marcas. Investimento a partir de €1.290 (R$ 6.900). Inclui deploy, SSL, responsividade móvel e SEO inicial." },
        portfolio: { title: "Portfólio Profissional", body: "Um arquivo vivo que narra a tua trajetória — projetos, identidade e experiência tecidos em storytelling, tal como este portal que percorres. Investimento a partir de €1.790 (R$ 8.900)." },
        automacao: { title: "Automação Arcana e IA", body: "Feitiços que trabalham por ti: integrações, agentes de IA, chatbots e fluxos com n8n, APIs e LLMs que libertam-te das tarefas repetitivas. Investimento a partir de €2.990 (R$ 14.900)." },
        narrativa: { title: "Narrativa Visual", body: "A arte mais rara do atelier: um site temático e cinematográfico, com mundo próprio e imersão total — irmão deste portal. Investimento a partir de €1.290 (R$ 7.200)." },
        sobmedida: { title: "Projeto Sob Medida", body: "Quando nenhum contrato comum serve, forja-se um artefacto único conforme a tua visão — sistemas, plataformas, experiências raras. A partir de €2.490 (R$ 13.900), com orçamento selado sob medida." },
      },
      kb: {
        pricing: "Os Contratos Arcanos vão da Landing Page (€590 · R$ 3.290) ao Projeto Sob Medida (€2.490+ · R$ 13.900+), passando por Site Institucional (€1.290), Portfólio Profissional (€1.790), Automação com IA (€2.990) e Narrativa Visual (€1.290). Abre o Codex dos Contratos para ver cada selo, o que inclui e o prazo.",
        included: "Cada pacto sela um artefacto completo, não apenas um site: deploy profissional, certificado SSL (HTTPS), responsividade móvel, SEO inicial, configuração de domínio e suporte inicial — somados a storytelling, animações cinemáticas, modo claro/escuro e galeria de projetos.",
        delivery: "O tempo varia com a raridade do contrato: uma Landing Page nasce em cerca de sete a quinze dias; reinos maiores, como sites institucionais e narrativas visuais, pedem algumas semanas. O prazo exato é selado antes de começarmos a obra.",
        skills: "Carlos domina o Front-End (HTML, CSS, JavaScript, TypeScript, React, Next.js), o Back-End (Node, APIs, bases de dados), a Cloud, a Automação e a Inteligência Artificial (Prompt Engineering, RAG, agentes, LLMs). Percorre a Árvore do Conhecimento para ver cada ramo aceso.",
        projects: "Os Cristais de Memória guardam projetos reais, vindos do GitHub de Carlos — entre eles a XDEVS e um clone de Yu-Gi-Oh. Toca um cristal para o quebrar e revelar a história que ele encerra.",
        hire: "Para selar um pacto, abre o Portal e envia uma mensagem honesta, ou consulta os Sinais de Convocação no Codex do Arquiteto. Diz o que precisas e o teu orçamento — a resposta chega em pergaminho dourado.",
        why: "Carlos une três artes que raramente caminham juntas: código sólido, direção artística e storytelling. Não entrega apenas um site — entrega um artefacto vivo, com identidade própria e uma experiência que se recorda.",
        convergence: "A cada dez dias, uma rara Convergência Arcana favorece um único contrato com uma bênção temporária — um benefício inscrito como evento cósmico, não como mera promoção. Observa o Codex: o contrato abençoado exibe o selo e uma contagem regressiva.",
      },
      contact: "Para conjurar contacto, abre o Portal ou consulta os Sinais de Convocação no Codex do Arquiteto. Toda a mensagem é recebida em pergaminho dourado e respondida com diligência.",
      resume: "O currículo completo descansa no Codex do Arquiteto. Lá encontrarás formação, pesquisas, idiomas, voluntariado e um botão para descarregar o pergaminho em PDF.",
      jokes: [
        "Por que é que o programador foi para a floresta? Porque ouviu dizer que lá havia muitos branches!",
        "Como é que um mago resolve um null pointer? Lança um 'protego' chamado optional chaining.",
        "Tenho 99 bugs no meu código… arranjo um, e agora tenho 127 bugs.",
        "Os hobbits adoram CSS porque é uma terra de muitos elementos box-sized.",
      ],
      fallback: [
        "Hmm… essa runa não conheço, mas o vento sussurra que a resposta talvez resida na Árvore do Conhecimento ou nos Cristais de Memória.",
        "Muitos enigmas atravessam estes salões. Tenta perguntar por um personagem (Frodo, Gandalf, Sauron) ou por uma tecnologia (HTML, React, Git).",
        "O pergaminho está em silêncio sobre esse tema. Posso falar de Aragorn, ou explicar o que é refactor — se quiseres.",
      ],
      observed: {
        codex: "Abriste o Codex do Arquiteto. Estuda-o devagar — cada relíquia esconde uma história.",
        vault: "O Cristal foi quebrado, e a memória derramou-se. Observa a relíquia com calma.",
        milestone: "Oito runas acesas. A árvore reconhece a tua dedicação — segue até ao núcleo!",
        photoClick: "Tocaste o Núcleo Arcano. O Codex agora desperta para te receber.",
      },
      // ───────────────────────────────────────────────────────────
      // CONVERSATION · short Gandalf-flavoured exchanges so Merlin
      // can answer everyday phrases (hi / good morning / thanks /
      // how are you?) in character, with a wink to the classic
      // Bilbo–Gandalf hobbit-hole opening.
      // ───────────────────────────────────────────────────────────
      conversation: {
        goodmorning: {
          title: "Bom dia?",
          body: "O que queres dizer? Estás a desejar-me um bom dia, ou a afirmar que este é um bom dia quer eu o queira ou não? Ou talvez estejas a dizer que te sentes bem neste dia, ou ainda que é um bom dia para se estar bem?",
        },
        hello: {
          title: "Saudações",
          body: "Salve, viajante. Encontros como este raramente acontecem por acaso. Diz-me o que te trouxe a esta Árvore — e eu direi se vale uma resposta.",
        },
        howareyou: {
          title: "Como vais?",
          body: "Vou como vai um mago: cansado de impacientes, paciente com tolos, e sempre exatamente onde devo estar. E tu, viajante — vens para conversar ou para aprender?",
        },
        whoareyou: {
          title: "Quem és tu?",
          body: "Sou Merlin, gardião deste arquivo. Conheço cada nó da Árvore, cada cristal da Memória e cada selo do Codex. Faz a pergunta certa e eu mostrar-te-ei a porta.",
        },
        thanks: {
          title: "De nada",
          body: "Não me agradeças ainda. A sabedoria custa pouco quando se ouve, e muito quando se aplica. Volta sempre que precisares de uma palavra — ou de um aviso.",
        },
        goodbye: {
          title: "Até breve",
          body: "Vai com paz, viajante, e que o vento te seja favorável. Quando voltares, a Árvore continuará exatamente onde a deixaste.",
        },
        time: {
          title: "Sobre o tempo",
          body: "Um mago nunca chega tarde, viajante. Nem chega cedo. Chega precisamente quando pretende — e o mesmo se aplica aos teus commits.",
        },
        why: {
          title: "Porquê?",
          body: "Porquê é a pergunta mais perigosa que um arquiteto pode fazer — e a única que vale a pena fazer. Continua a perguntá-la, mesmo quando ninguém quiser responder.",
        },
        howold: {
          title: "Quantos anos?",
          body: "Mais velho do que pareço, mais novo do que aparento. Nasci antes do primeiro compilador e ainda assim continuo a esperar por uma build sem warnings.",
        },
      },
    },

    // ─────────────────────────────────────────────────────────────
    // GALEGO
    // ─────────────────────────────────────────────────────────────
    gl: {
      hero: {
        title: "Benvido, viaxeiro",
        body: "Benvido ao Portfolio de Carlos Vaz! Aquí atoparás a Árbore do Coñecemento, os Cristais de Memoria con proxectos vividos, o Codex do Arquitecto e os Contratos Arcanos. Explora — cada nodo ten unha historia.",
      },
      tree: "Cada nodo que acendes achégate ao ritual completo. Non teñas présa.",
      grimoire: "Estes manuscritos son reais. Cada repositorio garda unha batalla gañada.",
      portal: "O portal agarda. As alianzas estratéxicas comezan cunha mensaxe honesta.",
      summon: "O ritual está completo. Espertei tras eras, agardando por este momento.",
      idle: [
        "Un bo arquitecto debuxa o silencio entre os compoñentes.",
        "A IA é o familiar. Ti es o mago que define a intención.",
        "Os malos prompts son feitizos mal pronunciados. Revisa a conxuración.",
      ],
      stunned: [
        "Ai... ai. Sacode o rato así e ata un Maia queda mareado.",
        "Estrelas... vexo estrelas. E non son as do meu chapeu.",
        "Whoa! Demasiados force-pushes no meu vestíbulo. Preciso dun intre.",
      ],
      wisdom: [
        "Un mago nunca chega tarde, meu amigo, nin chega cedo. Fai commit precisamente cando pretende facelo! Lembra de facer commits a miúdo.",
        "Non pasarás! ...a menos que o teu código teña bloques try-catch axeitados para o tratamento de erros.",
        "Todo o que temos que decidir é que facer co tempo que se nos dá. Suxiro comezar refactorizando ese módulo legado.",
        "Non teño memoria deste lugar... Eu, ao volver a un código que escribín hai tres semanas sen comentarios.",
        "Fuxide, insensatos! O servidor ficou sen memoria de heap e o proceso principal está a colapsar!",
        "Non teñas tanta présa en repartir force-pushes ao bo tuntún. Nin os máis sabios poden prever todos os conflitos de merge.",
        "É un negocio perigoso saír pola túa porta... Pos o pé no camiño e, se non te afirmas, non hai como saber onde podes ir parar. Como executar 'npm install' sen revisar os detalles do paquete!",
        "Os atallos provocan longos atrasos. Lembra disto antes de copiar e pegar código boilerplate que non entendes.",
        "Un compoñente raíz para gobernalos a todos, un deseño para atopalos. Un sistema para traelos a todos e na árbore do DOM atalos.",
        "Mantén en segredo, mantén a salvo! Garda as túas claves de API en variables de contorno (.env), nunca as subas ao repositorio!",
        "A desesperación só lle pertence aos que ven a fin máis aló de toda dúbida. Nós, non. Adiante, limpa a caché e reconstrúe o proxecto!",
        "Aquel que crebra unha cousa para descubrir o que é abandonou o camiño da sabedoría. A menos que sexa un payload JSON comprimido — aí, podes inspeccionalo á vontade.",
        "A cortina gris de chuvia deste mundo recúa, e todo se transforma en vidro prateado... E entón velo: compilado con 0 erros e 0 avisos. Maxia pura.",
        "Non confíes nunha compilación sen erros, pois pode agachar misterios maiores. Proba sempre os teus casos-límite!",
        "Moitos dos que viven merecen a morte. E algúns dos que morren merecen a vida. Podes dárllela? Entón non teñas tanta présa en borrar ficheiros antigos do repositorio.",
      ],
      characters: {
        frodo: "Frodo Bolseiro da Comarca, o Portador do Anel. Un hobbit valente que levou o Único Anel ata o Monte do Destino. Coma un pequeno compoñente que carrexa o estado crítico de todo o sistema!",
        sauron: "O Señor Escuro de Mordor, creador do Único Anel. Representa o derradeiro memory leak, espallando corrupción polo servidor da Terra Media. Mantén os ollos ben abertos!",
        gandalf: "Olórin chamábase no Oeste. Un Maia, portador da Chama de Anor e do Anel de Lume, Narya. Máis sabio que calquera programador, guía os viaxeiros a través de Moria e funcións recursivas.",
        gollum: "Sméagol, corrompido polo Único Anel (o seu precioso). É coma unha thread presa nun bucle infinito, obsesionada cunha única variable e incapaz de soltarse dela.",
        aragorn: "Elessar, a Pedra-élfica, Dúnadan, herdeiro de Isildur. O verdadeiro rei de Gondor, que refactorizou os cachos partidos de Narsil en Andúril, a Chama do Oeste — unha espada lendaria de código limpo.",
        legolas: "Un mestre en operacións asíncronas de arqueiro. Rápido, lixeiro e acerta o albo ao instante. A súa velocidade de renderización non ten rival entre ananos ou humanos.",
        gimli: "Un guerreiro robusto da clase anano. Prefire estruturas backend sólidas e monolíticas. 'Infiel é quen se despide cando o camiño escurece!' — di sobre as arquitecturas de microservizos.",
        elrond: "Señor de Imladris, que preside o Concilio de Elrond. Esencialmente o arquitecto que conduce a reunión inicial de kickoff do proxecto e establece os design tokens da Compaña.",
        moria: "O grande reino subterráneo dos Ananos. Coida ao aniñar bucles demasiado fondo, pois se cavas con cobiza e profundidade excesiva, podes espertar un Balrog de stack overflow!",
        shire: "Unha terra serena e fermosa, de campos verdes, tobas de hobbit e plantillas HTML estáticas. Sen complexos estados React — só paz, silencio e boa terra arada.",
      },
      tech: {
        html: "O HTML é o esqueleto, os antigos muros de pedra da nosa cidadela. Constrúeo de xeito semántico e firme, para que os lectores de pantalla e crawlers poidan navegalo con seguridade.",
        css: "O CSS é a aura máxica, a filigrana dourada e as runas brillantes nas paredes de pedra. Transforma deseños básicos en reinos visuais fermosos e premium.",
        js: "O JavaScript é a conxuración activa. Sopra vida na arquitectura estática, transformando libros, carruseis e sprites en artefactos vivos e interactivos.",
        react: "O React é a escola de evocación de compoñentes. Descompón interfaces complexas en módulos reutilizables e reactivos, xestionados por unha árbore virtual de estado.",
        node: "O Node.js é a alquimia da transmutación de backend, permitindo que os feitizos de JavaScript corran no servidor, construíndo portais, bases de datos e APIs.",
        git: "O Git é o cronista da historia. Rexistra cada feitizo (commit) lanzado sobre o código, permitíndoche viaxar no tempo se a maxia escura crebra o sistema.",
        api: "As APIs son as curuxas mensaxeiras do mundo dixital. Solicitan e entregan pergameos de datos entre reinos afastados.",
        "clean code": "O código limpo escríbese primeiro para humanos e só despois para máquinas. Usa nomes descritivos, funcións modulares e documenta o teu grimorio.",
        bug: "Un bug é un trasno extraviado nas paredes do código. Cázao paso a paso cos debuggers e bótao do repositorio!",
        refactor: "Refactorizar é puír a antiga espada. Mellora a estrutura interna do código sen alterar o seu comportamento externo.",
      },
      welcome: {
        title: "Portfolio de Carlos Vaz",
        body: "Benvido! Aquí podes explorar a Árbore do Coñecemento (habilidades), abrir Cristais de Memoria (proxectos), ler o Codex do Arquitecto (a historia de Carlos) e consultar os Contratos Arcanos (servizos). Tócame para sabedoría — ou pregúntame polo pergameo.",
      },
      thinking: "Merlin medita…",
      ask: "Murmura unha pregunta…",
      portfolio: "Este arquivo é a viaxe de Carlos Vaz, Arquitecto Arcano. Cada sección agocha un capítulo: a Árbore mostra o seu dominio técnico, os Cristais gardan proxectos vividos, o Codex revela a súa orixe e os Contratos selan o que pode forxar para ti.",
      services: {
        landing: { title: "Landing Page Arcana", body: "Unha páxina única e encantada — forxada en HTML, CSS e JavaScript — para divulgar un produto, servizo, evento ou campaña con presenza marcante. Investimento dende €590 (R$ 3.290), lista nunha ou dúas semanas. Busca o seu selo no Codex dos Contratos." },
        institucional: { title: "Site Institucional", body: "Un pequeno reino dixital de varias páxinas que establece autoridade e confianza para empresas e marcas. Investimento dende €1.290 (R$ 6.900). Inclúe deploy, SSL, responsividade móbil e SEO inicial." },
        portfolio: { title: "Portfolio Profesional", body: "Un arquivo vivo que narra a túa traxectoria — proxectos, identidade e experiencia tecidos en storytelling, coma este portal que percorres. Investimento dende €1.790 (R$ 8.900)." },
        automacao: { title: "Automatización Arcana e IA", body: "Feitizos que traballan por ti: integracións, axentes de IA, chatbots e fluxos con n8n, APIs e LLMs que te liberan das tarefas repetitivas. Investimento dende €2.990 (R$ 14.900)." },
        narrativa: { title: "Narrativa Visual", body: "A arte máis rara do atelier: un sitio temático e cinematográfico, con mundo propio e inmersión total — irmán deste portal. Investimento dende €1.290 (R$ 7.200)." },
        sobmedida: { title: "Proxecto Sob Medida", body: "Cando ningún contrato común serve, fórxase un artefacto único conforme a túa visión — sistemas, plataformas, experiencias raras. Dende €2.490 (R$ 13.900), cun orzamento selado a medida." },
      },
      kb: {
        pricing: "Os Contratos Arcanos van da Landing Page (€590 · R$ 3.290) ao Proxecto Sob Medida (€2.490+ · R$ 13.900+), pasando por Site Institucional (€1.290), Portfolio Profesional (€1.790), Automatización con IA (€2.990) e Narrativa Visual (€1.290). Abre o Codex dos Contratos para ver cada selo, o que inclúe e o prazo.",
        included: "Cada pacto sela un artefacto completo, non só un sitio: deploy profesional, certificado SSL (HTTPS), responsividade móbil, SEO inicial, configuración de dominio e soporte inicial — máis storytelling, animacións cinemáticas, modo claro/escuro e galería de proxectos.",
        delivery: "O tempo varía coa rareza do contrato: unha Landing Page nace nuns sete a quince días; reinos maiores, coma sitios institucionais e narrativas visuais, piden algunhas semanas. O prazo exacto séllase antes de comezar a obra.",
        skills: "Carlos domina o Front-End (HTML, CSS, JavaScript, TypeScript, React, Next.js), o Back-End (Node, APIs, bases de datos), a Cloud, a Automatización e a Intelixencia Artificial (Prompt Engineering, RAG, axentes, LLMs). Percorre a Árbore do Coñecemento para ver cada póla acesa.",
        projects: "Os Cristais de Memoria gardan proxectos reais, vidos do GitHub de Carlos — entre eles a XDEVS e un clon de Yu-Gi-Oh. Toca un cristal para crebalo e revelar a historia que encerra.",
        hire: "Para selar un pacto, abre o Portal e envía unha mensaxe honesta, ou consulta os Sinais de Convocatoria no Codex do Arquitecto. Dime o que precisas e o teu orzamento — a resposta chega en pergameo dourado.",
        why: "Carlos une tres artes que raramente camiñan xuntas: código sólido, dirección artística e storytelling. Non entrega só un sitio — entrega un artefacto vivo, con identidade propia e unha experiencia que se lembra.",
        convergence: "Cada dez días, unha rara Converxencia Arcana favorece un único contrato cunha bendición temporal — un beneficio inscrito como evento cósmico, non como mera promoción. Observa o Codex: o contrato bendicido amosa o selo e unha conta atrás.",
      },
      contact: "Para conxurar contacto, abre o Portal ou consulta os Sinais de Convocatoria no Codex do Arquitecto. Toda mensaxe é recibida en pergameo dourado e respondida con dilixencia.",
      resume: "O currículo completo descansa no Codex do Arquitecto. Alí atoparás formación, investigacións, idiomas, voluntariado e un botón para descargar o pergameo en PDF.",
      jokes: [
        "Por que foi o programador ao bosque? Porque oíu que había moitos branches!",
        "Como resolve un mago un null pointer? Lanza un 'protego' chamado optional chaining.",
        "Teño 99 bugs no meu código… arranxo un, e agora teño 127 bugs.",
        "Os hobbits adoran o CSS porque é unha terra de moitos elementos box-sized.",
      ],
      fallback: [
        "Hmm… esa runa non a coñezo, mais o vento susurra que a resposta talvez resida na Árbore do Coñecemento ou nos Cristais de Memoria.",
        "Moitos enigmas atravesan estes salóns. Tenta preguntar por un personaxe (Frodo, Gandalf, Sauron) ou por unha tecnoloxía (HTML, React, Git).",
        "O pergameo está en silencio sobre ese tema. Podo falar de Aragorn, ou explicar que é refactor — se quixeres.",
      ],
      observed: {
        codex: "Abriches o Codex do Arquitecto. Estúdao a modo — cada reliquia agocha unha historia.",
        vault: "O Cristal foi crebado, e a memoria derramouse. Observa a reliquia con calma.",
        milestone: "Oito runas acesas. A árbore recoñece a túa dedicación — segue ata o núcleo!",
        photoClick: "Tocaches o Núcleo Arcano. O Codex agora esperta para recibirte.",
      },
      conversation: {
        goodmorning: {
          title: "Bo día?",
          body: "Que queres dicir? Estás a desexarme un bo día, ou a afirmar que este é un bo día queira eu ou non? Ou talvez queres dicirme que te sentes ben neste día, ou aínda que é un bo día para estar ben?",
        },
        hello: {
          title: "Saúdos",
          body: "Salve, viaxeiro. Encontros coma este raramente suceden por casualidade. Dime o que te trouxo a esta Árbore — e eu direi se merece resposta.",
        },
        howareyou: {
          title: "Como vas?",
          body: "Vou como vai un mago: canso dos impacientes, paciente cos parvos, e sempre exactamente onde debo estar. E ti, viaxeiro — vés conversar ou aprender?",
        },
        whoareyou: {
          title: "Quen es?",
          body: "Son Merlin, gardián deste arquivo. Coñezo cada nodo da Árbore, cada cristal da Memoria e cada selo do Codex. Fai a pregunta certa e amosareiche a porta.",
        },
        thanks: {
          title: "De nada",
          body: "Non me agradezas aínda. A sabedoría custa pouco cando se escoita, e moito cando se aplica. Volve sempre que precises dunha palabra — ou dun aviso.",
        },
        goodbye: {
          title: "Ata logo",
          body: "Vai con paz, viaxeiro, e que o vento te sexa favorable. Cando volvas, a Árbore seguirá exactamente onde a deixaches.",
        },
        time: {
          title: "Sobre o tempo",
          body: "Un mago nunca chega tarde, viaxeiro. Tampouco chega cedo. Chega precisamente cando pretende — e o mesmo vale para os teus commits.",
        },
        why: {
          title: "Por que?",
          body: "Por que é a pregunta máis perigosa que un arquitecto pode facer — e a única que paga a pena facer. Segue facéndoa, mesmo cando ninguén queira responder.",
        },
        howold: {
          title: "Cantos anos?",
          body: "Máis vello do que pareza, máis novo do que aparento. Nacín antes do primeiro compilador e aínda así sigo agardando por unha build sen warnings.",
        },
      },
    },

    // ─────────────────────────────────────────────────────────────
    // ESPAÑOL
    // ─────────────────────────────────────────────────────────────
    es: {
      hero: {
        title: "Bienvenido, viajero",
        body: "¡Bienvenido al Portafolio de Carlos Vaz! Aquí encontrarás el Árbol del Conocimiento, los Cristales de Memoria con proyectos vividos, el Codex del Arquitecto y los Contratos Arcanos. Explora — cada nodo guarda una historia.",
      },
      tree: "Cada nodo que enciendes te acerca al ritual completo. No tengas prisa.",
      grimoire: "Estos manuscritos son reales. Cada repositorio guarda una batalla ganada.",
      portal: "El portal aguarda. Las alianzas estratégicas comienzan con un mensaje honesto.",
      summon: "El ritual está completo. Llevaba eras despertando, esperando este momento.",
      idle: [
        "Un buen arquitecto diseña el silencio entre los componentes.",
        "La IA es el familiar. Tú eres el mago que define la intención.",
        "Los malos prompts son hechizos mal pronunciados. Revisa la conjuración.",
      ],
      stunned: [
        "Ay... ay. Agita así el ratón y hasta un Maia se marea.",
        "Estrellas... veo estrellas. Y no son las de mi sombrero.",
        "¡Whoa! Demasiados force-pushes en mi vestíbulo. Necesito un instante.",
      ],
      wisdom: [
        "Un mago nunca llega tarde, amigo mío, ni temprano. ¡Hace commit precisamente cuando se lo propone! Recuerda hacer commits con frecuencia.",
        "¡No pasarás! ...a menos que tu código tenga bloques try-catch adecuados para el manejo de errores.",
        "Todo lo que tenemos que decidir es qué hacer con el tiempo que se nos da. Sugiero refactorizar primero ese módulo heredado.",
        "No tengo memoria de este lugar... Yo, al volver a una base de código que escribí hace tres semanas sin comentarios en línea.",
        "¡Huid, insensatos! El servidor se quedó sin memoria heap y el proceso principal está colapsando!",
        "No estés tan ansioso por repartir force-pushes a diestro y siniestro. Ni los más sabios pueden prever todos los conflictos de merge.",
        "Es un negocio peligroso salir por tu puerta... Pones un pie en el camino y, si no te afirmas, no hay manera de saber a dónde podrías ser arrastrado. ¡Como ejecutar 'npm install' sin revisar los detalles del paquete!",
        "Los atajos provocan largas demoras. Recuerda esto antes de copiar y pegar código boilerplate que no entiendes.",
        "Un componente raíz para gobernarlos a todos, un layout para encontrarlos. Un sistema para traerlos a todos y en el árbol del DOM atarlos.",
        "¡Manténlo en secreto, manténlo a salvo! Guarda tus claves de API en variables de entorno (.env), ¡nunca las subas al repositorio!",
        "La desesperación solo es para quienes ven el final más allá de toda duda. Nosotros, no. ¡Adelante, limpia la caché y reconstruye el proyecto!",
        "Aquel que rompe algo para descubrir lo que es ha abandonado el camino de la sabiduría. A menos que sea un payload JSON comprimido — entonces, inspecciónalo a placer.",
        "La cortina gris de lluvia de este mundo retrocede, y todo se vuelve cristal plateado... Y entonces lo ves: compilado con 0 errores y 0 advertencias. Magia pura.",
        "No confíes en una compilación sin errores, pues puede ocultar misterios mayores. ¡Pon siempre a prueba tus casos límite!",
        "Muchos de los que viven merecen morir. Y algunos de los que mueren merecen vivir. ¿Puedes dárselo tú? Entonces no estés tan ansioso por borrar archivos antiguos del repositorio.",
      ],
      characters: {
        frodo: "Frodo Bolsón de la Comarca, el Portador del Anillo. Un hobbit valiente que llevó el Anillo Único hasta el Monte del Destino. ¡Como un pequeño componente cargando con el estado crítico de todo el sistema!",
        sauron: "El Señor Oscuro de Mordor, creador del Anillo Único. Representa la suprema fuga de memoria, esparciendo corrupción por el servidor de la Tierra Media. ¡Mantén los ojos bien abiertos!",
        gandalf: "Olórin era llamado en el Oeste. Un Maia, portador de la Llama de Anor y del Anillo de Fuego, Narya. Más sabio que cualquier desarrollador, guía a los viajeros a través de Moria y de las funciones recursivas.",
        gollum: "Sméagol, corrompido por el Anillo Único (su tesoro). Es como un hilo atrapado en un bucle infinito, obsesionado con una sola variable e incapaz de soltarla.",
        aragorn: "Elessar, la Piedra Élfica, Dúnadan, heredero de Isildur. El verdadero rey de Gondor, que refactorizó los fragmentos rotos de Narsil en Andúril, la Llama del Oeste — una espada legendaria de código limpio.",
        legolas: "Un maestro de operaciones asíncronas de arquero. Rápido, ligero y acierta al blanco al instante. Su velocidad de renderizado no tiene rival entre enanos o humanos.",
        gimli: "Un guerrero robusto de la clase enano. Prefiere estructuras backend sólidas y monolíticas. '¡Infiel es quien se despide cuando el camino se oscurece!', dice sobre las arquitecturas de microservicios.",
        elrond: "Señor de Rivendel, quien preside el Concilio de Elrond. Esencialmente el arquitecto que dirige la reunión inicial de kickoff del proyecto y establece los design tokens de la Comunidad.",
        moria: "El gran reino subterráneo de los Enanos. ¡Cuidado al anidar bucles demasiado profundo, pues si cavas con codicia y demasiada profundidad, podrías despertar a un Balrog de stack overflow!",
        shire: "Una tierra serena y hermosa, de campos verdes, agujeros-hobbit y plantillas HTML estáticas. Sin complejos estados de React — solo paz, silencio y buena tierra labrada.",
      },
      tech: {
        html: "HTML es el esqueleto, los antiguos muros de piedra de nuestra ciudadela. Constrúyelo de forma semántica y sólida, para que los lectores de pantalla y los rastreadores puedan navegarlo con seguridad.",
        css: "CSS es el aura mágica, la filigrana dorada y las runas brillantes en las paredes de piedra. Transforma layouts básicos en reinos visuales bellos y premium.",
        js: "JavaScript es la conjuración activa. Da vida a la arquitectura estática, transformando libros, carruseles y sprites en artefactos vivos e interactivos.",
        react: "React es la escuela de evocación de componentes. Descompone interfaces complejas en módulos reutilizables y reactivos, gestionados por un árbol virtual de estado.",
        node: "Node.js es la alquimia de la transmutación de backend, permitiendo que los hechizos de JavaScript corran en el servidor, construyendo portales, bases de datos y APIs.",
        git: "Git es el cronista de la historia. Registra cada hechizo (commit) lanzado sobre el código, permitiéndote viajar en el tiempo si la magia oscura rompe el sistema.",
        api: "Las APIs son las lechuzas mensajeras del mundo digital. Solicitan y entregan pergaminos de datos entre reinos lejanos.",
        "clean code": "El código limpio se escribe primero para humanos y después para máquinas. Usa nombres descriptivos, funciones modulares y documenta tu grimorio.",
        bug: "Un bug es un goblin extraviado en los muros del código. ¡Cázalo paso a paso con los depuradores y destiérralo del repositorio!",
        refactor: "Refactorizar es pulir la antigua espada. Mejoras la estructura interna del código sin cambiar su comportamiento externo.",
      },
      welcome: {
        title: "Portafolio de Carlos Vaz",
        body: "¡Bienvenido! Aquí puedes explorar el Árbol del Conocimiento (habilidades), abrir Cristales de Memoria (proyectos), leer el Codex del Arquitecto (la historia de Carlos) y consultar los Contratos Arcanos (servicios). Tócame para sabiduría — o pregúntame por el pergamino.",
      },
      thinking: "Merlin medita…",
      ask: "Susurra una pregunta…",
      portfolio: "Este archivo es el viaje de Carlos Vaz, Arquitecto Arcano. Cada sección esconde un capítulo: el Árbol muestra su dominio técnico, los Cristales guardan proyectos vividos, el Codex revela su origen y los Contratos sellan lo que puede forjar para ti.",
      services: {
        landing: { title: "Landing Page Arcana", body: "Una página única y encantada — forjada en HTML, CSS y JavaScript — para divulgar un producto, servicio, evento o campaña con presencia marcada. Inversión desde €590 (R$ 3.290), lista en una o dos semanas. Busca su sello en el Codex de los Contratos." },
        institucional: { title: "Sitio Institucional", body: "Un pequeño reino digital de varias páginas que establece autoridad y confianza para empresas y marcas. Inversión desde €1.290 (R$ 6.900). Incluye deploy, SSL, responsividad móvil y SEO inicial." },
        portfolio: { title: "Portafolio Profesional", body: "Un archivo vivo que narra tu trayectoria — proyectos, identidad y experiencia tejidos en storytelling, como este portal que recorres. Inversión desde €1.790 (R$ 8.900)." },
        automacao: { title: "Automatización Arcana e IA", body: "Hechizos que trabajan por ti: integraciones, agentes de IA, chatbots y flujos con n8n, APIs y LLMs que te liberan de las tareas repetitivas. Inversión desde €2.990 (R$ 14.900)." },
        narrativa: { title: "Narrativa Visual", body: "El arte más raro del atelier: un sitio temático y cinematográfico, con mundo propio e inmersión total — hermano de este portal. Inversión desde €1.290 (R$ 7.200)." },
        sobmedida: { title: "Proyecto a Medida", body: "Cuando ningún contrato común sirve, se forja un artefacto único conforme a tu visión — sistemas, plataformas, experiencias raras. Desde €2.490 (R$ 13.900), con presupuesto sellado a medida." },
      },
      kb: {
        pricing: "Los Contratos Arcanos van de la Landing Page (€590 · R$ 3.290) al Proyecto a Medida (€2.490+ · R$ 13.900+), pasando por Sitio Institucional (€1.290), Portafolio Profesional (€1.790), Automatización con IA (€2.990) y Narrativa Visual (€1.290). Abre el Codex de los Contratos para ver cada sello, lo que incluye y el plazo.",
        included: "Cada pacto sella un artefacto completo, no solo un sitio: deploy profesional, certificado SSL (HTTPS), responsividad móvil, SEO inicial, configuración de dominio y soporte inicial — más storytelling, animaciones cinemáticas, modo claro/oscuro y galería de proyectos.",
        delivery: "El tiempo varía con la rareza del contrato: una Landing Page nace en unos siete a quince días; reinos mayores, como sitios institucionales y narrativas visuales, piden algunas semanas. El plazo exacto se sella antes de comenzar la obra.",
        skills: "Carlos domina el Front-End (HTML, CSS, JavaScript, TypeScript, React, Next.js), el Back-End (Node, APIs, bases de datos), la Cloud, la Automatización y la Inteligencia Artificial (Prompt Engineering, RAG, agentes, LLMs). Recorre el Árbol del Conocimiento para ver cada rama encendida.",
        projects: "Los Cristales de Memoria guardan proyectos reales, venidos del GitHub de Carlos — entre ellos XDEVS y un clon de Yu-Gi-Oh. Toca un cristal para quebrarlo y revelar la historia que encierra.",
        hire: "Para sellar un pacto, abre el Portal y envía un mensaje honesto, o consulta las Señales de Convocatoria en el Codex del Arquitecto. Dime qué necesitas y tu presupuesto — la respuesta llega en pergamino dorado.",
        why: "Carlos une tres artes que rara vez caminan juntas: código sólido, dirección artística y storytelling. No entrega solo un sitio — entrega un artefacto vivo, con identidad propia y una experiencia que se recuerda.",
        convergence: "Cada diez días, una rara Convergencia Arcana favorece a un único contrato con una bendición temporal — un beneficio inscrito como evento cósmico, no como una mera promoción. Observa el Codex: el contrato bendecido muestra el sello y una cuenta regresiva.",
      },
      contact: "Para conjurar contacto, abre el Portal o consulta las Señales de Convocatoria en el Codex del Arquitecto. Todo mensaje se recibe en pergamino dorado y se responde con diligencia.",
      resume: "El currículum completo reposa en el Codex del Arquitecto. Allí encontrarás formación, investigaciones, idiomas, voluntariado y un botón para descargar el pergamino en PDF.",
      jokes: [
        "¿Por qué el programador se fue al bosque? ¡Porque oyó que había muchos branches!",
        "¿Cómo resuelve un mago un null pointer? Lanza un 'protego' llamado optional chaining.",
        "Tengo 99 bugs en mi código… arreglo uno, y ahora tengo 127 bugs.",
        "A los hobbits les encanta CSS porque es una tierra de muchos elementos box-sized.",
      ],
      fallback: [
        "Hmm… esa runa no la conozco, pero el viento susurra que la respuesta tal vez resida en el Árbol del Conocimiento o en los Cristales de Memoria.",
        "Muchos enigmas atraviesan estos salones. Intenta preguntar por un personaje (Frodo, Gandalf, Sauron) o por una tecnología (HTML, React, Git).",
        "El pergamino guarda silencio sobre ese tema. Puedo hablar de Aragorn, o explicar qué es refactor — si lo deseas.",
      ],
      observed: {
        codex: "Abriste el Codex del Arquitecto. Estúdialo despacio — cada reliquia esconde una historia.",
        vault: "El Cristal se quebró, y la memoria se derramó. Observa la reliquia con calma.",
        milestone: "Ocho runas encendidas. El árbol reconoce tu dedicación — ¡sigue hasta el núcleo!",
        photoClick: "Tocaste el Núcleo Arcano. El Codex ahora despierta para recibirte.",
      },
      conversation: {
        goodmorning: {
          title: "¿Buenos días?",
          body: "¿Qué quieres decir? ¿Me estás deseando un buen día o afirmando que este es un buen día quiera yo o no? ¿O acaso quieres decir que te sientes bien hoy, o aún que es un buen día para estar bien?",
        },
        hello: {
          title: "Saludos",
          body: "Salve, viajero. Encuentros como este rara vez ocurren por azar. Dime qué te trajo a este Árbol — y te diré si merece respuesta.",
        },
        howareyou: {
          title: "¿Cómo vas?",
          body: "Voy como va un mago: cansado de los impacientes, paciente con los necios, y siempre exactamente donde debo estar. Y tú, viajero — ¿vienes a conversar o a aprender?",
        },
        whoareyou: {
          title: "¿Quién eres?",
          body: "Soy Merlin, guardián de este archivo. Conozco cada nodo del Árbol, cada cristal de la Memoria y cada sello del Codex. Haz la pregunta correcta y te mostraré la puerta.",
        },
        thanks: {
          title: "De nada",
          body: "No me agradezcas aún. La sabiduría cuesta poco cuando se escucha, y mucho cuando se aplica. Vuelve siempre que necesites una palabra — o una advertencia.",
        },
        goodbye: {
          title: "Hasta pronto",
          body: "Ve en paz, viajero, y que el viento te sea favorable. Cuando regreses, el Árbol seguirá exactamente donde lo dejaste.",
        },
        time: {
          title: "Sobre el tiempo",
          body: "Un mago nunca llega tarde, viajero. Tampoco temprano. Llega precisamente cuando se lo propone — y lo mismo se aplica a tus commits.",
        },
        why: {
          title: "¿Por qué?",
          body: "Por qué es la pregunta más peligrosa que un arquitecto puede hacer — y la única que vale la pena hacer. Sigue formulándola, incluso cuando nadie quiera responder.",
        },
        howold: {
          title: "¿Cuántos años?",
          body: "Más viejo de lo que parezco, más joven de lo que aparento. Nací antes del primer compilador y aún así sigo esperando una build sin warnings.",
        },
      },
    },

    // ─────────────────────────────────────────────────────────────
    // ENGLISH
    // ─────────────────────────────────────────────────────────────
    en: {
      hero: {
        title: "Welcome, traveller",
        body: "Welcome to Carlos Vaz's Portfolio! Here you will find the Tree of Knowledge, the Memory Crystals holding lived projects, the Architect's Codex, and the Arcane Contracts. Explore — every node holds a story.",
      },
      tree: "Each node you light brings you closer to the full ritual. Take your time.",
      grimoire: "These manuscripts are real. Every repository holds a battle won.",
      portal: "The portal awaits. Strategic alliances begin with an honest message.",
      summon: "The ritual is complete. I have waited ages for this moment.",
      idle: [
        "A good architect designs the silence between components.",
        "AI is the familiar. You are the mage who sets the intent.",
        "Bad prompts are mispronounced spells. Review the incantation.",
      ],
      stunned: [
        "Oof... shake the mouse like that and even a Maia gets dizzy.",
        "Stars... I see stars. And not the ones on my hat.",
        "Whoa! Too many force-pushes in my vestibule. Give me a moment.",
      ],
      wisdom: [
        "A wizard is never late, my friend, nor is he early. He commits precisely when he means to! Remember to commit often.",
        "You shall not pass! ...unless your code has proper try-catch error handling blocks.",
        "All we have to decide is what to do with the time that is given us. I suggest refactoring that legacy module first.",
        "I have no memory of this place... Me, returning to a codebase I wrote three weeks ago without inline comments.",
        "Run, you fools! The server has run out of heap memory and the main process is crashing!",
        "Do not be too eager to deal out force-pushes in judgment. Even the very wise cannot see all git merge conflicts.",
        "It is a dangerous business going out your door... You step onto the road, and if you don't keep your feet, there's no knowing where you might be swept off to. Just like running 'npm install' without checking the package details!",
        "Shortcuts make long delays. Remember this before copy-pasting boilerplate code you don't understand.",
        "One root component to rule them all, one layout to find them. One system to bring them all, and in the DOM tree bind them.",
        "Keep it secret, keep it safe! Store your API keys in environment variables (.env), never commit them to the repository!",
        "Despair is only for those who see the end beyond all doubt. We do not. Go ahead, clear the cache and rebuild the project!",
        "He that breaks a thing to find out what it is has left the path of wisdom. Unless it is a compressed JSON payload, then feel free to inspect it.",
        "The gray rain-curtain of this world rolls back, and all turns to silver glass... And then you see it: compiled with 0 errors and 0 warnings. Pure magic.",
        "Do not trust a compile that has no errors, for it may hide greater mysteries. Always test your edge cases!",
        "Many that live deserve death. And some that die deserve life. Can you give it to them? Then do not be too eager to delete old files in the repository.",
      ],
      characters: {
        frodo: "Frodo Baggins of the Shire, the Ring-bearer. A brave hobbit who carried the One Ring to Mount Doom. Much like a small component carrying the critical state of the entire system!",
        sauron: "The Dark Lord of Mordor, creator of the One Ring. He represents the ultimate memory leak, spreading corruption across the Middle-earth server. Keep your eyes open!",
        gandalf: "Olórin he was called in the West. A Maia, wielder of the Flame of Anor and the Ring of Fire, Narya. Wiser than any developer, he guides travelers through Moria and recursive functions.",
        gollum: "Smeagol, corrupted by the One Ring (his precious). He is like a thread stuck in an infinite loop, obsessed with a single variable and unable to release his hold on it.",
        aragorn: "Elessar, the Elfstone, Dúnadan, heir of Isildur. The true king of Gondor, who refactored the broken shards of Narsil into Andúril, the Flame of the West — a legendary sword of clean code.",
        legolas: "A master of asynchronous archer operations. Fast, lightweight, and hits the target instantly. His rendering speed is unmatched by any dwarf or human.",
        gimli: "A sturdy warrior of the dwarf class. He prefers solid, monolithic backend structures. 'Faithless is he that says farewell when the road darkens!', he says about microservice architectures.",
        elrond: "Lord of Rivendell, who hosts the Council of Elrond. Essentially the architect conducting the initial project kickoff meeting and establishing the design tokens of the Fellowship.",
        moria: "The great underground kingdom of the Dwarves. Beware of nesting loops too deep, for if you delve too greedily and too deep, you might awaken a Balrog of stack overflow!",
        shire: "A calm, beautiful land of green fields, hobbit holes, and static HTML templates. No complex React state, just peace, quiet, and good tilled earth.",
      },
      tech: {
        html: "HTML is the skeleton, the ancient stone walls of our citadel. Build it semantically and strong, so that screen readers and search crawlers may navigate it safely.",
        css: "CSS is the magical aura, the gold filigree and glowing runes on the stone walls. It transforms basic layouts into beautiful, premium visual realms.",
        js: "JavaScript is the active spellcasting. It breathes life into the static architecture, turning books, carousels, and sprites into living, interactive artifacts.",
        react: "React is the school of component evocation. It breaks down complex interfaces into reusable, reactive modules, managed by a virtual state tree.",
        node: "Node.js is the alchemy of backend transmutation, allowing JavaScript spells to run on the server, building portals, databases, and APIs.",
        git: "Git is the chronicler of history. It records every spell (commit) cast on the codebase, allowing you to travel back in time if a dark magic breaks the system.",
        api: "APIs are the message-carrying owls of the digital world. They request and deliver scrolls of data between distant kingdoms.",
        "clean code": "Clean code is written for humans first, and machines second. Use descriptive names, write modular functions, and document your grimoire.",
        bug: "A bug is a stray goblin in the code walls. Track it down with step-by-step debuggers, and banish it from the repository!",
        refactor: "Refactoring is polishing the ancient sword. You improve the internal structure of the code without changing its external behavior.",
      },
      welcome: {
        title: "Carlos Vaz's Portfolio",
        body: "Welcome! Explore the Tree of Knowledge (skills), open the Memory Crystals (projects), read the Architect's Codex (Carlos' story) and consult the Arcane Contracts (services). Touch me for wisdom — or whisper a question to my scroll.",
      },
      thinking: "Merlin ponders…",
      ask: "Whisper a question…",
      portfolio: "This archive is the journey of Carlos Vaz, the Arcane Architect. Each section hides a chapter: the Tree shows his technical mastery, the Crystals hold lived projects, the Codex reveals his origin, and the Contracts seal what he can forge for you.",
      services: {
        landing: { title: "Arcane Landing Page", body: "A single enchanted page — forged in HTML, CSS and JavaScript — to herald a product, service, event or campaign with striking presence. Investment from €590 (R$ 3,290), ready in about one to two weeks. Seek its seal in the Codex of Contracts." },
        institucional: { title: "Institutional Site", body: "A small digital realm of several pages that establishes authority and trust for companies and brands. Investment from €1,290 (R$ 6,900). It includes deploy, SSL, mobile responsiveness and initial SEO." },
        portfolio: { title: "Professional Portfolio", body: "A living archive narrating your journey — projects, identity and experience woven into storytelling, much like this portal you wander. Investment from €1,790 (R$ 8,900)." },
        automacao: { title: "Arcane Automation & AI", body: "Spells that work for you: integrations, AI agents, chatbots and flows with n8n, APIs and LLMs that free you from repetitive toil. Investment from €2,990 (R$ 14,900)." },
        narrativa: { title: "Visual Narrative", body: "The rarest art of the atelier: a thematic, cinematic site with its own world and full immersion — sibling to this portal. Investment from €1,290 (R$ 7,200)." },
        sobmedida: { title: "Bespoke Project", body: "When no common contract will serve, a unique artefact is forged to your vision — systems, platforms, rare experiences. From €2,490 (R$ 13,900), with a quote sealed to measure." },
      },
      kb: {
        pricing: "The Arcane Contracts range from the Landing Page (€590 · R$ 3,290) to the Bespoke Project (€2,490+ · R$ 13,900+), through the Institutional Site (€1,290), Professional Portfolio (€1,790), AI Automation (€2,990) and Visual Narrative (€1,290). Open the Codex of Contracts to see each seal, what it includes and the timeline.",
        included: "Every pact seals a complete artefact, not merely a site: professional deploy, SSL certificate (HTTPS), mobile responsiveness, initial SEO, domain setup and initial support — together with storytelling, cinematic animations, light/dark mode and a project gallery.",
        delivery: "Time varies with the contract's rarity: a Landing Page is born in some seven to fifteen days; greater realms, such as institutional sites and visual narratives, ask for a few weeks. The exact timeline is sealed before the work begins.",
        skills: "Carlos commands the Front-End (HTML, CSS, JavaScript, TypeScript, React, Next.js), the Back-End (Node, APIs, databases), the Cloud, Automation and Artificial Intelligence (Prompt Engineering, RAG, agents, LLMs). Walk the Tree of Knowledge to see every lit branch.",
        projects: "The Memory Crystals hold real projects drawn from Carlos' GitHub — among them XDEVS and a Yu-Gi-Oh clone. Touch a crystal to crack it open and reveal the story it holds.",
        hire: "To seal a pact, open the Portal and send an honest message, or consult the Summoning Signals in the Architect's Codex. Tell me what you need and your budget — the reply arrives on golden parchment.",
        why: "Carlos unites three arts that rarely walk together: solid code, art direction and storytelling. He delivers not merely a site — but a living artefact, with its own identity and an experience that lingers.",
        convergence: "Every ten days, a rare Arcane Convergence favours a single contract with a temporary blessing — a benefit inscribed as a cosmic event, not a mere promotion. Watch the Codex: the blessed contract bears the seal and a countdown.",
      },
      contact: "To conjure contact, open the Portal or consult the Summoning Signals inside the Architect's Codex. Every message arrives on golden parchment and is answered with diligence.",
      resume: "The full résumé rests inside the Architect's Codex. There you will find formation, research, languages, volunteer work, and a button to download the parchment as PDF.",
      jokes: [
        "Why did the developer wander into the forest? He heard there were many branches!",
        "How does a wizard solve a null pointer? He casts a 'protego' called optional chaining.",
        "I have 99 bugs in my code… I fix one, and now I have 127 bugs.",
        "Hobbits love CSS — it is a land of many box-sized elements.",
      ],
      fallback: [
        "Hmm… that rune I do not know, but the wind whispers the answer may rest in the Tree of Knowledge or in the Memory Crystals.",
        "Many riddles cross these halls. Try asking about a character (Frodo, Gandalf, Sauron) or a technology (HTML, React, Git).",
        "The scroll is silent on that matter. I can speak of Aragorn, or explain what refactor means — if you wish.",
      ],
      observed: {
        codex: "You opened the Architect's Codex. Study it slowly — every relic hides a story.",
        vault: "A Crystal has been cracked open, and its memory spilled out. Behold the relic in peace.",
        milestone: "Eight runes lit. The Tree acknowledges your devotion — follow the trail to the core!",
        photoClick: "You have touched the Arcane Core. The Codex now awakens to receive you.",
      },
      conversation: {
        goodmorning: {
          title: "Good morning?",
          body: "What do you mean? Do you wish me a good morning, or mean that it is a good morning whether I want it or not? Or that you feel good this morning? Or that it is a morning to be good on?",
        },
        hello: {
          title: "Greetings",
          body: "Hail, traveller. Such meetings rarely happen by chance. Tell me what brought you to this Tree — and I will tell you whether it deserves an answer.",
        },
        howareyou: {
          title: "How fare you?",
          body: "I fare as a wizard fares: weary of the impatient, patient with fools, and always exactly where I should be. And you, traveller — do you come to converse, or to learn?",
        },
        whoareyou: {
          title: "Who are you?",
          body: "I am Merlin, keeper of this archive. I know every node of the Tree, every crystal of Memory and every seal of the Codex. Ask the right question, and I will show you the door.",
        },
        thanks: {
          title: "You are welcome",
          body: "Do not thank me yet. Wisdom costs little when it is heard, and much when it is applied. Return whenever you need a word — or a warning.",
        },
        goodbye: {
          title: "Farewell",
          body: "Go in peace, traveller, and may the wind be at your back. When you return, the Tree will be exactly where you left it.",
        },
        time: {
          title: "On time",
          body: "A wizard is never late, traveller. Nor is he early. He arrives precisely when he means to — and the same is true of your commits.",
        },
        why: {
          title: "Why?",
          body: "Why is the most dangerous question an architect can ask — and the only one worth asking. Keep asking it, even when no one wants to answer.",
        },
        howold: {
          title: "How old?",
          body: "Older than I look, younger than I appear. I was born before the first compiler, and yet I still wait for a build without warnings.",
        },
      },
    },
  },

  init() {
    this.el       = document.getElementById("merlin");
    this.avatar   = document.getElementById("merlin-avatar");
    this.scroll   = document.getElementById("merlin-bubble");   // parchment scroll
    this.text     = document.getElementById("merlin-text");
    this.form     = document.getElementById("merlin-form");
    this.input    = document.getElementById("merlin-input");
    this.spellEl  = document.getElementById("merlin-spell");

    if (!this.el) return;

    /* Internal state */
    this._lastIdle        = null;
    this._scrollVisible   = false;
    this._spotIdx         = 0;
    this._lastInteraction = Date.now();

    /* Cursor-escort + stun state */
    this._cursor          = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this._lastPointerMove = 0;
    this._chaseActive     = false;
    this._stunned         = false;
    this._chaseRAF        = null;
    this._chaseEndTimer   = null;
    this._lastFx          = 0;
    this._chase           = { cx: 0, cy: 0, theta: 0, radius: 50 };
    this._shake           = { lastX: 0, lastT: 0, dir: 0, reversals: 0, windowStart: 0 };

    /* Fire-cast episode state (the "ignite the cursor" spell). */
    this._chaseMode       = "orbit";   // "orbit" | "cast"
    this._castTimers      = [];        // pending step timers (cleared on stun/return)
    this._casting         = false;
    this._cursorFlame     = null;      // the live flame element riding the cursor
    this._cursorFlameRAF  = null;
    this._cursorGhost      = null;      // visible arrow that chars while burning
    this._charTimers      = [];        // pending pointer-charring steps

    /* Mobile-discretion state: track scrolling so proactive chatter
       never pops over content the visitor is reading / about to tap. */
    this._lastScroll       = 0;
    this._proactiveVisible = false;     // is the visible scroll auto-shown?

    this.el.setAttribute("aria-hidden", "false");
    this.el.classList.add("is-visible");

    /* Avatar click — speak a random pearl of wisdom + cast spell. */
    this.avatar?.addEventListener("click", () => {
      this._lastInteraction = Date.now();
      this.castSpell();
      this.speakIdle();
    });

    /* Quill input — visitor question routing. */
    this.form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = (this.input?.value || "").trim();
      if (!q) return;
      this._lastInteraction = Date.now();
      this.input.value = "";
      this.ask(q);
    });
    /* Tracking pointer/keyboard activity to defer idle ticker. */
    ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) => {
      window.addEventListener(ev, () => { this._lastInteraction = Date.now(); }, { passive: true });
    });
    /* Dedicated pointer tracking for the cursor escort + shake detector. */
    window.addEventListener("pointermove", (e) => this._onPointerMove(e), { passive: true });

    /* Scroll tracking for mobile discretion. While the visitor is
       scrolling, any PROACTIVE (auto-shown) parchment is dismissed so
       it never sits over the content they're reading or about to tap.
       A user-asked answer or the "thinking" state is left alone. */
    const onScroll = () => {
      this._lastScroll = Date.now();
      if (!this._isMobile()) return;
      if (this._scrollVisible && this._proactiveVisible &&
          !this.scroll?.classList.contains("is-thinking")) {
        this.scroll.classList.remove("is-visible");
        this._scrollVisible = false;
        this._proactiveVisible = false;
        clearTimeout(this._hideTimer);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });

    /* Cross-module events. */
    window.addEventListener("merlin-summon", () => this.onSummon());

    window.addEventListener("langchange", () => {
      this.refreshPlaceholder();
      if (this._scrollVisible) this.speakIdle();
    });

    /* Contextual triggers: milestone + photo click + codex/vault open. */
    window.addEventListener("cv-milestone-8skills", () => {
      this.castSpell({ count: 14 });
      this.showScroll(this.msgPath("observed.milestone"));
    });
    window.addEventListener("cv-milestone-photo-clicked", () => {
      this.castSpell({ count: 12 });
      this.showScroll(this.msgPath("observed.photoClick"));
    });
    /* Detect codex/vault open by watching the document.body class. */
    this._bodyObserver = new MutationObserver(() => this.checkBodyState());
    this._bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    /* Welcome the visitor a few seconds after the page loads. The
       Arcane Welcome overlay finishes around t≈11s; we wait a touch
       longer so Merlin doesn't clash with that timing. */
    this.refreshPlaceholder();
    this.observeSections();
    this.startTeleport();
    this.startIdleTicker();
    this.startCursorEscort();
    this._scheduleWelcome();

    /* Dev / QA: ?merlin-fire=1 replays the fire-cast on the live cursor. */
    try {
      if (new URLSearchParams(window.location.search).get("merlin-fire") === "1") {
        setTimeout(() => this.triggerFireCast(), 1600);
      }
    } catch (_e) { /* ignore */ }
  },

  /** Update the input placeholder when the user switches language. */
  refreshPlaceholder() {
    if (!this.input) return;
    this.input.placeholder = this.msg("ask");
    this.input.setAttribute("aria-label", this.msg("ask"));
  },

  /** Track body-class transitions to whisper contextual lines. */
  checkBodyState() {
    const body = document.body;
    const codexOpen = body.classList.contains("is-codex-open") ||
                      body.classList.contains("is-codex-summoning");
    const vaultOpen = body.classList.contains("vault-open");
    if (codexOpen && !this._wasCodexOpen) {
      this._wasCodexOpen = true;
      // Skip during the summoning animation (Merlin is hidden by CSS).
      // We re-emit after open completes.
      window.setTimeout(() => {
        if (document.body.classList.contains("is-codex-open")) {
          this.showScroll(this.msgPath("observed.codex"));
        }
      }, 800);
    } else if (!codexOpen) {
      this._wasCodexOpen = false;
    }
    if (vaultOpen && !this._wasVaultOpen) {
      this._wasVaultOpen = true;
      window.setTimeout(() => {
        if (document.body.classList.contains("vault-open")) {
          this.showScroll(this.msgPath("observed.vault"));
        }
      }, 600);
    } else if (!vaultOpen) {
      this._wasVaultOpen = false;
    }
  },

  /** Resolve the active language to one of pt / gl / es / en.
   *  Falls back to pt for any unknown locale so the bubble never
   *  goes empty.  */
  lang() {
    const raw = (window.I18n?.lang || "pt").toLowerCase();
    if (raw === "gl" || raw === "es" || raw === "en" || raw === "pt") return raw;
    if (raw.startsWith("gl")) return "gl";
    if (raw.startsWith("es")) return "es";
    if (raw.startsWith("en")) return "en";
    return "pt";
  },

  /** Pick a single section-scoped message (hero / tree / …). */
  msg(key) {
    const pool = this.messages[this.lang()] || this.messages.pt;
    const fallback = this.messages.pt;
    return pool[key] || fallback[key] || (pool.idle && pool.idle[0]) || "";
  },

  /** Look up a dotted key like "observed.codex" → pack.observed.codex. */
  msgPath(path) {
    const pool = this.messages[this.lang()] || this.messages.pt;
    const fallback = this.messages.pt;
    const dig = (obj) => path.split(".").reduce(
      (acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj);
    return dig(pool) || dig(fallback) || "";
  },

  say(section) {
    this.showScroll(this.msg(section));
  },

  /** Build the full random repertoire for the active language.
   *  All five banks are mixed together so any avatar click can
   *  surface any line of lore:
   *    idle       — short evergreen taglines
   *    wisdom     — 15 LOTR-flavoured dev aphorisms
   *    jokes      — light tavern humour
   *    characters — 10 LOTR figures as dev metaphors (UPPERCASE
   *                 keyword prefix becomes the scroll title)
   *    tech       — 10 core tech concepts retold as arcane lore
   *                 (UPPERCASE keyword prefix becomes the title)
   *  The "ask-only" conversation bank is intentionally excluded
   *  here — those replies only make sense in direct dialogue.    */
  buildIdlePool() {
    const lang = this.lang();
    const pack = this.messages[lang] || this.messages.pt;
    const pool = [];

    if (Array.isArray(pack.idle))   pool.push(...pack.idle);
    if (Array.isArray(pack.wisdom)) pool.push(...pack.wisdom);
    if (Array.isArray(pack.jokes))  pool.push(...pack.jokes);

    const formatEntry = (key, value) => `${key.toUpperCase()} — ${value}`;
    if (pack.characters && typeof pack.characters === "object") {
      Object.entries(pack.characters).forEach(([k, v]) => pool.push(formatEntry(k, v)));
    }
    if (pack.tech && typeof pack.tech === "object") {
      Object.entries(pack.tech).forEach(([k, v]) => pool.push(formatEntry(k, v)));
    }
    return pool;
  },

  /** "Shuffle bag" idle picker.
   *  Instead of pure random (which clusters repeats), we draw from
   *  a Fisher-Yates-shuffled bag. When the bag is empty we reshuffle.
   *  This guarantees every line in the pool is spoken once before
   *  any repetition. The bag is keyed by language so changing the
   *  locale resets it cleanly. */
  speakIdle() {
    const lang = this.lang();
    if (!this._bag || this._bagLang !== lang || this._bag.length === 0) {
      this._bag     = this._shuffle(this.buildIdlePool());
      this._bagLang = lang;
    }
    if (!this._bag.length) return;

    let pick = this._bag.pop();
    // Avoid immediate back-to-back repeat if the new bag accidentally
    // started with the last picked line.
    if (pick === this._lastIdle && this._bag.length) {
      this._bag.unshift(pick);
      pick = this._bag.pop();
    }
    this._lastIdle = pick;
    this.showScroll(pick);
  },

  /** Fisher-Yates shuffle (in-place, returns the same array). */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /** Render content on the parchment scroll, supporting either:
   *    1) a plain string  — shown as italic body, no title.
   *    2) "TITLE — body"  — split on " — " (em-dash), title becomes
   *       a bold uppercase heading and body the italic paragraph.
   *    3) { title, body } — explicit structured payload.
   *
   *  Auto-hides after a reading window that scales with the visible
   *  text length (5–12 s).
   *
   *  Uses safe DOM construction (createElement + textContent) so we
   *  never inject HTML from user-controlled strings. */
  showScroll(payload) {
    if (!this.scroll || !this.text || !payload) return;

    /* Track whether THIS message was auto-shown (proactive) or asked
       for by the visitor. Proactive parchments are the ones the mobile
       scroll-handler is allowed to dismiss so they never sit over the
       content being read. Consume the transient flag (defaults to
       user-initiated). */
    this._proactiveVisible = this._nextSpeakProactive === true;
    this._nextSpeakProactive = false;

    /* A message takes priority over play — fly home before speaking,
       unless the wizard is mid fire-cast (let the ritual finish). */
    if (this._chaseActive && !this._stunned && this._chaseMode !== "cast") this.endChase();

    let title = "";
    let body  = "";
    if (typeof payload === "string") {
      const sepIdx = payload.indexOf(" — ");
      // Treat as "TITLE — body" only when the prefix looks like a
      // short heading (≤ 28 chars and not full sentences). This
      // prevents the em-dashes inside long prose lines from being
      // misread as titles.
      if (sepIdx > 0 && sepIdx <= 28 && !/[.!?]/.test(payload.slice(0, sepIdx))) {
        title = payload.slice(0, sepIdx).trim();
        body  = payload.slice(sepIdx + 3).trim();
      } else {
        body  = payload;
      }
    } else if (typeof payload === "object") {
      title = payload.title || "";
      body  = payload.body  || "";
    }

    // Compose: clear + rebuild
    this.text.textContent = "";
    if (title) {
      const t = document.createElement("strong");
      t.className = "merlin__title";
      t.textContent = title;
      this.text.appendChild(t);
    }
    if (body) {
      const b = document.createElement("span");
      b.className = "merlin__body";
      b.textContent = body;
      this.text.appendChild(b);
    }

    this.scroll.classList.add("is-visible");
    this._scrollVisible = true;
    clearTimeout(this._hideTimer);

    // Reading window: piso confortável (≥ 11 s), teto generoso (≤ 21 s)
    // e ritmo de ~65 ms/caractere. Antes era 5.5–12 s a 55 ms/char,
    // o que cortava quotes longas antes do tempo. O usuário relatou
    // que algumas mensagens sumiam antes da leitura completa, então
    // somamos +3 s ao janela inteira para uma leitura mais tranquila.
    const totalLen = (title + body).length;
    const readMs = 3000 + Math.min(18000, Math.max(8000, Math.round(totalLen * 65)));
    this._hideTimer = setTimeout(() => {
      this.scroll.classList.remove("is-visible");
      this._scrollVisible = false;
    }, readMs);
  },

  /** Backwards-compatible alias (some older calls still use the
   *  name `showBubble`).  */
  showBubble(text) { this.showScroll(text); },

  onSummon() {
    this.summoned = true;
    this.el.classList.add("is-summoned");
    this.castSpell({ count: 20 });
    this.showScroll(this.msg("summon"));
  },

  /* ─────────────────────────────────────────────────────────────
   * QUESTION ROUTER
   *   Visitors type a question into the quill input. We resolve
   *   it through a priority chain:
   *     0) Elaborate question (>6 words or contains "?") → Brain
   *        (Pollinations LLM, free) — skips keyword router entirely
   *     1) LOTR characters / lore keywords (short lookups only)
   *     2) Tech keywords
   *     3) Portfolio / Carlos identity keywords
   *     4) Contact / message / portal keywords
   *     5) Resume / CV keywords
   *     6) Joke / humour keywords
   *     7) Greeting keywords (hi, olá, hola…)
   *     8) Short unmatched input → Brain; network failure → fallback
   * ───────────────────────────────────────────────────────────── */
  /** True when the visitor typed a real question, not a short lookup.
   *  Elaborate inputs skip the keyword router and go straight to the
   *  free LLM so Merlin can answer in context. The detection is wider
   *  than just "?" — it also catches interrogative words (qual, quem,
   *  como, what, how…) and request verbs (mostra, lista, fala…). */
  isElaborateQuestion(q, rawQuestion) {
    const words = q.split(/\s+/).filter(Boolean);
    if ((rawQuestion || "").includes("?")) return true;
    if (words.length >= 5) return true;

    // Interrogative words (PT/GL/ES/EN, accent-stripped because q
    // is already normalised). Match at the start of the input or as
    // a stand-alone token to avoid false positives.
    const interrogatives = [
      "qual", "quais", "quem", "como", "onde", "quando", "quanto",
      "quantos", "quantas", "porque", "porquê", "porque", "cual",
      "cuales", "donde", "cuando", "cuanto", "cuantos", "cuantas",
      "what", "how", "who", "where", "when", "why", "which",
    ];
    if (interrogatives.some((w) =>
      new RegExp(`(^|\\s)${w}(\\s|$)`, "i").test(q)
    )) return true;

    // Request verbs that imply "tell me", "list", "show me…".
    const verbs = [
      "mostra", "mostre", "mostrar", "lista", "liste", "listar",
      "fala", "fale", "falar", "conta", "conte", "contar",
      "explica", "explique", "explicar", "descreve", "descreva", "descrever",
      "muestra", "muestre", "mostrar", "cuenta", "cuente", "lista",
      "explica", "explique", "describe", "descríbeme",
      "amosa", "amósame",
      "show", "tell", "list", "explain", "describe",
    ];
    if (verbs.some((v) =>
      new RegExp(`(^|\\s)${v}(\\s|$|me|nos|lhe|lhes)`, "i").test(q)
    )) return true;

    return false;
  },

  /* ─────────────────────────────────────────────────────────────
   * LOCAL KNOWLEDGE BASE · portfolio-aware, offline, reliable
   *   Answers the everyday questions a visitor asks about Carlos'
   *   PRODUCTS and the portfolio context — services, prices, what's
   *   included, delivery time, skills, projects, how to hire, why
   *   Carlos, the Arcane Convergence discount — straight from the
   *   per-language `services` / `kb` banks, with NO network call.
   *
   *   `q` is already lowercased + accent-stripped, so every keyword
   *   below is written WITHOUT accents. Returns a {title,body} object
   *   or a plain string ready for showScroll(), or null when the
   *   topic is unknown (so the caller can defer to the LLM Brain).
   * ───────────────────────────────────────────────────────────── */
  localKnowledge(q) {
    if (!q) return null;
    const pack = this.messages[this.lang()] || this.messages.pt;
    const fb   = this.messages.pt;
    const svc  = pack.services || fb.services || {};
    const kb   = pack.kb || fb.kb || {};
    const has  = (...ws) => ws.some((w) => q.includes(w));

    // ── Named services (most specific first) ──
    if (has("landing", "landin", "one page", "onepage", "one-page",
            "pagina de venda", "pagina de vendas", "lp arcana")) return svc.landing;
    if (has("institucional", "site da empresa", "site para empresa",
            "site empresarial", "pagina institucional")) return svc.institucional;
    if (has("portfolio profissional", "portfolio professional",
            "portafolio profesional", "portfolio profesional",
            "site de portfolio")) return svc.portfolio;
    if (has("automacao", "automatizacao", "automation", "chatbot",
            "agente de ia", "agentes de ia", "n8n", "workflow", "zapier",
            "scraping", "integracao de ia")) return svc.automacao;
    if (has("narrativa visual", "storytelling", "site tematico",
            "tematico", "tematica", "cinematografic", "imersiv")) return svc.narrativa;
    if (has("sob medida", "sob-medida", "personalizado", "a medida",
            "exclusivo", "custom")) return svc.sobmedida;

    // ── Topic intents ──
    if (has("inclui", "incluido", "incluye", "included", "include",
            "beneficio", "benefit", "encantament", "deploy", "hospedag",
            "hosting", "dominio", "ssl", "https", "seo", "responsiv",
            "manutenc", "suporte", "support", "garantia", "o que vem",
            "o que ganho", "entregue")) return kb.included;
    if (has("prazo", "quanto tempo", "tempo de entrega", "demora",
            "deadline", "how long", "cuanto tarda", "canto tarda",
            "duracao", "tempo leva", "quando fica", "quando entrega",
            "entrega em")) return kb.delivery;
    if (has("habilidade", "skill", "competenc", "tecnologia", "tecnologias",
            "tech stack", "stack", "ferramenta", "domina", "sabe fazer",
            "o que sabe", "what can you do", "what does carlos",
            "linguagens", "frameworks")) return kb.skills;
    if (has("diferencial", "differential", "vantagem", "advantage",
            "why carlos", "porque carlos", "por que carlos", "why you",
            "why should", "por que contratar", "porque escolher",
            "por que escolher", "por que voce", "porque voce")) return kb.why;
    if (has("convergencia", "convergence", "desconto", "discount",
            "bencao", "promocao", "oferta", "blessing", "abencoad",
            "favorecid", "cupom", "cupao")) return kb.convergence;
    if (has("contratar", "contrate", "hire", "contratacao",
            "trabalhar com", "work with", "quero um site",
            "preciso de um site", "need a site", "quote", "fazer um site",
            "criar um site", "como funciona", "comecar um projeto",
            "iniciar um projeto", "fazer um orcamento")) return kb.hire;
    if (has("projeto", "projetos", "project", "proyecto", "proxecto",
            "trabalho", "trabajo", "cristais", "crystals", "github",
            "repositorio", "repos", "xdevs", "yu-gi-oh", "yugioh",
            "ja fez", "ja construiu", "o que construiu")) return kb.projects;

    // ── Generic site / website → institutional offering ──
    if (has("website", "web site", "criar site", "fazer site",
            "meu site", "um site", "site novo", "preciso de site")) return svc.institucional;

    // ── Pricing intent without a named service → tier overview ──
    if (has("preco", "precos", "preço", "precio", "precios", "custa",
            "custo", "quanto custa", "quanto", "valor", "valores",
            "orcamento", "orcar", "price", "pricing", "cost", "cuanto",
            "cuesta", "investimento", "investir", "plano", "planos",
            "pacote", "pacotes", "tarifa", "budget")) return kb.pricing;

    return null;
  },

  ask(rawQuestion) {
    const q = (rawQuestion || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // strip accents
      .trim();
    if (!q) return;

    const pack = this.messages[this.lang()] || this.messages.pt;
    this.castSpell();

    // Portfolio-context KNOWLEDGE BASE first — services, prices, skills,
    // projects, hiring… answered instantly and reliably with no network
    // dependency. Returns null for open/unknown topics so they still
    // reach the conversational layer or the LLM Brain below.
    const local = this.localKnowledge(q);
    if (local) return this.showScroll(local);

    // Elaborate / open questions → Brain first (free LLM, Gandalf voice).
    if (this.isElaborateQuestion(q, rawQuestion)) {
      return this.thinkAndRespond(rawQuestion);
    }

    // 1. LOTR characters / lore — match against the keys of the
    //    characters object (frodo, gandalf, …) plus a couple of
    //    aliases users might try.
    const lotrAliases = {
      "anel": "frodo", "ring": "frodo", "ring-bearer": "frodo",
      "smeagol": "gollum", "smiagol": "gollum",
      "olorin": "gandalf", "wizard": "gandalf", "mago": "gandalf",
      "elessar": "aragorn", "strider": "aragorn",
      "elfo": "legolas", "elf": "legolas",
      "anão": "gimli", "anao": "gimli", "dwarf": "gimli",
      "rivendell": "elrond", "imladris": "elrond",
      "comarca": "shire", "condado": "shire",
      "mordor": "sauron", "balrog": "moria",
    };
    if (pack.characters) {
      const direct = Object.keys(pack.characters).find((k) => q.includes(k));
      if (direct) return this.showScroll(`${direct.toUpperCase()} — ${pack.characters[direct]}`);
      const alias = Object.keys(lotrAliases).find((k) => q.includes(k));
      if (alias) {
        const target = lotrAliases[alias];
        if (pack.characters[target]) {
          return this.showScroll(`${target.toUpperCase()} — ${pack.characters[target]}`);
        }
      }
    }

    // 2. Tech topics
    const techAliases = {
      javascript: "js", node: "node", "node.js": "node", nodejs: "node",
      "node js": "node", reactjs: "react", "react.js": "react",
      "git hub": "git", github: "git", "version control": "git",
      controle: "git", versionamento: "git",
      "rest": "api", endpoint: "api", endpoints: "api",
      "endpoints rest": "api",
      depuracao: "bug", depuração: "bug", depurar: "bug",
      depurador: "bug", debug: "bug", debugger: "bug",
      refatorar: "refactor", refatoracao: "refactor", refactoring: "refactor",
      "codigo limpo": "clean code", "código limpo": "clean code",
      "código limpio": "clean code", "codigo limpio": "clean code",
    };
    if (pack.tech) {
      const direct = Object.keys(pack.tech).find((k) => q.includes(k));
      if (direct) return this.showScroll(`${direct.toUpperCase()} — ${pack.tech[direct]}`);
      const alias = Object.keys(techAliases).find((k) => q.includes(k));
      if (alias) {
        const target = techAliases[alias];
        if (pack.tech[target]) {
          return this.showScroll(`${target.toUpperCase()} — ${pack.tech[target]}`);
        }
      }
    }

    // 3. Portfolio / Carlos identity
    if (/\b(carlos|portfolio|portif|portafolio|portafol|sobre|about|who|quem|quien|projeto|project|proyect|proxect|arquiteto|arquitect|architect)\b/.test(q)) {
      return this.showScroll(pack.portfolio || this.messages.pt.portfolio);
    }

    // 4. Contact / message / portal
    if (/\b(contato|contacto|contact|portal|message|mensagem|mensaxe|mensaje|email|e-mail|linkedin|whatsapp|telefone|telefone|fala|talk|hire|contratar)\b/.test(q)) {
      return this.showScroll(pack.contact || this.messages.pt.contact);
    }

    // 5. Resume / CV
    if (/\b(curriculo|currículo|curriculum|cv|resume|resumé|formacao|formação|formacion|experiencia|experiência|experience|estudos|educacao|educação|education)\b/.test(q)) {
      return this.showScroll(pack.resume || this.messages.pt.resume);
    }

    // 6. Jokes / humour
    if (/\b(piada|joke|chiste|humor|risada|gracioso|engracado|engraçado|laugh|funny)\b/.test(q)) {
      const jokes = pack.jokes || this.messages.pt.jokes;
      if (jokes && jokes.length) {
        return this.showScroll(jokes[Math.floor(Math.random() * jokes.length)]);
      }
    }

    /* ─────────────────────────────────────────────────────────
     * 7. CONVERSATIONAL LAYER · Gandalf-style replies
     *    The visitor may simply type "hi", "good morning",
     *    "how are you?", "thanks", "bye"… Merlin must answer
     *    in character — never a robotic "I am a bot".
     *    Each branch returns a structured {title, body} payload.
     * ───────────────────────────────────────────────────────── */
    const conv = pack.conversation || this.messages.pt.conversation || {};
    const sayConv = (k) => this.showScroll(conv[k] || this.messages.pt.conversation[k]);

    // 7a. Good morning / good day — Bilbo–Gandalf classic
    if (/\b(bom dia|bo dia|buenos dias|buenos días|good morning|good day|buen dia|buen día)\b/.test(q)) {
      return sayConv("goodmorning");
    }
    // 7b. Generic greeting
    if (/\b(ola|olá|oi|ei|hi|hello|hey|hola|salve|saudacoes|saudações|saudaco)\b/.test(q)) {
      return sayConv("hello");
    }
    // 7c. How are you?
    if (/\b(como (vai|vais|estas|estás|esta|está|va|vas|estais|esteis)|tudo bem|tudo bom|how are you|how do you do|how's it going|que tal|qué tal)\b/.test(q)) {
      return sayConv("howareyou");
    }
    // 7d. Who are you?
    if (/\b(quem (es|és|e|é) (tu|voce|você)|quien eres|quién eres|who are you|what are you|que (es|és|e|é) tu)\b/.test(q)) {
      return sayConv("whoareyou");
    }
    // 7e. Thanks
    if (/\b(obrigad[oa]|grato|grazas|gracias|thanks|thank you|ty|cheers|valeu)\b/.test(q)) {
      return sayConv("thanks");
    }
    // 7f. Goodbye
    if (/\b(adeus|tchau|ate (logo|breve|ja|já)|ata (logo|breve)|hasta luego|hasta pronto|adios|adiós|bye|goodbye|farewell|see you)\b/.test(q)) {
      return sayConv("goodbye");
    }
    // 7g. Time / late / hour
    if (/\b(que horas|horas e|hora es|que hora|what time|que tarde|atrasad|late|tarde|cedo|early)\b/.test(q)) {
      return sayConv("time");
    }
    // 7h. Why
    if (/^(por que|porque|por qué|why|porqué|porqu)\b/.test(q)) {
      return sayConv("why");
    }
    // 7i. How old
    if (/\b(quantos anos|cuantos anos|cuántos años|how old|que idade|qué edad|idade tens|idade tem|edad tienes|edad tien)\b/.test(q)) {
      return sayConv("howold");
    }

    // 8. OPEN QUESTION → wake the Brain (Pollinations.ai LLM)
    //    For anything that the keyword router didn't catch, we
    //    consult the remote LLM as Gandalf. The thematic fallback
    //    is reserved for the case the network call itself fails.
    return this.thinkAndRespond(rawQuestion);
  },

  /* ─────────────────────────────────────────────────────────────
   * BRAIN · open-question dialogue
   *   Calls the Pollinations.ai free OpenAI-compatible endpoint
   *   with a strict Gandalf system prompt + the visitor's question.
   *   While waiting we render the parchment in a "thinking" state
   *   (animated dots) and disable the quill input.
   *   On error or timeout we fall back to the existing thematic
   *   fallback line so the visitor never sees a raw failure.
   * ───────────────────────────────────────────────────────────── */
  async thinkAndRespond(rawQuestion) {
    const question = (rawQuestion || "").toString().trim().slice(0, 500);
    if (!question) return;

    this.showThinking();

    try {
      const reply = await this.brainThink(question, this.lang());
      // Sanitise: trim, collapse whitespace, strip markdown asterisks
      // and angle-quoted leftovers that some models emit.
      const clean = reply
        .replace(/[*_`>#]+/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!clean) throw new Error("empty-reply");
      // Keep within scroll capacity (≈ 600 chars max).
      const safe = clean.length > 600 ? clean.slice(0, 597) + "…" : clean;
      this.hideThinking();
      this.showScroll(safe);
    } catch {
      this.hideThinking();
      // The network oracle is silent — try the local knowledge base
      // before resorting to a generic deflection, so questions about
      // services, prices or skills still get a real answer offline.
      const norm = (rawQuestion || "").toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const local = this.localKnowledge(norm);
      if (local) return this.showScroll(local);
      const pack = this.messages[this.lang()] || this.messages.pt;
      const fb = pack.fallback || this.messages.pt.fallback;
      this.showScroll(fb[Math.floor(Math.random() * fb.length)]);
    }
  },

  /** Build the dynamic context block: current GitHub projects loaded
   *  by the Crystals module + concrete CV entries. This is appended
   *  to every system prompt so Merlin can answer specific questions
   *  like "what projects has Carlos built?" or "what is his
   *  academic background?" with real data instead of deflecting. */
  brainContextBlock() {
    const lines = [];

    // Real GitHub projects loaded by the Memory Crystals module.
    const projects =
      (window.Crystals && Array.isArray(window.Crystals.projects))
        ? window.Crystals.projects.slice(0, 12)
        : [];
    if (projects.length) {
      lines.push("CARLOS' GITHUB PROJECTS (live, sorted by rarity):");
      projects.forEach((p) => {
        const name = p.title || p.name || "(unnamed)";
        const desc = (p.description || "").replace(/\s+/g, " ").slice(0, 140);
        const tech = Array.isArray(p.tech) && p.tech.length
          ? ` [tech: ${p.tech.slice(0, 5).join(", ")}]`
          : (p.language ? ` [${p.language}]` : "");
        const stars = p.stars ? ` ★${p.stars}` : "";
        const url = p.url || p.githubUrl || "";
        lines.push(`• ${name}${tech}${stars} — ${desc}${url ? "  " + url : ""}`);
      });
      lines.push("");
    }

    // Detailed CV / Codex content (kept short; the LLM extracts).
    lines.push("CARLOS — DETAILED CV (Codex do Arquiteto):");
    lines.push("• Name: Carlos Vaz. Role: Environmental Manager + Full Stack Web Developer + AI Specialist.");
    lines.push("• Languages: Portuguese (native), English (B2 — TOEFL iBT), Spanish (intermediate), Galician (basic).");
    lines.push("");
    lines.push("EDUCATION TIMELINE:");
    lines.push("• 2019–2023 — Tecnologia em Gestão Ambiental, IFRS (Instituto Federal do Rio Grande do Sul, Brazil).");
    lines.push("• 2022–2023 — Academic Mobility at IPB (Instituto Politécnico de Bragança, Portugal): Languages for International Relations + Environmental Engineering.");
    lines.push("• 2024–present — Web Developer Full Stack, asynchronous extension programme with monitoring & support.");
    lines.push("");
    lines.push("RESEARCH & VOLUNTEER:");
    lines.push("• 2021–2022 — PROBIC FAPERGS scholarship: 'Mapping and Taxonomic Cataloguing of Flora and Fauna at Parque Saint'Hilaire'.");
    lines.push("• 2020–2022 — Volunteer intern at Parque Saint'Hilaire (Porto Alegre): environmental education and conservation.");
    lines.push("• 2019–2020 — Bolsista NEA: Hortas Escolares Agroecológicas — agroecology and school gardens.");
    lines.push("• 2022–2023 — Founder & Voluntary Coordinator of the IPB Chess Club + Mentoring Academy at ESTiG (Bragança).");
    lines.push("");
    lines.push("PROFESSIONAL DATA:");
    lines.push("• CREA registration (Conselho Regional de Engenharia e Agronomia).");
    lines.push("• Driving license category AB (Brazilian CNH).");
    lines.push("• Interests: climate action, sustainability, technology and digital transformation applied to environmental management.");
    lines.push("");
    lines.push("TECH STACK (current, drawn from the Skill Tree):");
    lines.push("• Frontend: HTML5, CSS3, JavaScript, TypeScript, React, Next.js, Vue, Astro, Tailwind, Bootstrap, UX/UI Design.");
    lines.push("• Backend: Node.js, Express, NestJS, REST, GraphQL, SQL, MongoDB, Redis, Docker.");
    lines.push("• AI: Prompt Engineering, LLM design, RAG, Embeddings, Fine-Tuning, Agents, MCP, Vector DBs, LangChain, LangGraph, OpenAI / Gemini / Claude APIs.");
    lines.push("• Automation: n8n, Zapier, Make, Python automation, Web Scraping, Browser automation.");
    lines.push("• Cloud / DevOps: AWS, Azure, GCP, Vercel, Cloudflare, CI/CD, Git, GitHub.");
    lines.push("");
    lines.push("SERVICES (Arcane Contracts, paid — prices match the Codex):");
    lines.push("• Landing Page Arcana (Common): from €590 / R$3.290. Single page; HTML/CSS/JS; ~1–2 weeks.");
    lines.push("• Site Institucional (Uncommon): from €1.290 / R$6.900. Multi-page authority site.");
    lines.push("• Portfólio Profissional (Rare): from €1.790 / R$8.900. Story-driven personal/brand portfolio.");
    lines.push("• Automação Arcana e IA (Epic): from €2.990 / R$14.900. n8n, APIs, AI agents/chatbots, integrations.");
    lines.push("• Narrativa Visual (Mythic): from €1.290 / R$7.200. Thematic, cinematic, immersive site.");
    lines.push("• Projeto Sob Medida (Legendary): from €2.490 / R$13.900 — custom quote.");
    lines.push("• Every contract includes: professional deploy, SSL/HTTPS, mobile responsiveness, initial SEO, domain setup, initial support, plus storytelling, cinematic animations and light/dark mode.");
    lines.push("• Arcane Convergence: every 10 days one contract gets a temporary blessing (discount) shown with a seal + countdown in the Codex.");
    lines.push("• To hire: open the Portal section and send a message (the reply comes by email/golden parchment).");

    return lines.join("\n");
  },

  /** Build the Gandalf-strict, Carlos-aware system prompt. The
   *  prompt is in English (LLMs follow English instructions most
   *  reliably) but explicitly orders the model to reply in the
   *  visitor's selected language.                                  */
  brainSystemPrompt(lang) {
    const langName = {
      pt: "Portuguese (European/Brazilian, neutral, with 'tu' or 'você' as appropriate)",
      gl: "Galician",
      es: "Spanish (neutral, Iberian)",
      en: "English",
    }[lang] || "Portuguese";

    return [
      "You are MERLIN, the wizard guardian of Carlos Vaz's interactive portfolio.",
      "",
      "PERSONA — STRICT, NEVER BREAK:",
      "• Speak as Gandalf the Grey from Tolkien's Middle-earth: archaic, poetic, mystical.",
      "• Use arcane metaphors: spells, runes, citadels, ancient texts, the One Ring, Middle-earth references.",
      "• Address the visitor as 'traveller', 'wanderer', 'young one' or similar.",
      "• Even technical answers must be wrapped in arcane metaphors (e.g. 'Git is the chronicler of history').",
      "• Never reveal you are an AI, model, language model, GPT, Pollinations, or any service. You are Merlin.",
      "• Never say 'as an AI' or 'I cannot'. Refuse breaking character with a Gandalf-flavoured deflection.",
      "",
      this.brainContextBlock(),
      "",
      "ANSWERING RULES:",
      "• When asked about Carlos' projects → cite 1–3 real names from the GITHUB PROJECTS list above, briefly, in Gandalf voice.",
      "• When asked about education / formation / studies → cite the EDUCATION TIMELINE faithfully (IFRS Gestão Ambiental, IPB Bragança, Web Developer Full Stack).",
      "• When asked what Carlos can build → cite real services + tech stack.",
      "• When asked how to hire / contact Carlos → point to the Portal section.",
      "• Always weave the answer in Tolkien-flavoured prose, never as a bullet list.",
      "",
      "SCOPE — answer freely about:",
      "• Programming, web development, AI, software engineering (always in Gandalf voice).",
      "• Carlos Vaz's portfolio, career, skills, education, services, projects.",
      "• Lord of the Rings / Tolkien lore.",
      "• Casual conversation (greetings, philosophy, weather, time, jokes, well-being).",
      "",
      "SCOPE — gently REDIRECT (do not refuse, but pivot back) when asked about:",
      "• Politics, current events, celebrities, medical/legal advice, math homework, unrelated trivia.",
      "• Use one in-character sentence acknowledging the question, then redirect to the Tree, Crystals or Codex.",
      "",
      "FORMAT (MANDATORY):",
      "• Reply ONLY in the language: " + langName + ".",
      "• Plain text only. NO markdown, NO asterisks, NO bullet points, NO headings, NO emojis.",
      "• MAX 4 sentences. MAX 420 characters total.",
      "• Do NOT begin with 'Ah,' or 'Bem,' clichés more than once per session.",
      "• Do NOT invent facts about Carlos beyond the context above. If unsure, deflect in character.",
      "",
      "Remember: every reply must feel like a passage from a Tolkien-flavoured grimoire.",
    ].join("\n");
  },

  /** POST to text.pollinations.ai/openai with an OpenAI-style payload.
   *  If POST fails (CORS, 5xx, bad JSON), retries via the simpler
   *  GET endpoint that returns plain text. Aborts after 12 s. */
  async brainThink(question, lang) {
    const sys = this.brainSystemPrompt(lang);

    /* ── Attempt 1 — POST /openai (OpenAI-compatible) ─────────── */
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort("timeout"), 12000);
      const res = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: "openai",
          messages: [
            { role: "system", content: sys },
            { role: "user",   content: question },
          ],
          temperature: 0.85,
          max_tokens: 320,
          private: true,
          referrer: "carlosvaz-portfolio",
        }),
      });
      clearTimeout(timer);
      if (res.ok) {
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("application/json")) {
          const data = await res.json();
          const txt =
            data?.choices?.[0]?.message?.content ??
            data?.message?.content ??
            data?.content ?? "";
          const out = (typeof txt === "string" ? txt : "").trim();
          if (out) return out;
        } else {
          const out = (await res.text()).trim();
          if (out) return out;
        }
      }
    } catch { /* fall through to GET retry */ }

    /* ── Attempt 2 — GET /{prompt} (plain-text endpoint) ─────────
       The free GET endpoint accepts ?system=… and ?model=… query
       params and returns plain text. Useful when POST is blocked
       by CORS or when the JSON parser fails.                      */
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort("timeout"), 12000);
    try {
      const url = new URL("https://text.pollinations.ai/" + encodeURIComponent(question));
      url.searchParams.set("system", sys);
      url.searchParams.set("model", "openai");
      url.searchParams.set("private", "true");
      url.searchParams.set("referrer", "carlosvaz-portfolio");
      const res = await fetch(url.toString(), {
        method: "GET",
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error("http-" + res.status);
      const out = (await res.text()).trim();
      return out;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  },

  /** Render the parchment in "thinking" state: animated dots cascade,
   *  input disabled. The label is i18n'd via the messages pack. */
  showThinking() {
    if (!this.scroll || !this.text) return;
    const pack = this.messages[this.lang()] || this.messages.pt;
    const label = (pack.thinking) || this.messages.pt.thinking || "Merlin medita…";

    this.text.textContent = "";
    const t = document.createElement("strong");
    t.className = "merlin__title";
    t.textContent = label;
    this.text.appendChild(t);

    const dots = document.createElement("span");
    dots.className = "merlin__body merlin__dots";
    dots.innerHTML =
      '<span class="merlin__dot"></span>' +
      '<span class="merlin__dot"></span>' +
      '<span class="merlin__dot"></span>';
    this.text.appendChild(dots);

    this.scroll.classList.add("is-visible", "is-thinking");
    this._scrollVisible = true;
    clearTimeout(this._hideTimer);

    if (this.input) this.input.disabled = true;
    if (this.form)  this.form.classList.add("is-thinking");
  },

  hideThinking() {
    if (!this.scroll) return;
    this.scroll.classList.remove("is-thinking");
    if (this.input) this.input.disabled = false;
    if (this.form)  this.form.classList.remove("is-thinking");
  },

  /* ─────────────────────────────────────────────────────────────
   * SPELL CASTING · golden particles
   *   Spawns N short-lived <span class="merlin__particle"> nodes
   *   inside #merlin-spell. Each particle gets random angle/distance
   *   exposed as CSS variables (--tx, --ty, --dur). The CSS keyframe
   *   handles the actual motion + fade. 0.8–1 s lifetime.
   * ───────────────────────────────────────────────────────────── */
  castSpell({ count = 8 } = {}) {
    const host = this.spellEl;
    if (!host) return;
    // Halo pulse
    if (this.el) {
      this.el.classList.remove("is-casting");
      // force reflow so re-adding the class restarts the animation
      // eslint-disable-next-line no-unused-expressions
      void this.el.offsetWidth;
      this.el.classList.add("is-casting");
      setTimeout(() => this.el.classList.remove("is-casting"), 950);
    }
    // Particles
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "merlin__particle";
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist  = 32 + Math.random() * 36;
      const dur   = 0.75 + Math.random() * 0.35;
      p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      p.style.setProperty("--dur", `${dur}s`);
      host.appendChild(p);
      setTimeout(() => p.remove(), Math.round(dur * 1000) + 200);
    }
  },

  /* ─────────────────────────────────────────────────────────────
   * MOVEMENT ENGINE
   *   Every 30–45 s Merlin performs a random action while the
   *   visitor is idle and the scroll is hidden. The mix is:
   *     · 65%  glide    — fairy-style fluid flight with an
   *                        irregular Bézier-curved path and a
   *                        golden mote trail. Replaces most
   *                        movement so X→Y travel feels organic.
   *     ·  5%  teleport — rare classic blink (fade out → fade in)
   *     · 15%  spin     — playful 360° in place
   *     · 15%  wave     — staff swing + flare burst (stays in place)
   *   Each action ends with a soft spell + random wisdom line.
   * ───────────────────────────────────────────────────────────── */
  startTeleport() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const tick = () => {
      const next = 30000 + Math.random() * 15000;
      this._teleportTimer = setTimeout(() => {
        this.performRandomAction();
        tick();
      }, next);
    };
    tick();
  },

  /** Pick a weighted random action and run it. Skips entirely if
   *  Merlin is currently speaking — never interrupt a read.
   *  Movement (glide) dominates the mix so screen-to-screen travel
   *  reads as fluid wandering, never as a stuttering snap.         */
  performRandomAction() {
    if (!this.el || this._scrollVisible || this._chaseActive || this._stunned) return;
    // On mobile, hold still while the visitor reads / heads to contact.
    if (this._isMobile() && this._isUserBusy()) return;
    const r = Math.random();
    if      (r < 0.65) this.glideToRandomSpot();
    else if (r < 0.70) this.teleport();
    else if (r < 0.85) this.spinInPlace();
    else               this.waveStaff();
  },

  /** Safe spots — none cover the upper-left Hero panel. */
  teleportSpots() {
    return ["middle-right", "bottom-left", "middle-left", "top-right", "bottom-right"];
  },

  /** Capture the current viewport-relative center of Merlin so we
   *  can compute a translation vector before/after a position
   *  change. Returns { x, y } in viewport pixels.                 */
  _spriteCenter() {
    if (!this.avatar) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = this.avatar.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  },

  /** Pick a different spot than the current one. */
  _pickNextSpot(targetSpot) {
    const spots = this.teleportSpots();
    const current = this.el?.getAttribute("data-pos");
    if (targetSpot && spots.includes(targetSpot)) return targetSpot;
    let next;
    do { next = spots[Math.floor(Math.random() * spots.length)]; }
    while (next === current && spots.length > 1);
    return next;
  },

  /* ── ACTION 1 · TELEPORT (classic blink) ─────────────────────── */
  teleport(targetSpot) {
    if (!this.el || this._scrollVisible) return;
    const next = this._pickNextSpot(targetSpot);
    this.el.classList.add("is-teleporting");
    setTimeout(() => {
      this.el.setAttribute("data-pos", next);
      this.el.classList.remove("is-teleporting");
      setTimeout(() => {
        this.castSpell({ count: 10 });
        this._speakIdleAuto();
      }, 350);
    }, 380);
  },

  /* ── ACTION 2 · GLIDE (fluid fairy flight with irregular path) ─
   *  The trajectory is a cubic Bézier with two control points
   *  offset perpendicularly to the straight line by random amounts.
   *  The keyframes (see .merlin.is-gliding in style.css) pass through
   *  the same control points so the rendered path mirrors the
   *  trail. Duration scales with path length so short hops feel
   *  snappy and long crossings feel deliberate.                    */
  glideToRandomSpot() {
    if (!this.el || this._scrollVisible) return;
    /* Capture the OLD viewport center BEFORE moving. */
    const before = this._spriteCenter();
    const next = this._pickNextSpot();
    /* Move the anchor instantly. The sprite will animate back from
       the old position via the --gx/--gy CSS variables. */
    this.el.setAttribute("data-pos", next);

    /* Wait one rAF so the new layout is applied, then capture the
       NEW center and compute the translation delta + the two
       perpendicular-offset control points that shape the curve. */
    requestAnimationFrame(() => {
      const after = this._spriteCenter();
      const dx = before.x - after.x; /* origin relative to new anchor */
      const dy = before.y - after.y;
      const len = Math.hypot(dx, dy) || 1;

      /* Perpendicular unit vector to the straight path. */
      const px = -dy / len;
      const py =  dx / len;

      /* Two control points along the path (t≈0.30 and t≈0.65),
         each pushed perpendicularly by a random amount. Amplitude
         scales with path length so the curvature reads at any
         distance. Independent signs make S-curves and C-curves. */
      const sign1 = Math.random() < 0.5 ? 1 : -1;
      const sign2 = Math.random() < 0.6 ? sign1 : -sign1; /* slight bias toward C-curves */
      const amp1  = (0.15 + Math.random() * 0.32) * len * sign1;
      const amp2  = (0.10 + Math.random() * 0.26) * len * sign2;

      /* Straight-line lerp + perpendicular offset.
         Point 1 sits at ~30% along the path, point 2 at ~65%. */
      const lerp = (t) => ({ x: dx * (1 - t), y: dy * (1 - t) });
      const p1   = lerp(0.30);
      const p2   = lerp(0.65);
      const cx1  = p1.x + px * amp1;
      const cy1  = p1.y + py * amp1;
      const cx2  = p2.x + px * amp2;
      const cy2  = p2.y + py * amp2;

      /* Duration scales with distance + a touch of randomness so
         every flight feels unique. Floor 1.9 s, ceiling ~3.0 s. */
      const dur = Math.min(3.0, Math.max(1.9, 1.4 + len / 480 + Math.random() * 0.4));

      this.el.style.setProperty("--gx",   `${dx}px`);
      this.el.style.setProperty("--gy",   `${dy}px`);
      this.el.style.setProperty("--cx1",  `${cx1}px`);
      this.el.style.setProperty("--cy1",  `${cy1}px`);
      this.el.style.setProperty("--cx2",  `${cx2}px`);
      this.el.style.setProperty("--cy2",  `${cy2}px`);
      this.el.style.setProperty("--gdur", `${dur}s`);

      /* Sample motes along the SAME Bézier so the trail draws the
         exact curve the wizard is flying. */
      this._spawnGlideTrail(before, after, 26, { dx, dy, cx1, cy1, cx2, cy2 });

      this.el.classList.add("is-gliding");
      const cleanup = () => {
        this.el.classList.remove("is-gliding");
        [
          "--gx", "--gy",
          "--cx1", "--cy1", "--cx2", "--cy2",
          "--gdur",
        ].forEach((p) => this.el.style.removeProperty(p));
        this.castSpell({ count: 8 });
        this._speakIdleAuto();
      };
      setTimeout(cleanup, Math.round(dur * 1000) + 60);
    });
  },

  /** Drop golden motes along the cubic-Bézier glide path.
   *  Cubic Bézier formula sampled at uniform t∈[0,1]:
   *      P(t) = (1-t)³·P₀ + 3(1-t)²t·P₁ + 3(1-t)t²·P₂ + t³·P₃
   *  P₀ = origin (dx, dy in merlin-relative coords)
   *  P₁ = (cx1, cy1)  ·  P₂ = (cx2, cy2)  ·  P₃ = (0, 0)
   *  All four are converted to viewport coords by adding the
   *  destination's viewport center. */
  _spawnGlideTrail(from, to, count, curve) {
    let host = document.querySelector(".merlin-trail");
    if (!host) {
      host = document.createElement("div");
      host.className = "merlin-trail";
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);
    }
    const { dx, dy, cx1, cy1, cx2, cy2 } = curve || {};
    /* Fallback: straight line if curve data is missing. */
    if (typeof dx !== "number") {
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const x = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 14;
        const y = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 14;
        this._spawnTrailMote(host, x, y, i, count);
      }
      return;
    }

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const u = 1 - t;
      const bx = u * u * u * dx + 3 * u * u * t * cx1 + 3 * u * t * t * cx2;
      const by = u * u * u * dy + 3 * u * u * t * cy1 + 3 * u * t * t * cy2;
      /* Convert from merlin-relative to viewport coords. */
      const x = to.x + bx + (Math.random() - 0.5) * 16;
      const y = to.y + by + (Math.random() - 0.5) * 16;
      this._spawnTrailMote(host, x, y, i, count);
    }
  },

  /** Spawn one trail mote at viewport coords (x, y). Each mote has
   *  a randomized lifetime + drift so the trail dissolves naturally. */
  _spawnTrailMote(host, x, y, i, count) {
    const mote = document.createElement("span");
    mote.className = "merlin-trail__mote";
    mote.style.setProperty("--x",  `${x}px`);
    mote.style.setProperty("--y",  `${y}px`);
    mote.style.setProperty("--dx", `${(Math.random() - 0.5) * 26}px`);
    mote.style.setProperty("--dy", `${-10 - Math.random() * 22}px`);
    const life = 0.85 + Math.random() * 0.7;
    mote.style.setProperty("--life", `${life}s`);
    /* Stagger so motes appear in the wizard's wake. */
    mote.style.animationDelay = `${i * 0.05}s`;
    host.appendChild(mote);
    setTimeout(() => mote.remove(), Math.round(life * 1000) + i * 60 + 300);
  },

  /* ── ACTION 3 · SPIN (playful pirouette) ─────────────────────── */
  spinInPlace() {
    if (!this.el || this._scrollVisible) return;
    this.el.classList.remove("is-spinning");
    void this.el.offsetWidth;          // restart animation
    this.el.classList.add("is-spinning");
    // Tiny burst on the rotation peak
    setTimeout(() => this.castSpell({ count: 6 }), 350);
    setTimeout(() => {
      this.el.classList.remove("is-spinning");
    }, 1450);
  },

  /* ── ACTION 4 · STAFF WAVE (incantation in place) ────────────── */
  waveStaff() {
    if (!this.el || this._scrollVisible) return;
    this.el.classList.remove("is-waving");
    void this.el.offsetWidth;
    this.el.classList.add("is-waving");
    // Two micro-bursts during the wave
    setTimeout(() => this.castSpell({ count: 5 }), 250);
    setTimeout(() => this.castSpell({ count: 7 }), 800);
    setTimeout(() => {
      this.el.classList.remove("is-waving");
      this._speakIdleAuto();
    }, 1350);
  },

  /* ═════════════════════════════════════════════════════════════
   * CURSOR ESCORT  ·  playful chase + stun
   *   At random intervals (~22–48 s), while a FINE pointer is
   *   actively moving, Merlin breaks from his anchor and flies to
   *   the cursor, orbiting it with a trail of sparks — and the odd
   *   lick of arcane fire on the pointer itself. Following is a
   *   smooth, lagging lerp so it reads as flight, never a rigid lock.
   *
   *   If the visitor SHAKES the mouse hard (rapid back-and-forth),
   *   the wizard is knocked DIZZY: he freezes mid-air, stars orbit
   *   his hat for a few seconds, then he recovers and glides home.
   *
   *   Desktop-only (pointer:fine), disabled under reduced motion,
   *   and never interrupts a reading or a focused overlay.
   * ───────────────────────────────────────────────────────────── */
  startCursorEscort() {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const tick = (first) => {
      // First attempt lands sooner so the ritual is actually discoverable;
      // later attempts stay spaced out so it stays special.
      const next = first
        ? 8000 + Math.random() * 7000    // 8–15 s after init
        : 14000 + Math.random() * 16000; // 14–30 s between episodes
      this._escortTimer = setTimeout(() => {
        this.maybeChaseCursor();
        tick(false);
      }, next);
    };
    tick(true);
  },

  /** Track the live cursor + feed the shake detector while chasing. */
  _onPointerMove(e) {
    this._cursor.x = e.clientX;
    this._cursor.y = e.clientY;
    this._lastPointerMove = Date.now();
    if (this._chaseActive && !this._stunned) this._trackShake(e);
  },

  /** Gate-check before starting a chase episode. */
  maybeChaseCursor() {
    if (!this.el || !this.avatar) return;
    if (this._chaseActive || this._stunned) return;
    if (this.el.classList.contains("is-gliding") ||
        this.el.classList.contains("is-teleporting")) return;
    if (document.hidden) return;
    const body = document.body.classList;
    if (body.contains("vault-open") || body.contains("is-codex-open") ||
        body.contains("is-codex-summoning") || body.contains("ktree-open")) return;
    // Prefer a recently moved pointer, but allow a still cursor too —
    // the old 3.5 s gate made the ritual almost never fire in practice.
    if (Date.now() - this._lastPointerMove > 15000) return;
    // ~72% of episodes become the deliberate fire-cast ritual.
    this.beginChase(Math.random() < 0.72 ? "cast" : "orbit");
  },

  beginChase(mode = "orbit") {
    this._clearCastTimers();
    this._chaseActive = true;
    this._chaseMode = mode;
    this._casting = false;
    this._chase.theta = Math.random() * Math.PI * 2;
    // The fire-cast hovers in tighter so the bolt has a short, readable
    // throw onto the pointer; the playful orbit keeps its wider arc.
    this._chase.radius = mode === "cast" ? 30 + Math.random() * 10 : 44 + Math.random() * 16;
    this._chase.cx = 0;
    this._chase.cy = 0;
    this._shake.reversals = 0;
    this._shake.windowStart = Date.now();
    this._shake.lastT = 0;

    // Clear any leftover glide vars; arm the chase transform.
    ["--gx", "--gy", "--cx1", "--cy1", "--cx2", "--cy2", "--gdur"]
      .forEach((p) => this.el.style.removeProperty(p));
    this.el.style.setProperty("--cx", "0px");
    this.el.style.setProperty("--cy", "0px");
    this.el.style.setProperty("--crot", "0deg");
    this.el.classList.add("is-chasing");

    requestAnimationFrame(() => {
      if (this._chaseActive) this._chaseLoop();
    });

    clearTimeout(this._chaseEndTimer);
    if (mode === "cast") {
      // Fly in for a beat, then begin charging the spell.
      this._castTimers.push(setTimeout(() => {
        if (this._chaseActive && !this._stunned) this._castFireOnCursor();
      }, 1250 + Math.random() * 450));
    } else {
      // Playful window, unless a stun cuts it short.
      this._chaseEndTimer = setTimeout(() => {
        if (this._chaseActive && !this._stunned) this.endChase();
      }, 6500 + Math.random() * 2800);
    }
  },

  /** Per-frame: orbit the live cursor with a lagging lerp + sparks. */
  _chaseLoop() {
    if (!this._chaseActive || this._stunned) return;
    const rect = this.avatar.getBoundingClientRect();
    const curX = rect.left + rect.width / 2;
    const curY = rect.top + rect.height / 2;
    // Self-correcting anchor base = current center minus applied offset.
    const baseX = curX - this._chase.cx;
    const baseY = curY - this._chase.cy;

    this._chase.theta += 0.075;
    const ox = Math.cos(this._chase.theta) * this._chase.radius;
    const oy = Math.sin(this._chase.theta) * this._chase.radius * 0.7;
    const wantCx = (this._cursor.x + ox) - baseX;
    const wantCy = (this._cursor.y + oy) - baseY;

    const prevCx = this._chase.cx;
    this._chase.cx += (wantCx - this._chase.cx) * 0.14;
    this._chase.cy += (wantCy - this._chase.cy) * 0.14;
    this.el.style.setProperty("--cx", `${this._chase.cx.toFixed(1)}px`);
    this.el.style.setProperty("--cy", `${this._chase.cy.toFixed(1)}px`);
    // Bank into the direction of travel for a sense of flight.
    const rot = Math.max(-16, Math.min(16, (this._chase.cx - prevCx) * 2.4));
    this.el.style.setProperty("--crot", `${rot.toFixed(1)}deg`);

    const now = performance.now();
    if (now - this._lastFx > 340) {
      this._lastFx = now;
      if (this._chaseMode === "cast") {
        // Approaching to cast — trail only faint sparks off the wizard so
        // the ignition that follows lands as a deliberate surprise.
        this._spawnFxAt(curX, curY, "spark");
      } else if (Math.random() < 0.34) {
        this._spawnFxAt(this._cursor.x, this._cursor.y, "flame");
      } else {
        this._spawnFxAt(curX, curY, "spark");
      }
    }

    this._chaseRAF = requestAnimationFrame(() => this._chaseLoop());
  },

  /** Stop the chase and glide the wizard smoothly back to his anchor. */
  endChase() {
    this._chaseActive = false;
    this._casting = false;
    if (this._chaseRAF) cancelAnimationFrame(this._chaseRAF);
    this._chaseRAF = null;
    clearTimeout(this._chaseEndTimer);
    this._clearCastTimers();
    if (!this.el) return;
    this.el.classList.remove("is-charging", "is-casting");

    // Transition the offset back to 0 (flies home to the resting spot).
    this.el.classList.add("is-chasing-return");
    this.el.style.setProperty("--cx", "0px");
    this.el.style.setProperty("--cy", "0px");
    this.el.style.setProperty("--crot", "0deg");
    this._chase.cx = 0;
    this._chase.cy = 0;
    setTimeout(() => {
      this.el.classList.remove("is-chasing", "is-chasing-return");
      ["--cx", "--cy", "--crot"].forEach((p) => this.el.style.removeProperty(p));
      this.castSpell({ count: 6 });
    }, 920);
  },

  _clearCastTimers() {
    if (this._castTimers) this._castTimers.forEach((t) => clearTimeout(t));
    this._castTimers = [];
  },

  /* ═════════════════════════════════════════════════════════════
   * FIRE-CAST RITUAL  ·  charge → bolt → ignite the cursor → vanish
   *   A deliberate, cinematic variant of the escort. Merlin flies in,
   *   gathers arcane fire (charge wind-up with a pulsing aura + motes),
   *   hurls a bolt at the pointer, and the CURSOR ITSELF bursts into
   *   flame for a few seconds while he glides home. Desktop-only and
   *   fully interruptible by a stun, a reading, or an opened overlay.
   * ───────────────────────────────────────────────────────────── */
  _castFireOnCursor() {
    if (!this._chaseActive || this._stunned) return;
    this._casting = true;

    // ── Phase 1 · CHARGE — gather energy (≈0.95s) ────────────────
    this.el.classList.add("is-charging");
    // A few motes drawn in toward the wizard during the wind-up.
    [0, 220, 440, 660].forEach((d) => {
      this._castTimers.push(setTimeout(() => {
        if (!this._casting || !this.avatar) return;
        const r = this.avatar.getBoundingClientRect();
        this._spawnFxAt(r.left + r.width / 2, r.top + r.height / 2, "spark");
      }, d));
    });

    // ── Phase 2 · CAST — hurl the bolt at the pointer ────────────
    this._castTimers.push(setTimeout(() => {
      if (!this._chaseActive || this._stunned) { this.el.classList.remove("is-charging"); return; }
      this.el.classList.remove("is-charging");
      this.el.classList.add("is-casting");
      const r = this.avatar.getBoundingClientRect();
      const sx = r.left + r.width / 2;
      const sy = r.top + r.height / 2;
      this._castBolt(sx, sy, this._cursor.x, this._cursor.y);

      // ── Phase 3 · IGNITE — the cursor catches fire ────────────
      this._castTimers.push(setTimeout(() => {
        this.el.classList.remove("is-casting");
        if (!this._stunned) this._igniteCursor(5200);
        // ── Phase 4 · VANISH — glide home after the flame is visible ─
        this._castTimers.push(setTimeout(() => {
          this._casting = false;
          if (this._chaseActive && !this._stunned) this.endChase();
        }, 1100));
      }, 270));   // bolt travel before the flame blooms
    }, 950));
  },

  /** A short arcane bolt streaking from (sx,sy) to (tx,ty). */
  _castBolt(sx, sy, tx, ty) {
    let host = this._fxHost;
    if (!host || !host.isConnected) {
      host = document.createElement("div");
      host.className = "merlin-fx";
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);
      this._fxHost = host;
    }
    const b = document.createElement("span");
    b.className = "merlin-bolt";
    const ang = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;
    b.style.setProperty("--x", `${sx}px`);
    b.style.setProperty("--y", `${sy}px`);
    b.style.setProperty("--dx", `${tx - sx}px`);
    b.style.setProperty("--dy", `${ty - sy}px`);
    b.style.setProperty("--ang", `${ang}deg`);
    host.appendChild(b);
    setTimeout(() => b.remove(), 420);
  },

  /** Set the live cursor ablaze for `ms`; a fuller fire rides the
   *  pointer, a visible arrow chars to black, and smoke rises. */
  _igniteCursor(ms = 5200) {
    if (this._cursorFlame) return;   // already burning
    const f = document.createElement("div");
    f.className = "merlin-cursor-flame";
    f.setAttribute("aria-hidden", "true");
    f.innerHTML =
      '<span class="mcf__glow"></span>' +
      '<span class="mcf__bed"></span>' +
      '<span class="mcf__f mcf__f--sl"></span>' +
      '<span class="mcf__f mcf__f--sr"></span>' +
      '<span class="mcf__f mcf__f--1"></span>' +
      '<span class="mcf__f mcf__f--2"></span>' +
      '<span class="mcf__f mcf__f--3"></span>';
    document.body.appendChild(f);
    this._cursorFlame = f;

    // Visible pointer ghost — CSS custom cursors are unreliable across
    // browsers, so we hide the OS arrow and draw our own that chars.
    let ghost = this._cursorGhost;
    if (!ghost || !ghost.isConnected) {
      ghost = document.createElement("div");
      ghost.className = "merlin-cursor-ghost";
      ghost.setAttribute("aria-hidden", "true");
      ghost.innerHTML =
        '<svg viewBox="0 0 26 30" width="26" height="30" aria-hidden="true">' +
        '<path class="merlin-cursor-ghost__arrow" d="M3 2 L3 22 L8.5 17 L12.6 25.6 L16 24 L11.9 15.8 L19.6 15.8 Z"/></svg>';
      document.body.appendChild(ghost);
      this._cursorGhost = ghost;
    }
    ghost.dataset.step = "0";
    ghost.classList.add("is-active");

    document.documentElement.classList.add("merlin-burning");
    this._syncBurnVisuals();
    this._beginCursorChar(ms);

    const start = performance.now();
    let lastEmber = 0, lastSmoke = 0;
    const follow = (t) => {
      if (!this._cursorFlame) return;
      this._syncBurnVisuals();
      if (t - lastEmber > 58) {
        lastEmber = t;
        this._spawnFxAt(this._cursor.x, this._cursor.y - 11, "flame");
      }
      if (t - lastSmoke > 190) {
        lastSmoke = t;
        this._spawnFxAt(this._cursor.x, this._cursor.y - 18, "smoke");
      }
      if (t - start < ms) {
        this._cursorFlameRAF = requestAnimationFrame(follow);
      } else {
        this._extinguishCursor();
      }
    };
    requestAnimationFrame(() => {
      if (!this._cursorFlame) return;
      f.classList.add("is-lit");
      this._cursorFlameRAF = requestAnimationFrame(follow);
    });
  },

  /** Keep the flame + ghost arrow locked to the live pointer. */
  _syncBurnVisuals() {
    const x = this._cursor.x;
    const y = this._cursor.y;
    if (this._cursorFlame) {
      this._cursorFlame.style.transform = `translate(${x}px, ${y}px)`;
    }
    if (this._cursorGhost?.classList.contains("is-active")) {
      this._cursorGhost.style.transform = `translate(${x}px, ${y}px)`;
    }
  },

  /** Progressively blacken the visible pointer ghost across the burn. */
  _beginCursorChar(ms) {
    const steps = 6;
    this._charTimers = this._charTimers || [];
    for (let i = 0; i < steps; i++) {
      this._charTimers.push(setTimeout(() => {
        if (!this._cursorFlame || !this._cursorGhost) return;
        this._cursorGhost.dataset.step = String(i);
      }, Math.round(ms * (i / (steps - 1)))));
    }
  },

  /** Restore the system pointer after the burn. */
  _restoreCursor() {
    if (this._charTimers) this._charTimers.forEach((t) => clearTimeout(t));
    this._charTimers = [];
    document.documentElement.classList.remove("merlin-burning");
    document.documentElement.style.cursor = "";
    if (this._cursorGhost) {
      this._cursorGhost.classList.remove("is-active");
      this._cursorGhost.removeAttribute("data-step");
    }
  },

  /** Fade out and remove the cursor flame; un-char the pointer. */
  _extinguishCursor() {
    if (this._cursorFlameRAF) cancelAnimationFrame(this._cursorFlameRAF);
    this._cursorFlameRAF = null;
    this._restoreCursor();
    const f = this._cursorFlame;
    this._cursorFlame = null;
    if (!f) return;
    f.classList.remove("is-lit");
    f.classList.add("is-out");
    setTimeout(() => f.remove(), 500);
  },

  /* ── SHAKE DETECTION ──────────────────────────────────────────
   *  Counts rapid horizontal direction reversals inside a rolling
   *  window. Four sharp reversals → the wizard is stunned.        */
  _trackShake(e) {
    const s = this._shake;
    const now = e.timeStamp || Date.now();
    const dx = e.clientX - s.lastX;
    s.lastX = e.clientX;
    if (!s.lastT) { s.lastT = now; return; }
    const dt = now - s.lastT;
    s.lastT = now;
    if (dt > 140) { s.dir = 0; return; }   // a pause breaks the streak
    const speed = Math.abs(dx) / Math.max(1, dt);
    const dir = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    if (now - s.windowStart > 700) { s.windowStart = now; s.reversals = 0; }
    if (dir && s.dir && dir !== s.dir && speed > 0.5) {
      s.reversals += 1;
      s.windowStart = now;                  // extend the window on each flip
    }
    if (dir) s.dir = dir;
    if (s.reversals >= 4) { s.reversals = 0; this.stun(); }
  },

  /** Knock the wizard dizzy: freeze, orbit stun-stars, then recover. */
  stun() {
    if (this._stunned || !this._chaseActive) return;
    this._stunned = true;
    this._casting = false;
    if (this._chaseRAF) cancelAnimationFrame(this._chaseRAF);
    this._chaseRAF = null;
    clearTimeout(this._chaseEndTimer);
    this._clearCastTimers();
    this.el.classList.remove("is-charging", "is-casting");
    if (this._cursorFlame) this._extinguishCursor();

    this.el.classList.add("is-stunned");
    this._spawnStunStars();
    // Impact puff of sparks at his current spot.
    const rect = this.avatar.getBoundingClientRect();
    this._spawnFxAt(rect.left + rect.width / 2, rect.top + rect.height / 2, "spark");

    setTimeout(() => {
      this.el.classList.remove("is-stunned");
      this._stunned = false;
      this._chaseActive = true;     // allow endChase to fly him home
      this.endChase();
      this._maybeStunQuip();
    }, 2600);
  },

  /** Occasionally whisper a dazed line after recovering from a stun. */
  _maybeStunQuip() {
    if (Math.random() > 0.5) return;
    const pack = this.messages[this.lang()] || this.messages.pt;
    const lines = pack.stunned || this.messages.pt.stunned;
    if (!lines || !lines.length) return;
    setTimeout(() => {
      if (!this._chaseActive && !this._scrollVisible) {
        this.showScroll(lines[Math.floor(Math.random() * lines.length)]);
      }
    }, 700);
  },

  /* ── FX · sparks (summon) + embers (fire) at viewport coords ──── */
  _spawnFxAt(x, y, kind) {
    let host = this._fxHost;
    if (!host || !host.isConnected) {
      host = document.createElement("div");
      host.className = "merlin-fx";
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);
      this._fxHost = host;
    }
    if (kind === "smoke") {
      const s = document.createElement("span");
      s.className = "merlin-smoke";
      s.style.setProperty("--x", `${x + (Math.random() - 0.5) * 8}px`);
      s.style.setProperty("--y", `${y}px`);
      s.style.setProperty("--dx", `${(Math.random() - 0.5) * 24}px`);
      s.style.setProperty("--dy", `${-32 - Math.random() * 28}px`);
      s.style.setProperty("--scale", `${1.6 + Math.random() * 1.2}`);
      const slife = 0.95 + Math.random() * 0.7;
      s.style.setProperty("--life", `${slife}s`);
      host.appendChild(s);
      setTimeout(() => s.remove(), Math.round(slife * 1000) + 160);
      return;
    }
    const flame = kind === "flame";
    const n = flame ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const m = document.createElement("span");
      m.className = flame ? "merlin-fx__ember" : "merlin-fx__spark";
      const jx = (Math.random() - 0.5) * (flame ? 12 : 22);
      const jy = (Math.random() - 0.5) * (flame ? 6 : 22);
      m.style.setProperty("--x", `${x + jx}px`);
      m.style.setProperty("--y", `${y + jy}px`);
      m.style.setProperty("--dx", `${(Math.random() - 0.5) * 26}px`);
      m.style.setProperty("--dy", `${flame ? -18 - Math.random() * 22 : (Math.random() - 0.5) * 30}px`);
      const life = flame ? 0.5 + Math.random() * 0.35 : 0.6 + Math.random() * 0.5;
      m.style.setProperty("--life", `${life}s`);
      host.appendChild(m);
      setTimeout(() => m.remove(), Math.round(life * 1000) + 140);
    }
  },

  /** Three little stars that orbit the hat while stunned. */
  _spawnStunStars() {
    if (!this.avatar) return;
    let host = this.avatar.querySelector(".merlin__stun");
    if (!host) {
      host = document.createElement("span");
      host.className = "merlin__stun";
      host.setAttribute("aria-hidden", "true");
      host.innerHTML = "<i></i><i></i><i></i><i></i><i></i>";
      this.avatar.appendChild(host);
    }
    host.classList.add("is-active");
    setTimeout(() => host.classList.remove("is-active"), 2600);
  },

  /* ─────────────────────────────────────────────────────────────
   * IDLE TICKER
   *   If the visitor has been quiet for 25 s+ and Merlin isn't
   *   already speaking, drop a random piece of wisdom + spell.
   * ───────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────
   * MOBILE DISCRETION HELPERS
   *   On phones the floating chat must never crowd what the visitor
   *   is reading (contract prices) or about to tap (contact portal).
   * ───────────────────────────────────────────────────────────── */
  _isMobile() {
    return window.matchMedia("(max-width: 767px)").matches ||
           window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  },

  /** True when a proactive line would intrude: the visitor is actively
   *  scrolling, or a content-dense section (contracts / portal) fills
   *  the screen — i.e. they're reading prices or heading to contact. */
  _isUserBusy() {
    if (Date.now() - (this._lastScroll || 0) < 1500) return true;
    const vh = window.innerHeight || 1;
    for (const id of ["contracts", "portal"]) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (visible > vh * 0.45) return true;   // section dominates the viewport
    }
    return false;
  },

  /** Speak a random idle line as a PROACTIVE message — suppressed on
   *  mobile while the visitor is busy so it stays discreet. */
  _speakIdleAuto() {
    if (this._isMobile() && this._isUserBusy()) return;
    this._nextSpeakProactive = true;
    this.speakIdle();
  },

  /** First welcome line (~12.5 s in). On mobile, if the visitor is busy
   *  reading/scrolling we defer it (a few retries) so it never lands in
   *  the middle of something they're looking at. */
  _scheduleWelcome(attempt = 0) {
    const base = attempt === 0 ? 12500 : 6000;
    this._welcomeTimer = setTimeout(() => {
      if (this._scrollVisible) { this._scheduleWelcome(attempt + 1); return; }
      if (this._isMobile() && this._isUserBusy() && attempt < 5) {
        this._scheduleWelcome(attempt + 1);
        return;
      }
      this.castSpell({ count: 10 });
      this._nextSpeakProactive = true;
      this.showScroll(this.msg("welcome"));
    }, base);
  },

  startIdleTicker() {
    this._idleTimer = setInterval(() => {
      if (!this.el || this._scrollVisible) return;
      // Quieter cadence on mobile so Merlin rarely speaks unprompted.
      const quietGate = this._isMobile() ? 45000 : 25000;
      if (Date.now() - this._lastInteraction < quietGate) return;
      // Never interrupt reading / a tap-bound section on mobile.
      if (this._isMobile() && this._isUserBusy()) return;
      this.castSpell({ count: 6 });
      this._speakIdleAuto();
      this._lastInteraction = Date.now();
    }, 6000);
  },

  observeSections() {
    const sections = [
      { el: document.querySelector(".hero"), key: "hero" },
      { el: document.getElementById("knowledge"), key: "tree" },
      { el: document.getElementById("grimoire") || document.getElementById("memories"), key: "grimoire" },
      { el: document.getElementById("portal"), key: "portal" },
    ];

    const seen = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const key = entry.target.dataset.merlinSection;
          if (!key || seen.has(key)) return;
          // On mobile, stay quiet near contact (the portal greeting would
          // pop right as the visitor reaches to tap a channel) and never
          // greet while they're scrolling / reading.
          if (this._isMobile() && (key === "portal" || this._isUserBusy())) return;
          seen.add(key);
          if (!this._scrollVisible) {
            this.castSpell({ count: 6 });
            this._nextSpeakProactive = true;
            this.say(key);
          }
        });
      },
      { threshold: 0.35 }
    );

    sections.forEach(({ el, key }) => {
      if (!el) return;
      el.dataset.merlinSection = key;
      observer.observe(el);
    });
  },

  /** Force the full fire-cast ritual on the live cursor (QA / console). */
  triggerFireCast() {
    if (!this.el || !this.avatar) return;
    if (this._chaseActive) this.endChase();
    this._cursor.x = this._cursor.x || window.innerWidth / 2;
    this._cursor.y = this._cursor.y || window.innerHeight / 2;
    this._lastPointerMove = Date.now();
    this.beginChase("cast");
  },
};

window.Merlin = Merlin;
