(() => {
    'use strict';

    const ENDERECO_API = 'http://localhost:5000/api';
    const CHAVE_SESSAO = 'conectasaude.sessao';
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
        escaparHtml: (valor) => new Option(String(valor)).innerHTML,
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

    function protegerPagina() {
        const sessao = lerSessao();
        if (!sessao) {
            sessionStorage.setItem('conectasaude.motivo', 'Sessão não encontrada ou expirada. Entre novamente.');
            location.replace('../index.html');
            return false;
        }
        const pagina = location.pathname.split('/').pop();
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

    async function iniciarPagina() {
        const pagina = location.pathname.split('/').pop() || 'index.html';
        const modulo = ['index.html', 'cadastro_instituicao.html'].includes(pagina)
            ? 'autenticacao'
            : ['aacd.html', 'pedido.html'].includes(pagina)
                ? 'pedidos'
                : ['laboratorio_instituicao.html', 'detalhe_laboratorio_instituicao.html'].includes(pagina)
                    ? 'laboratorios'
                    : ['solicitacoes.html', 'detalhe_solicitacao.html', 'fablab.html'].includes(pagina)
                        ? 'solicitacoes'
                        : null;

        if (pagina !== 'index.html' && !protegerPagina()) return;
        if (!modulo) return;

        await carregarScript(modulo);
        window.ConectaSaude[modulo]?.();
    }

    document.addEventListener('DOMContentLoaded', iniciarPagina);

    const botaoSair = document.getElementById('botao-sair');
    if (botaoSair) {
        botaoSair.addEventListener('click', (evento) => {
            evento.preventDefault();
            limparSessao();
            location.href = '../index.html';
        });
    }
})();
