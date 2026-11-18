const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');

dotenv.config();

const connectDB = require('./Config/db');
const User = require('./Models/user');
const Message = require('./Models/Message');
const Order = require('./Models/order');
const Printer = require('./Models/printer');

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET no arquivo .env (veja .env.example).');
  process.exit(1);
}

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Serve o front-end: com o servidor ligado, abra http://localhost:5000
app.use(express.static(path.join(__dirname, '..', 'Front')));

// ---------- Auxiliares de autenticação ----------

const PERFIS_CADASTRO = ['cliente', 'fornecedor']; // 'admin' nunca pode ser criado pelo site
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function usuarioPublico(u) {
  return {
    id: u._id,
    nomeInstituicao: u.nomeInstituicao,
    email: u.email,
    perfil: u.perfil,
    cidade: u.cidade,
    estado: u.estado
  };
}

// Middleware: use em rotas que exigem login (header "Authorization: Bearer <token>")
function exigirLogin(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  }
}

// ---------- Cadastro ----------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nomeInstituicao, email, senha, perfil, cidade, estado } = req.body;

    if (!nomeInstituicao || !email || !senha || !perfil || !cidade || !estado) {
      return res.status(400).json({ erro: 'Preencha todos os campos.' });
    }
    if (!EMAIL_VALIDO.test(email)) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }
    if (String(senha).length < 8) {
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 8 caracteres.' });
    }
    if (!PERFIS_CADASTRO.includes(perfil)) {
      return res.status(400).json({ erro: 'Perfil inválido.' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    if (await User.findOne({ email: emailNormalizado })) {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }

    // A senha vira hash dentro do model (pre-save)
    const usuario = await User.create({
      nomeInstituicao, email: emailNormalizado, senha, perfil, cidade, estado
    });

    res.status(201).json({
      sucesso: true,
      token: gerarToken(usuario),
      usuario: usuarioPublico(usuario)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ erro: 'Dados inválidos.' });
    }
    console.error(error);
    res.status(500).json({ erro: 'Erro interno ao criar a conta.' });
  }
});

// ---------- Login ----------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const usuario = await User
      .findOne({ email: String(email).trim().toLowerCase() })
      .select('+senha');

    // Mesma mensagem para "e-mail não existe" e "senha errada" (não revela quais e-mails existem)
    if (!usuario || !(await usuario.conferirSenha(String(senha)))) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    res.json({
      sucesso: true,
      token: gerarToken(usuario),
      usuario: usuarioPublico(usuario)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro interno ao entrar.' });
  }
});

// ---------- Quem sou eu (valida o token e devolve o usuário) ----------
app.get('/api/auth/me', exigirLogin, async (req, res) => {
  try {
    const usuario = await User.findById(req.auth.id);
    if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado.' });
    res.json({ sucesso: true, usuario: usuarioPublico(usuario) });
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ---------- Pedidos da instituição ----------
const pastaUploads = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(pastaUploads));

const upload = multer({
  storage: multer.diskStorage({
    destination: pastaUploads,
    filename: (req, file, cb) => cb(null, Date.now() + '.stl')
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.originalname.toLowerCase().endsWith('.stl'))
});

app.get('/api/laboratorios', exigirLogin, async (req, res) => {
  const [labs, impressoras] = await Promise.all([
    User.find({ perfil: 'fornecedor' }).sort('nomeInstituicao').lean(),
    Printer.find().lean()
  ]);
  res.json({ sucesso: true, laboratorios: labs.map((l) => ({ ...l, impressoras: impressoras.filter((i) => String(i.fornecedorId) === String(l._id)) })) });
});

const filtroPedidos = (req) => req.auth.perfil === 'fornecedor'
  ? { $or: [{ fornecedorId: req.auth.id }, { fornecedorId: null }] }
  : { clienteId: req.auth.id };

// Meus pedidos
app.get('/api/orders', exigirLogin, async (req, res) => {
  const pedidos = await Order.find(filtroPedidos(req))
    .populate('fornecedorId', 'nomeInstituicao')
    .populate('clienteId', 'nomeInstituicao')
    .sort({ createdAt: -1 });
  res.json({ sucesso: true, pedidos });
});

// Um pedido meu
app.get('/api/orders/:id', exigirLogin, async (req, res) => {
  try {
    const pedido = await Order.findOne({ _id: req.params.id, ...filtroPedidos(req) })
      .populate('fornecedorId', 'nomeInstituicao')
      .populate('clienteId', 'nomeInstituicao');
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    res.json({ sucesso: true, pedido });
  } catch (error) {
    res.status(404).json({ erro: 'Pedido não encontrado.' });
  }
});

app.patch('/api/orders/:id/status', exigirLogin, async (req, res) => {
  if (req.auth.perfil !== 'fornecedor') return res.status(403).json({ erro: 'Somente laboratórios podem alterar o status.' });
  const pedido = await Order.findOne({ _id: req.params.id, ...filtroPedidos(req) }).catch(() => null);
  if (!pedido || !Order.schema.path('status').enumValues.includes(req.body.status)) return res.status(400).json({ erro: 'Pedido ou status inválido.' });
  pedido.status = req.body.status;
  pedido.fornecedorId = req.auth.id;
  await pedido.save();
  res.json({ sucesso: true });
});

// Novo pedido (formulário com arquivo .stl)
function exigirInstituicao(req, res, next) {
  if (req.auth.perfil !== 'cliente') {
    return res.status(403).json({ erro: 'Somente instituições podem enviar pedidos.' });
  }
  next();
}

app.post('/api/orders', exigirLogin, exigirInstituicao, upload.single('arquivoStl'), async (req, res) => {
  try {
    const { paciente, peca, material, prazo, medidas, urgencia, fornecedorId } = req.body;
    if (!paciente || !peca || !prazo || !req.file) {
      return res.status(400).json({ erro: 'Preencha código do paciente, tipo de peça, prazo e anexe o arquivo .stl.' });
    }

    const total = await Order.countDocuments();
    const pedido = await Order.create({
      codigo: `CS-${new Date().getFullYear()}-${String(total + 1).padStart(4, '0')}`,
      clienteId: req.auth.id,
      fornecedorId: fornecedorId || undefined,
      paciente, peca, prazo, urgencia,
      material: material || undefined,
      observacoesTecnicas: medidas,
      arquivoUrl: '/uploads/' + req.file.filename
    });
    res.status(201).json({ sucesso: true, pedido });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ erro: 'Dados inválidos.' });
    console.error(error);
    res.status(500).json({ erro: 'Erro interno ao registrar o pedido.' });
  }
});

const meuPedido = (id, usuarioId) => Order.findOne({ _id: id, $or: [{ clienteId: usuarioId }, { fornecedorId: usuarioId }] }).catch(() => null);

app.get('/api/messages/:orderId', exigirLogin, async (req, res) => {
  if (!(await meuPedido(req.params.orderId, req.auth.id))) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  const mensagens = await Message.find({ orderId: req.params.orderId }).populate('remetenteId', 'nomeInstituicao').sort({ createdAt: 1 });
  res.json({ sucesso: true, mensagens });
});

app.post('/api/messages', exigirLogin, async (req, res) => {
  const { orderId, texto } = req.body;
  if (!texto || !texto.trim() || !(await meuPedido(orderId, req.auth.id))) return res.status(400).json({ erro: 'Mensagem ou pedido inválido.' });
  const mensagem = await Message.create({ orderId, remetenteId: req.auth.id, texto: texto.trim() });
  res.status(201).json({ sucesso: true, mensagem });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));