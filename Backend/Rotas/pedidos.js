const bibliotecaExpress = require('express');
const Pedido = require('../Modelos/pedido');
const { receberArquivo } = require('../Configuracao/envioArquivo');
const { exigirLogin, exigirPerfil } = require('../Intermediarios/autenticacao');

const rotas = bibliotecaExpress.Router();
rotas.use(exigirLogin);

const filtroPedidos = (requisicao) => requisicao.sessao.perfil === 'fornecedor'
  ? { $or: [{ fornecedorId: requisicao.sessao.id }, { fornecedorId: null }] }
  : { clienteId: requisicao.sessao.id };

rotas.get('/', async (requisicao, resposta) => {
  const pedidos = await Pedido.find(filtroPedidos(requisicao))
    .populate('fornecedorId', 'nomeInstituicao')
    .populate('clienteId', 'nomeInstituicao')
    .sort({ createdAt: -1 });
  resposta.json({ sucesso: true, pedidos });
});

rotas.get('/:id', async (requisicao, resposta) => {
  try {
    const pedido = await Pedido.findOne({ _id: requisicao.params.id, ...filtroPedidos(requisicao) })
      .populate('fornecedorId', 'nomeInstituicao')
      .populate('clienteId', 'nomeInstituicao');
    if (!pedido) return resposta.status(404).json({ erro: 'Pedido não encontrado.' });
    resposta.json({ sucesso: true, pedido });
  } catch {
    resposta.status(404).json({ erro: 'Pedido não encontrado.' });
  }
});

rotas.patch('/:id/status', exigirPerfil('fornecedor'), async (requisicao, resposta) => {
  try {
    const pedido = await Pedido.findOne({ _id: requisicao.params.id, ...filtroPedidos(requisicao) });
    if (!pedido || !Pedido.schema.path('status').enumValues.includes(requisicao.body.status)) {
      return resposta.status(400).json({ erro: 'Pedido ou status inválido.' });
    }
    pedido.status = requisicao.body.status;
    pedido.fornecedorId = requisicao.sessao.id;
    await pedido.save();
    resposta.json({ sucesso: true });
  } catch (erro) {
    console.error(erro);
    resposta.status(500).json({ erro: 'Erro ao atualizar o pedido.' });
  }
});

rotas.post('/', exigirPerfil('cliente'), receberArquivo.single('arquivoStl'), async (requisicao, resposta) => {
  try {
    const { paciente, peca, material, prazo, medidas, urgencia, fornecedorId } = requisicao.body;
    if (!paciente || !peca || !prazo || !requisicao.file) {
      return resposta.status(400).json({ erro: 'Preencha código do paciente, tipo de peça, prazo e anexe o arquivo .stl.' });
    }

    const total = await Pedido.countDocuments();
    const pedido = await Pedido.create({
      codigo: `CS-${new Date().getFullYear()}-${String(total + 1).padStart(4, '0')}`,
      clienteId: requisicao.sessao.id,
      fornecedorId: fornecedorId || undefined,
      paciente, peca, prazo, urgencia,
      material: material || undefined,
      observacoesTecnicas: medidas,
      arquivoUrl: '/uploads/' + requisicao.file.filename
    });
    resposta.status(201).json({ sucesso: true, pedido });
  } catch (erro) {
    if (erro.name === 'ValidationError') return resposta.status(400).json({ erro: 'Dados inválidos.' });
    console.error(erro);
    resposta.status(500).json({ erro: 'Erro interno ao registrar o pedido.' });
  }
});

module.exports = rotas;
