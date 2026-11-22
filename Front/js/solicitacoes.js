(() => {
    const plataforma = window.ConectaSaude;
    const $ = plataforma.$;
    const ROTULOS_SITUACAO = { analise: 'Nova', aceito: 'Aceita', producao: 'Em produção', pronto: 'Pronta para entrega' };
    const atualizarSituacaoPedido = (id, situacao) =>
        plataforma.fetchAutenticado(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: situacao }) });

    function iniciarConversa(id) {
        if (!$('conversa-mensagens')) return;
        const mostrar = () => plataforma.fetchAutenticado('/messages/' + id)
            .then((resposta) => resposta.json())
            .then(({ mensagens }) => {
                $('conversa-mensagens').innerHTML = mensagens.map((mensagem) =>
                    `<div class="mensagem mensagem-${mensagem.remetenteId._id === plataforma.lerSessao().usuario.id ? 'enviada' : 'recebida'}">
                        <span class="mensagem-autor">${plataforma.escaparHtml(mensagem.remetenteId.nomeInstituicao)}</span>
                        <p>${plataforma.escaparHtml(mensagem.texto)}</p>
                    </div>`
                ).join('') || '<p>Nenhuma mensagem ainda.</p>';
                $('conversa-mensagens').scrollTop = $('conversa-mensagens').scrollHeight;
            }).catch(() => {});
        $('conversa-enviar').addEventListener('click', async () => {
            const texto = $('conversa-texto').value.trim();
            if (!texto) return;
            await plataforma.fetchAutenticado('/messages', { method: 'POST', body: JSON.stringify({ orderId: id, texto }) });
            $('conversa-texto').value = '';
            mostrar();
        });
        mostrar();
        setInterval(mostrar, 5000);
    }

    function iniciarSolicitacoes() {
        if (!$('busca-solicitacoes')) return;
        let pedidos = [];
        const desenhar = () => {
            const busca = $('busca-solicitacoes').value.toLowerCase();
            document.querySelectorAll('.coluna').forEach((coluna, indice) => {
                const situacao = Object.keys(ROTULOS_SITUACAO)[indice];
                const lista = pedidos.filter((pedido) =>
                    pedido.status === situacao && (pedido.codigo + ' ' + pedido.peca).toLowerCase().includes(busca)
                );
                coluna.querySelector('.coluna-contador').textContent = lista.length;
                coluna.querySelector('.coluna-corpo').innerHTML = lista.map((pedido) => `<article class="cartao-quadro">
                    <div class="cartao-quadro-topo">
                        <div><h3>${plataforma.escaparHtml(pedido.peca)}</h3><p class="cartao-quadro-linha">${pedido.codigo}</p></div>
                        <a href="detalhe_solicitacao.html?id=${pedido._id}" class="cartao-quadro-seta">›</a>
                    </div>
                    <p class="cartao-quadro-prazo">Prazo: ${plataforma.formatarData(pedido.prazo)}</p>
                    <label class="cartao-quadro-situacao">
                        <small>Atualizar situação</small>
                        <select data-id="${pedido._id}">
                            ${Object.entries(ROTULOS_SITUACAO).map(([valor, rotulo]) =>
                                `<option value="${valor}"${valor === pedido.status ? ' selected' : ''}>${rotulo}</option>`
                            ).join('')}
                        </select>
                    </label>
                    <div class="cartao-quadro-acoes">
                        <a href="detalhe_solicitacao.html?id=${pedido._id}">Ver detalhes</a>
                        <button type="button" data-recusar="${pedido._id}">Cancelar</button>
                    </div>
                </article>`).join('') || '<div class="quadro-vazio"><span>Nenhuma solicitação</span></div>';
            });
        };
        const carregar = () => plataforma.fetchAutenticado('/orders')
            .then((resposta) => resposta.json())
            .then((dados) => { pedidos = dados.pedidos; desenhar(); });
        document.querySelector('.quadro').addEventListener('change', (evento) =>
            atualizarSituacaoPedido(evento.target.dataset.id, evento.target.value).then(carregar)
        );
        document.querySelector('.quadro').addEventListener('click', (evento) => {
            if (evento.target.dataset.recusar) atualizarSituacaoPedido(evento.target.dataset.recusar, 'recusado').then(carregar);
        });
        $('busca-solicitacoes').addEventListener('input', desenhar);
        carregar();
    }

    function iniciarDetalheSolicitacao() {
        if (!$('sol-codigo')) return;
        const id = new URLSearchParams(location.search).get('id');
        const carregar = () => plataforma.fetchAutenticado('/orders/' + id)
            .then((resposta) => resposta.json())
            .then(({ pedido }) => {
                const cliente = pedido.clienteId.nomeInstituicao;
                const [classe] = plataforma.ROTULOS_SITUACAO[pedido.status];
                $('sol-selo').className = 'selo selo-' + classe;
                Object.entries({
                    'sol-selo': ROTULOS_SITUACAO[pedido.status] || plataforma.ROTULOS_SITUACAO[pedido.status][1],
                    'sol-codigo': 'Solicitação ' + pedido.codigo,
                    'titulo-dados': pedido.peca,
                    'sol-recebida': `Recebida de ${cliente} · ${plataforma.formatarData(pedido.createdAt)}`,
                    'sol-paciente': pedido.paciente,
                    'sol-inst': cliente,
                    'sol-peca': pedido.peca,
                    'sol-material': pedido.material || '—',
                    'sol-prazo': plataforma.formatarData(pedido.prazo),
                    'sol-urgencia': plataforma.ROTULOS_URGENCIA[pedido.urgencia] || pedido.urgencia,
                    'sol-lab': pedido.fornecedorId ? pedido.fornecedorId.nomeInstituicao : 'Aguardando aceite',
                    'sol-obs': pedido.observacoesTecnicas || '—',
                    'arquivo-nome': pedido.arquivoUrl.split('/').pop(),
                    'conversa-sub': `${pedido.codigo} · Conversa com ${cliente}`
                }).forEach(([chave, texto]) => { $(chave).textContent = texto; });
                $('arquivo-baixar').href = plataforma.ENDERECO_API.replace('/api', '') + pedido.arquivoUrl;
                $('situacao-atual').value = pedido.status;
            }).catch(() => { $('titulo-dados').textContent = 'Solicitação não encontrada'; });
        $('situacao-atual').addEventListener('change', (evento) => atualizarSituacaoPedido(id, evento.target.value).then(carregar));
        $('recusar-solicitacao').addEventListener('click', () => atualizarSituacaoPedido(id, 'recusado').then(carregar));
        carregar();
        iniciarConversa(id);
    }

    function volumeDe(texto) {
        const numeros = String(texto).match(/\d+(?:[,.]\d+)?/g) || [];
        return {
            larguraX: Number((numeros[0] || 0).toString().replace(',', '.')),
            profundidadeY: Number((numeros[1] || 0).toString().replace(',', '.')),
            alturaZ: Number((numeros[2] || 0).toString().replace(',', '.'))
        };
    }

    function iniciarLaboratorio() {
        if (!$('parque')) return;
        let impressoras = [];
        const desenhar = () => {
            $('impressoras-contagem').textContent = `Impressoras cadastradas (${impressoras.length})`;
            $('parque').innerHTML = impressoras.map((impressora) => `<li class="impressora" data-id="${impressora._id}">
                <span class="caixa-icone caixa-icone-mini"><img class="icone" src="../img/impressora.png" alt=""></span>
                <div><b>${plataforma.escaparHtml(impressora.marca)} ${plataforma.escaparHtml(impressora.modelo)}</b>
                <small>${plataforma.escaparHtml(impressora.tecnologia)}${impressora.volumeConstrucao ? ` · ${impressora.volumeConstrucao.larguraX || ''} × ${impressora.volumeConstrucao.profundidadeY || ''} × ${impressora.volumeConstrucao.alturaZ || ''} mm` : ''}</small>
                <small>${(impressora.materiaisCompativeis || []).map(plataforma.escaparHtml).join(', ') || 'Sem materiais'} · <strong>${plataforma.escaparHtml(impressora.disponibilidade)}</strong></small></div>
                <button type="button" class="remover" data-remover="${impressora._id}" aria-label="Remover">×</button>
            </li>`).join('') || '<li class="pedido-aviso">Nenhuma impressora cadastrada.</li>';
        };
        const carregar = () => plataforma.fetchAutenticado('/laboratorios/me')
            .then((resposta) => resposta.json())
            .then((dados) => {
                const laboratorio = dados.laboratorio;
                $('razao').value = laboratorio.nomeInstituicao || '';
                $('cnpj').value = laboratorio.cnpj || '';
                $('responsavel').value = laboratorio.responsavel || '';
                $('telefone').value = laboratorio.telefone || '';
                $('cidade').value = laboratorio.cidade && laboratorio.estado ? `${laboratorio.cidade} / ${laboratorio.estado}` : laboratorio.cidade || '';
                $('cep').value = laboratorio.cep || '';
                $('rua').value = laboratorio.rua || '';
                $('bairro').value = laboratorio.bairro || '';
                $('numero').value = laboratorio.numero || '';
                $('complemento').value = laboratorio.complemento || '';
                impressoras = laboratorio.impressoras || [];
                desenhar();
            });

        $('salvar-cadastro').addEventListener('click', async () => {
            const local = $('cidade').value.split('/').map((parte) => parte.trim());
            const resposta = await plataforma.fetchAutenticado('/laboratorios/me', {
                method: 'PATCH',
                body: JSON.stringify({
                    nomeInstituicao: $('razao').value.trim(),
                    cnpj: $('cnpj').value.trim(),
                    responsavel: $('responsavel').value.trim(),
                    telefone: $('telefone').value.trim(),
                    cidade: local[0] || '',
                    estado: (local[1] || '').toUpperCase(),
                    cep: $('cep').value.trim(),
                    rua: $('rua').value.trim(),
                    bairro: $('bairro').value.trim(),
                    numero: $('numero').value.trim(),
                    complemento: $('complemento').value.trim(),
                    requisitos: [...document.querySelectorAll('[name="req"]:checked')].map((item) => item.value)
                })
            });
            const dados = await resposta.json();
            if (!resposta.ok) return $('erro-equip').textContent = dados.erro;
            $('salvo-auto').textContent = '✓ Alterações salvas';
        });

        $('add-imp').addEventListener('click', async () => {
            const resposta = await plataforma.fetchAutenticado('/laboratorios/impressoras', {
                method: 'POST',
                body: JSON.stringify({
                    marca: $('outra-marca').value.trim(),
                    modelo: $('outra-modelo').value.trim(),
                    tecnologia: document.querySelector('[name="outra-tec"]:checked').value,
                    volumeConstrucao: volumeDe($('outra-volume').value),
                    materiaisCompativeis: [...document.querySelectorAll('[name="outra-mat"]:checked')].map((item) => item.value),
                    disponibilidade: 'Disponível'
                })
            });
            const dados = await resposta.json();
            if (!resposta.ok) return $('erro-imp').textContent = dados.erro;
            $('formulario-impressora').reset();
            location.hash = 'equipamento';
            carregar();
        });

        $('parque').addEventListener('click', async (evento) => {
            const botao = evento.target.closest('[data-remover]');
            if (!botao) return;
            if (!confirm('Remover esta impressora?')) return;
            const resposta = await plataforma.fetchAutenticado('/laboratorios/impressoras/' + botao.dataset.remover, { method: 'DELETE' });
            if (resposta.ok) carregar();
        });
        carregar();
    }

    plataforma.solicitacoes = () => {
        iniciarSolicitacoes();
        iniciarDetalheSolicitacao();
        iniciarLaboratorio();
    };
})();
