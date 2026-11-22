
const requisicao = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'chave-teste-conectasaude';

const aplicativo = require('../servidor');

describe('Testes da rota de laboratórios', () => {

  test('deve impedir o cadastro sem autenticação', async () => {
    const resposta = await requisicao(aplicativo)
      .post('/api/laboratorios/impressoras')
      .send({});

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toBe('Faça login para continuar.');
  });

  test('deve impedir o cadastro sem os dados obrigatórios', async () => {
    const token = jwt.sign(
      { id: 'usuario-teste', perfil: 'fornecedor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resposta = await requisicao(aplicativo)
      .post('/api/laboratorios/impressoras')
      .set('Authorization', `Bearer ${token}`)
      .send({ marca: 'Creality' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe(
      'Informe marca, modelo e tecnologia.'
    );
  });

});
