const bibliotecaJwt = require('jsonwebtoken');

function gerarToken(usuario) {
  return bibliotecaJwt.sign(
    { id: usuario._id, perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function usuarioPublico(usuario) {
  return {
    id: usuario._id,
    nomeInstituicao: usuario.nomeInstituicao,
    email: usuario.email,
    perfil: usuario.perfil,
    cidade: usuario.cidade,
    estado: usuario.estado,
    cnpj: usuario.cnpj || '',
    cep: usuario.cep || '',
    rua: usuario.rua || '',
    bairro: usuario.bairro || '',
    numero: usuario.numero || '',
    complemento: usuario.complemento || '',
    requisitos: usuario.requisitos || []
  };
}

function exigirLogin(requisicao, resposta, proximo) {
  const cabecalho = requisicao.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  if (!token) return resposta.status(401).json({ erro: 'Faça login para continuar.' });

  try {
    requisicao.sessao = bibliotecaJwt.verify(token, process.env.JWT_SECRET);
    proximo();
  } catch {
    resposta.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  }
}

function exigirPerfil(perfil) {
  return (requisicao, resposta, proximo) => {
    if (requisicao.sessao.perfil !== perfil) {
      return resposta.status(403).json({ erro: 'Você não tem permissão para esta ação.' });
    }
    proximo();
  };
}

module.exports = { gerarToken, usuarioPublico, exigirLogin, exigirPerfil };
