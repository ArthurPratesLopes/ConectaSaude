const caminhos = require('path');
const bibliotecaExpress = require('express');
const carregadorAmbiente = require('dotenv');
const politicaCors = require('cors');

carregadorAmbiente.config();

const conectarBanco = require('./Configuracao/banco');
const { pastaEnvios } = require('./Configuracao/envioArquivo');

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET no arquivo .env (veja .env.example).');
  process.exit(1);
}

conectarBanco();

const aplicativo = bibliotecaExpress();
aplicativo.use(politicaCors());
aplicativo.use(bibliotecaExpress.json());
aplicativo.use(bibliotecaExpress.static(caminhos.join(__dirname, '..', 'Front')));
aplicativo.use('/uploads', bibliotecaExpress.static(pastaEnvios));

aplicativo.use('/api/auth', require('./Rotas/autenticacao'));
aplicativo.use('/api/laboratorios', require('./Rotas/laboratorios'));
aplicativo.use('/api/orders', require('./Rotas/pedidos'));
aplicativo.use('/api/messages', require('./Rotas/mensagens'));

const porta = process.env.PORT || 5000;
aplicativo.listen(porta, () => console.log(`🚀 Servidor rodando na porta ${porta}`));
