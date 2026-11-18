(() => {
    'use strict';

    const API = 'http://localhost:5000/api';
    const CHAVE_SESSAO = 'conectasaude.sessao';

    const PERFIL_PARA_API = { aacd: 'cliente', fablab: 'fornecedor' };
    const HOME_DO_PERFIL = {
        cliente: 'html/aacd.html',
        fornecedor: 'html/fablab.html',
        admin: 'html/aacd.html'
    };
    const PAGINAS_DO_PERFIL = {
        cliente: ['aacd.html', 'pedido.html', 'laboratorio_instituicao.html', 'detalhe_laboratorio_instituicao.html'],
        fornecedor: ['fablab.html', 'solicitacoes.html', 'detalhe_solicitacao.html']
    };
    const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

    function lerSessao() {
        try {
            const s = JSON.parse(localStorage.getItem(CHAVE_SESSAO));
            if (!s || !s.token || !s.usuario) return null;
            const { exp } = JSON.parse(atob(s.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (exp && exp * 1000 < Date.now()) { limparSessao(); return null; }
            return s;
        } catch (e) {
            return null;
        }
    }
    function salvarSessao(token, usuario) {
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token, usuario }));
    }
    function limparSessao() {
        localStorage.removeItem(CHAVE_SESSAO);
    }

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

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('form-acesso');

        if (form) iniciarHome(form);
        else {
            protegerPaginaInterna();
            if ($('pedidos')) iniciarPedidos();
            if ($('detalhe-codigo')) iniciarDetalhePedido();
        }

        const sair = document.getElementById('botao-sair');
        if (sair) {
            sair.addEventListener('click', (event) => {
                event.preventDefault();
                limparSessao();
                window.location.href = '../index.html';
            });
        }
    });

    function protegerPaginaInterna() {
        const sessao = lerSessao();
        if (!sessao) {
            sessionStorage.setItem('conectasaude.motivo', 'Sessão não encontrada ou expirada. Entre novamente.');
            console.warn('[Conecta Saúde] sem sessão válida; voltando ao login.');
            window.location.replace('../index.html');
            return;
        }
        const pagina = location.pathname.split('/').pop();
        const permitidas = PAGINAS_DO_PERFIL[sessao.usuario.perfil];
        if (permitidas && !permitidas.includes(pagina)) {
            window.location.replace(HOME_DO_PERFIL[sessao.usuario.perfil].replace('html/', ''));
        }
    }

    const $ = (id) => document.getElementById(id);
    const esc = (t) => new Option(t).innerHTML;
    const dia = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const STATUS = {
        analise: ['registrado', 'Registrado'],
        aceito: ['aceito', 'Aceito'],
        producao: ['impressao', 'Impressão'],
        pronto: ['entregue', 'Entregue'],
        recusado: ['recusado', 'Recusado']
    };

    function iniciarPedidos() {
        const carregar = () => CS.fetchAutenticado('/orders').then((r) => r.json()).then(({ pedidos }) => {
            Object.entries({ nTodos: '', nAbertos: 'analise', nImpressao: 'producao', nEntregues: 'pronto', nRecusados: 'recusado' }).forEach(([id, status]) => {
                $(id).textContent = String(pedidos.filter((p) => !status || p.status === status).length).padStart(2, '0');
            });
            $('atualizado').textContent = '';
            $('pedidos').innerHTML = pedidos.map((p) => `<li class="pedido">
                <div class="pedido-info">
                    <div class="pedido-linha1"><span class="selo selo-${STATUS[p.status][0]}">${STATUS[p.status][1]}</span><span class="pedido-codigo">${p.codigo}</span></div>
                    <h3>${esc(p.peca)}</h3>
                    <p>Registrado em ${dia(p.createdAt)} • Prazo: ${dia(p.prazo)}</p>
                </div>
                <a class="pedido-seta" href="pedido.html?id=${p._id}">›</a>
            </li>`).join('') || '<li class="pedido-aviso">Você ainda não enviou nenhum pedido.</li>';
        }).catch(() => {
            $('pedidos').innerHTML = '<li class="pedido-aviso pedido-aviso-erro">Não foi possível carregar os pedidos.</li>';
        });

        $('formPedido').addEventListener('submit', async (e) => {
            e.preventDefault();
            const dados = new FormData();
            ['paciente', 'peca', 'material', 'prazo', 'medidas'].forEach((id) => dados.append(id, $(id).value));
            dados.append('urgencia', document.querySelector('input[name="urgencia"]:checked').value);
            dados.append('arquivoStl', $('arquivoStl').files[0]);
            const resposta = await fetch(API + '/orders', { method: 'POST', headers: { Authorization: 'Bearer ' + lerSessao().token }, body: dados });
            if (!resposta.ok) return $('erro').textContent = (await resposta.json()).erro;
            e.target.reset();
            $('erro').textContent = '';
            location.hash = '';
            carregar();
        });

        carregar();
    }

    function iniciarDetalhePedido() {
        CS.fetchAutenticado('/orders/' + new URLSearchParams(location.search).get('id')).then((r) => r.json()).then(({ pedido: p }) => {
            $('detalhe-selo').className = 'selo selo-' + STATUS[p.status][0];
            Object.entries({
                'detalhe-selo': STATUS[p.status][1],
                'detalhe-codigo': p.codigo,
                'detalhe-titulo': p.peca,
                'detalhe-datas': `Registrado em ${dia(p.createdAt)} • Prazo: ${dia(p.prazo)}`,
                'dado-paciente': p.paciente,
                'dado-peca': p.peca,
                'dado-material': p.material || '—',
                'dado-prazo': dia(p.prazo),
                'dado-urgencia': p.urgencia,
                'dado-lab': p.fornecedorId ? p.fornecedorId.nomeInstituicao : 'Aguardando laboratório',
                'dado-medidas': p.observacoesTecnicas || '—',
                'dado-arquivo-nome': p.arquivoUrl.split('/').pop()
            }).forEach(([id, texto]) => { $(id).textContent = texto; });
            $('dado-arquivo').href = API.replace('/api', '') + p.arquivoUrl;
            const atual = p.status === 'recusado' ? -1 : Object.keys(STATUS).indexOf(p.status);
            document.querySelectorAll('.progresso li').forEach((li, i) => {
                li.classList.toggle('feito', i <= atual);
                li.firstChild.textContent = i <= atual ? '✓' : i + 1;
            });
        }).catch(() => { $('detalhe-titulo').textContent = 'Pedido não encontrado'; });
    }

    function iniciarHome(form) {
        const $ = (id) => document.getElementById(id);
        const campos = {
            nome: $('nome'), cidade: $('cidade'), estado: $('estado'),
            email: $('email'), senha: $('senha'), aceite: $('aceite')
        };
        const botao = $('botao-acesso');
        const textoBotao = botao.querySelector('.botao-texto');
        const erroGeral = $('erro-acesso');
        let modo = 'login';

        UFS.forEach((uf) => {
            const op = document.createElement('option');
            op.value = uf;
            op.textContent = uf;
            campos.estado.appendChild(op);
        });

        const motivo = sessionStorage.getItem('conectasaude.motivo');
        if (motivo) {
            sessionStorage.removeItem('conectasaude.motivo');
            setTimeout(() => mostrarAviso(motivo, 'info'), 0);
        }

        const perfilSelecionado = () => document.querySelector('input[name="perfil"]:checked')?.value || 'aacd';

        function erroCampo(nome, mensagem) {
            const el = $('erro-' + nome);
            if (!el) return;
            el.textContent = mensagem || '';
            el.hidden = !mensagem;
            const input = campos[nome];
            if (input && input.type !== 'checkbox') input.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
        }
        function limparErros() {
            ['nome', 'cidade', 'estado', 'email', 'senha', 'aceite'].forEach((n) => erroCampo(n, ''));
            mostrarAviso('');
        }
        function mostrarAviso(mensagem, tipo) {
            erroGeral.textContent = mensagem || '';
            erroGeral.className = 'aviso' + (tipo ? ' ' + tipo : '');
            erroGeral.hidden = !mensagem;
        }

        function definirModo(novo) {
            modo = novo;
            const cadastro = modo === 'cadastro';
            document.querySelectorAll('.abas button').forEach((b) => {
                const ativa = b.dataset.modo === modo;
                b.classList.toggle('ativa', ativa);
                b.setAttribute('aria-pressed', String(ativa));
            });
            ['campo-nome', 'campo-local', 'campo-termo'].forEach((id) => { $(id).hidden = !cadastro; });
            document.querySelector('.link-esqueci').hidden = cadastro;
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
        function atualizarRotuloNome() {
            $('rotulo-nome').textContent = perfilSelecionado() === 'fablab'
                ? 'Nome do laboratório'
                : 'Nome da unidade da instituição';
        }
        document.querySelectorAll('.abas button').forEach((b) => b.addEventListener('click', () => definirModo(b.dataset.modo)));
        document.querySelectorAll('input[name="perfil"]').forEach((r) => r.addEventListener('change', atualizarRotuloNome));

        ['abrir-acesso', 'comecar'].forEach((id) => {
            const a = $(id);
            if (a) a.addEventListener('click', () => setTimeout(() => campos.email.focus(), 300));
        });

        function atualizarBotao() {
            botao.disabled = !(campos.email.value.trim() && campos.senha.value.trim());
        }
        campos.email.addEventListener('input', atualizarBotao);
        campos.senha.addEventListener('input', atualizarBotao);
        atualizarBotao();

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

        document.querySelector('.link-esqueci').addEventListener('click', () => {
            mostrarAviso('A recuperação de senha ainda não está disponível. Fale com conectasaude@maua.br.', 'info');
        });

        function validar() {
            limparErros();
            let ok = true;
            const falha = (campo, msg) => { erroCampo(campo, msg); ok = false; };

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email.value.trim())) falha('email', 'Informe um e-mail válido.');
            if (campos.senha.value.length < 8) {
                if (modo === 'cadastro') falha('senha', 'A senha deve ter no mínimo 8 caracteres.');
            }
            if (modo === 'cadastro') {
                if (!campos.nome.value.trim()) falha('nome', 'Informe o nome.');
                if (!campos.cidade.value.trim()) falha('cidade', 'Informe a cidade.');
                if (!campos.estado.value) falha('estado', 'Escolha a UF.');
                if (!campos.aceite.checked) falha('aceite', 'É necessário aceitar os termos para criar a conta.');
            }
            return ok;
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
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

            botao.classList.add('carregando');
            botao.disabled = true;

            try {
                const resposta = await fetch(`${API}/auth/${cadastro ? 'register' : 'login'}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(corpo)
                });
                const dados = await resposta.json().catch(() => ({}));

                if (!resposta.ok) {
                    mostrarAviso(dados.erro || 'Não foi possível concluir. Tente novamente.');
                    return;
                }

                salvarSessao(dados.token, dados.usuario);
                mostrarAviso(cadastro ? 'Conta criada! Entrando…' : 'Bem-vindo! Entrando…', 'ok');

                window.location.href = HOME_DO_PERFIL[dados.usuario.perfil] || 'html/aacd.html';
            } catch (erro) {
                mostrarAviso('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
            } finally {
                botao.classList.remove('carregando');
                atualizarBotao();
            }
        });
    }
})();