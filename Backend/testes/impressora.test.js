
const mongoose = require('mongoose');
const Impressora = require('../Modelos/impressora');

describe('Testes unitários do modelo Impressora', () => {

  test('deve rejeitar uma tecnologia não permitida', () => {
    const impressora = new Impressora({
      fornecedorId: new mongoose.Types.ObjectId(),
      marca: 'Creality',
      modelo: 'Ender 3',
      tecnologia: 'LASER'
    });

    const erro = impressora.validateSync();

    expect(erro).toBeDefined();
    expect(erro.errors.tecnologia).toBeDefined();
  });

  test('deve exigir marca, modelo e tecnologia', () => {
    const impressora = new Impressora({
      fornecedorId: new mongoose.Types.ObjectId()
    });

    const erro = impressora.validateSync();

    expect(erro).toBeDefined();
    expect(erro.errors.marca).toBeDefined();
    expect(erro.errors.modelo).toBeDefined();
    expect(erro.errors.tecnologia).toBeDefined();
  });

});
