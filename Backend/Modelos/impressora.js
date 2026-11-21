const mangusto = require('mongoose');

const esquemaImpressora = new mangusto.Schema({
  fornecedorId: {
    type: mangusto.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  marca: {
    type: String,
    required: true
  },
  modelo: {
    type: String,
    required: true
  },
  tecnologia: {
    type: String,
    enum: ['FDM', 'SLA', 'FFF'],
    required: true
  },
  disponibilidade: {
    type: String,
    enum: ['Disponível', 'Limitada', 'Manutenção'],
    default: 'Disponível'
  },
  volumeConstrucao: {
    larguraX: Number,
    profundidadeY: Number,
    alturaZ: Number
  },
  materiaisCompativeis: [{
    type: String
  }],
  descricao: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mangusto.model('Impressora', esquemaImpressora, 'printers');