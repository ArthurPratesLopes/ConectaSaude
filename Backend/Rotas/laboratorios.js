const bibliotecaExpress = require('express');
const Usuario = require('../Modelos/usuario');
const Impressora = require('../Modelos/impressora');
const { exigirLogin, exigirPerfil, usuarioPublico } = require('../Intermediarios/autenticacao');

const rotas = bibliotecaExpress.Router();
rotas.use(exigirLogin);

rotas.get('/', async (requisicao, resposta) => {
  const [laboratorios, impressoras] = await Promise.all([
    Usuario.find({ perfil: 'fornecedor' }).sort('nomeInstituicao').lean(),
    Impressora.find().lean()
  ]);
  resposta.json({
    sucesso: true,
    laboratorios: laboratorios.map((laboratorio) => ({
      ...laboratorio,
      impressoras: impressoras.filter((impressora) => String(impressora.fornecedorId) === String(laboratorio._id))
    }))
  });
});

rotas.get('/me', exigirPerfil('fornecedor'), async (requisicao, resposta) => {
  const [laboratorio, impressoras] = await Promise.all([
    Usuario.findById(requisicao.sessao.id),
    Impressora.find({ fornecedorId: requisicao.sessao.id }).sort({ createdAt: -1 })
  ]);
  if (!laboratorio) return resposta.status(404).json({ erro: 'Laboratório não encontrado.' });
  resposta.json({ sucesso: true, laboratorio: { ...usuarioPublico(laboratorio), impressoras } });
});

rotas.patch('/me', exigirPerfil('fornecedor'), async (requisicao, resposta) => {
  const permitidos = ['nomeInstituicao', 'cidade', 'estado', 'cnpj', 'cep', 'rua', 'bairro', 'numero', 'complemento', 'requisitos'];
  const alteracoes = Object.fromEntries(permitidos
    .filter((campo) => requisicao.body[campo] !== undefined)
    .map((campo) => [campo, requisicao.body[campo]]));
  if (['nomeInstituicao', 'cidade', 'estado'].some((campo) =>
    alteracoes[campo] !== undefined && !String(alteracoes[campo]).trim()
  )) {
    return resposta.status(400).json({ erro: 'Nome, cidade e UF são obrigatórios.' });
  }

  const laboratorio = await Usuario.findByIdAndUpdate(requisicao.sessao.id, alteracoes, { new: true, runValidators: true });
  if (!laboratorio) return resposta.status(404).json({ erro: 'Laboratório não encontrado.' });
  resposta.json({ sucesso: true, laboratorio: usuarioPublico(laboratorio) });
});

rotas.post('/impressoras', exigirPerfil('fornecedor'), async (requisicao, resposta) => {
  try {
    const { marca, modelo, tecnologia, disponibilidade, volumeConstrucao, materiaisCompativeis, descricao } = requisicao.body;
    if (!marca || !modelo || !tecnologia) {
      return resposta.status(400).json({ erro: 'Informe marca, modelo e tecnologia.' });
    }
    const impressora = await Impressora.create({
      fornecedorId: requisicao.sessao.id,
      marca: String(marca).trim(),
      modelo: String(modelo).trim(),
      tecnologia,
      disponibilidade: disponibilidade || 'Disponível',
      volumeConstrucao: volumeConstrucao || {},
      materiaisCompativeis: Array.isArray(materiaisCompativeis) ? materiaisCompativeis : [],
      descricao: descricao || ''
    });
    resposta.status(201).json({ sucesso: true, impressora });
  } catch (erro) {
    if (erro.name === 'ValidationError') return resposta.status(400).json({ erro: 'Dados da impressora inválidos.' });
    console.error(erro);
    resposta.status(500).json({ erro: 'Erro ao cadastrar a impressora.' });
  }
});

rotas.patch('/impressoras/:id', exigirPerfil('fornecedor'), async (requisicao, resposta) => {
  try {
    const impressora = await Impressora.findOne({ _id: requisicao.params.id, fornecedorId: requisicao.sessao.id });
    if (!impressora) return resposta.status(404).json({ erro: 'Impressora não encontrada.' });
    ['marca', 'modelo', 'tecnologia', 'disponibilidade', 'volumeConstrucao', 'materiaisCompativeis', 'descricao']
      .forEach((campo) => {
        if (requisicao.body[campo] !== undefined) impressora[campo] = requisicao.body[campo];
      });
    await impressora.save();
    resposta.json({ sucesso: true, impressora });
  } catch (erro) {
    if (erro.name === 'ValidationError') return resposta.status(400).json({ erro: 'Dados da impressora inválidos.' });
    console.error(erro);
    resposta.status(500).json({ erro: 'Erro ao atualizar a impressora.' });
  }
});

rotas.delete('/impressoras/:id', exigirPerfil('fornecedor'), async (requisicao, resposta) => {
  const impressora = await Impressora.findOneAndDelete({ _id: requisicao.params.id, fornecedorId: requisicao.sessao.id }).catch(() => null);
  if (!impressora) return resposta.status(404).json({ erro: 'Impressora não encontrada.' });
  resposta.json({ sucesso: true });
});

module.exports = rotas;
