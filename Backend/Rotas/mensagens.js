const bibliotecaExpress = require('express');
const Mensagem = require('../Modelos/mensagem');
const Pedido = require('../Modelos/pedido');
const { exigirLogin } = require('../Intermediarios/autenticacao');

const rotas = bibliotecaExpress.Router();
rotas.use(exigirLogin);

async function pedidoDoUsuario(orderId, usuarioId) {
  return Pedido.findOne({
    _id: orderId,
    $or: [{ clienteId: usuarioId }, { fornecedorId: usuarioId }]
  }).catch(() => null);
}

rotas.get('/:orderId', async (requisicao, resposta) => {
  if (!(await pedidoDoUsuario(requisicao.params.orderId, requisicao.sessao.id))) {
    return resposta.status(404).json({ erro: 'Pedido não encontrado.' });
  }
  const mensagens = await Mensagem.find({ orderId: requisicao.params.orderId })
    .populate('remetenteId', 'nomeInstituicao')
    .sort({ createdAt: 1 });
  resposta.json({ sucesso: true, mensagens });
});

rotas.post('/', async (requisicao, resposta) => {
  const { orderId, texto } = requisicao.body;
  if (!texto || !texto.trim() || !(await pedidoDoUsuario(orderId, requisicao.sessao.id))) {
    return resposta.status(400).json({ erro: 'Mensagem ou pedido inválido.' });
  }
  const mensagem = await Mensagem.create({
    orderId,
    remetenteId: requisicao.sessao.id,
    texto: texto.trim()
  });
  resposta.status(201).json({ sucesso: true, mensagem });
});

module.exports = rotas;
