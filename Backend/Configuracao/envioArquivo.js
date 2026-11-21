const caminhos = require('path');
const processadorMultipart = require('multer');

const pastaEnvios = caminhos.join(__dirname, '..', 'uploads');

const receberArquivo = processadorMultipart({
  storage: processadorMultipart.diskStorage({
    destination: pastaEnvios,
    filename: (requisicao, arquivo, retorno) => retorno(null, Date.now() + '.stl')
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (requisicao, arquivo, retorno) => retorno(null, arquivo.originalname.toLowerCase().endsWith('.stl'))
});

module.exports = { pastaEnvios, receberArquivo };
