const mangusto = require('mongoose');
const bibliotecaHash = require('bcryptjs');

const esquemaUsuario = new mangusto.Schema({
  nomeInstituicao: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,   // "Contato@AACD.org" e "contato@aacd.org" passam a ser o mesmo e-mail
    trim: true
  },
  senha: {
    type: String,
    required: true,
    select: false      // a senha (hash) nunca vem em consultas, a menos que peçamos com .select('+senha')
  },
  perfil: {
    type: String,
    enum: ['cliente', 'fornecedor', 'admin'],
    required: true
  },
  cidade: {
    type: String,
    required: true,
    trim: true
  },
  estado: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  cnpj: { type: String, trim: true, default: '' },
  cep: { type: String, trim: true, default: '' },
  rua: { type: String, trim: true, default: '' },
  bairro: { type: String, trim: true, default: '' },
  numero: { type: String, trim: true, default: '' },
  complemento: { type: String, trim: true, default: '' },
  requisitos: [{ type: String }]
}, {
  timestamps: true
});

// Antes de salvar, transforma a senha em hash (só quando ela foi criada/alterada)
esquemaUsuario.pre('save', async function () {
  if (!this.isModified('senha')) return;
  this.senha = await bibliotecaHash.hash(this.senha, 10);
});

// Compara a senha digitada com o hash guardado
esquemaUsuario.methods.conferirSenha = function (senhaDigitada) {
  return bibliotecaHash.compare(senhaDigitada, this.senha);
};

module.exports = mangusto.model('Usuario', esquemaUsuario, 'users');
