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
            if ($('laboratorios')) iniciarLaboratorios();
            if ($('titulo-lab')) iniciarDetalheLab();
            if ($('busca-solicitacoes')) iniciarSolicitacoes();
            if ($('sol-codigo')) iniciarSolicitacao();
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
        pronto: ['entregue', 'Pronto'],
        recusado: ['recusado', 'Recusado']
    };

    function ligarFormulario(fornecedorId, depois) {
        $('formPedido').addEventListener('submit', async (e) => {
            e.preventDefault();
            const dados = new FormData();
            ['paciente', 'peca', 'material', 'prazo', 'medidas'].forEach((id) => dados.append(id, $(id).value));
            dados.append('urgencia', document.querySelector('input[name="urgencia"]:checked').value);
            dados.append('arquivoStl', $('arquivoStl').files[0]);
            dados.append('fornecedorId', fornecedorId);
            const resposta = await fetch(API + '/orders', { method: 'POST', headers: { Authorization: 'Bearer ' + lerSessao().token }, body: dados });
            if (!resposta.ok) return $('erro').textContent = (await resposta.json()).erro;
            e.target.reset();
            $('erro').textContent = '';
            location.hash = '';
            depois();
        });
    }

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

        ligarFormulario('', carregar);

        carregar();
    }

    const carregarLabs = () => CS.fetchAutenticado('/laboratorios').then((r) => r.json()).then((d) => d.laboratorios);
    const materiaisDe = (l) => [...new Set(l.impressoras.flatMap((i) => i.materiaisCompativeis))];

    function iniciarLaboratorios() {
        carregarLabs().then((labs) => {
            const desenhar = () => {
                const busca = $('busca-lab').value.toLowerCase();
                const lista = labs.filter((l) => [l.nomeInstituicao, l.cidade, ...materiaisDe(l)].join(' ').toLowerCase().includes(busca));
                $('total-labs').textContent = lista.length + (lista.length === 1 ? ' laboratório' : ' laboratórios');
                $('laboratorios').innerHTML = lista.map((l) => `<li class="lab-cartao">
                    <div class="lab-cartao-topo">
                        <span class="lab-icone"><img class="icone" src="../img/icone-laboratorio.png" alt=""></span>
                        <div><h3>${esc(l.nomeInstituicao)}</h3><p class="lab-cidade">${esc(l.cidade)}, ${esc(l.estado)}</p></div>
                    </div>
                    <div class="lab-numeros">
                        <div><strong>${l.impressoras.length}</strong><span>Impressoras</span></div>
                        <div><strong>${materiaisDe(l).length}</strong><span>Materiais</span></div>
                    </div>
                    <ul class="lab-materiais">${materiaisDe(l).map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
                    <ul class="lab-contatos"><li><b>E-mail</b> ${esc(l.email)}</li></ul>
                    <a href="detalhe_laboratorio_instituicao.html?id=${l._id}" class="botao-contorno lab-ver">Ver detalhes ›</a>
                </li>`).join('') || '<li class="pedido-aviso">Nenhum laboratório encontrado.</li>';
            };
            $('busca-lab').addEventListener('input', desenhar);
            desenhar();
        }).catch(() => { $('laboratorios').innerHTML = '<li class="pedido-aviso pedido-aviso-erro">Não foi possível carregar os laboratórios.</li>'; });
    }

    function iniciarDetalheLab() {
        const id = new URLSearchParams(location.search).get('id');
        ligarFormulario(id, () => { location.href = 'aacd.html'; });
        carregarLabs().then((labs) => {
            const l = labs.find((x) => x._id === id);
            $('titulo-lab').textContent = l.nomeInstituicao;
            $('lab-cidade').textContent = `${l.cidade}, ${l.estado}`;
            $('lab-avatar').textContent = l.nomeInstituicao.slice(0, 2).toUpperCase();
            $('lab-email').textContent = l.email;
            $('lab-qtd').textContent = l.impressoras.length + ' equipamentos cadastrados';
            $('lab-impressoras').innerHTML = l.impressoras.map((i) => `<li class="lab-imp">
                <span class="lab-icone lab-icone-3d" aria-hidden="true">3D</span>
                <div class="lab-imp-info">
                    <h3>${esc(i.marca)} ${esc(i.modelo)}</h3>
                    <p>${i.tecnologia}${i.volumeConstrucao ? ` · Volume: ${i.volumeConstrucao.larguraX} × ${i.volumeConstrucao.profundidadeY} × ${i.volumeConstrucao.alturaZ} mm` : ''}</p>
                    <p><b>Materiais:</b> ${i.materiaisCompativeis.map(esc).join(', ')}</p>
                </div>
                <span class="lab-status${i.disponibilidade === 'Disponível' ? '' : ' lab-status-parcial'}">${i.disponibilidade}</span>
            </li>`).join('') || '<li>Nenhuma impressora cadastrada ainda.</li>';
        }).catch(() => { $('titulo-lab').textContent = 'Laboratório não encontrado'; });
    }

    function ligarChat(id) {
        const caixa = $('chat-mensagens');
        const mostrarChat = () => CS.fetchAutenticado('/messages/' + id).then((r) => r.json()).then(({ mensagens }) => {
            caixa.innerHTML = mensagens.map((m) => `<div class="mensagem mensagem-${m.remetenteId._id === lerSessao().usuario.id ? 'enviada' : 'recebida'}">
                <span class="mensagem-autor">${esc(m.remetenteId.nomeInstituicao)}</span>
                <p>${esc(m.texto)}</p>
                <small>${new Date(m.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small>
            </div>`).join('') || '<p>Nenhuma mensagem ainda.</p>';
            caixa.scrollTop = caixa.scrollHeight;
        }).catch(() => {});
        $('chat-enviar').addEventListener('click', async () => {
            const texto = $('chat-texto').value.trim();
            if (!texto) return;
            await CS.fetchAutenticado('/messages', { method: 'POST', body: JSON.stringify({ orderId: id, texto }) });
            $('chat-texto').value = '';
            mostrarChat();
        });
        mostrarChat();
        setInterval(mostrarChat, 5000);
    }

    const ROTULO_LAB = { analise: 'Nova', aceito: 'Aceita', producao: 'Em produção', pronto: 'Pronta para entrega' };
    const mudarStatus = (id, status) => CS.fetchAutenticado(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

    function iniciarSolicitacoes() {
        let pedidos = [];
        const desenhar = () => {
            const busca = $('busca-solicitacoes').value.toLowerCase();
            document.querySelectorAll('.coluna').forEach((coluna, i) => {
                const lista = pedidos.filter((p) => p.status === Object.keys(ROTULO_LAB)[i] && (p.codigo + ' ' + p.peca).toLowerCase().includes(busca));
                coluna.querySelector('.coluna-contador').textContent = lista.length;
                coluna.querySelector('.coluna-corpo').innerHTML = lista.map((p) => `<article class="cartao-kanban">
                    <div class="cartao-kanban-topo">
                        <div>
                            <h3>${esc(p.peca)}</h3>
                            <p class="cartao-kanban-linha"><img class="ik ik-14" src="../img/documento.png" alt="" width="14" height="14">${p.codigo}</p>
                        </div>
                        <a href="detalhe_solicitacao.html?id=${p._id}" class="cartao-kanban-seta" aria-label="Abrir solicitação ${p.codigo}"><img class="ik ik-18" src="../img/seta.png" alt="" width="18" height="18"></a>
                    </div>
                    <p class="cartao-kanban-prazo"><img class="ik ik-15" src="../img/calendario.png" alt="" width="15" height="15">Prazo: ${dia(p.prazo)}</p>
                    <label class="cartao-kanban-status">
                        <small>Atualizar status</small>
                        <select data-id="${p._id}">${Object.entries(ROTULO_LAB).map(([v, r]) => `<option value="${v}"${v === p.status ? ' selected' : ''}>${r}</option>`).join('')}</select>
                    </label>
                    <div class="cartao-kanban-acoes">
                        <a href="detalhe_solicitacao.html?id=${p._id}">Ver detalhes</a>
                        <button type="button" data-recusar="${p._id}">Cancelar</button>
                    </div>
                </article>`).join('') || '<div class="kanban-vazio"><span>Nenhuma solicitação</span></div>';
            });
        };
        const carregar = () => CS.fetchAutenticado('/orders').then((r) => r.json()).then((d) => { pedidos = d.pedidos; desenhar(); });
        const kanban = document.querySelector('.kanban');
        kanban.addEventListener('change', (e) => mudarStatus(e.target.dataset.id, e.target.value).then(carregar));
        kanban.addEventListener('click', (e) => e.target.dataset.recusar && mudarStatus(e.target.dataset.recusar, 'recusado').then(carregar));
        $('busca-solicitacoes').addEventListener('input', desenhar);
        carregar();
    }

    function iniciarSolicitacao() {
        const id = new URLSearchParams(location.search).get('id');
        const carregar = () => CS.fetchAutenticado('/orders/' + id).then((r) => r.json()).then(({ pedido: p }) => {
            const [classe, rotulo] = STATUS[p.status];
            const cliente = p.clienteId.nomeInstituicao;
            $('sol-selo').className = 'selo selo-' + classe;
            Object.entries({
                'sol-selo': ROTULO_LAB[p.status] || rotulo,
                'sol-codigo': 'Solicitação ' + p.codigo,
                'titulo-dados': p.peca,
                'sol-recebida': `Recebida de ${cliente} · ${dia(p.createdAt)}`,
                'sol-paciente': p.paciente,
                'sol-inst': cliente,
                'sol-peca': p.peca,
                'sol-material': p.material || '—',
                'sol-quantidade': p.quantidade + (p.quantidade === 1 ? ' unidade' : ' unidades'),
                'sol-prazo': dia(p.prazo),
                'sol-urgencia': p.urgencia,
                'sol-lab': p.fornecedorId ? p.fornecedorId.nomeInstituicao : 'Aguardando aceite',
                'sol-obs': p.observacoesTecnicas || '—',
                'arquivo-nome': p.arquivoUrl.split('/').pop(),
                'chat-sub': `${p.codigo} · Conversa com ${cliente}`
            }).forEach(([chave, texto]) => { $(chave).textContent = texto; });
            $('arquivo-baixar').href = API.replace('/api', '') + p.arquivoUrl;
            $('status-atual').value = p.status;
            document.querySelector('.acompanhamento').classList.toggle('recusada', p.status === 'recusado');
            const atual = ['aceito', 'producao', 'pronto'].indexOf(p.status);
            document.querySelectorAll('.stepper li').forEach((li, i) => {
                li.classList.toggle('feito', i < atual);
                li.classList.toggle('atual', i === atual);
            });
        }).catch(() => { $('titulo-dados').textContent = 'Solicitação não encontrada'; });
        $('status-atual').addEventListener('change', (e) => mudarStatus(id, e.target.value).then(carregar));
        $('recusar-solicitacao').addEventListener('click', () => mudarStatus(id, 'recusado').then(carregar));
        carregar();
        ligarChat(id);
    }

    function iniciarDetalhePedido() {
        const id = new URLSearchParams(location.search).get('id');
        CS.fetchAutenticado('/orders/' + id).then((r) => r.json()).then(({ pedido: p }) => {
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
            $('chat-sub').textContent = `${p.codigo} · ` + (p.fornecedorId ? 'Conversa com ' + p.fornecedorId.nomeInstituicao : 'Aguardando laboratório');
            const atual = p.status === 'recusado' ? -1 : Object.keys(STATUS).indexOf(p.status);
            document.querySelectorAll('.progresso li').forEach((li, i) => {
                li.classList.toggle('feito', i <= atual);
                li.firstChild.textContent = i <= atual ? '✓' : i + 1;
            });
        }).catch(() => { $('detalhe-titulo').textContent = 'Pedido não encontrado'; });

        ligarChat(id);
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
    // ---- Acessibilidade: VLibras (tradutor de Libras do governo) e UserWay ----
    // O VLibras funciona sem cadastro. O UserWay precisa de um ID de conta gratuito
    // (https://userway.org/code): cole o ID abaixo para ativar; vazio = não carrega.
    const USERWAY_ID = '0bH9G4qEju';

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
            uw.setAttribute('data-position', '6');
            uw.async = true;
            document.body.appendChild(uw);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', carregarAcessibilidade);
    else carregarAcessibilidade();
})();
