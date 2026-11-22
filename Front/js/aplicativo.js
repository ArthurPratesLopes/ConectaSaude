(() => {
    'use strict';

    const ENDERECO_API = 'http://localhost:5000/api';
    const CHAVE_SESSAO = 'conectasaude.sessao';
    const USERWAY_ID = '0bH9G4qEju';
    const PAGINAS_PUBLICAS = ['index.html', 'cadastro_instituicao.html'];
    const PAGINAS_INICIAIS = {
        cliente: 'html/aacd.html',
        fornecedor: 'html/fablab.html',
        admin: 'html/aacd.html'
    };
    const PAGINAS_PERMITIDAS = {
        cliente: ['aacd.html', 'pedido.html', 'laboratorio_instituicao.html', 'detalhe_laboratorio_instituicao.html'],
        fornecedor: ['fablab.html', 'solicitacoes.html', 'detalhe_solicitacao.html']
    };

    function lerSessao() {
        try {
            const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
            if (!sessao || !sessao.token || !sessao.usuario) return null;
            const dados = JSON.parse(atob(sessao.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (dados.exp && dados.exp * 1000 < Date.now()) {
                limparSessao();
                return null;
            }
            return sessao;
        } catch {
            return null;
        }
    }

    function salvarSessao(token, usuario) {
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token, usuario }));
    }

    function limparSessao() {
        localStorage.removeItem(CHAVE_SESSAO);
    }

    window.ConectaSaude = {
        ENDERECO_API,
        $: (id) => document.getElementById(id),
        // escapa também aspas, para ser seguro em atributos HTML
        escaparHtml: (valor) => String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;'),
        formatarData: (valor) => new Date(valor).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        ROTULOS_SITUACAO: {
            analise: ['registrado', 'Registrado'],
            aceito: ['aceito', 'Aceito'],
            producao: ['impressao', 'Impressao'],
            pronto: ['entregue', 'Pronto'],
            recusado: ['recusado', 'Recusado']
        },
        // o banco guarda Normal/Prioritário/Urgente; na tela aparece Baixa/Média/Alta
        ROTULOS_URGENCIA: { Normal: 'Baixa', Prioritário: 'Média', Urgente: 'Alta' },
        lerSessao,
        salvarSessao,
        limparSessao,
        fetchAutenticado(caminho, opcoes = {}) {
            const sessao = lerSessao();
            return fetch(ENDERECO_API + caminho, {
                ...opcoes,
                headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}), Authorization: 'Bearer ' + (sessao ? sessao.token : '') }
            });
        }
    };

    // ---- Acessibilidade: VLibras (tradutor de Libras do governo) e UserWay ----
    function carregarAcessibilidade() {
        if (!document.querySelector('[vw]')) {
            const vw = document.createElement('div');
            vw.setAttribute('vw', '');
            vw.className = 'enabled';
            vw.innerHTML = '<div vw-access-button class="active"></div>'
                + '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
            document.body.appendChild(vw);

            const libras = document.createElement('script');
            libras.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
            libras.onload = () => new window.VLibras.Widget('https://vlibras.gov.br/app');
            document.body.appendChild(libras);
        }

        if (USERWAY_ID && !document.querySelector('script[data-account]')) {
            const uw = document.createElement('script');
            uw.src = 'https://cdn.userway.org/widget.js';
            uw.setAttribute('data-account', USERWAY_ID);
            uw.setAttribute('data-position', '3'); // esquerda, centralizado na vertical
            uw.async = true;
            document.body.appendChild(uw);
        }
    }

    function protegerPagina(pagina) {
        const sessao = lerSessao();
        if (!sessao) {
            sessionStorage.setItem('conectasaude.motivo', 'Sessão não encontrada ou expirada. Entre novamente.');
            location.replace('../index.html');
            return false;
        }
        if (PAGINAS_PERMITIDAS[sessao.usuario.perfil]?.includes(pagina) === false) {
            location.replace(PAGINAS_INICIAIS[sessao.usuario.perfil].replace('html/', ''));
            return false;
        }
        return true;
    }

    function carregarScript(nome) {
        return new Promise((resolver, rejeitar) => {
            const elementoScript = document.createElement('script');
            elementoScript.src = location.pathname.endsWith('/index.html') || location.pathname.endsWith('/')
                ? `js/${nome}.js`
                : `../js/${nome}.js`;
            elementoScript.onload = resolver;
            elementoScript.onerror = rejeitar;
            document.body.appendChild(elementoScript);
        });
    }

    function configurarBotaoSair() {
        const botaoSair = document.getElementById('botao-sair');
        if (!botaoSair) return;
        botaoSair.addEventListener('click', (evento) => {
            evento.preventDefault();
            limparSessao();
            location.href = '../index.html';
        });
    }

    async function iniciarPagina() {
        const pagina = location.pathname.split('/').pop() || 'index.html';
        const modulo = PAGINAS_PUBLICAS.includes(pagina)
            ? 'autenticacao'
            : ['aacd.html', 'pedido.html'].includes(pagina)
                ? 'pedidos'
                : ['laboratorio_instituicao.html', 'detalhe_laboratorio_instituicao.html'].includes(pagina)
                    ? 'laboratorios'
                    : ['solicitacoes.html', 'detalhe_solicitacao.html', 'fablab.html'].includes(pagina)
                        ? 'solicitacoes'
                        : null;

        carregarAcessibilidade();
        configurarBotaoSair();

        if (!PAGINAS_PUBLICAS.includes(pagina) && !protegerPagina(pagina)) return;
        if (!modulo) return;

        await carregarScript(modulo);
        window.ConectaSaude[modulo]?.();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarPagina);
    else iniciarPagina();
})();
