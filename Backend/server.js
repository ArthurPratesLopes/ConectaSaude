const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// 1. CADASTRO DE USUÁRIO
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nomeInstituicao, email, senha, perfil, cidade, estado } = req.body;

    if (!nomeInstituicao || !email || !senha || !perfil || !cidade || !estado) {
      return res.status(400).json({ erro: 'Preencha todos os campos.' });
    }

    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ erro: 'E-mail já cadastrado.' });
    }

    const usuario = await User.create({
      nomeInstituicao,
      email,
      senha,
      perfil,
      cidade,
      estado
    });

    res.status(201).json({
      sucesso: true,
      usuario: {
        id: usuario._id,
        nomeInstituicao: usuario.nomeInstituicao,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// 2. LOGIN DE USUÁRIO
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const usuario = await User.findOne({ email, senha });
    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    res.json({
      sucesso: true,
      usuario: {
        id: usuario._id,
        nomeInstituicao: usuario.nomeInstituicao,
        email: usuario.email,
        perfil: usuario.perfil,
        cidade: usuario.cidade,
        estado: usuario.estado
      }
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));