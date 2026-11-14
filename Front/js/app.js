/* ============================================================================
   CONECTA SAÚDE — app.js
   Único arquivo JavaScript do site. Todas as páginas (index.html e html/*.html)
   carregam este arquivo, e ele só "liga" o que existir na página aberta
   (por exemplo: se a página não tem o formulário de login, o código de login
   simplesmente não roda).

   COMO LER ESTE ARQUIVO
   - O arquivo está dividido em SEÇÕES numeradas (veja o índice abaixo).
   - Cada função começa com um comentário dizendo o que ela faz.
   - Funções chamadas "iniciarXxx" são as que ligam uma tela (adicionam os cliques,
     validações etc.). Elas ficam todas listadas na seção 13, no final do arquivo.

   ÍNDICE
    1. Configurações ............ endereço da API, perfis, lista de estados
    2. Ferramentas pequenas ..... funções de uso geral (criar elementos, máscaras...)
    3. Sessão (login) ........... quem está logado, token, sair
    4. Dados no navegador ....... guardar coisas por usuário (logo, cadastro, recusas)
    5. Termos e Privacidade ..... janelas dos links do rodapé
    6. Widgets de acessibilidade  VLibras e UserWay
    7. Menu do usuário e logo ... bolinha com iniciais, "Meu cadastro", "Sair"
    8. Tela inicial ............. login e criação de conta (index.html)
    9. Cadastro da instituição .. dados salvos no banco (rotas /api/perfil)
   10. Cadastro do laboratório .. dados, requisitos e impressoras
   11. Lista de pedidos ......... busca, filtro, ordem e exportar CSV (aacd.html)
   12. Telas de solicitação ..... janela modal, recusar, arquivo 3D, quadro kanban
   13. Início ................... decide o que rodar em cada página
   ============================================================================ */

