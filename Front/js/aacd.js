/* Conecta Saúde – página Pedidos AACD (html/aacd.html)
   Cuida de: lista de pedidos, resumo, filtro por status, formulário
   "Registrar necessidade" com envio do modelo .stl e tela de sucesso.
   Depende de js/comum.js. */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const form = $('#formPedido');
  if (!form || !window.CS) return;
  const { dados, esc, data, tamanho, mascararPaciente } = window.CS;

  const el = {
    lista: $('#pedidos'),
    vazio: $('#vazio'),
    filtro: $('#filtro'),
    atualizado: $('#atualizado'),
    busca: $('#busca'),
    ordem: $('#ordem'),
    exportar: $('#exportar'),
    envioBox: $('#envioProgresso'),
    envioBarra: $('#envioBarra'),
    envioTexto: $('#envioTexto'),
    nTodos: $('#nTodos'),
    nAbertos: $('#nAbertos'),
    nImpressao: $('#nImpressao'),
    nEntregues: $('#nEntregues'),
    paciente: $('#paciente'),
    peca: $('#peca'),
    material: $('#material'),
    prazo: $('#prazo'),
    medidas: $('#medidas'),
    arquivo: $('#arquivoStl'),
    lab: $('#lab'),
    erro: $('#erro'),
    sucesso: $('#sucesso'),
    botao: form.querySelector('button[type="submit"]'),
  };
  const TEXTO_BOTAO = el.botao.textContent;

  let pedidos = [];
  let enviando = false;

  /* ---------- lista e resumo ---------- */
  const doisDigitos = (n) => String(n).padStart(2, '0');

  function itemHTML(p) {
    const codigo = esc(p.codigo);
    return `
      <li class="pedido">
        <div class="pedido-info">
          <div class="pedido-linha1">
            <span class="selo ${CS.classeStatus(p)}">${esc(CS.rotuloStatus(p))}</span>
            <span class="pedido-codigo">${codigo}</span>
          </div>
          <h3>${esc(p.tipoPeca)}</h3>
          <p>Paciente ${esc(CS.mascararPaciente(p.codigoPaciente))} • ${esc(p.material || 'Material a definir')} • Prazo: ${esc(data(p.prazo))}</p>
        </div>
        <ol class="progresso" aria-label="Etapas do pedido">${CS.progressoHTML(p)}</ol>
        <a href="pedido.html?id=${encodeURIComponent(p.id)}" class="pedido-seta" aria-label="Ver detalhes do pedido ${codigo}">›</a>
      </li>`;
  }

  /* Regras dos cartões (todas calculadas a partir dos pedidos carregados):
     - Aguardando aceite: registrados e não recusados. "Requer atenção" = parados há mais de 3 dias.
     - Em produção: aceitos ou em impressão. "Atrasados" = prazo já vencido.
     - Entregues: só os entregues nos últimos 90 dias.  */
  const DIA = 24 * 60 * 60 * 1000;
  const DIAS_ATENCAO = 3;
  const DIAS_ENTREGUES = 90;
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  // Quando a peça foi entregue: 1º item do histórico (demo) ou última atualização (Backend)
  const entregueEm = (p) => new Date((p.historico && p.historico[0] && p.historico[0].data) || p.atualizadoEm || p.criadoEm);
  const prazoVencido = (p) => !!p.prazo && p.prazo < CS.hojeISO();

  function atualizarResumo() {
    const agora = new Date();
    const doMes = pedidos.filter((p) => {
      const d = new Date(p.criadoEm);
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    }).length;

    const aguardando = pedidos.filter((p) => !p.recusado && p.status === 0);
    const paradosHa = aguardando.filter((p) => agora - new Date(p.criadoEm) > DIAS_ATENCAO * DIA).length;
    const emProducao = pedidos.filter((p) => !p.recusado && (p.status === 1 || p.status === 2));
    const atrasados = emProducao.filter(prazoVencido).length;
    const entregues = pedidos.filter((p) => !p.recusado && p.status === 3 && agora - entregueEm(p) <= DIAS_ENTREGUES * DIA);

    const sub = (no) => no.nextElementSibling;
    el.nTodos.textContent = doisDigitos(pedidos.length);
    sub(el.nTodos).textContent = `+${doMes} este mês`;
    el.nAbertos.textContent = doisDigitos(aguardando.length);
    sub(el.nAbertos).textContent = paradosHa
      ? `${plural(paradosHa, 'pedido parado', 'pedidos parados')} há mais de ${DIAS_ATENCAO} dias`
      : 'Nenhum pedido parado';
    el.nImpressao.textContent = doisDigitos(emProducao.length);
    sub(el.nImpressao).textContent = atrasados
      ? `${plural(atrasados, 'com prazo vencido', 'com prazo vencido')}`
      : 'Dentro do prazo';
    el.nEntregues.textContent = doisDigitos(entregues.length);
    sub(el.nEntregues).textContent = `Nos últimos ${DIAS_ENTREGUES} dias`;
  }

  /* ---------- filtro, busca e ordem ---------- */
  const semAcento = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const ORDENS = {
    recentes: (a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)),
    antigos: (a, b) => String(a.criadoEm).localeCompare(String(b.criadoEm)),
    prazo: (a, b) => (a.prazo || '9999').localeCompare(b.prazo || '9999'),
    codigo: (a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true }),
  };

  function filtrados() {
    const f = el.filtro.value;
    const termo = semAcento(el.busca.value.trim());
    return pedidos
      .filter((p) => {
        if (f === 'recusado') return !!p.recusado;
        if (f === 'todos') return true;
        return !p.recusado && String(p.status) === f;   // recusado não entra em "Registrado"
      })
      .filter((p) => !termo || semAcento(`${p.codigo} ${p.tipoPeca}`).includes(termo))
      .sort(ORDENS[el.ordem.value] || ORDENS.recentes);
  }

  function desenharLista() {
    const visiveis = filtrados();
    el.lista.innerHTML = visiveis.map(itemHTML).join('');
    el.vazio.textContent = pedidos.length === 0
      ? 'Nenhum pedido ainda. Clique em "Registrar necessidade" para criar o primeiro.'
      : 'Nenhum pedido encontrado com esses filtros.';
    el.vazio.hidden = visiveis.length > 0;
    el.exportar.disabled = visiveis.length === 0;
  }

  /* ---------- exportar CSV (respeita filtro, busca e ordem) ---------- */
  // Evita que o Excel execute células que começam com = + - @ (injeção de fórmula)
  const celula = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return `"${s.replace(/"/g, '""')}"`;
  };

  function exportarCSV() {
    const linhas = filtrados();
    if (!linhas.length) return;
    const cab = ['Código', 'Status', 'Tipo de peça', 'Paciente', 'Material', 'Urgência', 'Laboratório', 'Registrado em', 'Prazo'];
    const corpo = linhas.map((p) => [
      p.codigo, CS.rotuloStatus(p), p.tipoPeca, mascararPaciente(p.codigoPaciente),
      p.material || '', p.urgencia, p.laboratorio || '', data(p.criadoEm), data(p.prazo),
    ]);
    // ";" e BOM para abrir direto no Excel em português
    const texto = '\ufeff' + [cab, ...corpo].map((l) => l.map(celula).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-conecta-saude-${CS.hojeISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function carregar() {
    el.lista.setAttribute('aria-busy', 'true');
    el.vazio.hidden = true;
    el.lista.innerHTML = '<li class="pedido-aviso">Carregando pedidos…</li>';
    const r = await dados.listarPedidos();
    el.lista.removeAttribute('aria-busy');
    if (!r.ok) {
      el.lista.innerHTML = `<li class="pedido-aviso pedido-aviso-erro">${esc(r.erro)} <button type="button" class="link-tentar" id="tentar-de-novo">Tentar de novo</button></li>`;
      $('#tentar-de-novo').addEventListener('click', carregar);
      return;
    }
    pedidos = r.pedidos;
    atualizarResumo();
    desenharLista();
    if (el.atualizado) {
      const h = new Date();
      el.atualizado.textContent = `Atualizado às ${doisDigitos(h.getHours())}:${doisDigitos(h.getMinutes())}`;
    }
  }

  /* ---------- formulário ---------- */
  function mostrarErro(msg) {
    el.sucesso.textContent = '';
    el.erro.textContent = msg || '';
  }
  function marcar(campo, invalido) {
    campo.setAttribute('aria-invalid', invalido ? 'true' : 'false');
  }
  function limparMarcas() {
    [el.paciente, el.peca, el.prazo, el.arquivo].forEach((c) => marcar(c, false));
  }

  // Devolve [{ campo, msg }] na ordem em que aparecem no formulário
  async function problemas() {
    const lista = [];
    const paciente = el.paciente.value.trim();
    if (!paciente) {
      lista.push({ campo: el.paciente, msg: 'Informe o código do paciente.' });
    } else if (!/\d/.test(paciente) || paciente.length > 20) {
      lista.push({ campo: el.paciente, msg: 'Use apenas o código do paciente (ex.: PAC-4821), sem o nome.' });
    }
    if (el.peca.value.trim().length < 3) {
      lista.push({ campo: el.peca, msg: 'Informe o tipo de peça.' });
    }
    if (!el.prazo.value) {
      lista.push({ campo: el.prazo, msg: 'Escolha o prazo necessário.' });
    } else if (el.prazo.value < CS.hojeISO()) {
      lista.push({ campo: el.prazo, msg: 'O prazo não pode ser uma data que já passou.' });
    }
    const erroStl = await CS.validarStl(el.arquivo.files[0]);
    if (erroStl) lista.push({ campo: el.arquivo, msg: erroStl });
    return lista;
  }

  function mostrarProgresso(enviados, total) {
    const pct = total ? Math.min(100, Math.round((enviados / total) * 100)) : 0;
    el.envioBox.hidden = false;
    el.envioBarra.value = pct;
    el.envioTexto.textContent = pct >= 100
      ? 'Arquivo enviado. Salvando o pedido…'
      : `Enviando… ${pct}% (${tamanho(enviados)} de ${tamanho(total)})`;
  }
  function esconderProgresso() {
    el.envioBox.hidden = true;
    el.envioBarra.value = 0;
  }

  function fecharGaveta() {
    location.hash = '#';
  }

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;
    mostrarErro('');
    limparMarcas();

    const lista = await problemas();
    if (lista.length) {
      lista.forEach((p) => marcar(p.campo, true));
      mostrarErro(lista[0].msg);
      lista[0].campo.focus();
      return;
    }

    enviando = true;
    el.botao.disabled = true;
    el.botao.textContent = 'Enviando…';
    mostrarProgresso(0, 1);

    const arquivo = el.arquivo.files[0];
    const r = await dados.criarPedido({
      codigoPaciente: el.paciente.value.trim(),
      tipoPeca: el.peca.value.trim(),
      material: el.material.value,
      prazo: el.prazo.value,
      medidas: el.medidas.value.trim(),
      urgencia: form.querySelector('input[name="urgencia"]:checked').value,
      laboratorio: el.lab.value,
    }, arquivo, mostrarProgresso);

    enviando = false;
    esconderProgresso();
    el.botao.disabled = false;
    el.botao.textContent = TEXTO_BOTAO;

    if (!r.ok) { mostrarErro(r.erro); return; }

    const p = r.pedido;
    form.reset();
    mostrarErro('');
    fecharGaveta();
    carregar();

    CS.mostrarSucesso({
      titulo: 'Pedido registrado!',
      texto: 'A necessidade foi enviada com o modelo 3D anexado. Você acompanha cada etapa pelo painel.',
      modelo: arquivo,
      resumo: [
        ['Código do pedido', p.codigo],
        ['Tipo de peça', p.tipoPeca],
        ['Arquivo do modelo', `${arquivo.name} (${tamanho(arquivo.size)})`],
        ['Material', p.material || 'A definir'],
        ['Prazo', data(p.prazo)],
        ['Urgência', p.urgencia],
        ['Laboratório', p.laboratorio || 'Qualquer laboratório compatível'],
      ],
      acoes: [
        { rotulo: 'Ver detalhes do pedido', tipo: 'principal', manter: true,
          aoClicar: () => { location.href = 'pedido.html?id=' + encodeURIComponent(p.id); } },
        { rotulo: 'Registrar outro pedido', tipo: 'contorno',
          aoClicar: () => { location.hash = '#registrar'; setTimeout(() => el.paciente.focus(), 60); } },
        { rotulo: 'Voltar aos pedidos', tipo: 'contorno' },
      ],
    });
  }

  /* ---------- eventos ---------- */
  el.filtro.addEventListener('change', desenharLista);
  el.ordem.addEventListener('change', desenharLista);
  el.busca.addEventListener('input', desenharLista);
  el.exportar.addEventListener('click', exportarCSV);
  form.addEventListener('submit', enviar);

  [el.paciente, el.peca, el.prazo].forEach((c) =>
    c.addEventListener('input', () => { marcar(c, false); mostrarErro(''); })
  );

  // valida o arquivo assim que ele é escolhido
  el.arquivo.addEventListener('change', async () => {
    marcar(el.arquivo, false);
    const arquivo = el.arquivo.files[0];
    if (!arquivo) { mostrarErro(''); return; }
    const erro = await CS.validarStl(arquivo);
    if (erro) {
      marcar(el.arquivo, true);
      mostrarErro(erro);
    } else {
      mostrarErro('');
      el.sucesso.textContent = `Arquivo pronto: ${arquivo.name} (${tamanho(arquivo.size)}).`;
    }
  });

  // limpa mensagens ao abrir/fechar a gaveta
  window.addEventListener('hashchange', () => {
    if (location.hash === '#registrar') {
      el.prazo.min = CS.hojeISO();
    } else {
      mostrarErro('');
      limparMarcas();
    }
  });

  // Esc fecha a gaveta
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && location.hash === '#registrar') fecharGaveta();
  });

  el.prazo.min = CS.hojeISO();
  carregar();
  window.addEventListener('pageshow', (e) => { if (e.persisted) carregar(); });
})();
