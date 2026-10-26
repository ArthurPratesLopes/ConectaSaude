/* Conecta Saúde – lógica da tela inicial (index.html)
   Cuida de: alternar Entrar/Criar conta, perfil AACD/Laboratório,
   validação, botão habilitado só com formulário válido, cadastro e login
   pela API do Backend (server.js) e redirecionamento por perfil. */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const form = $('#form-acesso');
  if (!form) return;

  const el = {
    titulo: $('#titulo-acesso'),
    sub: $('#sub-acesso'),
    abas: document.querySelectorAll('.abas button'),
    campoNome: $('#campo-nome'),
    campoLocal: $('#campo-local'),
    cidade: $('#cidade'),
    estado: $('#estado'),
    rotuloNome: $('#rotulo-nome'),
    nome: $('#nome'),
    email: $('#email'),
    senha: $('#senha'),
    esqueci: $('.link-esqueci'),
    campoTermo: $('#campo-termo'),
    aceite: $('#aceite'),
    erro: $('#erro-acesso'),
    verSenha: $('#ver-senha'),
    textoBotao: $('#botao-acesso .botao-texto'),
    abrirAcesso: $('#abrir-acesso'),
    cartao: $('#acesso'),
    botao: $('#botao-acesso'),
    comecar: $('#comecar'),
  };

  const TEXTOS = {
    login: {
      titulo: 'Acesse a plataforma',
      sub: 'Entre para acompanhar pedidos e produções.',
      botao: 'Entrar',
      autocomplete: 'current-password',
    },
    cadastro: {
      titulo: 'Crie sua conta',
      sub: 'Cadastre sua unidade para solicitar ou produzir peças.',
      botao: 'Criar conta',
      autocomplete: 'new-password',
    },
  };

  // Endereço do Backend (server.js, porta 5000 por padrão)
  const API = 'http://localhost:5000/api/auth';

  // perfil da tela -> perfil do banco (Models/user.js) + textos e destino
  const PERFIS = {
    aacd: {
      banco: 'cliente',
      rotulo: 'Nome da unidade da AACD',
      exemplo: 'Ex.: AACD Ibirapuera',
    },
    fablab: {
      banco: 'fornecedor',
      rotulo: 'Nome do laboratório',
      exemplo: 'Ex.: FabLab da Mauá',
    },
  };
  // perfil do banco -> página inicial dele (ajuste se a pasta tiver outro nome)
  const DESTINOS = {
    cliente: 'html/aacd.html',
    fornecedor: 'html/fablab.html',
    admin: 'html/aacd.html',
  };

  const CHAVE_SESSAO = 'conecta:sessao';
  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  let modo = 'login';
  let carregando = false;
  const tocados = new Set(); // campos que a pessoa já visitou

  /* ---------- helpers ---------- */
  const perfilAtual = () => form.querySelector('input[name="perfil"]:checked').value;
  const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  /* ---------- validação ---------- */
  // Devolve [{campo, msg}] na ordem em que aparecem no formulário.
  function problemas() {
    const lista = [];
    if (modo === 'cadastro' && el.nome.value.trim().length < 3) {
      lista.push({ campo: 'nome', msg: 'Informe o nome da unidade ou do laboratório.' });
    }
    if (modo === 'cadastro' && el.cidade.value.trim().length < 2) {
      lista.push({ campo: 'cidade', msg: 'Informe a cidade.' });
    }
    if (modo === 'cadastro' && !el.estado.value) {
      lista.push({ campo: 'estado', msg: 'Escolha o estado (UF).' });
    }
    if (!emailValido(el.email.value.trim())) {
      lista.push({ campo: 'email', msg: 'Digite um e-mail válido, como nome@instituicao.org.br.' });
    }
    if (el.senha.value.length < 8) {
      lista.push({ campo: 'senha', msg: 'A senha precisa ter pelo menos 8 caracteres.' });
    }
    if (modo === 'cadastro' && !el.aceite.checked) {
      lista.push({ campo: 'aceite', msg: 'Aceite os Termos de Uso e a Política de Privacidade para continuar.' });
    }
    return lista;
  }

  // Aviso geral (erros do servidor, recuperação de senha etc.). tipo: 'erro' | 'ok' | 'info'
  function mostrarErro(msg, tipo = 'erro') {
    el.erro.textContent = msg || '';
    el.erro.className = 'aviso' + (tipo === 'erro' ? '' : ' ' + tipo);
    el.erro.hidden = !msg;
  }

  const CAMPOS = ['nome', 'cidade', 'estado', 'email', 'senha', 'aceite'];

  function atualizar() {
    const lista = problemas();
    el.botao.disabled = lista.length > 0 || carregando;

    // cada campo mostra o próprio erro, mas só depois de a pessoa visitá-lo
    CAMPOS.forEach((id) => {
      const p = lista.find((x) => x.campo === id);
      const mostrar = !!p && tocados.has(id);
      const msg = document.getElementById('erro-' + id);
      if (msg) { msg.textContent = mostrar ? p.msg : ''; msg.hidden = !mostrar; }
      if (id !== 'aceite') el[id].setAttribute('aria-invalid', mostrar ? 'true' : 'false');
    });
  }

  /* ---------- modo (Entrar / Criar conta) ---------- */
  function definirModo(novo) {
    modo = novo;
    const t = TEXTOS[modo];
    const cadastro = modo === 'cadastro';

    el.abas.forEach((b) => {
      const ativa = b.dataset.modo === modo;
      b.classList.toggle('ativa', ativa);
      b.setAttribute('aria-pressed', String(ativa));
    });

    el.titulo.textContent = t.titulo;
    el.sub.textContent = t.sub;
    el.textoBotao.textContent = t.botao;
    el.senha.autocomplete = t.autocomplete;

    el.campoNome.hidden = !cadastro;
    el.campoLocal.hidden = !cadastro;
    el.campoTermo.hidden = !cadastro;
    el.esqueci.hidden = cadastro;

    tocados.clear();
    mostrarErro('');
    atualizar();
  }

  /* ---------- perfil ---------- */
  function definirPerfil() {
    const p = PERFIS[perfilAtual()];
    el.rotuloNome.textContent = p.rotulo;
    el.nome.placeholder = p.exemplo;
  }

  /* ---------- ações ---------- */
  function iniciarSessao(usuario) {
    try { sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario)); } catch { /* segue mesmo assim */ }
    window.location.href = DESTINOS[usuario.perfil] || DESTINOS.cliente;
  }

  // Chama a API e devolve { ok, dados }. Erros de rede viram mensagem amigável.
  async function chamar(rota, corpo) {
    try {
      const res = await fetch(`${API}/${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const dados = await res.json().catch(() => ({}));
      return { ok: res.ok, dados };
    } catch {
      return { ok: false, dados: { erro: 'Não foi possível falar com o servidor. Confira se o Backend está rodando.' } };
    }
  }

  async function criarConta() {
    const email = el.email.value.trim().toLowerCase();
    const senha = el.senha.value;
    const cadastro = await chamar('register', {
      nomeInstituicao: el.nome.value.trim(),
      email,
      senha,
      perfil: PERFIS[perfilAtual()].banco,
      cidade: el.cidade.value.trim(),
      estado: el.estado.value,
    });
    if (!cadastro.ok) { mostrarErro(cadastro.dados.erro || 'Não foi possível criar a conta.'); return; }

    // conta criada: já entra direto
    const login = await chamar('login', { email, senha });
    if (!login.ok) { definirModo('login'); mostrarErro('Conta criada! Entre com seu e-mail e senha.', 'ok'); return; }
    iniciarSessao(login.dados.usuario);
  }

  async function entrar() {
    const login = await chamar('login', {
      email: el.email.value.trim().toLowerCase(),
      senha: el.senha.value,
    });
    if (!login.ok) { mostrarErro(login.dados.erro || 'E-mail ou senha incorretos.'); return; }
    iniciarSessao(login.dados.usuario); // o destino vem do perfil salvo no banco
  }

  /* ---------- eventos ---------- */
  el.abas.forEach((b) => b.addEventListener('click', () => definirModo(b.dataset.modo)));

  form.querySelectorAll('input[name="perfil"]').forEach((r) =>
    r.addEventListener('change', () => { definirPerfil(); atualizar(); })
  );

  [['nome', el.nome], ['cidade', el.cidade], ['estado', el.estado], ['email', el.email], ['senha', el.senha]].forEach(([id, campo]) => {
    campo.addEventListener('input', () => { mostrarErro(''); atualizar(); });
    campo.addEventListener('blur', () => { tocados.add(id); atualizar(); });
    if (id === 'estado') campo.addEventListener('change', () => { tocados.add(id); atualizar(); });
  });
  el.aceite.addEventListener('change', () => { tocados.add('aceite'); atualizar(); });

  el.esqueci.addEventListener('click', () => {
    el.email.focus();
    mostrarErro('A recuperação de senha ainda não está disponível. Fale com a equipe: conectasaude@maua.br.', 'info');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    problemas().forEach((p) => tocados.add(p.campo));
    atualizar();
    if (el.botao.disabled) return;

    mostrarErro('');
    carregando = true;
    el.botao.classList.add('carregando');
    el.textoBotao.textContent = modo === 'cadastro' ? 'Criando conta…' : 'Entrando…';
    atualizar();
    try {
      await (modo === 'cadastro' ? criarConta() : entrar());
    } finally {
      // se não houve redirecionamento, libera o botão de novo
      carregando = false;
      el.botao.classList.remove('carregando');
      el.textoBotao.textContent = TEXTOS[modo].botao;
      atualizar();
    }
  });

  // "Começar agora": rola até o card e foca o primeiro campo útil
  if (el.comecar) {
    el.comecar.addEventListener('click', () => {
      setTimeout(() => (modo === 'cadastro' ? el.nome : el.email).focus({ preventScroll: true }), 300);
    });
  }


  // olho para mostrar/ocultar a senha
  el.verSenha.addEventListener('click', () => {
    const mostrar = el.senha.type === 'password';
    el.senha.type = mostrar ? 'text' : 'password';
    el.verSenha.setAttribute('aria-pressed', String(mostrar));
    el.verSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
    el.verSenha.querySelector('use').setAttribute('href', mostrar ? '#i-eye-off' : '#i-eye');
    el.senha.focus();
  });

  // "Acessar" (cabeçalho): rola até o cartão e foca o primeiro campo útil
  if (el.abrirAcesso) {
    el.abrirAcesso.addEventListener('click', () => {
      setTimeout(() => (modo === 'cadastro' ? el.nome : el.email).focus({ preventScroll: true }), 350);
    });
  }

  // se a foto não carregar, o degradê do CSS assume (sem ícone quebrado)
  const foto = document.querySelector('.hero-visual > img');
  if (foto) foto.addEventListener('error', () => foto.remove());

  // Esc fecha os modais de Termos/Privacidade (que abrem por :target)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && /^#(termos|privacidade)$/.test(location.hash)) {
      location.hash = '#acesso';
    }
  });

  // links "Criar conta" externos: index.html#cadastro abre direto a aba certa
  if (location.hash === '#cadastro') definirModo('cadastro');

  UFS.forEach((uf) => el.estado.add(new Option(uf, uf)));

  definirPerfil();
  definirModo('login');
})();
