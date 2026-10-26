/* Conecta Saúde – botão do canto nas páginas internas.
   O menu é fixo em cada página (Início + a página do perfil).
   Aqui só o botão muda: "Sair" com sessão (limpa e volta ao início) ou "Acessar". */
(() => {
  'use strict';
  const CHAVE_SESSAO = 'conecta:sessao';
  const botao = document.querySelector('header .botao-acessar');
  if (!botao) return;

  const temSessao = () => {
    try { return !!sessionStorage.getItem(CHAVE_SESSAO); } catch { return false; }
  };

  const atualizar = () => { botao.textContent = temSessao() ? 'Sair' : 'Acessar'; };

  botao.addEventListener('click', (e) => {
    if (!temSessao()) return; // sem sessão: segue o link para a área de acesso
    e.preventDefault();
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch { /* ignora */ }
    window.location.href = '../index.html';
  });

  atualizar();
  window.addEventListener('pageshow', atualizar);
})();
