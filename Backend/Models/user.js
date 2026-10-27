const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nomeInstituicao: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  senha: {
    type: String,
    required: true
  },
  perfil: {
    type: String,
    enum: ['cliente', 'fornecedor', 'admin'],
    required: true
  },
  cidade: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);