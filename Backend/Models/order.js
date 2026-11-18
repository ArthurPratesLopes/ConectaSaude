const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fornecedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  impressoraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer'
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

module.exports = mongoose.model('Order', orderSchema);