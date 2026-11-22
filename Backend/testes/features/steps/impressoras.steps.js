
const { Given, When, Then } = require('@cucumber/cucumber');
const mongoose = require('mongoose');
const assert = require('node:assert/strict');
const Impressora = require('../../../Modelos/impressora');

let impressora;
let erro;

Given('que preparo os dados de uma impressora', function () {
  impressora = new Impressora({
    fornecedorId: new mongoose.Types.ObjectId(),
    marca: 'Creality',
    modelo: 'Ender 3',
    tecnologia: 'FDM'
  });
  erro = null;
});

When('informo a tecnologia FDM', async function () {
  impressora.tecnologia = 'FDM';
  try {
    await impressora.validate();
  } catch (e) {
    erro = e;
  }
});

Then('a validação deve aceitar os dados', function () {
  assert.equal(erro, null);
});

When('informo a tecnologia LASER', async function () {
  impressora.tecnologia = 'LASER';
  try {
    await impressora.validate();
  } catch (e) {
    erro = e;
  }
});

Then('a validação deve rejeitar os dados', function () {
  assert.ok(erro);
  assert.ok(erro.errors.tecnologia);
});

When('deixo marca, modelo e tecnologia vazios', async function () {
  impressora.marca = '';
  impressora.modelo = '';
  impressora.tecnologia = '';
  try {
    await impressora.validate();
  } catch (e) {
    erro = e;
  }
});

Then('a validação deve indicar os campos obrigatórios', function () {
  assert.ok(erro);
  assert.ok(erro.errors.marca);
  assert.ok(erro.errors.modelo);
  assert.ok(erro.errors.tecnologia);
});
