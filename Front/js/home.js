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
    campoLogo: $('#campo-logo'),
    logo: $('#logo'),
    logoPrevia: $('#logo-previa'),
    logoEscolher: $('#logo-escolher'),
    logoRemover: $('#logo-remover'),
    erroLogo: $('#erro-logo'),
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
    avisoCaps: $('#aviso-caps'),
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

  // MODO DEMONSTRAÇÃO / MOCK ESTÁVEL:
  // - via ?mock=1 ou localStorage['conecta:mock'] = '1' continua em mock permanente;
  // - sem o parâmetro, a lógica antiga continua só em localhost sem depender do Backend.
  // Isso evita excesso de requisições e permite testar a interface com dados locais.
  function mockAtivo() {
    try {
      const url = new URL(window.location.href);
      const valorParam = url.searchParams.get('mock');
      if (valorParam === '1' || valorParam === 'true' || valorParam === 'on') {
        localStorage.setItem('conecta:mock', '1');
        return true;
      }
      if (valorParam === '0' || valorParam === 'false' || valorParam === 'off') {
        localStorage.setItem('conecta:mock', '0');
        return false;
      }
      const valor = localStorage.getItem('conecta:mock');
      return valor === '1' || valor === 'true' || valor === 'on';
    } catch {
      return false;
    }
  }
  const MODO_DEMO = mockAtivo() || ['localhost', '127.0.0.1', ''].includes(location.hostname);

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

  // Com sessão ativa a tela inicial não fica acessível (nem pelo "voltar" do navegador):
  // a única saída é o botão "Sair" das páginas internas.
  const voltarAoPainel = () => {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch { /* sem sessão */ }
    if (!s) return false;
    window.location.replace(DESTINOS[s.perfil] || DESTINOS.cliente);
    return true;
  };
  if (voltarAoPainel()) return;

  /* ---------- logo da instituição (opcional, só no cadastro) ----------
     A imagem é reduzida no navegador (128 px) e enviada como data URL junto do cadastro. */
  const LOGO_TAM = 128;
  const LOGO_MAX_BYTES = 5 * 1024 * 1024;
  const LOGO_TIPOS = /^image\/(png|jpeg|webp)$/;
  let logoDados = '';

  const PALAVRAS_LIGACAO = ['da', 'de', 'do', 'das', 'dos', 'e'];
  const iniciais = (texto) => {
    const p = (String(texto || '').match(/\p{L}+/gu) || []).filter((w) => !PALAVRAS_LIGACAO.includes(w.toLowerCase()));
    return ((p[0] ? p[0][0] : '') + (p[1] ? p[1][0] : '')).toUpperCase() || '?';
  };

  function desenharPrevia() {
    el.logoPrevia.textContent = '';
    if (logoDados) {
      const img = document.createElement('img');
      img.src = logoDados;
      img.alt = '';
      el.logoPrevia.appendChild(img);
    } else {
      el.logoPrevia.textContent = iniciais(el.nome.value);
    }
    el.logoRemover.hidden = !logoDados;
  }

  function erroDaLogo(msg) {
    el.erroLogo.textContent = msg || '';
    el.erroLogo.hidden = !msg;
  }

  // reduz mantendo a proporção (sem cortar a marca), sobre fundo branco
  function reduzirImagem(arquivo) {
    return new Promise((ok, falha) => {
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(LOGO_TAM / img.naturalWidth, LOGO_TAM / img.naturalHeight, 1);
        const w = Math.max(1, Math.round(img.naturalWidth * escala));
        const h = Math.max(1, Math.round(img.naturalHeight * escala));
        const c = document.createElement('canvas');
        c.width = c.height = LOGO_TAM;
        const g = c.getContext('2d');
        g.fillStyle = '#fff';
        g.fillRect(0, 0, LOGO_TAM, LOGO_TAM);
        g.drawImage(img, (LOGO_TAM - w) / 2, (LOGO_TAM - h) / 2, w, h);
        URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('imagem inválida')); };
      img.src = url;
    });
  }

  async function escolherLogo() {
    const arquivo = el.logo.files[0];
    erroDaLogo('');
    if (!arquivo) return;
    if (!LOGO_TIPOS.test(arquivo.type)) { el.logo.value = ''; erroDaLogo('Use uma imagem PNG, JPG ou WebP.'); return; }
    if (arquivo.size > LOGO_MAX_BYTES) { el.logo.value = ''; erroDaLogo('A imagem passa de 5 MB. Escolha uma menor.'); return; }
    try {
      logoDados = await reduzirImagem(arquivo);
    } catch {
      el.logo.value = '';
      erroDaLogo('Não foi possível ler essa imagem. Tente outro arquivo.');
      return;
    }
    desenharPrevia();
  }

  function removerLogo() {
    logoDados = '';
    el.logo.value = '';
    erroDaLogo('');
    desenharPrevia();
    el.logoEscolher.focus();
  }

  let modo = 'login';
  let carregando = false;
  const tocados = new Set(); // campos que a pessoa já visitou


  /* ---------- menu: na home só existe "Início" ----------
     Os pedidos ficam nas páginas internas (js/menu.js), depois do login.
     Aqui só o botão do canto muda: "Acessar" sem sessão, "Sair" com sessão. */
  const lerSessao = () => {
    try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
  };
  const sessaoAtiva = () => !!lerSessao();
  function atualizarMenu() {
    if (el.abrirAcesso) {
      const logado = sessaoAtiva();
      el.abrirAcesso.textContent = logado ? 'Sair' : 'Acessar';
      el.abrirAcesso.setAttribute('href', logado ? '#' : '#acesso');
    }
  }

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
    el.campoLogo.hidden = !cadastro;
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
    if (MODO_DEMO) {
      return { ok: true, dados: {} };
    }
    try {
      const res = await fetch(`${API}/${rota}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const dados = await res.json().catch(() => ({}));
      return { ok: res.ok, dados };
    } catch {
      return { ok: false, offline: true, dados: { erro: 'Não foi possível falar com o servidor. Confira se o Backend está rodando.' } };
    }
  }

  // Sessão de demonstração (sem Backend)
  function entrarEmDemo() {
    iniciarSessao({
      id: 'demo',
      nomeInstituicao: el.nome.value.trim() ||
        (perfilAtual() === 'fablab' ? 'Laboratório (demonstração)' : 'AACD (demonstração)'),
      email: el.email.value.trim().toLowerCase(),
      perfil: PERFIS[perfilAtual()].banco,
      logo: modo === 'cadastro' ? logoDados : '',
      demo: true,
    });
  }

  async function criarConta() {
    if (MODO_DEMO) { entrarEmDemo(); return; }
    const email = el.email.value.trim().toLowerCase();
    const senha = el.senha.value;
    const cadastro = await chamar('register', {
      nomeInstituicao: el.nome.value.trim(),
      email,
      senha,
      perfil: PERFIS[perfilAtual()].banco,
      cidade: el.cidade.value.trim(),
      estado: el.estado.value,
      logo: logoDados,
      // prova do aceite (LGPD): versão dos termos e momento do aceite
      termoVersao: (window.CS_LEGAL && window.CS_LEGAL.versao) || '',
      termoAceitoEm: new Date().toISOString(),
    });
    if (cadastro.offline && MODO_DEMO) { entrarEmDemo(); return; }
    if (!cadastro.ok) { mostrarErro(cadastro.dados.erro || 'Não foi possível criar a conta.'); return; }

    // conta criada: já entra direto
    const login = await chamar('login', { email, senha });
    if (!login.ok) { definirModo('login'); mostrarErro('Conta criada! Entre com seu e-mail e senha.', 'ok'); return; }
    iniciarSessao({ ...login.dados.usuario, token: login.dados.token });
  }

  async function entrar() {
    if (MODO_DEMO) { entrarEmDemo(); return; }
    const login = await chamar('login', {
      email: el.email.value.trim().toLowerCase(),
      senha: el.senha.value,
    });
    if (login.offline && MODO_DEMO) { entrarEmDemo(); return; }
    if (!login.ok) { mostrarErro(login.dados.erro || 'E-mail ou senha incorretos.'); return; }
    iniciarSessao({ ...login.dados.usuario, token: login.dados.token }); // o destino vem do perfil salvo no banco
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
  el.logoEscolher.addEventListener('click', () => el.logo.click());
  el.logo.addEventListener('change', escolherLogo);
  el.logoRemover.addEventListener('click', removerLogo);
  el.nome.addEventListener('input', () => { if (!logoDados) desenharPrevia(); });
  el.aceite.addEventListener('change', () => { tocados.add('aceite'); atualizar(); });

  el.esqueci.addEventListener('click', async () => {
    const email = el.email.value.trim().toLowerCase();
    if (!emailValido(email)) {
      tocados.add('email'); atualizar(); el.email.focus();
      mostrarErro('Digite o e-mail da conta no campo acima e clique de novo em "Esqueci minha senha".', 'info');
      return;
    }
    el.esqueci.disabled = true;
    const r = await chamar('esqueci-senha', { email });
    el.esqueci.disabled = false;
    if (r.offline) {
      mostrarErro('Não foi possível falar com o servidor agora. Tente de novo em instantes ou escreva para conectasaude@maua.br.', 'info');
      return;
    }
    // mesma resposta exista a conta ou não (não revela quais e-mails são cadastrados)
    mostrarErro('Se esse e-mail tiver cadastro, enviaremos as instruções para criar uma nova senha. Confira também o spam.', 'ok');
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
  if (el.verSenha) {
    el.verSenha.addEventListener('click', () => {
      const mostrar = el.senha.type === 'password';
      el.senha.type = mostrar ? 'text' : 'password';
      el.verSenha.setAttribute('aria-pressed', String(mostrar));
      el.verSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      el.verSenha.querySelector('.olho-aberto').style.display = mostrar ? 'none' : '';
      el.verSenha.querySelector('.olho-fechado').style.display = mostrar ? '' : 'none';
      el.senha.focus();
    });
  }

  // aviso de Caps Lock (só aparece enquanto a pessoa digita a senha)
  if (el.avisoCaps) {
    const checarCaps = (e) => {
      if (typeof e.getModifierState !== 'function') return;
      el.avisoCaps.hidden = !e.getModifierState('CapsLock');
    };
    el.senha.addEventListener('keydown', checarCaps);
    el.senha.addEventListener('keyup', checarCaps);
    el.senha.addEventListener('blur', () => { el.avisoCaps.hidden = true; });
  }

  // "Acessar" (cabeçalho): rola até o cartão e foca o primeiro campo útil
  if (el.abrirAcesso) {
    el.abrirAcesso.addEventListener('click', (e) => {
      if (sessaoAtiva()) {
        e.preventDefault();
        try { sessionStorage.removeItem(CHAVE_SESSAO); } catch { /* ignora */ }
        atualizarMenu();
        return;
      }
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
  desenharPrevia();
  definirModo('login');
  atualizarMenu();

  // volta da expiração por inatividade (ver menu.js)
  try {
    if (sessionStorage.getItem('conecta:expirou')) {
      sessionStorage.removeItem('conecta:expirou');
      mostrarErro('Sua sessão foi encerrada por inatividade. Entre novamente para continuar.', 'info');
    }
  } catch { /* ignora */ }

  // voltar pelo histórico (cache) também reflete o estado da sessão
  window.addEventListener('pageshow', () => { if (!voltarAoPainel()) atualizarMenu(); });
})();
