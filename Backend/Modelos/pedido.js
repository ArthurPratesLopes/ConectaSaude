const mangusto = require('mongoose');

const esquemaPedido = new mangusto.Schema({
  codigo: String,
  paciente: String,
  peca: String,
  prazo: Date,
  urgencia: {
    type: String,
    enum: ['Normal', 'Prioritário', 'Urgente'],
    default: 'Normal'
  },
  clienteId: {
    type: mangusto.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fornecedorId: {
    type: mangusto.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  impressoraId: {
    type: mangusto.Schema.Types.ObjectId,
    ref: 'Impressora'
  },
  arquivoUrl: {
    type: String,
    required: true
  },
  material: {
    type: String
  },
  resolucaoCamada: {
    type: String
  },
  quantidade: {
    type: Number,
    default: 1
  },
  observacoesTecnicas: {
    type: String
  },
  status: {
    type: String,
    enum: ['analise', 'aceito', 'producao', 'pronto', 'recusado'],
    default: 'analise'
  },
  validacaoClinica: {
    aprovado: {
      type: Boolean,
      default: false
    },
    responsavel: {
      type: String
    },
    observacoes: {
      type: String
    }
  }
}, {
  timestamps: true
});

module.exports = mangusto.model('Pedido', esquemaPedido, 'orders');