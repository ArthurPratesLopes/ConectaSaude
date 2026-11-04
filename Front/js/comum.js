/* Conecta Saúde – recursos compartilhados das páginas internas.
   Fica disponível como window.CS e é usado por aacd.js, pedido.js e fablab.js.
   Cuida de: acesso aos dados (API do Backend ou modo demonstração local),
   validação do arquivo .stl, visualizador 3D e a tela de sucesso. */
(() => {
  'use strict';

  /* ---------- configuração ---------- */
  const BASE = 'http://localhost:5000';      // Backend (server.js)
  const API = BASE + '/api';
  const CHAVE_SESSAO = 'conecta:sessao';     // mesma chave do home.js
  const CHAVE_MOCK = 'conecta:mock';          // persistente; mantém o mock estável sem depender do BACKEND
  const LIMITE_STL = 50 * 1024 * 1024;       // 50 MB (igual ao Backend)
  const LIMITE_STL_DEMO = 1.5 * 1024 * 1024; // acima disso o demo guarda só o nome

  function mockAtivo() {
    try {
      const url = new URL(window.location.href);
      const valorParam = url.searchParams.get('mock');
      if (valorParam === '1' || valorParam === 'true' || valorParam === 'on') {
        localStorage.setItem(CHAVE_MOCK, '1');
        return true;
      }
      if (valorParam === '0' || valorParam === 'false' || valorParam === 'off') {
        localStorage.setItem(CHAVE_MOCK, '0');
        return false;
      }
      const valor = localStorage.getItem(CHAVE_MOCK);
      return valor === '1' || valor === 'true' || valor === 'on';
    } catch {
      return false;
    }
  }

  function setMockAtivo(ativado) {
    try {
      const url = new URL(window.location.href);
      if (ativado) {
        url.searchParams.set('mock', '1');
        localStorage.setItem(CHAVE_MOCK, '1');
      } else {
        url.searchParams.delete('mock');
        localStorage.setItem(CHAVE_MOCK, '0');
      }
      window.history.replaceState({}, '', url);
    } catch {
      // fallback silencioso quando localStorage não estiver disponível
    }
  }

  /* ---------- utilidades ---------- */
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const dois = (n) => String(n).padStart(2, '0');

  // "2026-06-18" (ou ISO completo) -> "18 jun 2026", sem deslocar por fuso horário
  function data(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${m[3]} ${MESES[+m[2] - 1]} ${m[1]}` : '—';
  }
  // timestamp -> "12 jun 2026 • 14:20"
  function dataHora(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return `${dois(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()} • ${dois(d.getHours())}:${dois(d.getMinutes())}`;
  }
  function tamanho(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  }
  const hojeISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
  };
  // mostra só os 4 últimos caracteres do código do paciente (privacidade)
  const mascararPaciente = (c) => '••••' + String(c || '').replace(/[^A-Za-z0-9]/g, '').slice(-4);

  /* ---------- sessão ---------- */
  const sessao = () => {
    try { return JSON.parse(sessionStorage.getItem(CHAVE_SESSAO)); } catch { return null; }
  };
  // Sem login real (sessão de demonstração ou página aberta direto) os dados
  // ficam no navegador. Com login real, tudo passa pela API, salvo quando o
  // mock está explícito e persistente via ?mock=1 ou localStorage.
  const usaLocal = () => {
    const s = sessao();
    return mockAtivo() || !s || s.demo === true;
  };

  /* ---------- armazenamento local (modo demonstração) ---------- */
  const LS = {
    ler(chave, padrao) {
      try {
        const v = localStorage.getItem('conecta:' + chave);
        return v ? JSON.parse(v) : padrao;
      } catch { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem('conecta:' + chave, JSON.stringify(valor)); return true; } catch { return false; }
    },
  };

  const PEDIDOS_EXEMPLO = [
    {
      id: 'demo-0142', codigo: 'CS-2026-0142', status: 2, tipoPeca: 'Órtese de punho',
      codigoPaciente: 'PAC-4721', material: 'PLA médico', prazo: '2026-06-18', urgencia: 'Normal',
      laboratorio: 'FabLab da Mauá', arquivoNome: 'ortese-punho.stl', arquivoUrl: '',
      medidas: 'Punho com 15 cm de circunferência, tolerância de 1 mm. Acabamento macio nas bordas.',
      criadoEm: '2026-06-02T16:05:00',
      historico: [
        { data: '2026-06-12T14:20:00', titulo: 'Impressão iniciada', texto: 'O FabLab da Mauá iniciou a impressão da peça.' },
        { data: '2026-06-05T09:40:00', titulo: 'Pedido aceito', texto: 'O FabLab da Mauá aceitou o pedido e confirmou o material.' },
        { data: '2026-06-02T16:05:00', titulo: 'Necessidade registrada', texto: 'O pedido foi registrado pela AACD.' },
      ],
    },
    {
      id: 'demo-0138', codigo: 'CS-2026-0138', status: 1, tipoPeca: 'Adaptador de talher',
      codigoPaciente: 'PAC-0913', material: 'PETG', prazo: '2026-06-22', urgencia: 'Prioritário',
      laboratorio: 'FabLab Poli USP', arquivoNome: 'adaptador-talher.stl', arquivoUrl: '',
      medidas: 'Cabo com 22 mm de diâmetro para encaixe na mão direita.',
      criadoEm: '2026-05-30T10:15:00',
      historico: [
        { data: '2026-06-03T11:00:00', titulo: 'Pedido aceito', texto: 'O FabLab Poli USP aceitou o pedido e confirmou o material.' },
        { data: '2026-05-30T10:15:00', titulo: 'Necessidade registrada', texto: 'O pedido foi registrado pela AACD.' },
      ],
    },
    {
      id: 'demo-0129', codigo: 'CS-2026-0129', status: 3, tipoPeca: 'Prótese de mão',
      codigoPaciente: 'PAC-6280', material: 'TPU + PLA', prazo: '2026-06-10', urgencia: 'Normal',
      laboratorio: 'FabLab da Mauá', arquivoNome: 'protese-mao.stl', arquivoUrl: '',
      medidas: 'Prótese infantil com dedos articulados. Preenchimento de 30%.',
      criadoEm: '2026-05-18T09:00:00',
      historico: [
        { data: '2026-06-09T16:30:00', titulo: 'Peça entregue', texto: 'A peça foi entregue à AACD.' },
        { data: '2026-05-25T13:10:00', titulo: 'Impressão iniciada', texto: 'O FabLab da Mauá iniciou a impressão da peça.' },
        { data: '2026-05-20T08:45:00', titulo: 'Pedido aceito', texto: 'O FabLab da Mauá aceitou o pedido e confirmou o material.' },
        { data: '2026-05-18T09:00:00', titulo: 'Necessidade registrada', texto: 'O pedido foi registrado pela AACD.' },
      ],
    },
  ];
  const IMPRESSORAS_EXEMPLO = [
    { id: 'demo-imp-1', marca: 'Ultimaker', modelo: 'S3', tecnologia: 'FDM', volume: '230 × 190 × 200 mm', materiais: ['PLA', 'PETG'] },
  ];

  function pedidosLocais() {
    let lista = LS.ler('demo:pedidos', null);
    if (!lista) { lista = PEDIDOS_EXEMPLO; LS.gravar('demo:pedidos', lista); }
    return lista;
  }
  function impressorasLocais() {
    let lista = LS.ler('demo:impressoras', null);
    if (!lista) { lista = IMPRESSORAS_EXEMPLO; LS.gravar('demo:impressoras', lista); }
    return lista;
  }

  /* ---------- API ---------- */
  // Token do login (JWT) enviado em toda chamada à API
  const cabecalhoAuth = () => {
    const s = sessao();
    return s && s.token ? { Authorization: 'Bearer ' + s.token } : {};
  };
  // Token vencido ou inválido: encerra a sessão e volta para o login
  function sessaoExpirada() {
    try {
      sessionStorage.removeItem(CHAVE_SESSAO);
      sessionStorage.setItem('conecta:expirou', '1');
    } catch { /* ignora */ }
    window.location.replace('../index.html');
  }

  // Envio com barra de progresso (fetch não informa o progresso do upload)
  function enviarComProgresso(metodo, url, formData, aoProgresso) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open(metodo, url);
      Object.entries(cabecalhoAuth()).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) aoProgresso(e.loaded, e.total);
      };
      xhr.upload.onload = () => aoProgresso(1, 1); // bytes enviados; falta só a resposta do servidor
      xhr.onload = () => {
        if (xhr.status === 401) { sessaoExpirada(); return; }
        let dados = {};
        try { dados = JSON.parse(xhr.responseText); } catch { /* resposta sem JSON */ }
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, dados });
      };
      xhr.onerror = () => resolve({ ok: false, offline: true, dados: { erro: 'Não foi possível falar com o servidor. Confira se o Backend está rodando.' } });
      xhr.ontimeout = xhr.onerror;
      xhr.send(formData);
    });
  }

  async function pedirServidor(metodo, rota, corpo, formData, aoProgresso) {
    if (formData && aoProgresso) return enviarComProgresso(metodo, API + rota, formData, aoProgresso);
    try {
      const opcoes = { method: metodo, headers: { ...cabecalhoAuth() } };
      if (formData) {
        opcoes.body = formData; // o navegador define o Content-Type do multipart
      } else if (corpo) {
        opcoes.headers['Content-Type'] = 'application/json';
        opcoes.body = JSON.stringify(corpo);
      }
      const res = await fetch(API + rota, opcoes);
      if (res.status === 401) { sessaoExpirada(); return { ok: false, dados: { erro: 'Sessão expirada.' } }; }
      const dados = await res.json().catch(() => ({}));
      return { ok: res.ok, dados };
    } catch {
      return { ok: false, offline: true, dados: { erro: 'Não foi possível falar com o servidor. Confira se o Backend está rodando.' } };
    }
  }

  // Banco (Models/order.js) -> formato usado nas telas
  // "recusado" mantém a etapa 0 só para o desenho do andamento; quem conta ou filtra
  // deve olhar p.recusado (ver aacd.js) e nunca tratar status 0 como "aguardando aceite".
  const STATUS_BANCO = { analise: 0, aceito: 1, producao: 2, pronto: 3, recusado: 0 };
  function pedidoDoServidor(o) {
    return {
      id: o._id,
      codigo: o.codigo || 'CS-' + String(o._id).slice(-6).toUpperCase(),
      status: STATUS_BANCO[o.status] ?? 0,
      recusado: o.status === 'recusado',
      tipoPeca: o.tipoPeca || 'Peça',
      codigoPaciente: o.codigoPaciente || '',
      material: o.material || '',
      prazo: o.prazo ? String(o.prazo).slice(0, 10) : '',
      urgencia: o.urgencia || 'Normal',
      laboratorio: (o.fornecedorId && o.fornecedorId.nomeInstituicao) || o.laboratorioPreferido || '',
      medidas: o.observacoesTecnicas || '',
      arquivoNome: o.arquivoNome || String(o.arquivoUrl || '').split('/').pop(),
      arquivoUrl: o.arquivoUrl ? BASE + o.arquivoUrl : '',
      criadoEm: o.createdAt,
      atualizadoEm: o.updatedAt,
    };
  }
  function impressoraDoServidor(i) {
    const v = i.volumeConstrucao || {};
    return {
      id: i._id,
      marca: i.marca,
      modelo: i.modelo,
      tecnologia: i.tecnologia,
      volume: v.larguraX && v.profundidadeY && v.alturaZ ? `${v.larguraX} × ${v.profundidadeY} × ${v.alturaZ} mm` : '',
      materiais: i.materiaisCompativeis || [],
    };
  }
  // "330 × 240 × 300 mm" -> números largura, profundidade, altura
  function numerosDoVolume(texto) {
    return (String(texto || '').replace(',', '.').match(/\d+(?:\.\d+)?/g) || []).map(Number);
  }
  function volumeParaServidor(texto) {
    const n = numerosDoVolume(texto);
    return n.length >= 3 ? { larguraX: n[0], profundidadeY: n[1], alturaZ: n[2] } : undefined;
  }
  // vazio é aceito; se preencher, precisa ter as 3 medidas
  const volumeValido = (texto) => {
    if (!String(texto || '').trim()) return true;
    const n = numerosDoVolume(texto);
    return n.length >= 3 && n.slice(0, 3).every((x) => x > 0);
  };

  const dados = {
    /* --- pedidos --- */
    async listarPedidos() {
      if (usaLocal()) {
        const lista = pedidosLocais().slice().sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
        return { ok: true, pedidos: lista };
      }
      const r = await pedirServidor('GET', '/orders?clienteId=' + encodeURIComponent(sessao().id));
      if (!r.ok) return { ok: false, erro: r.dados.erro || 'Não foi possível carregar os pedidos.' };
      return { ok: true, pedidos: (r.dados.pedidos || []).map(pedidoDoServidor) };
    },

    async obterPedido(id) {
      if (usaLocal()) {
        const p = pedidosLocais().find((x) => x.id === id);
        return p ? { ok: true, pedido: p } : { ok: false, erro: 'Pedido não encontrado.' };
      }
      const r = await pedirServidor('GET', '/orders/' + encodeURIComponent(id));
      if (!r.ok) return { ok: false, erro: r.dados.erro || 'Pedido não encontrado.' };
      return { ok: true, pedido: pedidoDoServidor(r.dados.pedido) };
    },

    // campos: { codigoPaciente, tipoPeca, material, prazo, medidas, urgencia, laboratorio }
    // aoProgresso(enviados, total) é opcional; só é chamado no envio real ao servidor
    async criarPedido(campos, arquivo, aoProgresso) {
      if (usaLocal()) {
        const lista = pedidosLocais();
        const ano = new Date().getFullYear();
        const maior = lista
          .filter((p) => p.codigo.startsWith(`CS-${ano}-`))
          .reduce((m, p) => Math.max(m, parseInt(p.codigo.slice(-4), 10) || 0), 0);
        const agora = new Date().toISOString();
        const pedido = {
          id: 'demo-' + Date.now(),
          codigo: `CS-${ano}-${String(maior + 1).padStart(4, '0')}`,
          status: 0,
          tipoPeca: campos.tipoPeca,
          codigoPaciente: campos.codigoPaciente,
          material: campos.material,
          prazo: campos.prazo,
          urgencia: campos.urgencia,
          laboratorio: campos.laboratorio,
          medidas: campos.medidas,
          arquivoNome: arquivo.name,
          arquivoUrl: arquivo.size <= LIMITE_STL_DEMO ? await lerComoDataUrl(arquivo) : '',
          criadoEm: agora,
          historico: [{ data: agora, titulo: 'Necessidade registrada', texto: 'O pedido foi registrado pela AACD.' }],
        };
        lista.push(pedido);
        if (!LS.gravar('demo:pedidos', lista)) {
          // sem espaço no navegador: guarda o pedido sem o conteúdo do arquivo
          pedido.arquivoUrl = '';
          LS.gravar('demo:pedidos', lista);
        }
        return { ok: true, pedido };
      }

      const form = new FormData();
      form.append('clienteId', sessao().id);
      form.append('codigoPaciente', campos.codigoPaciente);
      form.append('tipoPeca', campos.tipoPeca);
      form.append('prazo', campos.prazo);
      form.append('urgencia', campos.urgencia);
      if (campos.material) form.append('material', campos.material);
      if (campos.laboratorio) form.append('laboratorioPreferido', campos.laboratorio);
      if (campos.medidas) form.append('observacoesTecnicas', campos.medidas);
      form.append('arquivoStl', arquivo);
      const r = await pedirServidor('POST', '/orders', null, form, aoProgresso);
      if (!r.ok) return { ok: false, erro: r.dados.erro || 'Não foi possível registrar o pedido.' };
      return { ok: true, pedido: pedidoDoServidor(r.dados.pedido) };
    },

    /* --- impressoras --- */
    async listarImpressoras() {
      if (usaLocal()) return { ok: true, impressoras: impressorasLocais() };
      const r = await pedirServidor('GET', '/printers?fornecedorId=' + encodeURIComponent(sessao().id));
      if (!r.ok) return { ok: false, erro: r.dados.erro || 'Não foi possível carregar as impressoras.' };
      return { ok: true, impressoras: (r.dados.impressoras || []).map(impressoraDoServidor) };
    },

    // imp: { id?, marca, modelo, tecnologia, volume, materiais[] }  (com id = edição)
    async salvarImpressora(imp) {
      if (usaLocal()) {
        const lista = impressorasLocais();
        let salva;
        if (imp.id) {
          const i = lista.findIndex((x) => x.id === imp.id);
          if (i < 0) return { ok: false, erro: 'Impressora não encontrada.' };
          salva = lista[i] = { ...lista[i], ...imp };
        } else {
          salva = { ...imp, id: 'demo-imp-' + Date.now() };
          lista.push(salva);
        }
        LS.gravar('demo:impressoras', lista);
        return { ok: true, impressora: salva };
      }
      const corpo = {
        fornecedorId: sessao().id,
        marca: imp.marca,
        modelo: imp.modelo,
        tecnologia: imp.tecnologia,
        volumeConstrucao: volumeParaServidor(imp.volume),
        materiaisCompativeis: imp.materiais,
      };
      const r = imp.id
        ? await pedirServidor('PUT', '/printers/' + encodeURIComponent(imp.id), corpo)
        : await pedirServidor('POST', '/printers', corpo);
      if (!r.ok) return { ok: false, erro: r.dados.erro || 'Não foi possível salvar a impressora.' };
      return { ok: true, impressora: impressoraDoServidor(r.dados.impressora) };
    },

    async removerImpressora(id) {
      if (usaLocal()) {
        LS.gravar('demo:impressoras', impressorasLocais().filter((x) => x.id !== id));
        return { ok: true };
      }
      const r = await pedirServidor('DELETE', '/printers/' + encodeURIComponent(id));
      return r.ok ? { ok: true } : { ok: false, erro: r.dados.erro || 'Não foi possível remover a impressora.' };
    },

    /* --- cadastro do laboratório (etapas 1 e 3) --- */
    async enviarCadastroLab(corpo) {
      if (usaLocal()) {
        LS.gravar('demo:laboratorio', { ...corpo, enviadoEm: new Date().toISOString() });
        return { ok: true };
      }
      const r = await pedirServidor('PUT', '/users/' + encodeURIComponent(sessao().id) + '/laboratorio', corpo);
      return r.ok ? { ok: true } : { ok: false, erro: r.dados.erro || 'Não foi possível enviar o cadastro.' };
    },
  };

  /* ---------- arquivo .stl ---------- */
  function lerComoDataUrl(arquivo) {
    return new Promise((resolve) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result));
      leitor.onerror = () => resolve('');
      leitor.readAsDataURL(arquivo);
    });
  }

  // Devolve uma mensagem de erro, ou '' quando o arquivo é um STL aceitável.
  async function validarStl(arquivo) {
    if (!arquivo) return 'Selecione o arquivo .stl da peça.';
    if (!/\.stl$/i.test(arquivo.name)) return 'O arquivo precisa estar no formato .stl.';
    if (arquivo.size === 0) return 'O arquivo está vazio.';
    if (arquivo.size > LIMITE_STL) return 'O arquivo passa de 50 MB. Reduza a malha e tente de novo.';
    try {
      const inicio = await arquivo.slice(0, 84).arrayBuffer();
      const texto = new TextDecoder('ascii').decode(inicio.slice(0, 5)).toLowerCase();
      if (texto === 'solid') return '';                      // STL em texto (ou binário com cabeçalho "solid")
      if (inicio.byteLength < 84) return 'O arquivo não parece um STL válido.';
      const triangulos = new DataView(inicio).getUint32(80, true);
      return 84 + triangulos * 50 === arquivo.size ? '' : 'O arquivo não parece um STL válido.';
    } catch {
      return '';
    }
  }

  /* ---------- visualizador 3D (Three.js, carregado só quando necessário) ---------- */
  let promessaThree = null;
  function carregarScript(src) {
    return new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = () => falha(new Error('Falha ao carregar ' + src));
      document.head.appendChild(s);
    });
  }
  function carregarThree() {
    if (!promessaThree) {
      promessaThree = (async () => {
        await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        await Promise.all([
          carregarScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js'),
          carregarScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'),
        ]);
      })();
      promessaThree.catch(() => { promessaThree = null; }); // permite tentar de novo depois
    }
    return promessaThree;
  }

  // fonte: File/Blob ou endereço (http ou data:). Devolve { ok, destruir }.
  async function mostrarModelo(container, fonte) {
    container.textContent = 'Carregando modelo 3D…';
    container.classList.remove('visualizador-erro');
    let renderer = null;
    let quadro = 0;
    let observador = null;
    let geometria = null;
    const destruir = () => {
      cancelAnimationFrame(quadro);
      if (observador) observador.disconnect();
      if (geometria) geometria.dispose();
      if (renderer) { renderer.dispose(); renderer.domElement.remove(); }
    };
    try {
      let buffer;
      if (fonte instanceof Blob) {
        buffer = await fonte.arrayBuffer();
      } else {
        const r = await fetch(fonte);
        if (!r.ok) throw new Error('arquivo indisponível');
        buffer = await r.arrayBuffer();
      }
      await carregarThree();
      const THREE = window.THREE;

      geometria = new THREE.STLLoader().parse(buffer);
      if (!geometria.attributes.position || geometria.attributes.position.count === 0) throw new Error('modelo vazio');
      geometria.computeVertexNormals(); // muitos STL vêm com normais zeradas e ficariam pretos
      geometria.center();
      geometria.computeBoundingSphere();
      const raio = geometria.boundingSphere.radius || 1;

      container.textContent = '';
      const largura = container.clientWidth || 400;
      const altura = container.clientHeight || 300;
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(largura, altura);
      container.appendChild(renderer.domElement);

      const cena = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, largura / altura, raio / 100, raio * 100);
      camera.position.set(raio * 1.6, raio * 1.2, raio * 2.2);
      cena.add(camera);
      cena.add(new THREE.AmbientLight(0xffffff, 0.65));
      const luz = new THREE.DirectionalLight(0xffffff, 0.8); // presa à câmera: o modelo nunca fica no escuro
      luz.position.set(1, 1, 2);
      camera.add(luz);

      const malha = new THREE.Mesh(
        geometria,
        new THREE.MeshStandardMaterial({ color: 0x006767, roughness: 0.45, metalness: 0.15 })
      );
      malha.rotation.x = -Math.PI / 2; // STL costuma ser Z para cima; Three.js usa Y
      cena.add(malha);

      const controles = new THREE.OrbitControls(camera, renderer.domElement);
      controles.enableDamping = true;
      controles.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      controles.autoRotateSpeed = 2;

      const desenhar = () => {
        if (!document.body.contains(container)) { destruir(); return; }
        controles.update();
        renderer.render(cena, camera);
        quadro = requestAnimationFrame(desenhar);
      };
      desenhar();

      if ('ResizeObserver' in window) {
        observador = new ResizeObserver(() => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        });
        observador.observe(container);
      }
      return { ok: true, destruir };
    } catch {
      destruir();
      container.classList.add('visualizador-erro');
      container.textContent = 'Pré-visualização 3D indisponível.';
      return { ok: false, destruir: () => {} };
    }
  }

  /* ---------- tela de sucesso ----------
     opcoes: {
       titulo, texto,
       resumo: [[rótulo, valor], ...],
       modelo: File | endereço   (mostra o STL em 3D)
       acoes: [{ rotulo, href?, aoClicar?, tipo: 'principal' | 'contorno', manter? }],
       aoFechar: () => {}
     } */
  function mostrarSucesso(opcoes) {
    const anterior = document.activeElement;
    const tela = document.createElement('div');
    tela.className = 'tela-sucesso';
    tela.setAttribute('role', 'dialog');
    tela.setAttribute('aria-modal', 'true');
    tela.setAttribute('aria-labelledby', 'sucesso-titulo');

    const resumo = (opcoes.resumo || []).filter(([, v]) => v);
    tela.innerHTML = `
      <div class="sucesso-caixa">
        <button type="button" class="sucesso-fechar" aria-label="Fechar">×</button>
        <div class="sucesso-selo" aria-hidden="true">
          <svg viewBox="0 0 52 52" focusable="false">
            <circle class="sucesso-circulo" cx="26" cy="26" r="24"></circle>
            <path class="sucesso-check" d="M15 27l8 8 15-17"></path>
          </svg>
        </div>
        <h2 id="sucesso-titulo" tabindex="-1">${esc(opcoes.titulo)}</h2>
        <p class="sucesso-texto">${esc(opcoes.texto)}</p>
        ${opcoes.modelo ? '<div class="visualizador sucesso-visualizador" aria-label="Pré-visualização 3D do modelo"></div>' : ''}
        ${resumo.length ? `<dl class="sucesso-resumo">${resumo.map(([r, v]) => `<div><dt>${esc(r)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        <div class="sucesso-acoes"></div>
      </div>`;

    let destruirModelo = () => {};
    let fechada = false;
    const fechar = () => {
      if (fechada) return;
      fechada = true;
      document.removeEventListener('keydown', teclado);
      destruirModelo();
      tela.remove();
      document.body.classList.remove('sem-rolagem');
      if (anterior && document.body.contains(anterior)) anterior.focus({ preventScroll: true });
      if (opcoes.aoFechar) opcoes.aoFechar();
    };

    const area = tela.querySelector('.sucesso-acoes');
    (opcoes.acoes || []).forEach((a) => {
      const classe = a.tipo === 'contorno' ? 'botao-contorno' : 'botao-principal';
      const no = document.createElement(a.href ? 'a' : 'button');
      no.className = classe;
      no.textContent = a.rotulo;
      if (a.href) no.href = a.href; else no.type = 'button';
      no.addEventListener('click', () => {
        if (!a.manter) fechar();   // fecha primeiro; a ação (navegar, abrir gaveta) vem depois
        if (a.aoClicar) a.aoClicar();
      });
      area.appendChild(no);
    });

    // Esc fecha; Tab fica preso dentro da tela
    function teclado(e) {
      if (e.key === 'Escape') { fechar(); return; }
      if (e.key !== 'Tab') return;
      const foco = [...tela.querySelectorAll('button, a[href]')].filter((n) => !n.disabled);
      if (!foco.length) return;
      const primeiro = foco[0];
      const ultimo = foco[foco.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === tela.querySelector('h2'))) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primeiro.focus();
      }
    }
    document.addEventListener('keydown', teclado);
    tela.querySelector('.sucesso-fechar').addEventListener('click', fechar);
    tela.addEventListener('click', (e) => { if (e.target === tela) fechar(); });

    document.body.appendChild(tela);
    document.body.classList.add('sem-rolagem');
    tela.querySelector('h2').focus({ preventScroll: true });

    if (opcoes.modelo) {
      mostrarModelo(tela.querySelector('.sucesso-visualizador'), opcoes.modelo).then((r) => {
        if (fechada) r.destruir(); else destruirModelo = r.destruir;
      });
    }
    return { fechar };
  }

  /* ---------- rótulos dos status ---------- */
  const ETAPAS = ['Registrado', 'Aceito', 'Impressão', 'Entregue'];
  const CLASSE_SELO = ['selo-registrado', 'selo-aceito', 'selo-impressao', 'selo-entregue'];
  const rotuloStatus = (p) => (p.recusado ? 'Recusado' : ETAPAS[p.status]);
  const classeStatus = (p) => (p.recusado ? 'selo-recusado' : CLASSE_SELO[p.status]);
  const progressoHTML = (p) => ETAPAS.map((nome, i) => {
    const feito = !p.recusado && i <= p.status;
    return `<li${feito ? ' class="feito"' : ''}><span class="bolinha">${feito ? '✓' : i + 1}</span><span class="etapa">${nome}</span></li>`;
  }).join('');

  window.CS = {
    BASE, esc, data, dataHora, tamanho, hojeISO, mascararPaciente,
    sessao, usaLocal, mockAtivo, setMockAtivo, dados,
    validarStl, volumeValido, mostrarModelo, mostrarSucesso,
    ETAPAS, rotuloStatus, classeStatus, progressoHTML,
  };
})();
