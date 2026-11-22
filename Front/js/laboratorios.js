(() => {
    const plataforma = window.ConectaSaude;
    const $ = plataforma.$;

    const carregarLaboratorios = () => plataforma.fetchAutenticado('/laboratorios')
        .then((resposta) => resposta.json())
        .then((dados) => dados.laboratorios);
    const obterMateriaisDisponiveis = (laboratorio) =>
        [...new Set(laboratorio.impressoras.flatMap((impressora) => impressora.materiaisCompativeis || []))];

    function iniciarListagemLaboratorios() {
        if (!$('laboratorios')) return;
        carregarLaboratorios().then((laboratorios) => {
            const desenhar = () => {
                const busca = $('busca-lab').value.toLowerCase();
                const lista = laboratorios.filter((laboratorio) =>
                    [laboratorio.nomeInstituicao, laboratorio.cidade, ...obterMateriaisDisponiveis(laboratorio)]
                        .join(' ').toLowerCase().includes(busca)
                );
                $('total-labs').textContent = lista.length + (lista.length === 1 ? ' laboratorio' : ' laboratorios');
                $('laboratorios').innerHTML = lista.map((laboratorio) => `<li class="lab-cartao">
                    <div class="lab-cartao-topo">
                        <span class="lab-icone"><img class="icone" src="../img/icone-laboratorio.png" alt=""></span>
                        <div><h3>${plataforma.escaparHtml(laboratorio.nomeInstituicao)}</h3><p class="lab-cidade">${plataforma.escaparHtml(laboratorio.cidade)}, ${plataforma.escaparHtml(laboratorio.estado)}</p></div>
                    </div>
                    <div class="lab-numeros">
                        <div><strong>${laboratorio.impressoras.length}</strong><span>Impressoras</span></div>
                        <div><strong>${obterMateriaisDisponiveis(laboratorio).length}</strong><span>Materiais</span></div>
                    </div>
                    <ul class="lab-materiais">${obterMateriaisDisponiveis(laboratorio).map((material) => `<li>${plataforma.escaparHtml(material)}</li>`).join('')}</ul>
                    <ul class="lab-contatos"><li><b>E-mail</b> ${plataforma.escaparHtml(laboratorio.email)}</li></ul>
                    <a href="detalhe_laboratorio_instituicao.html?id=${laboratorio._id}" class="botao-contorno lab-ver">Ver detalhes ›</a>
                </li>`).join('') || '<li class="pedido-aviso">Nenhum laboratorio encontrado.</li>';
            };
            $('busca-lab').addEventListener('input', desenhar);
            desenhar();
        }).catch(() => { $('laboratorios').innerHTML = '<li class="pedido-aviso pedido-aviso-erro">Não foi possível carregar os laboratórios.</li>'; });
    }

    function iniciarDetalheLaboratorio() {
        if (!$('titulo-lab')) return;
        const id = new URLSearchParams(location.search).get('id');
        carregarLaboratorios().then((laboratorios) => {
            const laboratorio = laboratorios.find((item) => item._id === id);
            if (!laboratorio) throw new Error();
            $('titulo-lab').textContent = laboratorio.nomeInstituicao;
            $('lab-cidade').textContent = `${laboratorio.cidade}, ${laboratorio.estado}`;
            $('lab-avatar').textContent = laboratorio.nomeInstituicao.slice(0, 2).toUpperCase();
            $('lab-responsavel').textContent = laboratorio.responsavel || 'Não informado';
            $('lab-email').textContent = laboratorio.email;
            $('lab-telefone').textContent = laboratorio.telefone || 'Não informado';
            $('lab-qtd').textContent = laboratorio.impressoras.length + ' equipamentos cadastrados';
            $('lab-impressoras').innerHTML = laboratorio.impressoras.map((impressora) => `<li class="lab-imp">
                <span class="lab-icone lab-icone-3d">3D</span>
                <div class="lab-imp-info">
                    <h3>${plataforma.escaparHtml(impressora.marca)} ${plataforma.escaparHtml(impressora.modelo)}</h3>
                    <p>${plataforma.escaparHtml(impressora.tecnologia)}${impressora.volumeConstrucao ? ` · Volume: ${impressora.volumeConstrucao.larguraX} × ${impressora.volumeConstrucao.profundidadeY} × ${impressora.volumeConstrucao.alturaZ} mm` : ''}</p>
                    <p><b>Materiais:</b> ${(impressora.materiaisCompativeis || []).map(plataforma.escaparHtml).join(', ')}</p>
                </div>
                <span class="lab-disponibilidade${impressora.disponibilidade === 'Disponível' ? '' : ' lab-disponibilidade-parcial'}">${plataforma.escaparHtml(impressora.disponibilidade)}</span>
            </li>`).join('') || '<li>Nenhuma impressora cadastrada ainda.</li>';
        }).catch(() => { $('titulo-lab').textContent = 'Laboratorio nao encontrado'; });

        if ($('formulario-pedido')) {
            $('formulario-pedido').addEventListener('submit', async (evento) => {
                evento.preventDefault();
                const dados = new FormData();
                ['paciente', 'peca', 'material', 'prazo', 'medidas'].forEach((campo) => dados.append(campo, $(campo).value));
                dados.append('urgencia', document.querySelector('input[name="urgencia"]:checked').value);
                dados.append('arquivoStl', $('arquivoStl').files[0]);
                dados.append('fornecedorId', id);
                const resposta = await fetch(plataforma.ENDERECO_API + '/orders', {
                    method: 'POST',
                    headers: { Authorization: 'Bearer ' + plataforma.lerSessao().token },
                    body: dados
                });
                if (!resposta.ok) return $('erro').textContent = (await resposta.json()).erro;
                location.href = 'aacd.html';
            });
        }
    }

    plataforma.laboratorios = () => {
        iniciarListagemLaboratorios();
        iniciarDetalheLaboratorio();
    };
})();
