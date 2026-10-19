const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    // Identificação principal (nome do responsável ou razão social da instituição)
    nomeInstituicao: {
      type: String,
      required: [true, 'O nome da instituição ou usuário é obrigatório'],
      trim: true,
    },

    // Credenciais de Acesso
    email: {
      type: String,
      required: [true, 'O e-mail é obrigatório'],
      unique: true, // Evita dois cadastros com o mesmo e-mail
      lowercase: true,
      trim: true,
    },
    senha: {
      type: String,
      required: [true, 'A senha é obrigatória'],
    },

    // Perfil de Acesso no Sistema
    perfil: {
      type: String,
      enum: ['cliente', 'fornecedor', 'admin'],
      required: [true, 'O perfil é obrigatório'],
    },

    // Dados de Contato e Localização
    telefone: {
      type: String,
      trim: true,
    },
    cidade: {
      type: String,
      required: [true, 'A cidade é obrigatória'],
      trim: true,
    },
    estado: {
      type: String,
      required: [true, 'O estado é obrigatório'],
      uppercase: true,
      maxLength: 2,
    },

    // E-mail exclusivo para receber notificações de novas solicitações (opcional)
    emailSolicitacoes: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Cria automaticamente createdAt e updatedAt
  }
);

module.exports = mongoose.model('User', UserSchema);