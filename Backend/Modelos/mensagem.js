const mangusto = require('mongoose');

const esquemaMensagem = new mangusto.Schema({
  orderId: {
    type: mangusto.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true
  },
  remetenteId: {
    type: mangusto.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  texto: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mangusto.model('Mensagem', esquemaMensagem, 'messages');