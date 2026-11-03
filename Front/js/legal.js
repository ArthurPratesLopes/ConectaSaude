/* Conecta Saúde – Termos de Uso e Política de Privacidade.
   Fonte ÚNICA do texto jurídico: este arquivo monta as janelas #termos e
   #privacidade em todas as páginas (index.html e html/*.html). Para alterar
   o texto, edite apenas as listas TERMOS e PRIVACIDADE abaixo.

   Estrutura de cada seção:
     { t: 'Título', i: [ item, item, ... ] }
   onde item pode ser:
     'Texto do item'                          -> cláusula numerada (ex.: 4.2)
     { t: 'Introdução', a: [ ... ] }          -> cláusula + alíneas a), b), c)...
     { t: 'Introdução', m: 'ul', a: [ ... ] } -> cláusula + marcadores
   Nas listas, um item pode ser ['Rótulo', 'texto'] para destacar o rótulo. */
(() => {
  'use strict';

  const VERSAO = '1.0';
  const ATUALIZACAO = '2 de novembro de 2026';
  window.CS_LEGAL = { versao: VERSAO, atualizacao: ATUALIZACAO }; // usado no registro do aceite (home.js)
  const EMAIL = 'conectasaude@maua.br';
  const TELEFONE = '(11) 4239-3000';

  /* =====================================================================
     TERMOS DE USO
     ===================================================================== */
  const TERMOS = {
    id: 'termos',
    titulo: 'Termos de Uso',
    preambulo:
      'Leia com atenção estes Termos de Uso antes de utilizar a plataforma Conecta Saúde. ' +
      'Eles estabelecem os direitos, os deveres e as responsabilidades de todas as pessoas e instituições que acessam o ambiente.',
    secoes: [
      {
        t: 'Aceitação e vigência',
        i: [
          'Os presentes Termos de Uso (“Termos”) regulam o acesso e a utilização da plataforma Conecta Saúde (“Plataforma”), ' +
            'desenvolvida e mantida pelo Instituto Mauá de Tecnologia (“Mauá”), em parceria com a AACD, e destinada à intermediação entre ' +
            'unidades da AACD e laboratórios de fabricação digital (“FabLabs”) para a solicitação e a produção de órteses e próteses.',
          'Ao criar uma conta, assinalar a opção de aceite ou utilizar a Plataforma, o Usuário declara que leu, compreendeu e concordou ' +
            'integralmente com estes Termos e com a Política de Privacidade, que deles faz parte indissociável.',
          'Caso não concorde com qualquer disposição aqui prevista, o Usuário deverá abster-se de utilizar a Plataforma.',
          'Estes Termos vigoram por prazo indeterminado, a contar do aceite, e permanecem aplicáveis enquanto o Usuário mantiver conta ativa.',
        ],
      },
      {
        t: 'Definições',
        i: [
          {
            t: 'Para os fins destes Termos, aplicam-se as seguintes definições:',
            m: 'ul',
            a: [
              ['Usuário:', 'pessoa natural que acessa a Plataforma, em nome próprio ou como representante de uma Instituição.'],
              ['Instituição:', 'unidade da AACD ou laboratório parceiro em nome do qual o Usuário realiza o cadastro e opera a Plataforma.'],
              ['Perfil AACD (Solicitante):', 'perfil destinado às unidades da AACD, habilitado a registrar e acompanhar pedidos de fabricação.'],
              ['Perfil Laboratório (Fornecedor):', 'perfil destinado aos laboratórios parceiros, habilitado a cadastrar sua estrutura e equipamentos, avaliar, aceitar, produzir e entregar pedidos.'],
              ['Pedido:', 'solicitação de fabricação registrada na Plataforma, composta por código, tipo de peça, material, prazo, urgência, medidas e observações técnicas, laboratório preferencial e arquivo de modelo tridimensional.'],
              ['Modelo 3D:', 'arquivo digital em formato .stl que representa a geometria da peça a ser fabricada.'],
              ['Dados Pessoais:', 'informação relacionada a pessoa natural identificada ou identificável, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD).'],
            ],
          },
        ],
      },
      {
        t: 'Objeto e natureza da Plataforma',
        i: [
          'A Plataforma tem por objeto viabilizar o registro, o aceite, o acompanhamento e a entrega de Pedidos de fabricação de órteses e próteses, ' +
            'disponibilizando recursos de cadastro, consulta e acompanhamento de status (Registrado, Aceito, Impressão e Entregue).',
          'A Plataforma atua exclusivamente como ambiente tecnológico de intermediação. Mauá não prescreve, não avalia clinicamente, não fabrica, ' +
            'não transporta nem entrega as peças, e não é parte das relações estabelecidas entre a AACD e os laboratórios.',
          'A Plataforma constitui iniciativa de caráter acadêmico e de extensão do Instituto Mauá de Tecnologia, podendo ter suas funcionalidades ' +
            'modificadas, suspensas ou descontinuadas, total ou parcialmente, a critério de Mauá e sem que isso gere direito a indenização.',
        ],
      },
      {
        t: 'Cadastro e conta de acesso',
        i: [
          'O acesso à Plataforma é restrito a profissionais e representantes de unidades da AACD e de laboratórios parceiros, mediante cadastro prévio ' +
            'com a indicação do perfil, do nome da unidade ou do laboratório, da cidade, da unidade federativa, de endereço de e-mail e de senha.',
          'O Usuário declara possuir poderes e autorização para atuar em nome da Instituição e que todas as informações prestadas são verdadeiras, ' +
            'completas e atualizadas, comprometendo-se a mantê-las atualizadas.',
          'O cadastro de laboratório poderá exigir informações complementares, tais como razão social, CNPJ, localização, requisitos atendidos e ' +
            'características dos equipamentos disponíveis.',
          'As credenciais de acesso são pessoais e intransferíveis. O Usuário é responsável pela guarda e pelo sigilo de sua senha e por todas as ' +
            'atividades realizadas com suas credenciais, salvo se comprovada falha atribuível à Plataforma.',
          'O Usuário deverá comunicar imediatamente a Mauá qualquer suspeita de uso não autorizado de sua conta ou de violação de segurança.',
          'Ao término de cada utilização, especialmente em equipamentos compartilhados, o Usuário deverá encerrar a sessão por meio da opção “Sair”.',
          'Mauá poderá recusar, suspender ou cancelar cadastros que contenham informações inverídicas, inconsistentes ou que contrariem estes Termos.',
        ],
      },
      {
        t: 'Direitos do Usuário',
        i: [
          {
            t: 'São direitos do Usuário:',
            a: [
              'acessar e utilizar as funcionalidades da Plataforma compatíveis com o seu perfil, nos termos deste documento;',
              'receber informações claras, adequadas e ostensivas sobre o tratamento de seus Dados Pessoais, conforme a Política de Privacidade;',
              'exercer os direitos de titular previstos no art. 18 da LGPD, pelos canais indicados na Política de Privacidade;',
              'consultar o andamento e o histórico dos Pedidos de sua Instituição;',
              'manter a titularidade sobre os conteúdos, os dados e os arquivos que inserir na Plataforma, nos termos da cláusula de propriedade intelectual;',
              'obter suporte pelos canais oficiais de atendimento;',
              'ser informado a respeito de alterações relevantes destes Termos;',
              'solicitar o encerramento de sua conta a qualquer tempo, observadas as obrigações já assumidas em Pedidos em andamento e os prazos legais de guarda de dados.',
            ],
          },
        ],
      },
      {
        t: 'Deveres do Usuário',
        i: [
          {
            t: 'Constituem deveres de todos os Usuários:',
            a: [
              'fornecer informações verdadeiras, completas e atualizadas, respondendo civil e criminalmente por eventual falsidade;',
              'utilizar a Plataforma de acordo com sua finalidade, com a legislação vigente, com a moral, os bons costumes e o princípio da boa-fé;',
              'manter sigilo sobre suas credenciais de acesso e não as compartilhar com terceiros;',
              'inserir, nos Pedidos, exclusivamente o código do paciente, sendo vedado informar nome, CPF, RG, endereço, telefone, imagem ou qualquer outro dado que identifique diretamente o paciente;',
              'registrar somente as informações estritamente necessárias à produção da peça, em observância ao princípio da necessidade;',
              'assegurar que detém autorização e base legal para inserir na Plataforma os dados e os arquivos que submeter;',
              'respeitar a confidencialidade das informações a que tiver acesso em razão do uso da Plataforma, utilizando-as apenas para a finalidade do Pedido;',
              'cumprir a legislação aplicável, inclusive a Lei Geral de Proteção de Dados e as normas sanitárias pertinentes a produtos para saúde;',
              'comunicar a Mauá falhas, vulnerabilidades, incidentes de segurança ou usos indevidos de que tomar conhecimento.',
            ],
          },
          {
            t: 'Constituem deveres específicos das unidades da AACD (Perfil Solicitante):',
            a: [
              'responder pela indicação clínica, pela prescrição e pela exatidão das medidas, tolerâncias e especificações técnicas informadas;',
              'validar o Modelo 3D antes do envio e garantir que ele não infrinja direitos de terceiros;',
              'informar prazo e grau de urgência de forma compatível com a real necessidade do paciente;',
              'conferir a peça recebida antes de qualquer uso clínico e confirmar a entrega na Plataforma.',
            ],
          },
          {
            t: 'Constituem deveres específicos dos laboratórios (Perfil Fornecedor):',
            a: [
              'manter atualizadas as informações sobre sua estrutura, seus equipamentos, materiais e capacidade produtiva;',
              'aceitar apenas Pedidos que possam executar dentro do prazo, do material e das especificações informados;',
              'fabricar as peças com observância das boas práticas de produção, de biossegurança e da regulamentação sanitária aplicável, empregando materiais compatíveis com o uso pretendido;',
              'atualizar o status do Pedido de forma tempestiva e fiel à realidade;',
              'utilizar os Modelos 3D e demais informações recebidas exclusivamente para a fabricação do Pedido correspondente.',
            ],
          },
        ],
      },
      {
        t: 'Pedidos, aceite e acompanhamento',
        i: [
          'O Pedido registrado por unidade da AACD ficará disponível aos laboratórios compatíveis. A indicação de laboratório preferencial constitui mera ' +
            'preferência e não obriga o laboratório indicado a aceitar o Pedido.',
          'O aceite do Pedido pelo laboratório formaliza o compromisso deste com o prazo e as especificações informados. O laboratório poderá recusar ' +
            'Pedidos, hipótese em que o status “Recusado” será exibido ao Solicitante.',
          'Os status e os históricos exibidos refletem as informações inseridas pelos Usuários. Mauá não garante que tais informações correspondam, ' +
            'em tempo real, à situação efetiva do Pedido.',
          'A confirmação de entrega encerra o ciclo do Pedido na Plataforma. Eventuais ajustes comerciais, logísticos ou contratuais entre a AACD e os ' +
            'laboratórios são de responsabilidade exclusiva das partes.',
        ],
      },
      {
        t: 'Propriedade intelectual e conteúdo do Usuário',
        i: [
          'A marca, o nome, o software, o layout, as bases de dados, os textos e os demais elementos da Plataforma pertencem a Mauá ou a seus licenciantes, ' +
            'sendo concedida ao Usuário apenas licença de uso limitada, não exclusiva, intransferível e revogável, para as finalidades previstas nestes Termos.',
          'Os Modelos 3D, as medidas, as observações técnicas e os demais conteúdos inseridos pelo Usuário permanecem de titularidade do Usuário, da ' +
            'Instituição ou dos terceiros que detenham os respectivos direitos.',
          'O Usuário concede a Mauá licença não exclusiva, gratuita e restrita ao estritamente necessário para armazenar, processar, exibir e ' +
            'disponibilizar o conteúdo à AACD e aos laboratórios envolvidos no Pedido, com a única finalidade de operar a Plataforma.',
          'É vedado ao laboratório reproduzir, comercializar, redistribuir ou utilizar os Modelos 3D recebidos para finalidade diversa da fabricação do ' +
            'Pedido, sem autorização expressa do titular.',
          'O Usuário responde pela legitimidade do conteúdo que inserir e se compromete a manter Mauá indene em face de reclamações de terceiros ' +
            'decorrentes de violação de direitos por tal conteúdo.',
        ],
      },
      {
        t: 'Condutas vedadas',
        i: [
          {
            t: 'É expressamente vedado ao Usuário:',
            a: [
              'acessar ou tentar acessar contas, áreas ou dados de outros Usuários ou da infraestrutura da Plataforma sem autorização;',
              'inserir arquivos ou códigos que contenham vírus, malware ou qualquer elemento capaz de danificar ou comprometer a Plataforma;',
              'realizar engenharia reversa, descompilar, copiar, extrair dados em massa ou explorar vulnerabilidades da Plataforma;',
              'sobrecarregar a infraestrutura por meio de rotinas automatizadas ou de uso abusivo;',
              'utilizar a Plataforma para fins ilícitos, fraudulentos, discriminatórios ou alheios à sua finalidade;',
              'inserir conteúdo ofensivo, falso, enganoso ou que viole direitos de terceiros, incluindo direitos de propriedade intelectual e de proteção de dados;',
              'ceder, vender ou transferir sua conta a terceiros.',
            ],
          },
        ],
      },
      {
        t: 'Proteção de Dados Pessoais',
        i: [
          'O tratamento de Dados Pessoais na Plataforma é regido pela Política de Privacidade e pela Lei nº 13.709/2018 (LGPD).',
          'O Pedido deve identificar o paciente exclusivamente por código. Conteúdos que contenham dados que identifiquem diretamente o paciente poderão ' +
            'ser removidos, anonimizados ou bloqueados por Mauá, sem prejuízo de outras medidas cabíveis.',
          'Cada Instituição é responsável pela licitude do tratamento dos Dados Pessoais que inserir na Plataforma, inclusive quanto à existência de base legal adequada.',
        ],
      },
      {
        t: 'Disponibilidade, suporte e segurança',
        i: [
          'Mauá empregará esforços razoáveis para manter a Plataforma disponível e segura, sem, contudo, garantir funcionamento ininterrupto ou livre de erros.',
          'A Plataforma poderá sofrer interrupções programadas ou emergenciais para manutenção, atualização, correção de falhas ou em decorrência de ' +
            'eventos alheios ao controle de Mauá.',
          'O suporte ao Usuário é prestado pelo e-mail ' + EMAIL + ' e pelo telefone ' + TELEFONE + '.',
        ],
      },
      {
        t: 'Limitação de responsabilidade',
        i: [
          {
            t: 'Na máxima extensão permitida pela legislação, Mauá não se responsabiliza por:',
            a: [
              'indicação clínica, prescrição, adequação, uso ou resultados terapêuticos das peças solicitadas;',
              'qualidade, segurança, conformidade técnica e desempenho das peças fabricadas pelos laboratórios;',
              'atrasos, descumprimentos ou inadimplementos nas relações entre a AACD e os laboratórios;',
              'informações falsas, incorretas ou incompletas inseridas pelos Usuários;',
              'uso indevido de credenciais decorrente de culpa ou negligência do Usuário;',
              'indisponibilidades causadas por caso fortuito, força maior, falhas de conexão, de energia, de provedores ou de terceiros.',
            ],
          },
          'Nada nestes Termos exclui ou limita responsabilidades que não possam ser afastadas por lei, tampouco os direitos irrenunciáveis do titular de dados.',
        ],
      },
      {
        t: 'Suspensão, bloqueio e encerramento',
        i: [
          'Mauá poderá suspender, bloquear ou encerrar o acesso de Usuário que violar estes Termos, que praticar ou for suspeito de praticar fraude, ou ' +
            'quando houver determinação legal, regulatória ou judicial, sem prejuízo das demais medidas cabíveis.',
          'Sempre que possível, o Usuário será previamente comunicado e poderá apresentar esclarecimentos.',
          'O encerramento da conta não exime o Usuário das obrigações assumidas em Pedidos já aceitos nem impede a conservação de dados pelos prazos ' +
            'exigidos em lei ou necessários ao exercício regular de direitos.',
        ],
      },
      {
        t: 'Alterações destes Termos',
        i: [
          'Mauá poderá alterar estes Termos a qualquer tempo, a fim de refletir mudanças legais, operacionais ou funcionais. A versão vigente estará ' +
            'sempre disponível na Plataforma, com a indicação da data da última atualização.',
          'Alterações relevantes serão comunicadas por meio da Plataforma ou do e-mail cadastrado. A continuidade de uso após a entrada em vigor da nova ' +
            'versão implica concordância com seu conteúdo; havendo discordância, o Usuário deverá encerrar sua conta.',
        ],
      },
      {
        t: 'Disposições gerais',
        i: [
          'A tolerância de Mauá quanto ao descumprimento de qualquer cláusula não implica renúncia ao direito de exigir seu cumprimento posteriormente.',
          'Caso qualquer disposição destes Termos seja considerada inválida ou ineficaz, as demais permanecerão em pleno vigor.',
          'O Usuário não poderá ceder ou transferir, total ou parcialmente, os direitos e as obrigações decorrentes destes Termos sem a anuência prévia e escrita de Mauá.',
          'As comunicações relacionadas à Plataforma serão realizadas por seus canais internos e pelo e-mail cadastrado pelo Usuário.',
        ],
      },
      {
        t: 'Legislação aplicável e foro',
        i: [
          'Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial pela Lei nº 13.709/2018 (LGPD), pela Lei nº 12.965/2014 ' +
            '(Marco Civil da Internet) e pelo Código Civil.',
          'Fica eleito o foro da Comarca de São Caetano do Sul, Estado de São Paulo, para dirimir quaisquer controvérsias decorrentes destes Termos, ' +
            'com renúncia a qualquer outro, por mais privilegiado que seja, ressalvadas as hipóteses de foro obrigatório previstas em lei.',
        ],
      },
    ],
  };

  /* =====================================================================
     POLÍTICA DE PRIVACIDADE
     ===================================================================== */
  const PRIVACIDADE = {
    id: 'privacidade',
    titulo: 'Política de Privacidade',
    preambulo:
      'Esta Política explica, de forma transparente, como a plataforma Conecta Saúde trata Dados Pessoais e quais são os direitos dos titulares, ' +
      'em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD).',
    secoes: [
      {
        t: 'Introdução e abrangência',
        i: [
          'Esta Política de Privacidade (“Política”) descreve como o Instituto Mauá de Tecnologia (“Mauá”), mantenedor da plataforma Conecta Saúde ' +
            '(“Plataforma”), coleta, utiliza, armazena, compartilha e protege Dados Pessoais.',
          'Aplica-se a todos os Usuários da Plataforma — profissionais e representantes de unidades da AACD e de laboratórios parceiros — e é parte ' +
            'integrante dos Termos de Uso.',
          'O tratamento de Dados Pessoais observa a boa-fé e os princípios da finalidade, adequação, necessidade, livre acesso, qualidade dos dados, ' +
            'transparência, segurança, prevenção, não discriminação e responsabilização e prestação de contas (art. 6º da LGPD).',
        ],
      },
      {
        t: 'Controlador e canal de atendimento',
        i: [
          'Mauá atua como controlador dos Dados Pessoais tratados para o cadastro, a autenticação e a operação da Plataforma.',
          'As unidades da AACD e os laboratórios permanecem responsáveis pela licitude dos dados que inserem nos Pedidos e pelos tratamentos que realizarem ' +
            'para suas próprias finalidades.',
          'O canal de comunicação com o encarregado pelo tratamento de Dados Pessoais, para dúvidas, solicitações e exercício de direitos, é o e-mail ' + EMAIL + '.',
        ],
      },
      {
        t: 'Dados pessoais tratados',
        i: [
          {
            t: 'Para a prestação dos serviços, a Plataforma poderá tratar as seguintes categorias de dados:',
            a: [
              ['Dados de cadastro e acesso:', 'nome da unidade ou do laboratório, e-mail, perfil de acesso, cidade, unidade federativa e senha.'],
              ['Dados cadastrais do laboratório:', 'razão social, CNPJ, localização, requisitos atendidos, informações sobre equipamentos e capacidade produtiva, e registro do aceite dos termos.'],
              ['Dados dos Pedidos:', 'código do paciente (identificador que não revela o nome), tipo de peça, material, prazo, urgência, medidas e observações técnicas, laboratório preferencial, Modelo 3D (.stl) e histórico de status.'],
              ['Dados de uso e técnicos:', 'dados de sessão, data e hora de acesso e informações técnicas de navegação eventualmente geradas pela infraestrutura, como endereço IP e tipo de navegador.'],
              ['Dados de suporte:', 'informações fornecidas pelo Usuário em contatos com a equipe da Plataforma.'],
            ],
          },
          'Os Pedidos devem identificar o paciente apenas por código. Ainda assim, as informações sobre a peça e suas medidas, associadas a outras informações ' +
            'mantidas pela AACD, podem permitir a identificação do paciente e revelar aspectos de sua saúde. Por essa razão, tais informações recebem ' +
            'proteção reforçada, em conformidade com as regras aplicáveis aos dados pessoais sensíveis (arts. 5º, II, e 11 da LGPD).',
        ],
      },
      {
        t: 'Finalidades e bases legais',
        i: [
          {
            t: 'Os Dados Pessoais são tratados para as seguintes finalidades, amparadas nas respectivas bases legais:',
            a: [
              ['Criação e gestão da conta, autenticação e controle de acesso —', 'execução de contrato ou de procedimentos preliminares a pedido do titular (art. 7º, V).'],
              ['Registro, aceite, produção, acompanhamento e entrega dos Pedidos —', 'execução de contrato (art. 7º, V) e, quanto a informações relacionadas à saúde, tutela da saúde em procedimento realizado por profissionais ou serviços de saúde (art. 11, II, “f”).'],
              ['Segurança da informação, prevenção a fraudes e auditoria —', 'legítimo interesse (art. 7º, IX) e garantia da prevenção à fraude e à segurança do titular (art. 11, II, “g”).'],
              ['Cumprimento de obrigações legais ou regulatórias —', 'art. 7º, II, da LGPD.'],
              ['Exercício regular de direitos em processo judicial, administrativo ou arbitral —', 'art. 7º, VI, e art. 11, II, “d”.'],
              ['Suporte e comunicações operacionais sobre a Plataforma —', 'execução de contrato e legítimo interesse (art. 7º, V e IX).'],
              ['Produção de estatísticas e melhoria da Plataforma —', 'mediante dados anonimizados, que não se caracterizam como Dados Pessoais (art. 12).'],
            ],
          },
          'Mauá não comercializa Dados Pessoais nem os utiliza para fins publicitários.',
        ],
      },
      {
        t: 'Compartilhamento de dados',
        i: [
          'Entre Usuários: as informações do Pedido e a identificação da Instituição são disponibilizadas à unidade da AACD solicitante e ao laboratório ' +
            'compatível ou escolhido, na medida estritamente necessária à execução do Pedido.',
          'Prestadores de serviço: Mauá poderá compartilhar dados com fornecedores de infraestrutura, hospedagem, banco de dados e suporte técnico, ' +
            'que atuam sob dever de confidencialidade e apenas para as finalidades da Plataforma.',
          'Recursos de terceiros: para o funcionamento da interface (por exemplo, fontes tipográficas e o visualizador tridimensional), o navegador do ' +
            'Usuário pode carregar recursos de redes de distribuição de conteúdo de terceiros, que podem receber dados técnicos como endereço IP e tipo de navegador.',
          'Autoridades: os dados poderão ser fornecidos mediante obrigação legal, ordem judicial ou requisição de autoridade competente.',
          'Eventual transferência internacional de dados, inclusive em razão dos recursos de terceiros mencionados, observará o Capítulo V da LGPD, com a ' +
            'adoção de garantias adequadas.',
        ],
      },
      {
        t: 'Armazenamento no navegador e tecnologias similares',
        i: [
          'A Plataforma utiliza o armazenamento do navegador para manter a sessão do Usuário enquanto a página estiver em uso; a sessão é encerrada ao ' +
            'selecionar a opção “Sair” ou ao fechar a aba do navegador.',
          'No modo de demonstração, dados fictícios ou inseridos pelo Usuário podem ser mantidos apenas no próprio dispositivo.',
          'A Plataforma não utiliza cookies de publicidade ou de rastreamento de comportamento.',
        ],
      },
      {
        t: 'Retenção e eliminação',
        i: [
          'Os Dados Pessoais são conservados pelo tempo necessário ao cumprimento das finalidades descritas nesta Política, enquanto a conta estiver ativa e, ' +
            'após o encerramento, pelos prazos exigidos por lei ou regulamento ou necessários ao exercício regular de direitos.',
          'Encerrados esses prazos, os dados serão eliminados ou anonimizados, ressalvadas as hipóteses de conservação previstas no art. 16 da LGPD.',
        ],
      },
      {
        t: 'Segurança da informação',
        i: [
          'Mauá adota medidas técnicas e administrativas aptas a proteger os Dados Pessoais contra acessos não autorizados e situações acidentais ou ' +
            'ilícitas de destruição, perda, alteração, comunicação ou difusão, incluindo credenciais individuais de acesso, segregação de perfis e ' +
            'restrição do acesso interno a pessoas autorizadas.',
          'Nenhum sistema é absolutamente invulnerável. O Usuário contribui para a segurança ao proteger suas credenciais e ao encerrar a sessão após o uso.',
          'Na ocorrência de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, Mauá comunicará a Autoridade Nacional de ' +
            'Proteção de Dados (ANPD) e os titulares afetados, nos termos do art. 48 da LGPD.',
        ],
      },
      {
        t: 'Direitos do titular',
        i: [
          {
            t: 'Nos termos do art. 18 da LGPD, o titular de Dados Pessoais tem direito de obter, a qualquer momento e mediante requisição:',
            a: [
              'confirmação da existência de tratamento;',
              'acesso aos dados;',
              'correção de dados incompletos, inexatos ou desatualizados;',
              'anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei;',
              'portabilidade dos dados a outro fornecedor de serviço ou produto, nos termos da regulamentação da ANPD;',
              'eliminação dos dados tratados com base no consentimento, ressalvadas as hipóteses de conservação legalmente previstas;',
              'informação sobre as entidades públicas e privadas com as quais Mauá compartilhou seus dados;',
              'informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da recusa;',
              'revogação do consentimento, quando este for a base legal do tratamento;',
              'oposição a tratamento realizado com fundamento em hipótese de dispensa de consentimento, em caso de descumprimento da lei.',
            ],
          },
          'As solicitações devem ser enviadas para ' + EMAIL + '. Para proteger o titular, Mauá poderá requerer a confirmação de sua identidade antes de ' +
            'atender ao pedido, que será respondido nos prazos previstos no art. 19 da LGPD.',
          'Pedidos de pacientes ou de seus responsáveis relativos a informações clínicas devem ser dirigidos preferencialmente à AACD, responsável pelo ' +
            'prontuário e pela relação com o paciente, cabendo a Mauá prestar o apoio necessário.',
          'O titular também pode apresentar petição à Autoridade Nacional de Proteção de Dados (ANPD) contra o controlador.',
        ],
      },
      {
        t: 'Responsabilidades do Usuário quanto aos dados',
        i: [
          {
            t: 'Ao utilizar a Plataforma, o Usuário compromete-se a:',
            a: [
              'não inserir nome, documentos, contatos, endereço, imagem ou outros dados que identifiquem diretamente o paciente;',
              'inserir apenas os dados necessários à produção da peça;',
              'manter seus dados cadastrais corretos e atualizados;',
              'tratar as informações de outros Usuários e dos Pedidos com confidencialidade e somente para a finalidade do Pedido;',
              'proteger suas credenciais e comunicar imediatamente qualquer suspeita de acesso indevido ou de incidente.',
            ],
          },
        ],
      },
      {
        t: 'Crianças e adolescentes',
        i: [
          'A Plataforma é destinada a profissionais e instituições e não se dirige a crianças e adolescentes como Usuários.',
          'Os Pedidos podem se referir a pacientes menores de idade, identificados exclusivamente por código. Nesses casos, o tratamento observará o ' +
            'melhor interesse da criança e do adolescente, nos termos do art. 14 da LGPD.',
        ],
      },
      {
        t: 'Alterações desta Política',
        i: [
          'Esta Política poderá ser atualizada para refletir mudanças legais, regulatórias ou operacionais. A versão vigente estará sempre disponível na ' +
            'Plataforma, com a data da última atualização, e alterações relevantes serão comunicadas por meio da Plataforma ou do e-mail cadastrado.',
        ],
      },
      {
        t: 'Contato',
        i: [
          'Para dúvidas, solicitações ou reclamações sobre esta Política ou sobre o tratamento de Dados Pessoais, entre em contato: e-mail ' + EMAIL +
            ' ou telefone ' + TELEFONE + '.',
        ],
      },
    ],
  };

  /* =====================================================================
     Montagem das janelas
     ===================================================================== */
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  function listaHTML(it) {
    const itens = it.a.map((x) => (
      Array.isArray(x) ? `<li><b>${esc(x[0])}</b> ${esc(x[1])}</li>` : `<li>${esc(x)}</li>`
    )).join('');
    return it.m === 'ul'
      ? `<ul class="legal-lista">${itens}</ul>`
      : `<ol class="legal-lista legal-alineas">${itens}</ol>`;
  }

  function secaoHTML(secao, n) {
    const itens = secao.i.map((it, k) => {
      const num = `${n}.${k + 1}`;
      if (typeof it === 'string') {
        return `<p><span class="legal-num">${num}</span>${esc(it)}</p>`;
      }
      return `<p><span class="legal-num">${num}</span>${esc(it.t)}</p>${listaHTML(it)}`;
    }).join('');
    return `<section class="legal-secao"><h3>${n}. ${esc(secao.t)}</h3>${itens}</section>`;
  }

  // Na tela inicial o "Fechar" volta ao cartão de acesso; nas páginas internas, ao rodapé.
  const destinoFechar = () => (document.getElementById('acesso') ? '#acesso' : '#rodape');

  function montar(doc) {
    const antigo = document.getElementById(doc.id);
    if (antigo) antigo.remove();

    const janela = document.createElement('div');
    janela.className = 'janela';
    janela.id = doc.id;
    janela.setAttribute('role', 'dialog');
    janela.setAttribute('aria-modal', 'true');
    janela.setAttribute('aria-labelledby', 'titulo-' + doc.id);
    janela.innerHTML = `
      <div class="janela-caixa janela-legal">
        <div class="legal-cabeca">
          <h2 id="titulo-${doc.id}">${esc(doc.titulo)}</h2>
          <p class="legal-meta">Versão ${VERSAO} • Última atualização: ${ATUALIZACAO}</p>
        </div>
        <div class="legal-corpo" tabindex="0">
          <p class="legal-preambulo">${esc(doc.preambulo)}</p>
          ${doc.secoes.map((s, k) => secaoHTML(s, k + 1)).join('')}
        </div>
        <div class="legal-rodape">
          <a href="${destinoFechar()}" class="botao-principal">Fechar</a>
        </div>
      </div>`;
    document.body.appendChild(janela);
  }

  function focarCorpo() {
    const id = location.hash.replace('#', '');
    if (id !== 'termos' && id !== 'privacidade') return;
    const corpo = document.querySelector(`#${id} .legal-corpo`);
    if (corpo) { corpo.scrollTop = 0; corpo.focus({ preventScroll: true }); }
  }

  montar(TERMOS);
  montar(PRIVACIDADE);

  window.addEventListener('hashchange', focarCorpo);
  focarCorpo();

  // Esc fecha a janela aberta
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && /^#(termos|privacidade)$/.test(location.hash)) {
      location.hash = destinoFechar();
    }
  });
})();
