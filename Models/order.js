const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  // Relacionamentos por ObjectId (Referências aos outros Schemas)
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O ID do cliente solicitante é obrigatório']
  },
  fornecedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'O ID do fornecedor/FabLab é obrigatório']
  },
  impressoraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Printer',
    required: [true, 'A impressora selecionada é obrigatória']
  },
  
  // Informações do Arquivo 3D (.stl)
  arquivoUrl: {
    type: String,
    required: [true, 'O caminho/URL do arquivo 3D (.stl) é obrigatório']
  },
  nomeArquivoOriginal: {
    type: String
  },
  
  // Especificações Técnicas da Impressão
  material: {
    type: String,
    required: [true, 'O material de impressão é obrigatório'] // Ex: 'PLA', 'TPU', 'PETG'
  },
  resolucaoCamada: {
    type: String,
    default: '0.2 mm - Padrão'
  },
  quantidade: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  observacoesTecnicas: {
    type: String,
    trim: true // Ex: "Infill de 30%, suporte automático, cor azul"
  },
  
  // Controle de Ciclo de Vida e Status
  status: {
    type: String,
    enum: ['analise', 'aceito', 'producao', 'pronto', 'recusado'],
    default: 'analise'
  },
  motivoRecusa: {
    type: String,
    trim: true
  },
  
  // Controle de Qualidade / Validação Clínica (Protocolo AACD)
  validacaoClinica: {
    aprovado: {
      type: Boolean,
      default: false
    },
    dataValidacao: Date,
    responsavelTecnico: String,
    observacoesProtocolo: String
  }
}, {
  timestamps: true // Cria automaticamente createdAt e updatedAt
});

module.exports = mongoose.model('Order', OrderSchema);