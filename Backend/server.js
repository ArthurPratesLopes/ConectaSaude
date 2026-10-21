const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// 1. Garante que a pasta 'uploads' existe fisicamente
const uploadsFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder);
}

// 2. Libera a pasta /uploads para o navegador conseguir baixar/visualizar os arquivos 3D
app.use('/uploads', express.static(uploadsFolder));

// 3. Configuração do Multer para salvar os arquivos .stl com nome único na pasta /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsFolder);
  },
  filename: (req, file, cb) => {
    // Ex: 1729512345678-minaprotese.stl
    const nomeUnico = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, nomeUnico);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Limite de 50MB
});

// 4. Rota de Teste de Upload
app.post('/api/upload-stl', upload.single('arquivoStl'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
  }

  // Gera a URL pública para o arquivo
  const fileUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;

  console.log(`📂 Arquivo salvo em disco: ${req.file.path}`);
  console.log(`🔗 URL pública gerada: ${fileUrl}`);

  res.json({
    sucesso: true,
    mensagem: 'Arquivo .stl enviado com sucesso!',
    nomeArquivo: req.file.filename,
    url: fileUrl
  });
});

app.get('/', (req, res) => {
  res.send('API do PrintBridge rodando!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});