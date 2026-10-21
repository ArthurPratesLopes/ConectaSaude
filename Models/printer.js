const mongoose = require('mongoose');

const PrinterSchema = new mongoose.Schema({
  fornecedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O ID do fornecedor é obrigatório']
  },
  cidade: {
    type: String,
    required: [true, 'A cidade é obrigatória'],
    trim: true
  },
  estado: {
    type: String,
    required: [true, 'O estado é obrigatório'],
    uppercase: true,
    maxLength: 2
  },
  emailSolicitacoes: {
    type: String,
    required: [true, 'O e-mail para solicitações é obrigatório'],
    lowercase: true,
    trim: true
  },
  marca: {
    type: String,
    required: [true, 'A marca é obrigatória']
  },
  modelo: {
    type: String,
    required: [true, 'O modelo é obrigatório']
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
    larguraX: { type: Number, required: true }, // em mm
    profundidadeY: { type: Number, required: true }, // em mm
    alturaZ: { type: Number, required: true } // em mm
  },
  materiaisCompativeis: [{
    type: String,
    enum: [
      'PLA',
      'ABS',
      'PETG',
      'TPU',
      'Nylon',
      'Resina Standard',
      'Resina Durable',
      'Resina Flexible',
      'Fibra de Carbono',
      'Fibra de Vidro',
      'ASA',
      'PA'
    ]
  }],
  descricao: {
    type: String,
    maxLength: 500
  }
}, { timestamps: true });

module.exports = mongoose.model('Printer', PrinterSchema);