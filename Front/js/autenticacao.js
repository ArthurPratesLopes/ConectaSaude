(() => {
    const plataforma = window.ConectaSaude;
    const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
    const PERFIS = { aacd: 'cliente', fablab: 'fornecedor' };
    const PAGINAS_INICIAIS = { cliente: 'html/aacd.html', fornecedor: 'html/fablab.html', admin: 'html/aacd.html' };

    plataforma.autenticacao = () => {
        const formulario = document.getElementById('formulario-acesso');
        if (!formulario) return;
        const $ = plataforma.$;
        const campos = {
            nome: $('nome'), cidade: $('cidade'), estado: $('estado'),
            email: $('email'), senha: $('senha'), aceite: $('aceite')
        };
        const botao = $('botao-acesso');
        const textoBotao = botao.querySelector('.botao-texto');
        const erroGeral = $('erro-acesso');
        let modo = 'login';

        UFS.forEach((uf) => campos.estado.add(new Option(uf, uf)));

        function erroCampo(nome, mensagem) {
            const elemento = $('erro-' + nome);
            if (!elemento) return;
            elemento.textContent = mensagem || '';
            elemento.hidden = !mensagem;
            const campoEntrada = campos[nome];
            if (campoEntrada && campoEntrada.type !== 'checkbox') campoEntrada.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
        }
        function limparErros() {
            ['nome', 'cidade', 'estado', 'email', 'senha', 'aceite'].forEach((nome) => erroCampo(nome, ''));
            mostrarAviso('');
        }
        function mostrarAviso(mensagem, tipo) {
            erroGeral.textContent = mensagem || '';
            erroGeral.className = 'aviso' + (tipo ? ' ' + tipo : '');
            erroGeral.hidden = !mensagem;
        }
        function perfilSelecionado() {
            return document.querySelector('input[name="perfil"]:checked')?.value || 'aacd';
        }
        function atualizarBotao() {
            botao.disabled = !(campos.email.value.trim() && campos.senha.value.trim());
        }
        function atualizarRotuloNome() {
            $('rotulo-nome').textContent = perfilSelecionado() === 'fablab'
                ? 'Nome do laboratorio'
                : 'Nome da unidade da instituicao';
        }
        function definirModo(novo) {
            modo = novo;
            const cadastro = modo === 'cadastro';
            document.querySelectorAll('.abas button').forEach((botao) => {
                const abaAtiva = botao.dataset.modo === modo;
                botao.classList.toggle('ativa', abaAtiva);
                botao.setAttribute('aria-pressed', String(abaAtiva));
            });
            ['campo-nome', 'campo-local', 'campo-termo'].forEach((id) => { $(id).hidden = !cadastro; });
            $('titulo-acesso').textContent = cadastro ? 'Crie sua conta' : 'Acesse a plataforma';
            $('sub-acesso').textContent = cadastro
                ? 'Cadastre sua instituicao ou laboratorio para comecar.'
                : 'Entre para acompanhar pedidos e producoes.';
            textoBotao.textContent = cadastro ? 'Criar conta' : 'Entrar';
            campos.senha.autocomplete = cadastro ? 'new-password' : 'current-password';
            atualizarRotuloNome();
            limparErros();
            atualizarBotao();
        }
        function validar() {
            limparErros();
            let valido = true;
            const falha = (campo, mensagem) => { erroCampo(campo, mensagem); valido = false; };
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email.value.trim())) falha('email', 'Informe um e-mail válido.');
            if (modo === 'cadastro') {
                if (!campos.nome.value.trim()) falha('nome', 'Informe o nome.');
                if (!campos.cidade.value.trim()) falha('cidade', 'Informe a cidade.');
                if (!campos.estado.value) falha('estado', 'Escolha a UF.');
                if (!campos.aceite.checked) falha('aceite', 'É necessário aceitar os termos para criar a conta.');
            }
            return valido;
        }

        document.querySelectorAll('.abas button').forEach((botao) => botao.addEventListener('click', () => definirModo(botao.dataset.modo)));
        document.querySelectorAll('input[name="perfil"]').forEach((radio) => radio.addEventListener('change', atualizarRotuloNome));
        campos.email.addEventListener('input', atualizarBotao);
        campos.senha.addEventListener('input', atualizarBotao);
        $('ver-senha').addEventListener('click', () => {
            const exibirSenha = campos.senha.type === 'password';
            campos.senha.type = exibirSenha ? 'text' : 'password';
        });

        const motivo = sessionStorage.getItem('conectasaude.motivo');
        if (motivo) {
            sessionStorage.removeItem('conectasaude.motivo');
            setTimeout(() => mostrarAviso(motivo, 'info'), 0);
        }

        formulario.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            if (!validar()) return;
            const cadastro = modo === 'cadastro';
            const corpo = cadastro
                ? {
                    nomeInstituicao: campos.nome.value.trim(),
                    email: campos.email.value.trim(),
                    senha: campos.senha.value,
                    perfil: PERFIS[perfilSelecionado()],
                    cidade: campos.cidade.value.trim(),
                    estado: campos.estado.value
                }
                : { email: campos.email.value.trim(), senha: campos.senha.value };
            botao.disabled = true;
            botao.classList.add('carregando');
            try {
                const resposta = await fetch(`${plataforma.ENDERECO_API}/auth/${cadastro ? 'register' : 'login'}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(corpo)
                });
                const dados = await resposta.json().catch(() => ({}));
                if (!resposta.ok) return mostrarAviso(dados.erro || 'Não foi possível concluir.');
                plataforma.salvarSessao(dados.token, dados.usuario);
                mostrarAviso(cadastro ? 'Conta criada! Entrando...' : 'Bem-vindo! Entrando...', 'ok');
                location.href = PAGINAS_INICIAIS[dados.usuario.perfil] || 'html/aacd.html';
            } catch {
                mostrarAviso('Não foi possível conectar ao servidor.');
            } finally {
                botao.classList.remove('carregando');
                atualizarBotao();
            }
        });

        atualizarRotuloNome();
        atualizarBotao();
    };

    window.ConectaSaude.autenticacao = plataforma.autenticacao;
})();
