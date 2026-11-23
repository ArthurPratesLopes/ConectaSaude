const mangusto = require('mongoose');
const carregadorAmbiente = require('dotenv');

const Usuario = require('./Modelos/usuario');
const Impressora = require('./Modelos/impressora');
const Pedido = require('./Modelos/pedido');
const Mensagem = require('./Modelos/mensagem');

carregadorAmbiente.config();

const enderecoMongo = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/printbridge';

const popularBanco = async () => {
  try {
    await mangusto.connect(enderecoMongo);
    console.log('Conectado.');

    await Usuario.deleteMany({});
    await Impressora.deleteMany({});
    await Pedido.deleteMany({});
    await Mensagem.deleteMany({});
    console.log('Coleções limpas.');

    const clienteAACD = await Usuario.create({
      nomeInstituicao: 'AACD Central',
      email: 'contato@aacd.org.br',
      senha: '12345678',
      perfil: 'cliente',
      cidade: 'São Paulo',
      estado: 'SP'
    });

    const fornecedorFabLab = await Usuario.create({
      nomeInstituicao: 'FabLab Mauá',
      email: 'fablab@maua.br',
      senha: '12345678',
      perfil: 'fornecedor',
      cidade: 'São Caetano do Sul',
      estado: 'SP'
    });
    console.log('Usuários criados.');

    const impressora1 = await Impressora.create({
      fornecedorId: fornecedorFabLab._id,
      marca: 'Ender',
      modelo: 'Ender 3 V2',
      tecnologia: 'FDM',
      disponibilidade: 'Disponível',
      volumeConstrucao: { larguraX: 220, profundidadeY: 220, alturaZ: 250 },
      materiaisCompativeis: ['PLA', 'PETG', 'TPU'],
      descricao: 'Impressora FDM otimizada para filamentos flexíveis e peças assistivas.'
    });

    const impressora2 = await Impressora.create({
      fornecedorId: fornecedorFabLab._id,
      marca: 'Anycubic',
      modelo: 'Photon Mono X',
      tecnologia: 'SLA',
      disponibilidade: 'Disponível',
      volumeConstrucao: { larguraX: 192, profundidadeY: 120, alturaZ: 245 },
      materiaisCompativeis: ['Resina'],
      descricao: 'Impressora de resina SLA de alta precisão para componentes cirúrgicos.'
    });
    console.log('Impressoras criadas.');

    const pedidoExemplo = await Pedido.create({
      clienteId: clienteAACD._id,
      fornecedorId: fornecedorFabLab._id,
      impressoraId: impressora1._id,
      arquivoUrl: '/uploads/1729512345678-protese_mao_infantil.stl',
      material: 'TPU',
      resolucaoCamada: '0.2 mm',
      quantidade: 1,
      observacoesTecnicas: 'Protetor palmar infantil com necessidade de alta flexibilidade.',
      status: 'analise',
      validacaoClinica: {
        aprovado: true,
        responsavel: 'Dra. Ana Silva (AACD)',
        observacoes: 'Modelo validado conforme diretrizes clínicas.'
      }
    });
    console.log('Pedido criado.');

    await Mensagem.create({
      orderId: pedidoExemplo._id,
      remetenteId: clienteAACD._id,
      texto: 'Olá! Enviamos o modelo com preenchimento de 30% em TPU. Conseguem atender o prazo?'
    });
    console.log('Mensagem criada.');

    console.log('OK');
    process.exit(0);

  } catch (erro) {
    console.error(`Erro: ${erro.message}`);
    process.exit(1);
  }
};

popularBanco();
