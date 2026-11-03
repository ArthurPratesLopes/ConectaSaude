/* Conecta Saúde – detalhe do pedido (html/pedido.html?id=...)
   Preenche a página com os dados do pedido escolhido na lista,
   inclusive o arquivo .stl (download e visualização 3D).
   Depende de js/comum.js. */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  if (!$('#detalhe-codigo') || !window.CS) return;
  const { dados, esc, data, dataHora, mascararPaciente } = window.CS;

  const principal = $('main.painel');
  const id = new URLSearchParams(location.search).get('id');

  // Data de um timestamp no fuso do navegador ("02 jun 2026")
  const dia = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    const p = (n) => String(n).padStart(2, '0');
    return data(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
  };

  function mostrarFalha(msg) {
    principal.innerHTML = `
      <a href="aacd.html" class="voltar">‹ Voltar para os pedidos</a>
      <section class="detalhe-cartao">
        <h2>Não foi possível abrir o pedido</h2>
        <p class="detalhe-aviso">${esc(msg)}</p>
      </section>`;
  }

  // Quando o pedido não guarda o histórico (vem do Backend), monta a partir das datas
  function historicoDe(p) {
    if (Array.isArray(p.historico) && p.historico.length) return p.historico;
    const lista = [{ data: p.criadoEm, titulo: 'Necessidade registrada', texto: 'O pedido foi registrado pela AACD.' }];
    if (p.recusado) {
      lista.unshift({ data: p.atualizadoEm || p.criadoEm, titulo: 'Pedido recusado', texto: 'O laboratório não pôde atender este pedido.' });
    } else if (p.status > 0) {
      const textos = [
        '',
        'O laboratório aceitou o pedido e confirmou o material.',
        'O laboratório iniciou a impressão da peça.',
        'A peça foi entregue à AACD.',
      ];
      const titulos = ['', 'Pedido aceito', 'Impressão iniciada', 'Peça entregue'];
      lista.unshift({ data: p.atualizadoEm || p.criadoEm, titulo: titulos[p.status], texto: textos[p.status] });
    }
    return lista;
  }

  function preencher(p) {
    document.title = `${p.codigo} | Conecta Saúde`;

    const selo = $('#detalhe-selo');
    selo.className = `selo ${CS.classeStatus(p)}`;
    selo.textContent = CS.rotuloStatus(p);
    $('#detalhe-codigo').textContent = p.codigo;
    $('#detalhe-titulo').textContent = p.tipoPeca;
    $('#detalhe-datas').textContent = `Registrado em ${dia(p.criadoEm)} • Prazo: ${data(p.prazo)}`;

    $('main .detalhe-cartao .progresso').innerHTML = CS.progressoHTML(p);

    $('#dado-paciente').textContent = mascararPaciente(p.codigoPaciente);
    $('#dado-peca').textContent = p.tipoPeca;
    $('#dado-material').textContent = p.material || 'A definir';
    $('#dado-prazo').textContent = data(p.prazo);
    $('#dado-urgencia').textContent = p.urgencia;
    $('#dado-lab').textContent = p.laboratorio || 'A definir';
    $('#dado-medidas').textContent = p.medidas || 'Sem observações.';

    // arquivo .stl
    const link = $('#dado-arquivo');
    $('#dado-arquivo-nome').textContent = p.arquivoNome || 'modelo.stl';
    if (p.arquivoUrl) {
      link.href = p.arquivoUrl;
      link.setAttribute('download', p.arquivoNome || 'modelo.stl');
    } else {
      link.removeAttribute('href');
      link.removeAttribute('download');
      link.setAttribute('aria-disabled', 'true');
      link.classList.add('arquivo-indisponivel');
      link.querySelector('.arquivo-baixar').textContent = 'Indisponível';
    }

    // visualização 3D
    const secaoModelo = $('#secao-modelo');
    if (p.arquivoUrl) {
      secaoModelo.hidden = false;
      CS.mostrarModelo($('#visualizador-stl'), p.arquivoUrl);
    } else {
      secaoModelo.hidden = true;
    }

    // histórico (mais recente primeiro)
    $('#historico').innerHTML = historicoDe(p).map((h) => `
      <li>
        <span class="historico-data">${esc(dataHora(h.data))}</span>
        <strong>${esc(h.titulo)}</strong>
        <p>${esc(h.texto)}</p>
      </li>`).join('');
  }

  (async () => {
    if (!id) { mostrarFalha('Nenhum pedido foi escolhido. Volte à lista e clique no pedido que quer ver.'); return; }
    const r = await dados.obterPedido(id);
    if (!r.ok) { mostrarFalha(r.erro); return; }
    preencher(r.pedido);
  })();
})();
