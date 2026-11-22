(() => {
    const plataforma = window.ConectaSaude;
    const $ = plataforma.$;

    function configurarFormularioPedido(fornecedorId, depois) {
        if (!$('formulario-pedido')) return;
        $('formulario-pedido').addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const dados = new FormData();
            ['paciente', 'peca', 'material', 'prazo', 'medidas', 'quantidade'].forEach((id) => dados.append(id, $(id).value));
            dados.append('urgencia', document.querySelector('input[name="urgencia"]:checked').value);
            dados.append('arquivoStl', $('arquivoStl').files[0]);
            dados.append('fornecedorId', fornecedorId);
            const resposta = await fetch(plataforma.ENDERECO_API + '/orders', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + plataforma.lerSessao().token },
                body: dados
            });
            if (!resposta.ok) return $('erro').textContent = (await resposta.json()).erro;
            evento.target.reset();
            $('erro').textContent = '';
            location.hash = '';
            depois();
        });
    }

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

    function iniciarPedidos() {
        if (!$('pedidos')) return;
        const carregar = () => plataforma.fetchAutenticado('/orders').then((resposta) => resposta.json()).then(({ pedidos }) => {
            const contadores = { nTodos: '', nAbertos: 'analise', nImpressao: 'producao', nEntregues: 'pronto', nRecusados: 'recusado' };
            Object.entries(contadores).forEach(([id, situacao]) => {
                $(id).textContent = String(pedidos.filter((pedido) => !situacao || pedido.status === situacao).length).padStart(2, '0');
            });
            $('pedidos').innerHTML = pedidos.map((pedido) => `<li class="pedido">
                <div class="pedido-info">
                    <div class="pedido-linha1"><span class="selo selo-${plataforma.ROTULOS_SITUACAO[pedido.status][0]}">${plataforma.ROTULOS_SITUACAO[pedido.status][1]}</span><span class="pedido-codigo">${pedido.codigo}</span></div>
                    <h3>${plataforma.escaparHtml(pedido.peca)}</h3>
                    <p>Registrado em ${plataforma.formatarData(pedido.createdAt)} • Prazo: ${plataforma.formatarData(pedido.prazo)}</p>
                </div>
                <a class="pedido-seta" href="pedido.html?id=${pedido._id}">›</a>
            </li>`).join('') || '<li class="pedido-aviso">Você ainda não enviou nenhum pedido.</li>';
        }).catch(() => { $('pedidos').innerHTML = '<li class="pedido-aviso pedido-aviso-erro">Não foi possível carregar os pedidos.</li>'; });
        configurarFormularioPedido('', carregar);
        carregar();
    }

    // pinta as bolinhas do andamento: Registrado, Aceito, Impressão, Pronto
    function pintarAndamento(situacao) {
        const ultimaEtapa = { analise: 0, aceito: 1, producao: 2, pronto: 3, recusado: 0 }[situacao] || 0;
        document.querySelectorAll('.progresso li').forEach((etapa, indice) => {
            etapa.classList.toggle('feito', indice <= ultimaEtapa);
        });
    }

    function iniciarDetalhePedido() {
        if (!$('detalhe-codigo')) return;
        const id = new URLSearchParams(location.search).get('id');
        plataforma.fetchAutenticado('/orders/' + id).then((resposta) => resposta.json()).then(({ pedido }) => {
            $('detalhe-selo').className = 'selo selo-' + plataforma.ROTULOS_SITUACAO[pedido.status][0];
            pintarAndamento(pedido.status);
            Object.entries({
                'detalhe-selo': plataforma.ROTULOS_SITUACAO[pedido.status][1],
                'detalhe-codigo': pedido.codigo,
                'detalhe-titulo': pedido.peca,
                'detalhe-datas': `Registrado em ${plataforma.formatarData(pedido.createdAt)} • Prazo: ${plataforma.formatarData(pedido.prazo)}`,
                'dado-paciente': pedido.paciente,
                'dado-peca': pedido.peca,
                'dado-material': pedido.material || '—',
                'dado-quantidade': pedido.quantidade || 1,
                'dado-prazo': plataforma.formatarData(pedido.prazo),
                'dado-urgencia': plataforma.ROTULOS_URGENCIA[pedido.urgencia] || pedido.urgencia,
                'dado-lab': pedido.fornecedorId ? pedido.fornecedorId.nomeInstituicao : 'Aguardando laboratório',
                'dado-medidas': pedido.observacoesTecnicas || '—',
                'dado-arquivo-nome': pedido.arquivoUrl.split('/').pop()
            }).forEach(([id, texto]) => { $(id).textContent = texto; });
            $('dado-arquivo').href = plataforma.ENDERECO_API.replace('/api', '') + pedido.arquivoUrl;
        }).catch(() => { $('detalhe-titulo').textContent = 'Pedido não encontrado'; });
        iniciarConversa(id);
    }

    plataforma.pedidos = () => {
        iniciarPedidos();
        iniciarDetalhePedido();
        if ($('titulo-lab')) {
            const evento = new Event('conectasaude:pedidos');
            document.dispatchEvent(evento);
        }
    };
})();
