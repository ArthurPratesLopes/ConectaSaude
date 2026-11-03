/* Conecta Saúde – cabeçalho das páginas internas.
   - A tela inicial só é alcançada pelo botão "Sair" (não há link de "Início"
     nem o logo leva para lá).
   - Sem sessão ativa, a página interna redireciona para a tela inicial.
   - Mostra, ao lado de "Sair", quem está logado: empresa e e-mail. */
(() => {
  'use strict';
  const CHAVE_SESSAO = 'conecta:sessao';
  const INICIO = '../index.html';

  const lerSessao = () => {
    try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
  };

  // Páginas internas só existem com sessão ativa (vale também ao voltar pelo histórico).
  const exigirSessao = () => {
    if (lerSessao()) return true;
    window.location.replace(INICIO);
    return false;
  };
  if (!exigirSessao()) return;
  window.addEventListener('pageshow', exigirSessao);

  const botao = document.querySelector('header .botao-acessar');
  if (!botao) return;

  const PALAVRAS_LIGACAO = ['da', 'de', 'do', 'das', 'dos', 'e'];
  const iniciais = (texto) => {
    const p = (String(texto || '').match(/\p{L}+/gu) || []).filter((w) => !PALAVRAS_LIGACAO.includes(w.toLowerCase()));
    return ((p[0] ? p[0][0] : '') + (p[1] ? p[1][0] : '')).toUpperCase() || '?';
  };
  const div = (classe, texto) => {
    const el = document.createElement('div');
    el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  };

  // logo + nome da empresa em cima + e-mail embaixo
  function montarConta() {
    const s = lerSessao();
    const empresa = (s && s.nomeInstituicao) || 'Empresa não informada';
    const email = (s && s.email) || 'E-mail não informado';

    const avatar = div('usuario-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    const usarIniciais = () => { avatar.textContent = iniciais(empresa); };
    if (s && s.logo) {
      const img = document.createElement('img');
      img.alt = '';
      img.addEventListener('error', () => { img.remove(); usarIniciais(); });
      img.src = s.logo;
      avatar.appendChild(img);
    } else {
      usarIniciais();
    }

    const chip = div('usuario-logado');
    chip.setAttribute('role', 'group');
    chip.setAttribute('aria-label', `Logado como ${empresa}, e-mail ${email}`);
    chip.title = `${empresa} • ${email}`;
    const textos = div('usuario-textos');
    textos.append(div('usuario-nome', empresa), div('usuario-email', email));
    chip.append(avatar, textos);

    const conta = div('conta');
    botao.parentNode.insertBefore(conta, botao);
    conta.append(chip, botao);
  }

  botao.textContent = 'Sair';
  botao.setAttribute('href', INICIO);
  montarConta();

  /* ---------- encerra a sessão por inatividade ----------
     Importante em computadores compartilhados (hospital, laboratório).
     Após LIMITE_MIN sem uso aparece um aviso de AVISO_SEG segundos; sem resposta, a sessão acaba. */
  const LIMITE_MIN = 15;
  const AVISO_SEG = 60;
  let timerAviso = 0;
  let timerFim = 0;
  let contagem = 0;
  let caixa = null;
  let ultimoToque = 0;

  function encerrarPorInatividade() {
    try {
      sessionStorage.removeItem(CHAVE_SESSAO);
      sessionStorage.setItem('conecta:expirou', '1');
    } catch { /* ignora */ }
    window.location.replace(INICIO);
  }

  function fecharAviso() {
    clearInterval(contagem);
    if (caixa) { caixa.remove(); caixa = null; }
  }

  function mostrarAviso() {
    let restante = AVISO_SEG;
    caixa = document.createElement('div');
    caixa.className = 'tela-sucesso';
    caixa.setAttribute('role', 'alertdialog');
    caixa.setAttribute('aria-modal', 'true');
    caixa.setAttribute('aria-labelledby', 'inativo-titulo');
    caixa.innerHTML = `
      <div class="sucesso-caixa">
        <h2 id="inativo-titulo" tabindex="-1">Você ainda está aí?</h2>
        <p class="sucesso-texto">Por segurança, sua sessão será encerrada em <b id="inativo-seg">${restante}</b> segundos por falta de uso.</p>
        <div class="sucesso-acoes">
          <button type="button" class="botao-principal" id="inativo-continuar">Continuar conectado</button>
          <button type="button" class="botao-contorno" id="inativo-sair">Sair agora</button>
        </div>
      </div>`;
    document.body.appendChild(caixa);
    caixa.querySelector('#inativo-continuar').addEventListener('click', () => { fecharAviso(); reiniciar(); });
    caixa.querySelector('#inativo-sair').addEventListener('click', encerrarPorInatividade);
    caixa.querySelector('#inativo-continuar').focus();
    contagem = setInterval(() => {
      restante -= 1;
      const no = caixa && caixa.querySelector('#inativo-seg');
      if (no) no.textContent = restante;
    }, 1000);
    timerFim = setTimeout(encerrarPorInatividade, AVISO_SEG * 1000);
  }

  function reiniciar() {
    clearTimeout(timerAviso);
    clearTimeout(timerFim);
    timerAviso = setTimeout(mostrarAviso, (LIMITE_MIN * 60 - AVISO_SEG) * 1000);
  }

  // qualquer uso reinicia a contagem (no máximo 1x por segundo), exceto com o aviso aberto
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) =>
    document.addEventListener(ev, () => {
      if (caixa) return;
      const agora = Date.now();
      if (agora - ultimoToque < 1000) return;
      ultimoToque = agora;
      reiniciar();
    }, { passive: true, capture: true })
  );
  reiniciar();

  botao.addEventListener('click', (e) => {
    e.preventDefault();
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch { /* ignora */ }
    // replace: a página interna sai do histórico e o "voltar" não a reabre
    window.location.replace(INICIO);
  });
})();
