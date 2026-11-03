/* Conecta Saúde – cadastro de laboratório (html/fablab.html)
   Cuida de: lista de impressoras (adicionar, editar, remover), validações,
   progresso das 3 etapas, envio do cadastro e telas de sucesso.
   Depende de js/comum.js. */
(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  if (!$('#parque') || !window.CS) return;
  const { dados, esc } = window.CS;

  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  const NOMES_ETAPA = ['Dados do laboratório', 'Equipamentos e capacidade', 'Requisitos e termo'];
  const TECNOLOGIAS = { FDM: 'FDM (filamento)', SLA: 'SLA (resina)' };

  const el = {
    razao: $('#razao'),
    cnpj: $('#cnpj'),
    cidade: $('#cidade'),
    seloDados: $('#selo-dados'),
    parque: $('#parque'),
    vazio: $('#vazio'),
    aceite: $('#aceite'),
    enviar: $('#enviar-cadastro'),
    erroCadastro: $('#erro-cadastro'),
    // formulário "primeira impressora" (dentro da etapa 2)
    inline: { marca: $('#marca'), modelo: $('#modelo'), volume: $('#volume') },
    salvarInline: $('#salvar-imp'),
    erroInline: $('#erro-imp-inline'),
    // gaveta "adicionar / editar impressora"
    gaveta: { marca: $('#outra-marca'), modelo: $('#outra-modelo'), volume: $('#outra-volume') },
    salvarGaveta: $('#add-imp'),
    erroGaveta: $('#erro-imp'),
    tituloGaveta: $('#titulo-nova-imp'),
  };

  let impressoras = [];
  let editandoId = null;
  let ocupado = false;

  /* ---------- validações ---------- */
  function cnpjValido(texto) {
    const n = texto.replace(/\D/g, '');
    if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false;
    const digito = (base) => {
      let soma = 0;
      let peso = base.length - 7;
      for (let i = 0; i < base.length; i++) {
        soma += Number(base[i]) * peso--;
        if (peso < 2) peso = 9;
      }
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    return digito(n.slice(0, 12)) === Number(n[12]) && digito(n.slice(0, 13)) === Number(n[13]);
  }
  function formatarCnpj(texto) {
    const n = texto.replace(/\D/g, '').slice(0, 14);
    return n
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  function cidadeUfValida(texto) {
    const m = /^(.{2,}?)\s*\/\s*([A-Za-z]{2})$/.exec(texto.trim());
    return !!m && UFS.includes(m[2].toUpperCase());
  }

  // regras dos 3 campos da etapa 1 -> mensagem ('' quando válido)
  const REGRAS_DADOS = {
    razao: () => (el.razao.value.trim().length < 3 ? 'Informe a razão social.' : ''),
    cnpj: () => (cnpjValido(el.cnpj.value) ? '' : 'Digite um CNPJ válido, com 14 números.'),
    cidade: () => (cidadeUfValida(el.cidade.value) ? '' : 'Use o formato Cidade / UF, como São Caetano do Sul / SP.'),
  };
  const dadosValidos = () => Object.values(REGRAS_DADOS).every((regra) => !regra());

  function mostrarErroCampo(campo, msg) {
    let aviso = campo.parentElement.querySelector('.campo-erro');
    if (!aviso) {
      aviso = document.createElement('small');
      aviso.className = 'campo-erro';
      aviso.id = `erro-${campo.id}`;
      campo.setAttribute('aria-describedby', aviso.id);
      campo.insertAdjacentElement('afterend', aviso);
    }
    aviso.textContent = msg;
    aviso.hidden = !msg;
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  const validarCampo = (nome) => {
    const msg = REGRAS_DADOS[nome]();
    mostrarErroCampo(el[nome], msg);
    return msg;
  };

  const requisitosMarcados = () => $$('input[name="req"]').every((c) => c.checked);

  function erroImpressora(imp) {
    if (imp.marca.trim().length < 2) return 'Informe a marca da impressora.';
    if (!imp.modelo.trim()) return 'Informe o modelo da impressora.';
    if (!CS.volumeValido(imp.volume)) return 'Informe o volume com as 3 medidas, como 330 × 240 × 300 mm.';
    if (!imp.materiais.length) return 'Selecione ao menos um material.';
    return '';
  }

  /* ---------- progresso das etapas ---------- */
  function atualizarProgresso() {
    const feitas = [dadosValidos(), impressoras.length > 0, requisitosMarcados() && el.aceite.checked];
    const atual = feitas.findIndex((f) => !f);          // -1 quando está tudo pronto
    const posicao = atual === -1 ? 2 : atual;
    const total = feitas.filter(Boolean).length;
    const percentual = Math.round((total / 3) * 100);

    $('#etapa-texto').textContent = `Etapa ${posicao + 1} de 3`;
    $('#etapa-nome').textContent = NOMES_ETAPA[posicao];
    $('#etapa-percentual').textContent = `${percentual}%`;
    $('#barra').style.width = `${percentual}%`;
    $('.barra').setAttribute('aria-valuenow', String(percentual));

    $$('.etapas li').forEach((li, i) => {
      li.classList.toggle('feito', feitas[i]);
      li.classList.toggle('atual', i === atual);
      li.querySelector('.etapa-bolinha').textContent = feitas[i] ? '✓' : String(i + 1);
      const link = li.querySelector('a');
      if (i === atual) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
    });
    el.seloDados.hidden = !feitas[0];
  }

  /* ---------- lista de impressoras ---------- */
  function itemHTML(i) {
    const nome = esc(`${i.marca} ${i.modelo}`);
    const detalhes = [i.tecnologia, i.volume, (i.materiais || []).join(', ')].filter(Boolean).map(esc).join(' · ');
    return `
      <li class="impressora" data-id="${esc(i.id)}">
        <span class="form-icone mini">3D</span>
        <div>
          <b>${nome}</b>
          <small>${detalhes}</small>
        </div>
        <a href="#nova-impressora" class="impressora-editar" aria-label="Editar a impressora ${nome}">Editar</a>
        <button type="button" class="remover" aria-label="Remover a impressora ${nome}">×</button>
      </li>`;
  }
  function desenharParque() {
    el.parque.innerHTML = impressoras.map(itemHTML).join('');
    el.vazio.hidden = impressoras.length > 0;
    atualizarProgresso();
  }
  async function carregarImpressoras() {
    el.parque.innerHTML = '<li class="pedido-aviso">Carregando impressoras…</li>';
    el.vazio.hidden = true;
    const r = await dados.listarImpressoras();
    if (!r.ok) {
      el.parque.innerHTML = `<li class="pedido-aviso pedido-aviso-erro">${esc(r.erro)} <button type="button" class="link-tentar" id="tentar-de-novo">Tentar de novo</button></li>`;
      $('#tentar-de-novo').addEventListener('click', carregarImpressoras);
      return;
    }
    impressoras = r.impressoras;
    desenharParque();
  }

  /* ---------- leitura e preenchimento dos formulários de impressora ---------- */
  const marcados = (nome) => $$(`input[name="${nome}"]:checked`).map((c) => c.value);
  const lerInline = () => ({
    marca: el.inline.marca.value,
    modelo: el.inline.modelo.value,
    tecnologia: $('input[name="tec"]:checked').value,
    volume: el.inline.volume.value.trim(),
    materiais: marcados('mat'),
  });
  const lerGaveta = () => ({
    marca: el.gaveta.marca.value,
    modelo: el.gaveta.modelo.value,
    tecnologia: $('input[name="outra-tec"]:checked').value,
    volume: el.gaveta.volume.value.trim(),
    materiais: marcados('outra-mat'),
  });

  function preencherGaveta(imp) {
    el.gaveta.marca.value = imp ? imp.marca : '';
    el.gaveta.modelo.value = imp ? imp.modelo : '';
    el.gaveta.volume.value = imp ? imp.volume : '';
    $$('input[name="outra-tec"]').forEach((r) => { r.checked = r.value === (imp ? imp.tecnologia : 'FDM'); });
    $$('input[name="outra-mat"]').forEach((c) => { c.checked = !!imp && imp.materiais.includes(c.value); });
    el.erroGaveta.textContent = '';
    el.tituloGaveta.textContent = imp ? 'Editar impressora' : 'Adicionar impressora';
    el.salvarGaveta.textContent = imp ? 'Salvar alterações' : 'Salvar impressora';
  }
  function limparInline() {
    el.inline.marca.value = '';
    el.inline.modelo.value = '';
    el.inline.volume.value = '';
    $$('input[name="tec"]').forEach((r) => { r.checked = r.value === 'FDM'; });
    $$('input[name="mat"]').forEach((c) => { c.checked = c.value === 'PLA'; });
  }

  /* ---------- salvar impressora ---------- */
  async function salvarImpressora(origem) {
    if (ocupado) return;
    const gaveta = origem === 'gaveta';
    const campoErro = gaveta ? el.erroGaveta : el.erroInline;
    const botao = gaveta ? el.salvarGaveta : el.salvarInline;
    const imp = gaveta ? lerGaveta() : lerInline();
    const edicao = gaveta && editandoId;
    if (edicao) imp.id = editandoId;

    campoErro.textContent = '';
    const erro = erroImpressora(imp);
    if (erro) { campoErro.textContent = erro; return; }

    ocupado = true;
    botao.disabled = true;
    const textoOriginal = botao.textContent;
    botao.textContent = 'Salvando…';
    const r = await dados.salvarImpressora(imp);
    ocupado = false;
    botao.disabled = false;
    botao.textContent = textoOriginal;

    if (!r.ok) { campoErro.textContent = r.erro; return; }

    const salva = r.impressora;
    if (edicao) {
      impressoras = impressoras.map((i) => (i.id === salva.id ? salva : i));
    } else {
      impressoras.push(salva);
    }
    desenharParque();
    el.erroCadastro.textContent = '';

    if (gaveta) location.hash = '#equipamento'; else limparInline();
    editandoId = null;

    CS.mostrarSucesso({
      titulo: edicao ? 'Impressora atualizada!' : 'Impressora cadastrada!',
      texto: edicao
        ? 'As alterações foram salvas.'
        : 'A impressora já faz parte do parque do seu laboratório e poderá ser combinada com os pedidos.',
      resumo: [
        ['Impressora', `${salva.marca} ${salva.modelo}`],
        ['Tecnologia', TECNOLOGIAS[salva.tecnologia] || salva.tecnologia],
        ['Volume útil', salva.volume || 'Não informado'],
        ['Materiais', (salva.materiais || []).join(', ')],
        ['Impressoras no laboratório', String(impressoras.length)],
      ],
      acoes: [
        { rotulo: 'Cadastrar outra impressora', tipo: 'principal',
          aoClicar: () => { editandoId = null; preencherGaveta(null); location.hash = '#nova-impressora'; } },
        { rotulo: 'Continuar o cadastro', tipo: 'contorno' },
      ],
    });
  }

  async function remover(id) {
    const imp = impressoras.find((i) => i.id === id);
    if (!imp) return;
    if (!window.confirm(`Remover a impressora ${imp.marca} ${imp.modelo}?`)) return;
    const r = await dados.removerImpressora(id);
    if (!r.ok) { window.alert(r.erro); return; }
    impressoras = impressoras.filter((i) => i.id !== id);
    desenharParque();
  }

  /* ---------- enviar cadastro ---------- */
  function problemasCadastro() {
    const lista = [];
    Object.keys(REGRAS_DADOS).forEach((nome) => {
      const msg = validarCampo(nome);
      if (msg) lista.push({ campo: el[nome], msg });
    });
    if (!impressoras.length) {
      lista.push({ campo: el.inline.marca, msg: 'Cadastre ao menos uma impressora: preencha os campos e clique em "Salvar impressora".' });
    }
    const faltando = $$('input[name="req"]').find((c) => !c.checked);
    if (faltando) lista.push({ campo: faltando, msg: 'Confirme todos os requisitos do laboratório.' });
    if (!el.aceite.checked) lista.push({ campo: el.aceite, msg: 'Aceite os Termos de Uso e a Política de Privacidade para continuar.' });
    return lista;
  }

  async function enviarCadastro() {
    if (ocupado) return;
    el.erroCadastro.textContent = '';
    const lista = problemasCadastro();
    if (lista.length) {
      el.erroCadastro.textContent = lista[0].msg;
      lista[0].campo.scrollIntoView({ block: 'center' });
      lista[0].campo.focus({ preventScroll: true });
      return;
    }

    ocupado = true;
    el.enviar.disabled = true;
    const textoOriginal = el.enviar.textContent;
    el.enviar.textContent = 'Enviando…';
    const r = await dados.enviarCadastroLab({
      razaoSocial: el.razao.value.trim(),
      cnpj: el.cnpj.value,
      cidadeUf: el.cidade.value.trim(),
      requisitos: $$('input[name="req"]').map((c) => c.value),
      termoAceito: true,
    });
    ocupado = false;
    el.enviar.disabled = false;
    el.enviar.textContent = textoOriginal;

    if (!r.ok) { el.erroCadastro.textContent = r.erro; return; }

    CS.mostrarSucesso({
      titulo: 'Cadastro enviado!',
      texto: 'Os dados do laboratório e das impressoras foram enviados. Eles serão usados para combinar o seu laboratório com os pedidos.',
      resumo: [
        ['Razão social', el.razao.value.trim()],
        ['CNPJ', el.cnpj.value],
        ['Cidade / UF', el.cidade.value.trim()],
        ['Impressoras cadastradas', impressoras.map((i) => `${i.marca} ${i.modelo}`).join(', ')],
      ],
      acoes: [
        { rotulo: 'Voltar ao cadastro', tipo: 'principal' },
      ],
    });
  }

  /* ---------- eventos ---------- */
  el.cnpj.addEventListener('input', () => { el.cnpj.value = formatarCnpj(el.cnpj.value); });

  Object.keys(REGRAS_DADOS).forEach((nome) => {
    el[nome].addEventListener('blur', () => { validarCampo(nome); atualizarProgresso(); });
    el[nome].addEventListener('input', () => {
      if (el[nome].getAttribute('aria-invalid') === 'true') validarCampo(nome);
      el.erroCadastro.textContent = '';
      atualizarProgresso();
    });
  });
  $$('input[name="req"]').forEach((c) => c.addEventListener('change', () => { el.erroCadastro.textContent = ''; atualizarProgresso(); }));
  el.aceite.addEventListener('change', () => { el.erroCadastro.textContent = ''; atualizarProgresso(); });

  [el.inline.marca, el.inline.modelo, el.inline.volume].forEach((c) => c.addEventListener('input', () => { el.erroInline.textContent = ''; }));
  [el.gaveta.marca, el.gaveta.modelo, el.gaveta.volume].forEach((c) => c.addEventListener('input', () => { el.erroGaveta.textContent = ''; }));

  el.salvarInline.addEventListener('click', () => salvarImpressora('inline'));
  el.salvarGaveta.addEventListener('click', () => salvarImpressora('gaveta'));
  $('#form-impressora').addEventListener('submit', (e) => { e.preventDefault(); salvarImpressora('gaveta'); });
  el.enviar.addEventListener('click', enviarCadastro);

  // "Editar" e "×" da lista (os itens são recriados, então usamos delegação)
  el.parque.addEventListener('click', (e) => {
    const item = e.target.closest('.impressora');
    if (!item) return;
    if (e.target.closest('.impressora-editar')) {
      editandoId = item.dataset.id;
      preencherGaveta(impressoras.find((i) => i.id === editandoId));
    } else if (e.target.closest('.remover')) {
      remover(item.dataset.id);
    }
  });
  // "Adicionar outra impressora" abre a gaveta vazia
  $('.botao-adicionar').addEventListener('click', () => { editandoId = null; preencherGaveta(null); });

  window.addEventListener('hashchange', () => {
    if (location.hash === '#nova-impressora') {
      setTimeout(() => el.gaveta.marca.focus(), 60);
    } else {
      editandoId = null;
      el.erroGaveta.textContent = '';
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && location.hash === '#nova-impressora') location.hash = '#equipamento';
  });

  // se a pessoa entrou com cidade/UF no cadastro, já sugere no formulário
  const s = CS.sessao();
  if (s && s.cidade && s.estado && !el.cidade.value) el.cidade.value = `${s.cidade} / ${s.estado}`;

  carregarImpressoras();
  atualizarProgresso();
})();
