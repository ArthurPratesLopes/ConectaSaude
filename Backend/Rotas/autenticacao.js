const bibliotecaExpress = require('express');
const Usuario = require('../Modelos/usuario');
const { gerarToken, usuarioPublico, exigirLogin } = require('../Intermediarios/autenticacao');

const rotas = bibliotecaExpress.Router();
const perfisCadastro = ['cliente', 'fornecedor'];
const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

rotas.post('/register', async (requisicao, resposta) => {
  try {
    const { nomeInstituicao, email, senha, perfil, cidade, estado } = requisicao.body;
    if (!nomeInstituicao || !email || !senha || !perfil || !cidade || !estado) {
      return resposta.status(400).json({ erro: 'Preencha todos os campos.' });
    }
    if (!emailValido.test(email)) return resposta.status(400).json({ erro: 'Informe um e-mail válido.' });
    if (!perfisCadastro.includes(perfil)) return resposta.status(400).json({ erro: 'Perfil inválido.' });

    const emailNormalizado = String(email).trim().toLowerCase();
    const existente = await Usuario.findOne({ email: emailNormalizado });
    if (existente) return resposta.status(409).json({ erro: 'E-mail já cadastrado.' });

    const usuario = await Usuario.create({
      nomeInstituicao, email: emailNormalizado, senha, perfil, cidade, estado
    });
    resposta.status(201).json({
      sucesso: true,
      token: gerarToken(usuario),
      usuario: usuarioPublico(usuario)
    });
  } catch (erro) {
    if (erro.code === 11000) return resposta.status(409).json({ erro: 'E-mail já cadastrado.' });
    if (erro.name === 'ValidationError') return resposta.status(400).json({ erro: 'Dados inválidos.' });
    console.error(erro);
    resposta.status(500).json({ erro: 'Erro interno ao criar a conta.' });
  }
});

rotas.post('/login', async (requisicao, resposta) => {
  try {
    const { email, senha } = requisicao.body;
    if (!email || !senha) return resposta.status(400).json({ erro: 'Informe e-mail e senha.' });

    const usuario = await Usuario.findOne({ email: String(email).trim().toLowerCase() }).select('+senha');
    if (!usuario || !(await usuario.conferirSenha(String(senha)))) {
      return resposta.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }
    resposta.json({ sucesso: true, token: gerarToken(usuario), usuario: usuarioPublico(usuario) });
  } catch (erro) {
    console.error(erro);
    resposta.status(500).json({ erro: 'Erro interno ao entrar.' });
  }
});

rotas.get('/me', exigirLogin, async (requisicao, resposta) => {
  try {
    const usuario = await Usuario.findById(requisicao.sessao.id);
    if (!usuario) return resposta.status(401).json({ erro: 'Usuário não encontrado.' });
    resposta.json({ sucesso: true, usuario: usuarioPublico(usuario) });
  } catch {
    resposta.status(500).json({ erro: 'Erro interno.' });
  }
});

module.exports = rotas;
