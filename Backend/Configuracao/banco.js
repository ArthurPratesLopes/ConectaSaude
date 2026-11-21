const mangusto = require('mongoose');

const conectarBanco = async () => {
    try {
        const conexao = await mangusto.connect(process.env.MONGO_URI);
        console.log(`Conectado: ${conexao.connection.host}`);
    } catch (erro) {
        console.error(`Não conectado: ${erro.message}`);
        process.exit(1)
    }
};

module.exports = conectarBanco;