// "(() => { ... })();" é uma função que se executa sozinha. Serve para deixar todas as
// variáveis abaixo PRIVADAS (nada vaza para outros scripts). 'use strict' faz o navegador
// avisar de erros comuns de programação em vez de ignorá-los.
(() => {
    'use strict';

    /* ========================================================================
       1. CONFIGURAÇÕES
       ======================================================================== */

    // Endereço do back-end. Se o site for aberto pelo próprio servidor (http://localhost:5000),
    // usa caminho relativo; se for aberto pelo Live Server ou direto do arquivo, aponta
    // para o servidor local.
    const API = (location.protocol.startsWith('http') && location.port === '5000')
        ? '/api'
        : 'http://localhost:5000/api';

    // Nome sob o qual a sessão fica guardada no navegador (localStorage).
    const CHAVE_SESSAO = 'conectasaude.sessao';

    // O site chama os perfis de "aacd"/"fablab"; o banco de dados chama de "cliente"/"fornecedor".
    const PERFIL_PARA_API = { aacd: 'cliente', fablab: 'fornecedor' };

    // Página inicial de cada perfil logado (caminho a partir da raiz do site).
    const HOME_DO_PERFIL = {
        cliente: 'html/aacd.html',
        fornecedor: 'html/solicitacoes.html',
        admin: 'html/aacd.html'
    };

    // Quais páginas cada perfil pode abrir. Se tentar abrir outra, é mandado para a sua home.
    const PAGINAS_DO_PERFIL = {
        cliente: ['aacd.html', 'pedido.html', 'laboratorio_instituicao.html', 'detalhe_laboratorio_instituicao.html', 'cadastro_instituicao.html'],
        fornecedor: ['fablab.html', 'solicitacoes.html', 'detalhe_solicitacao.html']
    };

    // Rótulo do perfil mostrado embaixo do nome, no menu do topo.
    const ROTULO_PERFIL = { cliente: 'Instituição', fornecedor: 'Laboratório', admin: 'Administrador' };

    // Página "Meu cadastro" de cada perfil (aparece no menu do usuário).
    const PAGINA_CADASTRO = { cliente: 'cadastro_instituicao.html', fornecedor: 'fablab.html' };

    const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
    const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // "algo@algo.algo", sem espaços
    const TIPOS_DE_LOGO = ['image/png', 'image/jpeg', 'image/webp'];

    /* ========================================================================
       2. FERRAMENTAS PEQUENAS (usadas em várias telas)
       ======================================================================== */

    // Atalho: $('nome') = document.getElementById('nome')
    const $ = (id) => document.getElementById(id);

    // Cria um elemento HTML: criar('p', 'classe', 'texto') → <p class="classe">texto</p>.
    // O texto entra por textContent, ou seja, NUNCA é interpretado como HTML (mais seguro).
    function criar(tag, classe, texto) {
        const el = document.createElement(tag);
        if (classe) el.className = classe;
        if (texto) el.textContent = texto;
        return el;
    }

    // Deixa só os números de um texto: "(11) 9999-0000" → "1199990000"
    const soDigitos = (v) => String(v).replace(/\D/g, '');

    // 5 → "05" (para horas e contadores)
    const doisDigitos = (n) => String(n).padStart(2, '0');

    // Mostra uma mensagem num elemento (e o esconde quando a mensagem é vazia).
    function mostrarTexto(el, msg) {
        el.textContent = msg || '';
        el.hidden = !msg;
    }

    // Cria uma função de aviso com dois campos: um de erro e um de sucesso.
    // Uso: const avisar = fazerAviso(elErro, elOk); avisar('deu erro'); avisar('', 'deu certo');
    const fazerAviso = (elErro, elOk) => (msgErro, msgOk) => {
        mostrarTexto(elErro, msgErro);
        mostrarTexto(elOk, msgOk);
    };

    // Coloca as opções "AC, AL, ... TO" dentro de um <select> de estados.
    function preencherUFs(select) {
        UFS.forEach((uf) => {
            const opcao = document.createElement('option');
            opcao.value = uf;
            opcao.textContent = uf;
            select.appendChild(opcao);
        });
    }

    // "Instituição São Paulo" → "IS" (ignora "de/da/do/e" no meio do nome).
    // Se não houver nome, usa a primeira letra do e-mail.
    function iniciaisDe(nome, email) {
        const palavras = String(nome || '').trim().split(/\s+/).filter((p) => p && !/^(d[aeo]s?|e)$/i.test(p));
        const letras = palavras.slice(0, 2).map((p) => p.charAt(0)).join('');
        return (letras || String(email || '?').charAt(0)).toUpperCase();
    }

    // ----- Máscaras: formatam o que a pessoa digita enquanto ela digita -----
    function mascaraCnpj(v) { // 12345678000190 → 12.345.678/0001-90
        const d = soDigitos(v).slice(0, 14);
        let o = d.slice(0, 2);
        if (d.length > 2) o += '.' + d.slice(2, 5);
        if (d.length > 5) o += '.' + d.slice(5, 8);
        if (d.length > 8) o += '/' + d.slice(8, 12);
        if (d.length > 12) o += '-' + d.slice(12, 14);
        return o;
    }
    function mascaraCep(v) { // 01234567 → 01234-567
        const d = soDigitos(v).slice(0, 8);
        return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
    }
    function mascaraTelefone(v) { // 11999990000 → (11) 99999-0000
        const d = soDigitos(v).slice(0, 11);
        if (!d) return '';
        if (d.length < 3) return '(' + d;
        const ddd = d.slice(0, 2), resto = d.slice(2);
        if (resto.length <= 4) return '(' + ddd + ') ' + resto;
        if (d.length <= 10) return '(' + ddd + ') ' + resto.slice(0, 4) + '-' + resto.slice(4);
        return '(' + ddd + ') ' + resto.slice(0, 5) + '-' + resto.slice(5);
    }

    // Mostra (ou limpa) a mensagem de erro logo abaixo de um campo do formulário.
    // A mensagem <small> é criada na primeira vez que é preciso; depois só é reaproveitada.
    // Também marca o campo como inválido para leitores de tela (aria-invalid).
    function marcarErro(el, msg) {
        const campo = el.closest('.campo');
        if (!campo) return;
        // campos de senha têm um botão de "olho" ao lado: a mensagem vai depois do conjunto todo
        const ancora = el.closest('.campo-senha') || el;
        let aviso = campo.querySelector('.campo-erro[data-de="' + el.id + '"]');
        if (!aviso && msg) {
            aviso = criar('small', 'campo-erro');
            aviso.id = 'erro-' + el.id;
            aviso.dataset.de = el.id;
            aviso.setAttribute('role', 'alert');
            ancora.insertAdjacentElement('afterend', aviso);
        }
        if (aviso) mostrarTexto(aviso, msg);
        el.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg) el.setAttribute('aria-describedby', 'erro-' + el.id);
        else el.removeAttribute('aria-describedby');
    }

    /* ========================================================================
       3. SESSÃO (quem está logado)
       O servidor devolve um "token" no login. Guardamos token + dados do usuário
       no localStorage (memória do navegador que sobrevive ao fechar a aba).
       ======================================================================== */

    // Lê a sessão guardada. Devolve null se não existe, está corrompida ou o token já venceu.
    function lerSessao() {
        try {
            const s = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
            if (!s || !s.token || !s.usuario) return null;
            // O token (JWT) tem 3 partes separadas por "."; a do meio guarda a data de validade ("exp").
            const { exp } = JSON.parse(atob(s.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (exp && exp * 1000 < Date.now()) { limparSessao(); return null; }
            return s;
        } catch {
            return null;
        }
    }
    const salvarSessao = (token, usuario) => localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token, usuario }));
    const limparSessao = () => localStorage.removeItem(CHAVE_SESSAO);

    // Encerra a sessão e volta ao login, deixando um recado para a tela de login mostrar.
    function encerrarSessao(motivo) {
        limparSessao();
        sessionStorage.setItem('conectasaude.motivo', motivo || 'Sessão expirada. Entre novamente.');
        window.location.replace('../index.html');
    }

    // Fica disponível globalmente como "CS" (ex.: CS.fetchAutenticado('/perfil')).
    // fetchAutenticado = fetch normal, mas já enviando o token do usuário no cabeçalho.
    window.CS = {
        sessao: lerSessao,
        fetchAutenticado(caminho, opcoes = {}) {
            const s = lerSessao();
            return fetch(API + caminho, {
                ...opcoes,
                headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}), Authorization: 'Bearer ' + (s ? s.token : '') }
            });
        }
    };

    // Chama uma rota do servidor com o token. Devolve { resp, dados } e, se o servidor
    // disser que o token não vale mais (401), já manda a pessoa de volta ao login.
    async function pedirAoServidor(caminho, opcoes) {
        const resp = await CS.fetchAutenticado(caminho, opcoes);
        const dados = await resp.json().catch(() => ({}));
        if (resp.status === 401) encerrarSessao(dados.erro);
        return { resp, dados };
    }

    // Páginas internas exigem login e o perfil certo (instituição ou laboratório).
    function protegerPaginaInterna() {
        const sessao = lerSessao();
        if (!sessao) {
            sessionStorage.setItem('conectasaude.motivo', 'Sessão não encontrada ou expirada. Entre novamente.');
            console.warn('[Conecta Saúde] sem sessão válida; voltando ao login.');
            window.location.replace('../index.html');
            return;
        }
        const pagina = location.pathname.split('/').pop(); // "aacd.html", "fablab.html"...
        const permitidas = PAGINAS_DO_PERFIL[sessao.usuario.perfil];
        if (permitidas && !permitidas.includes(pagina)) {
            window.location.replace(HOME_DO_PERFIL[sessao.usuario.perfil].replace('html/', ''));
        }
    }

    /* ========================================================================
       4. DADOS GUARDADOS NO NAVEGADOR, POR USUÁRIO
       Enquanto o back-end não tem todas as rotas, algumas coisas ficam no localStorage.
       Cada usuário tem a sua "chave": conectasaude.<assunto>.<id do usuário>
       Assuntos usados: "logo", "lab" (cadastro do laboratório) e "recusadas" (solicitações).
       Se o navegador bloquear o armazenamento, as funções não quebram: devolvem null/false.
       ======================================================================== */

    function chaveDoUsuario(assunto) {
        const s = lerSessao();
        return s ? 'conectasaude.' + assunto + '.' + (s.usuario.id || s.usuario.email) : null;
    }
    function lerGuardado(assunto) { // devolve o texto guardado ou null
        const chave = chaveDoUsuario(assunto);
        try { return chave ? localStorage.getItem(chave) : null; } catch { return null; }
    }
    function gravarGuardado(assunto, texto) { // devolve true se conseguiu guardar
        const chave = chaveDoUsuario(assunto);
        if (!chave) return false;
        try { localStorage.setItem(chave, texto); return true; } catch { return false; }
    }
    function apagarGuardado(assunto) {
        const chave = chaveDoUsuario(assunto);
        try { if (chave) localStorage.removeItem(chave); } catch { /* sem acesso ao armazenamento */ }
    }
    function lerGuardadoJson(assunto) { // para dados que foram guardados como JSON
        try { return JSON.parse(lerGuardado(assunto)); } catch { return null; }
    }

    // Atalhos por assunto
    const lerLogo = () => lerGuardado('logo');
    const salvarLogo = (dataUrl) => gravarGuardado('logo', dataUrl);
    const removerLogo = () => apagarGuardado('logo');
    const lerLab = () => lerGuardadoJson('lab');
    const salvarLab = (estado) => gravarGuardado('lab', JSON.stringify(estado));
    const lerRecusas = () => lerGuardadoJson('recusadas') || {};
    function gravarRecusa(codigo, dados) {
        const todas = lerRecusas();
        todas[codigo] = dados;
        return gravarGuardado('recusadas', JSON.stringify(todas));
    }

    /* ========================================================================
       5. TERMOS DE USO E POLÍTICA DE PRIVACIDADE
       Os links "#termos" e "#privacidade" (rodapé de todas as páginas e caixa de aceite
       do cadastro) abrem uma janela com o texto correspondente, sem sair da página.
       Para mudar um texto, edite TEXTOS; para mudar a data, edite ATUALIZADO.

       Formato de cada seção em TEXTOS:
         ['Título', 'parágrafo', ['item de lista', 'item de lista'], 'parágrafo']
       (um texto simples vira parágrafo; uma lista [...] vira marcadores)
       ======================================================================== */

    const ATUALIZADO = '14 de novembro de 2026';

    const TEXTOS = {
        termos: {
            titulo: 'Termos de Uso',
            abertura: 'Ao criar uma conta ou utilizar a plataforma Conecta Saúde, o usuário declara ter lido e concordado com estes Termos de Uso.',
            secoes: [
                ['Sobre a plataforma',
                    'A Conecta Saúde é uma iniciativa do Instituto Mauá de Tecnologia que aproxima instituições de saúde e laboratórios FabLab para a produção de órteses e próteses por impressão 3D. A plataforma facilita o registro, o acompanhamento e a comunicação dos pedidos; ela não presta atendimento clínico nem substitui a avaliação de profissionais de saúde.'],
                ['Cadastro e acesso',
                    'O uso da plataforma exige cadastro como Instituição ou como Laboratório. O usuário deve informar dados verdadeiros e atualizados, manter sua senha em sigilo e responde pelas atividades realizadas em sua conta. A troca de senha é solicitada à equipe da Conecta Saúde.'],
                ['Responsabilidades da Instituição',
                    'A Instituição deve informar medidas, material, prazo e demais requisitos de forma correta e completa, e permanece responsável pela indicação clínica, pelo uso e pela adaptação da peça ao paciente. Deve também evitar o envio de dados que identifiquem o paciente além do estritamente necessário.'],
                ['Responsabilidades do Laboratório',
                    'O Laboratório deve avaliar sua capacidade antes de aceitar um pedido, produzir a peça conforme as especificações recebidas, manter o andamento da produção atualizado e cumprir os prazos aceitos.'],
                ['Condutas proibidas',
                    'É vedado ao usuário:',
                    ['utilizar a plataforma para fins ilícitos ou fornecer informações falsas;',
                     'acessar contas ou áreas sem autorização, ou tentar comprometer a segurança do sistema;',
                     'enviar arquivos ou mensagens de conteúdo ilícito, malicioso ou que violem direitos de terceiros.']],
                ['Propriedade intelectual',
                    'A marca, o layout e o código da plataforma pertencem ao Instituto Mauá de Tecnologia ou a seus licenciantes. Os modelos e arquivos enviados continuam sendo de seus titulares, que autorizam o uso deles pelo laboratório destinatário apenas para a produção do pedido.'],
                ['Limitação de responsabilidade',
                    'A plataforma atua como intermediadora. Ela não garante o aceite dos pedidos, os prazos, a qualidade ou a adequação clínica das peças produzidas, nem responde por acordos feitos entre as partes fora da plataforma ou por indisponibilidades temporárias do serviço, salvo nos casos previstos em lei.'],
                ['Suspensão e encerramento',
                    'O acesso poderá ser suspenso ou encerrado em caso de descumprimento destes Termos ou de uso indevido. O usuário pode solicitar o encerramento de sua conta a qualquer momento pelo contato abaixo.'],
                ['Alterações e contato',
                    'Estes Termos podem ser atualizados, e a versão vigente ficará sempre disponível na plataforma, com a data da última atualização. Eles são regidos pelas leis da República Federativa do Brasil. Dúvidas: conectasaude@maua.br.']
            ]
        },

        privacidade: {
            titulo: 'Política de Privacidade',
            abertura: 'Esta Política explica como a Conecta Saúde trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).',
            secoes: [
                ['Controlador',
                    'O Instituto Mauá de Tecnologia é o responsável pelas decisões sobre o tratamento dos dados na plataforma. Contato: conectasaude@maua.br.'],
                ['Dados tratados',
                    'A plataforma trata as seguintes informações:',
                    ['cadastro: nome da instituição, responsável, cidade, UF, e-mail, telefone, senha (guardada apenas de forma protegida) e logo, se enviado;',
                     'pedidos: identificação reduzida do paciente, material, prazo, medidas, observações, arquivo 3D e mensagens trocadas no chat;',
                     'laboratórios: requisitos e equipamentos cadastrados;',
                     'sessão: informações guardadas no navegador para manter o usuário conectado.']],
                ['Finalidades e bases legais',
                    'Os dados são usados para criar e manter contas, viabilizar os pedidos e a comunicação entre instituições e laboratórios, e garantir a segurança da plataforma. O tratamento se baseia na execução do serviço solicitado pelo usuário, no cumprimento de obrigação legal e no legítimo interesse de proteger o sistema.'],
                ['Dados de pacientes',
                    'Os pedidos podem conter informações relacionadas a pacientes, que podem ser dados pessoais sensíveis. Por isso, a Instituição deve informar apenas o necessário para a fabricação da peça, preferindo identificadores reduzidos a nome ou documentos, e responde por ter fundamento legal adequado para esse compartilhamento.'],
                ['Compartilhamento',
                    'Os dados de cada pedido ficam disponíveis à Instituição e ao Laboratório envolvidos. Não vendemos dados pessoais, e eles só serão informados a autoridades quando a lei exigir. A plataforma usa recursos de terceiros (fontes, ferramentas de acessibilidade como VLibras e UserWay, e bibliotecas do visualizador 3D), que podem receber o endereço IP do navegador ao serem carregados.'],
                ['Armazenamento e segurança',
                    'Adotamos medidas técnicas e administrativas para proteger os dados contra acesso não autorizado, perda ou alteração, embora nenhum sistema seja totalmente isento de riscos. Os dados são mantidos enquanto a conta estiver ativa e pelo tempo necessário para cumprir as finalidades e as obrigações legais, sendo depois eliminados ou anonimizados.'],
                ['Armazenamento no navegador',
                    'Usamos o armazenamento local do navegador para manter a sessão e guardar preferências, como o logo e alterações de cadastro em andamento. Essas informações não são usadas para publicidade.'],
                ['Direitos do titular',
                    'O titular pode solicitar:',
                    ['a confirmação da existência de tratamento e o acesso aos seus dados;',
                     'a correção de dados incompletos, inexatos ou desatualizados;',
                     'a anonimização, o bloqueio ou a eliminação de dados desnecessários;',
                     'a portabilidade e a informação sobre com quem os dados foram compartilhados;',
                     'a revogação do consentimento, quando ele for a base do tratamento.'],
                    'As solicitações devem ser enviadas para conectasaude@maua.br.'],
                ['Atualizações',
                    'Esta Política pode ser atualizada. A versão vigente ficará sempre disponível na plataforma, com a data da última atualização.']
            ]
        }
    };

    // Monta a janela (<dialog>) de um dos textos. O navegador cuida do Esc, do fundo escuro e do foco.
    function montarJanelaLegal(chave) {
        const texto = TEXTOS[chave];
        const janela = criar('dialog', 'janela-legal');
        janela.id = 'janela-' + chave;
        janela.setAttribute('aria-labelledby', 'titulo-' + chave);

        // Cabeçalho e rodapé são <div> porque as tags header/footer têm estilo próprio no home.css
        const titulo = criar('h2', '', texto.titulo);
        titulo.id = 'titulo-' + chave;
        const cabeca = criar('div', 'legal-cabeca');
        cabeca.append(titulo, criar('p', 'legal-meta', 'Última atualização: ' + ATUALIZADO));

        // Corpo: texto de abertura + uma <section> numerada para cada item de "secoes"
        const corpo = criar('div', 'legal-corpo');
        corpo.tabIndex = 0; // permite rolar o texto pelo teclado
        corpo.append(criar('p', 'legal-preambulo', texto.abertura));
        texto.secoes.forEach(([nome, ...blocos], i) => {
            const secao = criar('section', 'legal-secao');
            const h3 = criar('h3');
            h3.append(criar('span', 'legal-num', (i + 1) + '.'), nome);
            secao.append(h3);
            blocos.forEach((bloco) => {
                if (Array.isArray(bloco)) { // lista de marcadores
                    const lista = criar('ul', 'legal-lista');
                    bloco.forEach((item) => lista.append(criar('li', '', item)));
                    secao.append(lista);
                } else { // parágrafo
                    secao.append(criar('p', '', bloco));
                }
            });
            corpo.append(secao);
        });

        const fechar = criar('button', 'botao-principal', 'Fechar');
        fechar.type = 'button';
        fechar.addEventListener('click', () => janela.close());
        const rodape = criar('div', 'legal-rodape');
        rodape.append(fechar);

        janela.addEventListener('click', (e) => { if (e.target === janela) janela.close(); }); // clique no fundo escuro
        janela.append(cabeca, corpo, rodape);
        document.body.append(janela);
        return janela;
    }

    // Abre a janela "termos" ou "privacidade". A janela é montada só na primeira vez que é pedida.
    const janelasLegais = {};
    function abrirJanelaLegal(chave) {
        if (!Object.keys(TEXTOS).includes(chave)) return;
        if (!janelasLegais[chave]) janelasLegais[chave] = montarJanelaLegal(chave);
        if (!janelasLegais[chave].open) janelasLegais[chave].showModal();
    }

    function iniciarTermos() {
        // Qualquer link para #termos ou #privacidade abre a janela (um só "ouvinte" para a página toda)
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href="#termos"], a[href="#privacidade"]');
            if (!link) return;
            e.preventDefault();
            abrirJanelaLegal(link.getAttribute('href').slice(1));
        });
        // Endereço aberto direto em ...#termos ou ...#privacidade
        abrirJanelaLegal(location.hash.slice(1));
    }

    /* ========================================================================
       6. WIDGETS DE ACESSIBILIDADE
       Os dois são carregados de fora (internet). Se não carregarem (sem rede ou
       bloqueador de anúncios), o site segue normal, só sem o botão.
       ======================================================================== */

    // VLibras: tradutor para Libras do governo federal
    const VLIBRAS_URL = 'https://vlibras.gov.br/app';
    function iniciarVLibras() {
        if (document.querySelector('[vw]') || $('vlibras-script')) return;

        // A "caixa" que o VLibras espera encontrar na página
        const widget = document.createElement('div');
        widget.setAttribute('vw', '');
        widget.className = 'enabled';
        widget.innerHTML =
            '<div vw-access-button class="active"></div>' +
            '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
        document.body.appendChild(widget);

        const script = document.createElement('script');
        script.id = 'vlibras-script';
        script.src = VLIBRAS_URL + '/vlibras-plugin.js';
        script.async = true;
        script.onload = () => {
            try { new window.VLibras.Widget(VLIBRAS_URL); } catch { widget.remove(); }
        };
        script.onerror = () => widget.remove();
        document.body.appendChild(script);
    }

    // UserWay: botão de acessibilidade (contraste, tamanho da fonte, leitor etc.)
    // O ID da conta está no painel do UserWay (Install → valor de data-account).
    // Se ficar vazio, o widget não é carregado.
    const USERWAY_ACCOUNT = '0bH9G4qEju';
    function iniciarUserWay() {
        if (!USERWAY_ACCOUNT || $('userway-script')) return;
        const script = document.createElement('script');
        script.id = 'userway-script';
        script.src = 'https://cdn.userway.org/widget.js';
        script.dataset.account = USERWAY_ACCOUNT;
        script.dataset.position = '6'; // 3 = canto inferior esquerdo (o padrão do UserWay é 6, inferior direito)
        script.async = true;
        script.onerror = () => script.remove();
        document.body.appendChild(script);
    }

    /* ========================================================================
       7. MENU DO USUÁRIO E LOGO
       No topo das páginas internas, o botão "Sair" vira uma bolinha com o logo (ou as
       iniciais), o nome e um menu com "Meu cadastro" e "Sair".
       ======================================================================== */

    // Ganchos que o menu preenche quando é montado; outras telas os chamam para atualizar o menu
    // (ex.: depois de trocar o logo ou o nome). Antes de o menu existir, não fazem nada.
    let atualizarAvatarMenu = () => {};
    let atualizarNomeMenu = () => {};

    // Redimensiona a imagem escolhida para 192×192, com fundo branco e o logo inteiro visível
    // dentro do círculo. Devolve uma Promise com a imagem em texto (data URL, "data:image/png;base64,...").
    function prepararLogo(arquivo) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(arquivo);
            const img = new Image();
            img.onload = () => {
                const T = 192;
                const c = document.createElement('canvas'); // "folha de desenho" invisível
                c.width = c.height = T;
                const g = c.getContext('2d');
                g.fillStyle = '#fff';
                g.fillRect(0, 0, T, T);
                g.imageSmoothingQuality = 'high';
                const caixa = T * 0.80; // deixa o logo grande sem cortar o conteúdo no círculo
                const esc = Math.min(caixa / img.width, caixa / img.height);
                const w = img.width * esc, h = img.height * esc;
                g.drawImage(img, (T - w) / 2, (T - h) / 2, w, h);
                URL.revokeObjectURL(url);
                resolve(c.toDataURL('image/png'));
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagem inválida')); };
            img.src = url;
        });
    }

    // O arquivo do logo é aceitável? (PNG, JPG ou WebP de até 5 MB)
    const logoValido = (arq) => TIPOS_DE_LOGO.includes(arq.type) && arq.size <= 5 * 1024 * 1024;

    // Preenche a bolinha do menu: o logo, se houver; senão as iniciais.
    function preencherAvatar(avatar, u) {
        const logo = lerLogo();
        avatar.textContent = '';
        if (logo) {
            const img = document.createElement('img');
            img.src = logo;
            img.alt = '';
            avatar.appendChild(img);
        } else {
            avatar.textContent = iniciaisDe(u.nomeInstituicao, u.email);
        }
    }

    // Preenche a pré-visualização redonda do logo nas telas de cadastro (logo ou iniciais)
    // e mostra o botão "Remover" só quando existe um logo.
    function desenharPreviaLogo(previa, botaoRemover, logo, u) {
        previa.style.backgroundImage = logo ? `url(${logo})` : '';
        previa.style.backgroundSize = 'cover';
        previa.style.backgroundPosition = 'center';
        previa.textContent = logo ? '' : iniciaisDe(u.nomeInstituicao, u.email);
        botaoRemover.hidden = !logo;
    }

    // Troca o botão "Sair" original pela bolinha + nome + menu.
    function montarMenuUsuario() {
        const botaoSair = $('botao-sair');
        const sessao = lerSessao();
        if (!botaoSair || !sessao) return; // sem sessão: mantém o botão "Sair" original

        const u = sessao.usuario;
        const paginaCadastro = PAGINA_CADASTRO[u.perfil];

        const conta = criar('div', 'conta');
        conta.innerHTML =
            '<button type="button" class="usuario-botao" id="usuario-botao" aria-haspopup="menu" aria-expanded="false" aria-controls="usuario-menu">' +
                '<span class="usuario-avatar" aria-hidden="true"></span>' +
                '<span class="usuario-textos"><b class="usuario-nome"></b><small class="usuario-perfil"></small></span>' +
                '<img class="usuario-seta" src="../img/seta-baixo.png" alt="" width="16" height="16">' +
            '</button>' +
            '<div class="usuario-menu" id="usuario-menu" role="menu" aria-labelledby="usuario-botao" hidden>' +
                (paginaCadastro
                    ? '<a href="' + paginaCadastro + '" class="usuario-menu-item usuario-menu-item-normal" role="menuitem"' +
                      (location.pathname.split('/').pop() === paginaCadastro ? ' aria-current="page"' : '') +
                      '><img class="icone" src="../img/usuario.png" alt="">Meu cadastro</a>'
                    : '') +
                '<a href="../index.html" class="usuario-menu-item" id="botao-sair" role="menuitem"><img class="icone" src="../img/sair.png" alt="">Sair</a>' +
            '</div>';

        const botao = conta.querySelector('.usuario-botao');
        const menu = conta.querySelector('.usuario-menu');
        const avatar = conta.querySelector('.usuario-avatar');

        // Os textos entram por textContent: o nome vem do cadastro e nunca deve ser lido como HTML.
        atualizarAvatarMenu = () => preencherAvatar(avatar, u);
        atualizarNomeMenu = () => {
            const atual = lerSessao();
            if (!atual) return;
            const nome = atual.usuario.nomeInstituicao || atual.usuario.email || 'Minha conta';
            conta.querySelector('.usuario-nome').textContent = nome;
            botao.setAttribute('aria-label', 'Menu da conta de ' + nome);
        };
        atualizarAvatarMenu();
        atualizarNomeMenu();
        conta.querySelector('.usuario-perfil').textContent = ROTULO_PERFIL[u.perfil] || '';

        botaoSair.replaceWith(conta); // o novo "Sair" mantém o id, então o clique de sair (seção 13) continua valendo

        // Abrir/fechar o menu. Com o teclado, ao abrir o foco vai para o primeiro item.
        const fecharMenu = () => { menu.hidden = true; botao.setAttribute('aria-expanded', 'false'); };
        const abrirMenu = (viaTeclado) => {
            menu.hidden = false;
            botao.setAttribute('aria-expanded', 'true');
            if (viaTeclado) menu.querySelector('[role="menuitem"]').focus();
        };
        botao.addEventListener('click', (e) => (menu.hidden ? abrirMenu(e.detail === 0) : fecharMenu())); // detail 0 = veio do teclado
        document.addEventListener('click', (e) => { if (!conta.contains(e.target)) fecharMenu(); }); // clique fora fecha
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.hidden) { fecharMenu(); botao.focus(); }
        });
        menu.addEventListener('keydown', (e) => { if (e.key === 'Tab') fecharMenu(); });
    }

    // Campo "Logo" da página de edição do cadastro do LABORATÓRIO (fablab.html).
    // O logo é salvo no navegador assim que a imagem é escolhida.
    function iniciarLogoCadastro() {
        const input = $('logo-lab');
        const sessao = lerSessao();
        if (!input || !sessao) return;

        const u = sessao.usuario;
        const previa = $('logo-previa');
        const remover = $('logo-remover');
        const avisar = fazerAviso($('erro-logo'), $('logo-ok'));
        const mostrarPrevia = () => desenharPreviaLogo(previa, remover, lerLogo(), u);
        mostrarPrevia();

        $('logo-escolher').addEventListener('click', () => input.click());

        input.addEventListener('change', async () => {
            const arq = input.files[0];
            avisar('');
            if (!arq) return;
            if (!logoValido(arq)) {
                avisar('Use PNG, JPG ou WebP de até 5 MB.');
                input.value = '';
                return;
            }
            try {
                const dataUrl = await prepararLogo(arq);
                if (!salvarLogo(dataUrl)) { avisar('Não foi possível guardar o logo neste navegador.'); return; }
                mostrarPrevia();
                atualizarAvatarMenu();
                avisar('', '✓ Logo atualizado no menu.');
            } catch {
                avisar('Não foi possível ler esta imagem. Tente outro arquivo.');
            } finally {
                input.value = ''; // permite escolher o mesmo arquivo de novo
            }
        });

        remover.addEventListener('click', () => {
            removerLogo();
            mostrarPrevia();
            atualizarAvatarMenu();
            avisar('', 'Logo removido.');
        });
    }

    // Instituição: o nome e o logo do menu vêm do banco de dados em todas as páginas da instituição
    // (menos na de cadastro, que faz a própria busca).
    function sincronizarPerfilMenu() {
        const s = lerSessao();
        if (!s || s.usuario.perfil !== 'cliente') return;
        if ($('form-conta')) return;
        carregarPerfil().catch(() => { /* sem rede: mantém o que já está no menu */ });
    }

    /* ========================================================================
       8. TELA INICIAL: LOGIN E CRIAÇÃO DE CONTA (index.html)
       O mesmo formulário serve para "Entrar" e "Criar conta"; a variável "modo"
       diz qual dos dois está ativo, e a tela se adapta.
       ======================================================================== */
    function iniciarHome(form) {
        const campos = {
            nome: $('nome'), cidade: $('cidade'), estado: $('estado'),
            email: $('email'), senha: $('senha'), aceite: $('aceite')
        };
        const botao = $('botao-acesso');
        const textoBotao = botao.querySelector('.botao-texto');
        const erroGeral = $('erro-acesso');
        let modo = 'login'; // 'login' ou 'cadastro'

        preencherUFs(campos.estado);

        // Recado deixado por outra página (ex.: "Sessão expirada"). Aparece uma vez só.
        const motivo = sessionStorage.getItem('conectasaude.motivo');
        if (motivo) {
            sessionStorage.removeItem('conectasaude.motivo');
            setTimeout(() => mostrarAviso(motivo, 'info'), 0);
        }

        // Perfil marcado nos botões de opção (Instituição ou Laboratório); "aacd" por padrão
        const perfilSelecionado = () => document.querySelector('input[name="perfil"]:checked')?.value || 'aacd';

        // ----- mensagens de erro -----
        function erroCampo(nome, mensagem) { // erro embaixo de um campo específico
            const el = $('erro-' + nome);
            if (!el) return;
            mostrarTexto(el, mensagem);
            const input = campos[nome];
            if (input && input.type !== 'checkbox') input.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
        }
        function mostrarAviso(mensagem, tipo) { // aviso geral acima do botão (tipo: 'info' ou 'ok'; sem tipo = erro)
            erroGeral.textContent = mensagem || '';
            erroGeral.className = 'aviso' + (tipo ? ' ' + tipo : '');
            erroGeral.hidden = !mensagem;
        }
        function limparErros() {
            Object.keys(campos).forEach((n) => erroCampo(n, ''));
            mostrarAviso('');
        }

        // ----- botão só habilita com e-mail e senha preenchidos -----
        function atualizarBotao() {
            botao.disabled = !(campos.email.value.trim() && campos.senha.value.trim());
        }
        campos.email.addEventListener('input', atualizarBotao);
        campos.senha.addEventListener('input', atualizarBotao);

        // ----- alternar "Entrar" / "Criar conta" -----
        function atualizarRotuloNome() {
            $('rotulo-nome').textContent = perfilSelecionado() === 'fablab'
                ? 'Nome do laboratório'
                : 'Nome da unidade da instituição';
        }
        function definirModo(novo) {
            modo = novo;
            const cadastro = modo === 'cadastro';
            document.querySelectorAll('.abas button').forEach((b) => {
                const ativa = b.dataset.modo === modo;
                b.classList.toggle('ativa', ativa);
                b.setAttribute('aria-pressed', String(ativa));
            });
            // campos extras (nome, cidade/UF, aceite dos termos) só existem no cadastro
            ['campo-nome', 'campo-local', 'campo-termo'].forEach((id) => { $(id).hidden = !cadastro; });
            document.querySelector('.link-esqueci').hidden = cadastro;
            $('aviso-credenciamento').hidden = !cadastro; // lembrete: o acesso depende da análise do credenciamento
            $('titulo-acesso').textContent = cadastro ? 'Crie sua conta' : 'Acesse a plataforma';
            $('sub-acesso').textContent = cadastro
                ? 'Cadastre sua instituição ou laboratório para começar.'
                : 'Entre para acompanhar pedidos e produções.';
            textoBotao.textContent = cadastro ? 'Criar conta' : 'Entrar';
            campos.senha.autocomplete = cadastro ? 'new-password' : 'current-password';
            atualizarRotuloNome();
            limparErros();
            atualizarBotao();
        }
        document.querySelectorAll('.abas button').forEach((b) => b.addEventListener('click', () => definirModo(b.dataset.modo)));
        document.querySelectorAll('input[name="perfil"]').forEach((r) => r.addEventListener('change', atualizarRotuloNome));
        atualizarBotao();

        // Os links "Acessar" e "Começar agora" rolam até o formulário; depois de 0,3 s o cursor vai ao e-mail
        ['abrir-acesso', 'comecar'].forEach((id) => {
            const a = $(id);
            if (a) a.addEventListener('click', () => setTimeout(() => campos.email.focus(), 300));
        });

        // ----- mostrar/ocultar senha e aviso de Caps Lock -----
        const verSenha = $('ver-senha');
        verSenha.addEventListener('click', () => {
            const mostrar = campos.senha.type === 'password';
            campos.senha.type = mostrar ? 'text' : 'password';
            verSenha.setAttribute('aria-pressed', String(mostrar));
            verSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
            verSenha.querySelector('.olho-aberto').style.display = mostrar ? 'none' : '';
            verSenha.querySelector('.olho-fechado').style.display = mostrar ? '' : 'none';
        });
        const avisoCaps = $('aviso-caps');
        const checarCaps = (e) => { avisoCaps.hidden = !(e.getModifierState && e.getModifierState('CapsLock')); };
        campos.senha.addEventListener('keydown', checarCaps);
        campos.senha.addEventListener('keyup', checarCaps);
        campos.senha.addEventListener('blur', () => { avisoCaps.hidden = true; });

        const MSG_ESQUECI = 'A recuperação de senha ainda não está disponível. Fale com conectasaude@maua.br.';
        document.querySelector('.link-esqueci').addEventListener('click', () => {
            // se a mensagem de "esqueci a senha" já está na tela, o segundo clique esconde
            const aberta = !erroGeral.hidden && erroGeral.textContent === MSG_ESQUECI;
            mostrarAviso(aberta ? '' : MSG_ESQUECI, 'info');
        });

        // ----- validação no navegador (o servidor valida de novo) -----
        function validar() {
            limparErros();
            let ok = true;
            const falha = (campo, msg) => { erroCampo(campo, msg); ok = false; };

            if (!EMAIL_VALIDO.test(campos.email.value.trim())) falha('email', 'Informe um e-mail válido.');
            if (modo === 'cadastro') {
                if (campos.senha.value.length < 8) falha('senha', 'A senha deve ter no mínimo 8 caracteres.');
                if (!campos.nome.value.trim()) falha('nome', 'Informe o nome.');
                if (!campos.cidade.value.trim()) falha('cidade', 'Informe a cidade.');
                if (!campos.estado.value) falha('estado', 'Escolha a UF.');
                if (!campos.aceite.checked) falha('aceite', 'É necessário aceitar os termos para criar a conta.');
            }
            return ok;
        }

        // ----- aviso depois de criar a conta: o acesso só libera após a análise do credenciamento -----
        function mostrarAvisoCredenciamento(email) {
            const fundo = criar('div', 'cred-fundo');
            const caixa = criar('div', 'cred-caixa');
            caixa.setAttribute('role', 'dialog');
            caixa.setAttribute('aria-modal', 'true');
            caixa.setAttribute('aria-labelledby', 'cred-titulo');
            const titulo = criar('h2', '', 'Cadastro recebido!');
            titulo.id = 'cred-titulo';
            titulo.tabIndex = -1;
            const p1 = criar('p', 'cred-texto', 'Por enquanto você ainda não consegue entrar na plataforma. '
                + 'O grupo Conecta Saúde vai analisar o credenciamento da sua conta antes de liberar o acesso.');
            const p2 = criar('p', 'cred-texto');
            p2.append('Quando for aprovado, você poderá entrar com o e-mail ', criar('b', '', email), '. ');
            p2.append('Dúvidas? Fale com ', criar('a', '', 'conectasaude@maua.br'), '.');
            p2.querySelector('a').href = 'mailto:conectasaude@maua.br';
            const ok = criar('button', 'cred-botao', 'Entendi');
            ok.type = 'button';
            caixa.append(titulo, p1, p2, ok);
            fundo.appendChild(caixa);
            document.body.appendChild(fundo);
            document.body.classList.add('sem-rolagem');
            titulo.focus();
            function fechar() {
                document.removeEventListener('keydown', teclas, true);
                fundo.remove();
                document.body.classList.remove('sem-rolagem');
                campos.email.focus();
            }
            function teclas(e) {
                if (e.key === 'Escape') { e.stopPropagation(); fechar(); }
                else if (e.key === 'Tab') { // mantém o foco dentro da janela (há só dois itens clicáveis)
                    const itens = [p2.querySelector('a'), ok];
                    const i = itens.indexOf(document.activeElement);
                    e.preventDefault();
                    itens[(i + (e.shiftKey ? -1 : 1) + itens.length) % itens.length].focus();
                }
            }
            document.addEventListener('keydown', teclas, true);
            ok.addEventListener('click', fechar);
            fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fechar(); });
        }

        // ----- envio do formulário (login ou cadastro) -----
        // "async/await" permite esperar a resposta do servidor sem travar a página.
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // impede o envio padrão (que recarregaria a página)
            if (!validar()) return;

            const cadastro = modo === 'cadastro';
            const corpo = cadastro
                ? {
                    nomeInstituicao: campos.nome.value.trim(),
                    email: campos.email.value.trim(),
                    senha: campos.senha.value,
                    perfil: PERFIL_PARA_API[perfilSelecionado()],
                    cidade: campos.cidade.value.trim(),
                    estado: campos.estado.value
                }
                : { email: campos.email.value.trim(), senha: campos.senha.value };

            botao.classList.add('carregando'); // mostra o "girando" no botão
            botao.disabled = true;

            try {
                const resposta = await fetch(`${API}/auth/${cadastro ? 'register' : 'login'}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(corpo)
                });
                const dados = await resposta.json().catch(() => ({}));

                // Conta ainda não aprovada (o servidor responde 403 no login): explica em vez de mostrar erro seco
                if (!cadastro && resposta.status === 403) {
                    mostrarAviso(dados.erro || 'Seu cadastro ainda está em análise pelo grupo Conecta Saúde. '
                        + 'Você poderá entrar assim que o credenciamento for aprovado.', 'info');
                    return;
                }
                if (!resposta.ok) {
                    mostrarAviso(dados.erro || 'Não foi possível concluir. Tente novamente.');
                    return;
                }

                // Conta nova: não entra na plataforma, só avisa que o credenciamento será analisado
                if (cadastro) {
                    const emailCadastrado = campos.email.value.trim();
                    form.reset();
                    definirModo('login');
                    mostrarAvisoCredenciamento(emailCadastrado);
                    return;
                }

                salvarSessao(dados.token, dados.usuario);
                mostrarAviso('Bem-vindo! Entrando…', 'ok');
                // O destino é decidido pelo perfil gravado no banco, não pela opção marcada na tela
                window.location.href = HOME_DO_PERFIL[dados.usuario.perfil] || 'html/aacd.html';
            } catch {
                mostrarAviso('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
            } finally { // roda sempre, deu certo ou errado
                botao.classList.remove('carregando');
                atualizarBotao();
            }
        });
    }

    /* ========================================================================
       9. CADASTRO DA INSTITUIÇÃO (cadastro_instituicao.html)
       Os dados ficam no banco, pelas rotas /api/perfil e /api/perfil/logo.
       ======================================================================== */

    // Atualiza o usuário guardado na sessão (o token continua o mesmo) e o nome no menu do topo.
    function atualizarSessaoUsuario(u) {
        const s = lerSessao();
        if (!s) return;
        const usuario = Object.assign({}, s.usuario);
        ['nomeInstituicao', 'email', 'cidade', 'estado', 'responsavel', 'telefone'].forEach((k) => {
            if (typeof u[k] === 'string') usuario[k] = u[k];
        });
        salvarSessao(s.token, usuario);
        atualizarNomeMenu();
    }

    // Busca o perfil no servidor. Só faz UMA busca por página: o menu e a tela de cadastro
    // compartilham o resultado (a "promessa" fica guardada em promessaPerfil).
    // forcar = true busca de novo, mesmo que já exista resultado.
    let promessaPerfil = null;
    function carregarPerfil(forcar) {
        if (promessaPerfil && !forcar) return promessaPerfil;
        promessaPerfil = (async () => {
            const { resp, dados } = await pedirAoServidor('/perfil');
            if (resp.status === 401) throw new Error('sessão inválida');
            if (!resp.ok || !dados.perfil) throw new Error(dados.erro || 'Não foi possível carregar o cadastro.');
            // o banco manda: o logo guardado no navegador é só uma cópia para o menu
            if (dados.perfil.logo) salvarLogo(dados.perfil.logo); else removerLogo();
            atualizarSessaoUsuario(dados.perfil);
            atualizarAvatarMenu();
            return dados.perfil;
        })();
        promessaPerfil.catch(() => { promessaPerfil = null; }); // se falhou, a próxima tentativa busca de novo
        return promessaPerfil;
    }

    function iniciarCadastroInstituicao() {
        const form = $('form-conta');
        const sessao = lerSessao();
        if (!form || !sessao) return;

        const CAMPOS = ['nomeInstituicao', 'responsavel', 'cidade', 'estado', 'email', 'telefone'];
        const ROTULOS = { nomeInstituicao: 'o nome da instituição', responsavel: 'o responsável', cidade: 'a cidade', estado: 'a UF', email: 'o e-mail', telefone: 'o telefone' };
        const TODOS = CAMPOS.concat(['senhaAtual']);

        const estadoTxt = $('conta-estado'); // texto "Tudo salvo" / "Alterações não salvas"...
        const salvar = $('conta-salvar');
        const descartar = $('conta-descartar');
        const aviso = $('conta-aviso');
        let original = null;   // dados como estão no banco (null enquanto carrega)
        let salvando = false;  // true durante o envio ao servidor

        preencherUFs($('estado'));

        // Muda o texto de situação ao lado do botão Salvar; "tipo" é a classe extra ('pendente' ou 'erro')
        const situacao = (texto, tipo) => {
            estadoTxt.textContent = texto;
            estadoTxt.className = 'salvo-auto' + (tipo ? ' ' + tipo : '');
        };

        // ----- aviso rápido (toast) no canto da tela, some sozinho em 3,5 s -----
        let tempoToast = null;
        function toast(msg, erro) {
            const t = $('toast');
            const icone = criar('img', 'icone');
            icone.src = '../img/' + (erro ? 'alerta.png' : 'check.png');
            icone.alt = '';
            t.textContent = '';
            t.append(icone, msg);
            t.className = 'toast' + (erro ? ' erro' : '');
            t.hidden = false;
            clearTimeout(tempoToast);
            tempoToast = setTimeout(() => { t.hidden = true; }, 3500);
        }

        // ----- ler / escrever o formulário -----
        // valores(): o que está digitado agora, já "limpo" (sem espaços, e-mail em minúsculas, telefone só números)
        const valores = () => ({
            nomeInstituicao: $('nomeInstituicao').value.trim(),
            responsavel: $('responsavel').value.trim(),
            cidade: $('cidade').value.trim(),
            estado: $('estado').value,
            email: $('email').value.trim().toLowerCase(),
            telefone: soDigitos($('telefone').value)
        });
        function preencher(u) { // coloca no formulário os dados vindos do banco
            CAMPOS.forEach((c) => { $(c).value = u[c] || ''; });
            $('telefone').value = mascaraTelefone(u.telefone || '');
        }
        function limparSenhas() { // esvazia o campo de senha e volta o "olho" ao estado inicial
            $('senhaAtual').value = '';
            $('senhaAtual').type = 'password';
            marcarErro($('senhaAtual'), '');
            document.querySelectorAll('.ver-senha').forEach((b) => {
                b.setAttribute('aria-pressed', 'false');
                b.setAttribute('aria-label', 'Mostrar senha');
            });
        }

        // Compara o que está digitado com o que está no banco: houve alteração?
        const normalizar = (campo, valor) =>
            campo === 'telefone' ? soDigitos(valor || '')
            : campo === 'email' ? String(valor || '').toLowerCase()
            : (valor || '');
        function mudouDados() {
            if (!original) return false;
            const v = valores();
            return CAMPOS.some((c) => v[c] !== normalizar(c, original[c]));
        }
        // Trocar o e-mail exige confirmar com a senha atual
        const precisaSenhaAtual = () => !!original && valores().email !== String(original.email || '').toLowerCase();

        // Atualiza a tela conforme o estado: campo de senha visível?, botão Salvar ligado?, texto de situação
        function atualizarTela() {
            const pede = precisaSenhaAtual();
            $('campo-senha-atual').hidden = !pede;
            if (!pede) { $('senhaAtual').value = ''; marcarErro($('senhaAtual'), ''); }

            if (!original || salvando) return;
            const alterado = mudouDados();
            salvar.disabled = !alterado;
            descartar.hidden = !alterado;
            situacao(alterado ? 'Alterações não salvas' : '✓ Tudo salvo', alterado ? 'pendente' : '');
        }

        // ----- eventos dos campos -----
        $('telefone').addEventListener('input', (e) => { e.target.value = mascaraTelefone(e.target.value); });
        TODOS.forEach((id) => $(id).addEventListener('input', () => {
            marcarErro($(id), '');
            mostrarTexto(aviso, '');
            atualizarTela();
        }));
        $('estado').addEventListener('change', () => { marcarErro($('estado'), ''); atualizarTela(); });

        // Botões de "olho": mostram/ocultam a senha do campo indicado em data-alvo
        document.querySelectorAll('.ver-senha').forEach((b) => b.addEventListener('click', () => {
            const alvo = $(b.dataset.alvo);
            const mostrar = alvo.type === 'password';
            alvo.type = mostrar ? 'text' : 'password';
            b.setAttribute('aria-pressed', String(mostrar));
            b.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
        }));

        // "Descartar alterações": volta o formulário ao que está no banco
        descartar.addEventListener('click', () => {
            if (!original) return;
            preencher(original);
            limparSenhas();
            TODOS.forEach((id) => marcarErro($(id), ''));
            mostrarTexto(aviso, '');
            atualizarTela();
        });

        // Avisa o navegador para perguntar "deseja sair?" se houver alterações não salvas
        window.addEventListener('beforeunload', (e) => {
            if (original && !salvando && mudouDados()) { e.preventDefault(); e.returnValue = ''; }
        });

        // ----- validação (o servidor valida de novo) -----
        function validar() {
            const v = valores();
            let primeiro = null; // primeiro campo com erro, para receber o foco
            const falha = (id, msg) => { marcarErro($(id), msg); if (!primeiro) primeiro = $(id); };
            TODOS.forEach((id) => marcarErro($(id), ''));

            CAMPOS.forEach((c) => { if (!v[c]) falha(c, 'Informe ' + ROTULOS[c] + '.'); });
            if (v.email && !EMAIL_VALIDO.test(v.email)) falha('email', 'Informe um e-mail válido.');
            if (v.telefone && (v.telefone.length < 10 || v.telefone.length > 11)) falha('telefone', 'Informe o telefone com DDD.');
            if (precisaSenhaAtual() && !$('senhaAtual').value) falha('senhaAtual', 'Informe a senha atual.');

            if (primeiro) primeiro.focus();
            return !primeiro;
        }

        // Liga/desliga o estado "salvando…" (botão girando e desabilitado)
        function emSalvamento(sim) {
            salvando = sim;
            salvar.classList.toggle('carregando', sim);
            salvar.disabled = sim || !mudouDados();
            if (sim) situacao('Salvando…');
        }

        // ----- salvar (envia ao servidor com PUT /perfil) -----
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!original || salvando || !mudouDados()) return;
            mostrarTexto(aviso, '');
            if (!validar()) { situacao('Corrija os campos destacados.', 'erro'); return; }

            const corpo = valores();
            if (precisaSenhaAtual()) corpo.senhaAtual = $('senhaAtual').value;

            emSalvamento(true);
            try {
                const { resp, dados } = await pedirAoServidor('/perfil', { method: 'PUT', body: JSON.stringify(corpo) });
                if (resp.status === 401) return; // sessão vencida: já está voltando ao login

                if (!resp.ok) {
                    // o servidor pode devolver erros por campo: { campos: { email: 'já existe' } }
                    let primeiro = null;
                    Object.entries(dados.campos || {}).forEach(([campo, msg]) => {
                        if ($(campo)) { marcarErro($(campo), msg); if (!primeiro) primeiro = $(campo); }
                    });
                    if (primeiro) primeiro.focus();
                    mostrarTexto(aviso, primeiro ? '' : (dados.erro || 'Não foi possível salvar. Tente novamente.'));
                    emSalvamento(false);
                    situacao('Não foi possível salvar.', 'erro');
                    return;
                }

                original = Object.assign({}, original, dados.usuario);
                atualizarSessaoUsuario(dados.usuario);
                preencher(original);
                limparSenhas();
                emSalvamento(false);
                atualizarTela();
                toast('Alterações salvas');
            } catch {
                emSalvamento(false);
                mostrarTexto(aviso, 'Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
                situacao('Não foi possível salvar.', 'erro');
            }
        });

        // ----- logo (vai para o banco assim que a imagem é escolhida) -----
        const logoPrevia = $('conta-logo-previa');
        const logoRemover = $('conta-logo-remover');
        const logoInput = $('conta-logo');
        const avisarLogo = fazerAviso($('conta-logo-erro'), $('conta-logo-ok'));
        let logoAtual = ''; // logo atual (texto data URL); vazio = sem logo
        const mostrarLogo = () => desenharPreviaLogo(logoPrevia, logoRemover, logoAtual, (lerSessao() || sessao).usuario);
        const logoOcupado = (sim) => { // desliga os botões enquanto fala com o servidor
            $('conta-logo-escolher').disabled = sim;
            logoRemover.disabled = sim;
        };

        $('conta-logo-escolher').addEventListener('click', () => logoInput.click());

        logoInput.addEventListener('change', async () => {
            const arq = logoInput.files[0];
            avisarLogo('');
            if (!arq) return;
            if (!logoValido(arq)) {
                avisarLogo('Use PNG, JPG ou WebP de até 5 MB.');
                logoInput.value = '';
                return;
            }
            logoOcupado(true);
            try {
                const dataUrl = await prepararLogo(arq);
                const { resp, dados } = await pedirAoServidor('/perfil/logo', { method: 'PUT', body: JSON.stringify({ logo: dataUrl }) });
                if (resp.status === 401) return;
                if (!resp.ok) { avisarLogo(dados.erro || 'Não foi possível salvar o logo.'); return; }
                logoAtual = dataUrl;
                salvarLogo(dataUrl);
                mostrarLogo();
                atualizarAvatarMenu();
                avisarLogo('', '✓ Logo atualizado.');
            } catch (err) {
                avisarLogo(err && err.message === 'imagem inválida'
                    ? 'Não foi possível ler esta imagem. Tente outro arquivo.'
                    : 'Não foi possível conectar ao servidor.');
            } finally {
                logoOcupado(false);
                logoInput.value = '';
            }
        });

        logoRemover.addEventListener('click', async () => {
            avisarLogo('');
            logoOcupado(true);
            try {
                const { resp, dados } = await pedirAoServidor('/perfil/logo', { method: 'DELETE' });
                if (resp.status === 401) return;
                if (!resp.ok) { avisarLogo(dados.erro || 'Não foi possível remover o logo.'); return; }
                logoAtual = '';
                removerLogo();
                mostrarLogo();
                atualizarAvatarMenu();
                avisarLogo('', 'Logo removido.');
            } catch {
                avisarLogo('Não foi possível conectar ao servidor.');
            } finally {
                logoOcupado(false);
            }
        });

        // ----- carregar os dados do banco ao abrir a página -----
        async function carregar() {
            $('conta-falha').hidden = true;
            form.setAttribute('aria-busy', 'true');
            situacao('Carregando…');
            try {
                const perfil = await carregarPerfil(true);
                original = perfil;
                preencher(perfil);
                logoAtual = perfil.logo || '';
                mostrarLogo();
                CAMPOS.forEach((id) => { $(id).disabled = false; }); // os campos começam bloqueados até carregar
                form.setAttribute('aria-busy', 'false');
                $('selo-conta').hidden = false;
                atualizarTela();
            } catch (err) {
                if (!lerSessao()) return; // sessão inválida: já está voltando ao login
                const semRede = err instanceof TypeError; // fetch sem conexão dá TypeError
                $('conta-falha-texto').textContent = semRede
                    ? 'Não foi possível conectar ao servidor. Verifique se o back-end está rodando.'
                    : err.message;
                $('conta-falha').hidden = false;
                situacao('Cadastro não carregado.', 'erro');
            }
        }
        $('conta-tentar').addEventListener('click', carregar);

        // Enquanto carrega, mostra o logo guardado no navegador (se houver) ou as iniciais
        logoAtual = lerLogo() || '';
        mostrarLogo();
        carregar();
    }

    /* ========================================================================
       10. CADASTRO DO LABORATÓRIO (fablab.html): dados, requisitos e impressoras
       Tudo fica guardado neste navegador, por usuário (seção 4). O back-end ainda não
       tem rotas de impressoras; quando tiver, só lerLab/salvarLab precisam trocar o
       localStorage por CS.fetchAutenticado(...).
       ======================================================================== */

    // Impressoras que aparecem na primeira visita (as mesmas do protótipo)
    const IMPRESSORAS_INICIAIS = [
        { id: 1, marca: 'Ultimaker', modelo: 'S3', tecnologia: 'FDM', volume: '230 × 190 × 200 mm', materiais: ['PLA', 'PETG'], disponibilidade: 'Disponível', obs: '' },
        { id: 2, marca: 'Prusa', modelo: 'MK4', tecnologia: 'FDM', volume: '250 × 210 × 220 mm', materiais: ['PLA', 'PETG', 'TPU'], disponibilidade: 'Limitada', obs: 'Fila de produção até sexta-feira.' }
    ];
    // ids dos campos de dados do laboratório
    const CAMPOS_LAB = ['razao', 'cnpj', 'cidade', 'cep', 'rua', 'bairro', 'numero', 'complemento'];
    // campos obrigatórios e como aparecem na mensagem "Informe ..."
    const OBRIGATORIOS_LAB = { razao: 'a razão social', cnpj: 'o CNPJ', cidade: 'a cidade / UF', cep: 'o CEP', rua: 'a rua', bairro: 'o bairro', numero: 'o número' };

    // Garante que uma impressora lida do armazenamento tem todos os campos, com o tipo certo.
    // Devolve null se o item estiver estragado (ele é descartado).
    function normalizarImpressora(p) {
        if (!p || typeof p.id !== 'number' || typeof p.marca !== 'string' || typeof p.modelo !== 'string') return null;
        return {
            id: p.id,
            marca: p.marca,
            modelo: p.modelo,
            tecnologia: p.tecnologia === 'SLA' ? 'SLA' : 'FDM',
            volume: typeof p.volume === 'string' ? p.volume : '',
            materiais: Array.isArray(p.materiais) ? p.materiais.filter((m) => typeof m === 'string') : [],
            disponibilidade: ['Disponível', 'Limitada', 'Manutenção'].includes(p.disponibilidade) ? p.disponibilidade : 'Disponível',
            obs: typeof p.obs === 'string' ? p.obs : ''
        };
    }

    // Monta a linha (<li>) de uma impressora da lista. "selecionada" = a que está sendo editada.
    function itemImpressora(p, selecionada) {
        const nome = p.marca + ' ' + p.modelo;
        const li = criar('li', 'impressora' + (selecionada ? ' impressora-ativa' : ''));
        li.dataset.id = String(p.id);
        li.tabIndex = 0; // a linha inteira é clicável e também funciona pelo teclado
        if (selecionada) li.setAttribute('aria-current', 'true');

        const icone = criar('img', 'icone');
        icone.src = '../img/impressora.png';
        icone.alt = '';
        const caixa = criar('span', 'caixa-icone caixa-icone-mini');
        caixa.appendChild(icone);

        // Texto: nome / tecnologia · volume / materiais · disponibilidade — observação
        const linha1 = criar('small', '', p.tecnologia + (p.volume ? ' · ' + p.volume : ''));
        const linha2 = criar('small');
        linha2.append((p.materiais.join(', ') || 'Sem materiais') + ' · ', criar('strong', '', p.disponibilidade));
        if (p.obs) linha2.append(' — ' + p.obs);
        const info = criar('div');
        info.append(criar('b', '', nome), linha1, linha2);

        li.append(caixa, info);
        if (selecionada) { // o rótulo "Editar" só aparece na impressora clicada
            const editar = criar('a', 'impressora-editar', 'Editar');
            editar.href = '#equipamento';
            editar.setAttribute('aria-label', 'Editar ' + nome);
            li.appendChild(editar);
        }
        const remover = criar('button', 'remover', '×');
        remover.type = 'button';
        remover.setAttribute('aria-label', 'Remover ' + nome);
        li.appendChild(remover);
        return li;
    }

    function iniciarCadastroLab() {
        const parque = $('parque'); // a lista (<ul>) de impressoras
        if (!parque || !lerSessao()) return;

        // Lê o valor da opção marcada num grupo de botões de opção (radio) e as marcadas de caixas (checkbox)
        const radio = (nome) => (document.querySelector('input[name="' + nome + '"]:checked') || {}).value;
        const marcados = (nome) => Array.from(document.querySelectorAll('input[name="' + nome + '"]:checked')).map((c) => c.value);

        // ----- estado: o que foi salvo antes; na primeira visita, o que já está escrito na página -----
        const salvo = lerLab() || {};
        const estado = {
            dados: Object.assign(Object.fromEntries(CAMPOS_LAB.map((c) => [c, $(c).value])), salvo.dados),
            requisitos: Array.isArray(salvo.requisitos) ? salvo.requisitos : marcados('req'),
            impressoras: Array.isArray(salvo.impressoras)
                ? salvo.impressoras.map(normalizarImpressora).filter(Boolean)
                : IMPRESSORAS_INICIAIS.map((p) => Object.assign({}, p, { materiais: p.materiais.slice() }))
        };
        let editandoId = null; // id da impressora selecionada (nenhuma até o clique)

        const gravar = () => salvarLab(estado); // guarda tudo no navegador; devolve true/false
        const proximoId = () => estado.impressoras.reduce((m, p) => Math.max(m, p.id), 0) + 1;

        // =====================  COLUNA DA ESQUERDA: dados do laboratório  =====================
        CAMPOS_LAB.forEach((c) => { $(c).value = estado.dados[c] || ''; });
        $('cnpj').value = mascaraCnpj($('cnpj').value);
        $('cep').value = mascaraCep($('cep').value);
        document.querySelectorAll('input[name="req"]').forEach((c) => { c.checked = estado.requisitos.includes(c.value); });

        const barra = $('salvo-auto'); // texto "✓ Alterações salvas automaticamente"
        function avisoBarra(msg, erro) {
            barra.textContent = msg;
            barra.style.color = erro ? 'var(--error, #b3261e)' : '';
        }

        $('cnpj').addEventListener('input', (e) => { e.target.value = mascaraCnpj(e.target.value); });
        $('cep').addEventListener('input', (e) => { e.target.value = mascaraCep(e.target.value); });
        Object.keys(OBRIGATORIOS_LAB).forEach((c) => $(c).addEventListener('input', () => marcarErro($(c), '')));

        // Salva sozinho quando um campo muda (por isso o texto "salvas automaticamente")
        function salvarSozinho() {
            CAMPOS_LAB.forEach((c) => { estado.dados[c] = $(c).value.trim(); });
            estado.requisitos = marcados('req');
            if (gravar()) avisoBarra('✓ Alterações salvas automaticamente');
            else avisoBarra('Não foi possível guardar neste navegador.', true);
        }
        CAMPOS_LAB.forEach((c) => $(c).addEventListener('change', salvarSozinho));
        document.querySelectorAll('input[name="req"]').forEach((c) => c.addEventListener('change', salvarSozinho));

        // Confere os campos obrigatórios; marca os erros e põe o cursor no primeiro com problema
        function validarDados() {
            let primeiro = null;
            Object.keys(OBRIGATORIOS_LAB).forEach((c) => {
                const el = $(c);
                const v = el.value.trim();
                let msg = '';
                if (!v) msg = 'Informe ' + OBRIGATORIOS_LAB[c] + '.';
                else if (c === 'cnpj' && soDigitos(v).length !== 14) msg = 'O CNPJ deve ter 14 dígitos.';
                else if (c === 'cep' && soDigitos(v).length !== 8) msg = 'O CEP deve ter 8 dígitos.';
                marcarErro(el, msg);
                if (msg && !primeiro) primeiro = el;
            });
            if (primeiro) primeiro.focus();
            return !primeiro;
        }

        $('salvar-cadastro').addEventListener('click', () => {
            if (!validarDados()) { avisoBarra('Corrija os campos destacados.', true); return; }
            salvarSozinho();
            if (!barra.style.color) avisoBarra('✓ Cadastro atualizado'); // só se salvou sem erro
        });

        // =====================  COLUNA DA DIREITA: impressoras  =====================
        const editor = document.querySelector('.equipamento-editando'); // painel "Editando equipamento"
        const avisarEquip = fazerAviso($('erro-equip'), $('ok-equip'));

        // Aviso temporário (4 s) acima da lista de impressoras
        const avisoListaEl = $('aviso-lista');
        let tempoAvisoLista = null;
        function avisoLista(msg) {
            mostrarTexto(avisoListaEl, msg);
            clearTimeout(tempoAvisoLista);
            if (msg) tempoAvisoLista = setTimeout(() => { avisoListaEl.hidden = true; }, 4000);
        }

        // Redesenha a lista inteira de impressoras (e o contador "Impressoras cadastradas (N)")
        function desenharLista() {
            parque.textContent = '';
            if (!estado.impressoras.length) {
                parque.appendChild(criar('li', 'pedido-aviso', 'Nenhuma impressora cadastrada. Use “Adicionar outra impressora” para começar.'));
            }
            estado.impressoras.forEach((p) => parque.appendChild(itemImpressora(p, p.id === editandoId)));
            $('impressoras-contagem').textContent = 'Impressoras cadastradas (' + estado.impressoras.length + ')';
        }

        // Preenche o painel "Editando equipamento" com a impressora escolhida (ou o esconde)
        function mostrarEditor() {
            const p = estado.impressoras.find((x) => x.id === editandoId);
            editor.hidden = !p;
            if (!p) return;
            $('editor-sobretitulo').textContent = 'Editando equipamento';
            $('editor-titulo').textContent = p.marca + ' ' + p.modelo;
            $('marca').value = p.marca;
            $('modelo').value = p.modelo;
            document.querySelectorAll('input[name="tec"]').forEach((r) => { r.checked = r.value === p.tecnologia; });
            $('volume').value = p.volume;
            $('disponibilidade').value = p.disponibilidade;
            $('obs-disp').value = p.obs;
            document.querySelectorAll('input[name="mat"]').forEach((c) => { c.checked = p.materiais.includes(c.value); });
            marcarErro($('marca'), '');
            marcarErro($('modelo'), '');
            avisarEquip('');
        }

        function removerImpressora(id) {
            const p = estado.impressoras.find((x) => x.id === id);
            if (!p) return;
            if (!window.confirm('Remover a impressora ' + p.marca + ' ' + p.modelo + '?')) return;
            estado.impressoras = estado.impressoras.filter((x) => x.id !== id);
            if (editandoId === id) editandoId = null;
            gravar();
            desenharLista();
            mostrarEditor();
        }

        // Clicar na impressora a seleciona (fica verde, mostra "Editar" e abre o painel);
        // clicar de novo na mesma a desmarca.
        function selecionarImpressora(id) {
            editandoId = editandoId === id ? null : id;
            avisoLista('');
            desenharLista();
            mostrarEditor();
            const li = parque.querySelector('li[data-id="' + id + '"]');
            if (li) li.focus({ preventScroll: true }); // o foco do teclado não se perde no redesenho
            if (editandoId !== null) editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Um só "ouvinte" para a lista toda (a lista é redesenhada, então não dá para ligar em cada linha):
        // o clique diz, pelo elemento clicado, se foi em "×", em "Editar" ou na linha.
        parque.addEventListener('click', (e) => {
            const li = e.target.closest('li.impressora');
            if (!li) return;
            const id = Number(li.dataset.id);
            if (e.target.closest('.remover')) {
                removerImpressora(id);
            } else if (e.target.closest('.impressora-editar')) {
                e.preventDefault(); // "Editar": leva o cursor para o painel de edição
                $('marca').focus({ preventScroll: true });
                editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                selecionarImpressora(id);
            }
        });
        parque.addEventListener('keydown', (e) => { // Enter ou Espaço também selecionam
            if (e.target.matches('li.impressora') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                selecionarImpressora(Number(e.target.dataset.id));
            }
        });

        // Botão "Salvar impressora" do painel de edição
        $('salvar-imp').addEventListener('click', () => {
            const marca = $('marca').value.trim();
            const modelo = $('modelo').value.trim();
            marcarErro($('marca'), marca ? '' : 'Informe a marca.');
            marcarErro($('modelo'), modelo ? '' : 'Informe o modelo.');
            if (!marca || !modelo) {
                (marca ? $('modelo') : $('marca')).focus();
                avisarEquip('Preencha marca e modelo para salvar.');
                return;
            }
            const p = estado.impressoras.find((x) => x.id === editandoId);
            if (!p) return;
            Object.assign(p, {
                marca, modelo,
                tecnologia: radio('tec') === 'SLA' ? 'SLA' : 'FDM',
                volume: $('volume').value.trim(),
                materiais: marcados('mat'),
                disponibilidade: $('disponibilidade').value,
                obs: $('obs-disp').value.trim()
            });
            if (!gravar()) { avisarEquip('Não foi possível guardar neste navegador.'); return; }
            desenharLista();
            $('editor-titulo').textContent = marca + ' ' + modelo;
            avisarEquip('', '✓ Impressora salva.');
        });
        ['marca', 'modelo'].forEach((id) => $(id).addEventListener('input', () => { marcarErro($(id), ''); avisarEquip(''); }));

        // Gaveta "Adicionar impressora" (abre pelo link #nova-impressora, só com CSS)
        const formNova = $('form-impressora');
        const erroNova = $('erro-imp');
        $('add-imp').addEventListener('click', () => {
            const marca = $('outra-marca').value.trim();
            const modelo = $('outra-modelo').value.trim();
            if (!marca || !modelo) {
                erroNova.textContent = 'Informe a marca e o modelo da impressora.';
                (marca ? $('outra-modelo') : $('outra-marca')).focus();
                return;
            }
            erroNova.textContent = '';
            estado.impressoras.push({
                id: proximoId(), marca, modelo,
                tecnologia: radio('outra-tec') === 'SLA' ? 'SLA' : 'FDM',
                volume: $('outra-volume').value.trim(),
                materiais: marcados('outra-mat'),
                disponibilidade: 'Disponível',
                obs: ''
            });
            const guardou = gravar();
            formNova.reset();
            desenharLista();
            mostrarEditor();
            avisoLista(guardou ? '✓ Impressora adicionada. Clique nela para editar.' : 'A impressora foi adicionada, mas não foi possível guardá-la neste navegador.');
            location.hash = 'equipamento'; // fecha a gaveta
        });
        formNova.addEventListener('submit', (e) => { e.preventDefault(); $('add-imp').click(); }); // Enter no formulário = clicar em adicionar
        ['outra-marca', 'outra-modelo'].forEach((id) => $(id).addEventListener('input', () => { erroNova.textContent = ''; }));

        // Esc fecha a gaveta; ao abrir, o cursor vai para o primeiro campo
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && location.hash === '#nova-impressora') location.hash = 'equipamento';
        });
        window.addEventListener('hashchange', () => {
            if (location.hash === '#nova-impressora') setTimeout(() => $('outra-marca').focus(), 50);
        });

        desenharLista();
        mostrarEditor();
    }

    /* ========================================================================
       11. LISTA DE PEDIDOS DA INSTITUIÇÃO (aacd.html)
       Busca, filtro por status, ordenação e exportação para CSV.
       O back-end ainda não tem rota de pedidos (só o modelo Order), então a lista usa
       os dados de exemplo abaixo. Quando a rota existir, troque PEDIDOS_EXEMPLO pelo
       resultado de CS.fetchAutenticado('/orders').
       status: 0 Registrado, 1 Aceito, 2 Impressão, 3 Entregue, ou 'recusado'
       ======================================================================== */
    const PEDIDOS_EXEMPLO = [
        { codigo: 'CS-2026-0150', peca: 'Órtese de tornozelo',  status: 0,         registrado: '2026-06-10', prazo: '2026-06-28' },
        { codigo: 'CS-2026-0148', peca: 'Adaptador de talher',  status: 1,         registrado: '2026-06-08', prazo: '2026-06-22' },
        { codigo: 'CS-2026-0147', peca: 'Prótese de mão',       status: 1,         registrado: '2026-06-06', prazo: '2026-06-24' },
        { codigo: 'CS-2026-0142', peca: 'Órtese de punho',      status: 2,         registrado: '2026-06-02', prazo: '2026-06-18' },
        { codigo: 'CS-2026-0139', peca: 'Órtese de cotovelo',   status: 'recusado', registrado: '2026-05-30', prazo: '2026-06-15' },
        { codigo: 'CS-2026-0136', peca: 'Suporte de polegar',   status: 'recusado', registrado: '2026-05-28', prazo: '2026-06-12' },
        { codigo: 'CS-2026-0131', peca: 'Órtese de dedo',       status: 3,         registrado: '2026-05-20', prazo: '2026-06-05' }
    ];
    const NOMES_STATUS = ['Registrado', 'Aceito', 'Impressão', 'Entregue']; // texto do selo, na ordem dos status 0 a 3
    const CLASSES_SELO = ['registrado', 'aceito', 'impressao', 'entregue']; // classe CSS de cada selo (cor)

    function iniciarListaPedidos() {
        const lista = $('pedidos'); // <ul> onde os pedidos são desenhados
        if (!lista || !lerSessao()) return;

        const nomeStatus = (p) => (p.status === 'recusado' ? 'Recusado' : NOMES_STATUS[p.status]);
        const classeSelo = (p) => 'selo-' + (p.status === 'recusado' ? 'recusado' : CLASSES_SELO[p.status]);
        const dataBR = (iso) => { const [a, m, d] = iso.split('-'); return d + ' ' + MESES[m - 1] + ' ' + a; }; // "2026-06-10" → "10 jun 2026"
        const semAcento = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); // busca sem diferenciar acento/maiúscula

        // Pedidos que passam pela busca e pelo filtro, já na ordem escolhida
        function pedidosVisiveis() {
            const busca = semAcento($('busca').value.trim());
            const filtro = $('filtro').value;
            const achados = PEDIDOS_EXEMPLO.filter((p) =>
                (filtro === 'todos' || String(p.status) === filtro) &&
                semAcento(p.codigo + ' ' + p.peca).includes(busca));
            // as datas estão em AAAA-MM-DD, então comparar como texto já ordena certo
            const comparar = {
                recentes: (a, b) => b.registrado.localeCompare(a.registrado) || b.codigo.localeCompare(a.codigo),
                antigos: (a, b) => a.registrado.localeCompare(b.registrado) || a.codigo.localeCompare(b.codigo),
                prazo: (a, b) => a.prazo.localeCompare(b.prazo),
                codigo: (a, b) => a.codigo.localeCompare(b.codigo)
            };
            return achados.sort(comparar[$('ordem').value]);
        }

        // Redesenha a lista conforme a busca/filtro/ordem atuais
        function desenhar() {
            const pedidos = pedidosVisiveis();
            lista.textContent = '';
            pedidos.forEach((p) => {
                const linha1 = criar('div', 'pedido-linha1');
                linha1.append(criar('span', 'selo ' + classeSelo(p), nomeStatus(p)), criar('span', 'pedido-codigo', p.codigo));
                const info = criar('div', 'pedido-info');
                info.append(linha1, criar('h3', '', p.peca), criar('p', '', 'Registrado em ' + dataBR(p.registrado) + ' • Prazo: ' + dataBR(p.prazo)));

                const seta = criar('a', 'pedido-seta', '›');
                seta.href = 'pedido.html?codigo=' + encodeURIComponent(p.codigo);
                seta.setAttribute('aria-label', 'Abrir pedido ' + p.codigo);

                const item = criar('li', 'pedido');
                item.append(info, seta);
                lista.append(item);
            });
            lista.hidden = pedidos.length === 0;
            $('vazio').hidden = pedidos.length > 0; // "nenhum pedido encontrado"
        }

        // Cartões de resumo no topo (contam todos os pedidos, sem filtro)
        const contar = (status) => PEDIDOS_EXEMPLO.filter((p) => p.status === status).length;
        $('nTodos').textContent = doisDigitos(PEDIDOS_EXEMPLO.length);
        $('nAbertos').textContent = doisDigitos(contar(0));
        $('nImpressao').textContent = doisDigitos(contar(2));
        $('nEntregues').textContent = doisDigitos(contar(3));
        $('nRecusados').textContent = doisDigitos(contar('recusado'));
        $('atualizado').textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        $('busca').addEventListener('input', desenhar);
        $('filtro').addEventListener('change', desenhar);
        $('ordem').addEventListener('change', desenhar);

        // EXPORTAR CSV: baixa uma planilha com o que está na tela (respeita busca, filtro e ordem).
        // Separador ";" e marcador BOM (\ufeff) no início, para o Excel em português abrir com acentos certos.
        function celulaCsv(valor) {
            let texto = String(valor);
            if (/^[=+\-@]/.test(texto)) texto = "'" + texto; // impede o Excel de tratar o texto como fórmula
            return '"' + texto.replace(/"/g, '""') + '"';   // aspas dentro do texto são dobradas
        }
        $('exportar').addEventListener('click', () => {
            const linhas = [['Código', 'Tipo de peça', 'Status', 'Registrado em', 'Prazo']];
            pedidosVisiveis().forEach((p) => linhas.push([p.codigo, p.peca, nomeStatus(p), dataBR(p.registrado), dataBR(p.prazo)]));
            const csv = '\ufeff' + linhas.map((l) => l.map(celulaCsv).join(';')).join('\r\n');
            // O arquivo é criado no próprio navegador e baixado por um link invisível
            const link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
            link.download = 'pedidos-conecta-saude.csv';
            link.click();
            URL.revokeObjectURL(link.href);
        });

        desenhar();
    }

    /* ========================================================================
       12. TELAS DE SOLICITAÇÃO DO LABORATÓRIO
       (solicitacoes.html e detalhe_solicitacao.html)
         - Recusar solicitação (janela de confirmação + motivo opcional)
         - Visualizar arquivo 3D (.stl) e baixar o arquivo
         - Cartões recusados saem do quadro de solicitações
       Enquanto o back-end não tem as rotas de pedidos, a recusa fica guardada neste navegador.
       Pontos para ligar no back: marcados com "BACK:".
       ======================================================================== */

    // Biblioteca 3D, carregada só quando alguém clica em "Visualizar arquivo"
    const THREE_BASE = 'https://cdn.jsdelivr.net/npm/three@0.147.0/';

    // ISO "2026-06-08T14:20:00Z" → "8 jun, 14:20"
    function dataHora(iso) {
        const d = new Date(iso);
        return d.getDate() + ' ' + MESES[d.getMonth()] + ', ' + doisDigitos(d.getHours()) + ':' + doisDigitos(d.getMinutes());
    }

    // ----- Janela (modal) acessível -----
    // Abre uma caixa no meio da tela com fundo escuro. Parâmetros:
    //   titulo, texto, corpo (elemento extra), acoes (lista de botões), largo (caixa maior),
    //   aoFechar (função chamada ao fechar), gatilho (botão que abriu, para devolver o foco).
    // Devolve { fechar, caixa, titulo }.
    function abrirModal({ titulo, texto, corpo, acoes, largo, aoFechar, gatilho: botaoOrigem }) {
        // quem abriu a janela recebe o foco de volta ao fechar (no Safari o clique não foca botões)
        const gatilho = botaoOrigem || document.activeElement;
        const fundo = criar('div', 'tela-sucesso');
        const caixa = criar('div', 'sucesso-caixa modal-caixa' + (largo ? ' modal-largo' : ''));
        caixa.setAttribute('role', 'dialog');
        caixa.setAttribute('aria-modal', 'true');
        caixa.setAttribute('aria-labelledby', 'modal-titulo');

        const x = criar('button', 'sucesso-fechar', '×');
        x.type = 'button';
        x.setAttribute('aria-label', 'Fechar');
        const h2 = criar('h2', '', titulo);
        h2.id = 'modal-titulo';
        h2.tabIndex = -1;
        caixa.append(x, h2);
        if (texto) caixa.appendChild(criar('p', 'sucesso-texto', texto));
        if (corpo) caixa.appendChild(corpo);
        if (acoes && acoes.length) {
            const barra = criar('div', 'sucesso-acoes');
            barra.append(...acoes);
            caixa.appendChild(barra);
        }
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        document.body.classList.add('sem-rolagem'); // trava a rolagem da página por trás

        function fechar() {
            document.removeEventListener('keydown', teclas, true);
            fundo.remove();
            document.body.classList.remove('sem-rolagem');
            if (aoFechar) aoFechar();
            if (gatilho && gatilho.focus && document.body.contains(gatilho)) gatilho.focus();
        }
        // Esc fecha; Tab fica "preso" dentro da janela (do último item volta ao primeiro e vice-versa)
        function teclas(e) {
            if (e.key === 'Escape') { e.stopPropagation(); fechar(); return; }
            if (e.key !== 'Tab') return;
            const itens = Array.from(caixa.querySelectorAll('button, a[href], textarea, input, select, [tabindex]:not([tabindex="-1"])'))
                .filter((el) => !el.disabled && el.offsetParent !== null);
            if (!itens.length) return;
            const primeiro = itens[0], ultimo = itens[itens.length - 1];
            if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
            else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
        }
        document.addEventListener('keydown', teclas, true);
        x.addEventListener('click', fechar);
        fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fechar(); }); // clique no fundo escuro

        return { fechar, caixa, titulo: h2 };
    }

    // ----- Tela "Visualizar solicitação": botão "Recusar solicitação" -----
    function iniciarRecusa() {
        const botao = $('recusar-solicitacao');
        if (!botao) return;

        // O código da solicitação (ex.: CS-2026-0138) está no atributo data-solicitacao do chat
        const chat = document.querySelector('.chat[data-solicitacao]');
        const codigo = chat ? chat.dataset.solicitacao : 'solicitacao';

        // Muda a tela para o estado "recusada": selo, andamento, status, histórico e aviso no lugar do botão
        function aplicarRecusa(info) {
            const selo = document.querySelector('.painel-topo .selo');
            if (selo) { selo.textContent = 'Recusada'; selo.className = 'selo selo-recusado'; }

            const andamento = document.querySelector('.acompanhamento');
            if (andamento) andamento.classList.add('recusada');

            const status = $('status-atual');
            if (status) {
                status.disabled = true;
                status.options[0].textContent = 'Solicitação recusada';
                status.selectedIndex = 0;
            }

            const historico = document.querySelector('.acompanhamento-historico');
            if (historico && !historico.querySelector('.chip-historico-recusada')) {
                const chip = criar('span', 'chip-historico chip-historico-recusada', 'Recusada ');
                chip.appendChild(criar('small', '', dataHora(info.em)));
                historico.appendChild(chip);
            }

            const aviso = criar('div', 'recusa-aviso');
            aviso.setAttribute('role', 'status');
            aviso.tabIndex = -1;
            aviso.appendChild(criar('b', '', 'Solicitação recusada'));
            aviso.appendChild(criar('p', '', 'Recusada em ' + dataHora(info.em) + '.'));
            if (info.motivo) aviso.appendChild(criar('p', '', 'Motivo: ' + info.motivo));
            const atual = $('recusar-solicitacao');
            if (atual) atual.replaceWith(aviso);
            return aviso;
        }

        // Se esta solicitação já foi recusada antes, abre direto no estado "recusada"
        const salva = lerRecusas()[codigo];
        if (salva) { aplicarRecusa(salva); return; }

        // Clique em "Recusar": abre a janela de confirmação com o campo de motivo
        botao.addEventListener('click', () => {
            const motivo = criar('textarea');
            motivo.id = 'recusa-motivo';
            motivo.maxLength = 500;
            motivo.placeholder = 'Ex.: material indisponível para o prazo pedido.';
            const rotulo = criar('label', '', 'Motivo da recusa (opcional)');
            rotulo.htmlFor = 'recusa-motivo';
            const erro = criar('small', 'campo-erro');
            erro.setAttribute('role', 'alert');
            erro.hidden = true;
            const campo = criar('div', 'modal-campo');
            campo.append(rotulo, motivo, erro);

            const voltar = criar('button', 'botao-contorno', 'Voltar');
            voltar.type = 'button';
            const confirmar = criar('button', 'botao-perigo', 'Recusar solicitação');
            confirmar.type = 'button';

            const modal = abrirModal({
                titulo: 'Recusar esta solicitação?',
                texto: 'A Instituição será avisada e a solicitação sai da sua fila. Esta ação não pode ser desfeita por aqui.',
                corpo: campo,
                acoes: [voltar, confirmar],
                gatilho: botao
            });
            motivo.focus();

            voltar.addEventListener('click', modal.fechar);
            confirmar.addEventListener('click', () => {
                // BACK: trocar por PATCH /api/orders/:id  { status: 'recusado', motivoRecusa }
                const info = { motivo: motivo.value.trim(), em: new Date().toISOString() };
                if (!gravarRecusa(codigo, info)) {
                    mostrarTexto(erro, 'Não foi possível registrar a recusa neste navegador. Tente novamente.');
                    return;
                }
                modal.fechar();
                aplicarRecusa(info).focus({ preventScroll: false });
            });
        });
    }

    // ----- Arquivo 3D: baixar e visualizar -----
    // BACK: data-arquivo-url deve apontar para o arquivo do pedido (ex.: /api/orders/:id/arquivo ou /uploads/...)

    // Baixa o arquivo em bytes. Se o endereço for da API, envia o token junto.
    async function buscarArquivo(url) {
        const s = lerSessao();
        const cabecalhos = {};
        if (s && /\/api\//.test(url)) cabecalhos.Authorization = 'Bearer ' + s.token;
        const resp = await fetch(url, { headers: cabecalhos });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.arrayBuffer();
    }

    // Carrega um arquivo .js de fora e espera ele ficar pronto
    function carregarScript(src) {
        return new Promise((ok, falha) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = ok;
            s.onerror = () => { s.remove(); falha(new Error('script')); };
            document.head.appendChild(s);
        });
    }
    // Carrega a biblioteca three.js (3D) + leitor de .stl + controles do mouse. Só uma vez.
    let promessaThree = null;
    function carregarThree() {
        if (window.THREE && window.THREE.STLLoader && window.THREE.OrbitControls) return Promise.resolve();
        if (!promessaThree) {
            promessaThree = carregarScript(THREE_BASE + 'build/three.min.js')
                .then(() => Promise.all([
                    carregarScript(THREE_BASE + 'examples/js/loaders/STLLoader.js'),
                    carregarScript(THREE_BASE + 'examples/js/controls/OrbitControls.js')
                ]))
                .catch((e) => { promessaThree = null; throw e; }); // se falhou, a próxima tentativa recarrega
        }
        return promessaThree;
    }

    // Desenha o modelo 3D dentro de "container". Devolve { parar() } para liberar a memória ao fechar.
    function montarCena(container, buffer) {
        const T = window.THREE;
        const largura = container.clientWidth || 600;
        const altura = container.clientHeight || 340;

        const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(largura, altura);
        container.appendChild(renderer.domElement);

        const cena = new T.Scene();
        const camera = new T.PerspectiveCamera(40, largura / altura, 0.1, 100000);

        // Lê o .stl, centraliza e mede o tamanho para posicionar a câmera à distância certa
        const geometria = new T.STLLoader().parse(buffer);
        geometria.center();
        geometria.computeBoundingSphere();
        const raio = geometria.boundingSphere.radius || 1;

        const malha = new T.Mesh(geometria, new T.MeshStandardMaterial({ color: 0x006767, roughness: 0.55, metalness: 0.1 }));
        malha.rotation.x = -Math.PI / 2; // arquivos STL costumam ter o eixo Z para cima
        cena.add(malha);
        cena.add(new T.HemisphereLight(0xffffff, 0x9fb7b7, 0.9));
        const luz = new T.DirectionalLight(0xffffff, 0.8);
        luz.position.set(1, 2, 3);
        cena.add(luz);

        camera.position.set(raio * 1.9, raio * 1.3, raio * 2.6);
        camera.lookAt(0, 0, 0);

        const controles = new T.OrbitControls(camera, renderer.domElement); // arrastar gira, rolagem aproxima
        controles.enableDamping = true;

        // Laço de animação: redesenha a cena a cada quadro até "parar()"
        let ativo = true;
        let quadro = 0;
        const desenhar = () => {
            if (!ativo) return;
            quadro = requestAnimationFrame(desenhar);
            controles.update();
            renderer.render(cena, camera);
        };
        desenhar();

        // Se a janela do navegador mudar de tamanho, ajusta a cena
        const aoRedimensionar = () => {
            const w = container.clientWidth, h = container.clientHeight;
            if (!w || !h) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', aoRedimensionar);

        return {
            parar() {
                ativo = false;
                cancelAnimationFrame(quadro);
                window.removeEventListener('resize', aoRedimensionar);
                controles.dispose();
                geometria.dispose();
                renderer.dispose();
            }
        };
    }

    // Liga os botões "Visualizar arquivo" e "Baixar" do cartão do arquivo
    function iniciarArquivo() {
        const cartao = $('arquivo-cartao');
        if (!cartao) return;
        const botaoVer = $('arquivo-visualizar');
        const linkBaixar = $('arquivo-baixar');
        const url = cartao.dataset.arquivoUrl; // vem do atributo data-arquivo-url do HTML
        const nomeEl = cartao.querySelector('.arquivo-nome');
        const nome = nomeEl ? nomeEl.textContent.trim() : 'modelo.stl';

        // mensagem de erro logo abaixo do cartão do arquivo
        const erro = criar('small', 'campo-erro');
        erro.setAttribute('role', 'alert');
        erro.hidden = true;
        cartao.insertAdjacentElement('afterend', erro);
        const avisar = (msg) => mostrarTexto(erro, msg);

        if (!url) { // pedido sem arquivo anexado: desativa os botões
            [botaoVer, linkBaixar].forEach((el) => {
                el.classList.add('arquivo-indisponivel');
                el.setAttribute('aria-disabled', 'true');
                el.tabIndex = -1;
            });
            avisar('Este pedido não tem arquivo anexado.');
            return;
        }

        // Baixar: pega os bytes e dispara o download por um link invisível
        async function baixar() {
            avisar('');
            try {
                const buffer = await buscarArquivo(url);
                const link = document.createElement('a');
                link.href = URL.createObjectURL(new Blob([buffer], { type: 'model/stl' }));
                link.download = nome;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            } catch {
                avisar('Não foi possível baixar o arquivo agora. Tente novamente.');
            }
        }
        linkBaixar.addEventListener('click', (e) => { e.preventDefault(); baixar(); });

        // Visualizar: abre uma janela e, quando o arquivo e a biblioteca 3D chegam, desenha o modelo
        botaoVer.addEventListener('click', async () => {
            avisar('');
            const area = criar('div', 'visualizador', 'Carregando modelo…');
            area.setAttribute('role', 'img');
            area.setAttribute('aria-label', 'Pré-visualização 3D de ' + nome);
            const corpo = criar('div');
            corpo.append(area, criar('p', 'modal-dica', 'Arraste para girar e use a rolagem (ou dois dedos) para aproximar.'));

            const btnBaixar = criar('button', 'botao-contorno', 'Baixar arquivo');
            btnBaixar.type = 'button';
            const btnFechar = criar('button', 'botao-principal', 'Fechar');
            btnFechar.type = 'button';

            let cena = null;
            const modal = abrirModal({
                titulo: 'Visualizar arquivo',
                texto: nome,
                corpo,
                acoes: [btnBaixar, btnFechar],
                largo: true,
                gatilho: botaoVer,
                aoFechar: () => { if (cena) cena.parar(); }
            });
            btnFechar.addEventListener('click', modal.fechar);
            btnBaixar.addEventListener('click', baixar);
            btnFechar.focus();

            try {
                const [buffer] = await Promise.all([buscarArquivo(url), carregarThree()]);
                if (!document.body.contains(area)) return; // fechou antes de terminar
                area.textContent = '';
                cena = montarCena(area, buffer);
            } catch {
                if (!document.body.contains(area)) return;
                area.textContent = '';
                area.appendChild(criar('span', 'visualizador-erro', 'Não foi possível exibir o modelo 3D. Você ainda pode baixar o arquivo.'));
            }
        });
    }

    // ----- Quadro "Solicitações recebidas" (solicitacoes.html): as recusadas saem da fila -----
    function iniciarQuadro() {
        const quadro = document.querySelector('.kanban');
        if (!quadro) return;
        const recusas = lerRecusas();
        let removeu = false;
        quadro.querySelectorAll('.cartao-kanban').forEach((cartao) => {
            const linha = cartao.querySelector('.cartao-kanban-linha'); // texto com o código do pedido
            const codigo = linha ? linha.textContent.trim() : '';
            if (recusas[codigo]) { cartao.remove(); removeu = true; }
        });
        if (!removeu) return;
        // Atualiza o número de cada coluna e mostra "vazio" nas colunas que ficaram sem cartões
        quadro.querySelectorAll('.coluna').forEach((coluna) => {
            const total = coluna.querySelectorAll('.cartao-kanban').length;
            const contador = coluna.querySelector('.coluna-contador');
            const vazio = coluna.querySelector('.kanban-vazio');
            if (contador) contador.textContent = String(total);
            if (vazio) vazio.hidden = total > 0;
        });
    }

    /* ========================================================================
       13. INÍCIO: decide o que rodar em cada página
       Cada função "iniciarXxx" começa verificando se os elementos da sua tela existem
       na página aberta; se não existirem, ela sai sem fazer nada.
       ======================================================================== */

    // Janelas de Termos e Privacidade: ficam prontas assim que o script é lido
    iniciarTermos();

    // Quando o HTML da página termina de carregar:
    document.addEventListener('DOMContentLoaded', () => {
        iniciarVLibras();
        iniciarUserWay();

        const form = $('form-acesso'); // só a tela inicial (index.html) tem este formulário
        if (form) {
            iniciarHome(form);
        } else { // qualquer outra página é "interna": exige login
            protegerPaginaInterna();
            montarMenuUsuario();
            iniciarLogoCadastro();
            iniciarCadastroLab();
            sincronizarPerfilMenu();
            iniciarCadastroInstituicao();
            iniciarListaPedidos();
        }

        // Botão "Sair" (o original, ou o do menu do usuário, que mantém o mesmo id)
        const sair = $('botao-sair');
        if (sair) {
            sair.addEventListener('click', (event) => {
                event.preventDefault();
                limparSessao();
                window.location.href = '../index.html';
            });
        }
    });

    // Telas de solicitação do laboratório (se o HTML já carregou, roda na hora)
    function iniciarTelasDeSolicitacao() {
        iniciarRecusa();
        iniciarArquivo();
        iniciarQuadro();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarTelasDeSolicitacao);
    else iniciarTelasDeSolicitacao();
})();