# Conecta Saúde

Plataforma que conecta instituições de saúde (AACD) a FabLabs universitários para a produção de órteses e próteses em impressão 3D.

- **Front-end:** HTML, CSS e JavaScript puro (pasta `Front/`)
- **Back-end:** Node.js + Express + MongoDB (pasta `Backend/`)

---

## 1. Programas necessários

Instale antes de rodar o projeto:

| Programa | Versão recomendada | Para quê | Download |
|---|---|---|---|
| **Node.js** (já inclui o npm) | 20 LTS ou superior | Executar o servidor | https://nodejs.org |
| **MongoDB Community Server** | 6.0 ou superior | Banco de dados | https://www.mongodb.com/try/download/community |
| **MongoDB Compass** (opcional) | qualquer | Ver os dados do banco numa interface | vem junto no instalador do MongoDB |
| **Navegador atualizado** | Chrome, Edge ou Firefox | Abrir o site | — |

Para conferir se estão instalados, rode no terminal:

```
node -v
npm -v
```

O MongoDB precisa estar **em execução** em `localhost:27017`. No Windows, o instalador normalmente o registra como serviço e ele inicia sozinho.

---

## 2. Dependências do back-end (npm)

Declaradas em `Backend/package.json` e instaladas com `npm install`:

| Pacote | Função no projeto |
|---|---|
| `express` | Servidor web e rotas da API |
| `mongoose` | Conexão e modelos do MongoDB |
| `dotenv` | Lê as variáveis do arquivo `.env` |
| `cors` | Permite que o front chame a API de outra origem (ex.: Live Server) |
| `bcryptjs` | Gera e confere o hash das senhas |
| `jsonwebtoken` | Cria e valida o token de login (JWT) |
| `multer` | Upload de arquivos (será usado no anexo de `.stl`) |

O front-end **não tem dependências**: não usa frameworks nem precisa de `npm`.

---

## 3. Configuração do `.env`

Crie o arquivo `Backend/.env` (há um modelo em `Backend/.env.example`):

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ConectaSaude
JWT_SECRET=troque-por-uma-frase-longa-e-aleatoria
```

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão 5000) |
| `MONGO_URI` | Endereço do MongoDB. O banco se chama `ConectaSaude` |
| `JWT_SECRET` | Segredo usado para assinar os tokens. **Obrigatório**: sem ele o servidor não inicia |

> Não envie o `.env` para o GitHub. Ele deve estar no `.gitignore`.

---

## 4. Como rodar

Todos os comandos abaixo devem ser executados **dentro da pasta `Backend`** (o erro `Could not read package.json` aparece quando o terminal está em outra pasta).

```
cd Backend
npm install
npm start
```

Quando aparecer `Conectado: ...` e `Servidor rodando na porta 5000`, abra no navegador:

**http://localhost:5000**

O servidor entrega o front-end e a API no mesmo endereço. Evite abrir o `index.html` clicando no arquivo, pois alguns navegadores não mantêm o login entre páginas nesse modo.

### Dados de teste (opcional)

```
npm run seed
```

Apaga as coleções e cria usuários, impressoras e pedidos de exemplo. Contas criadas:

| Perfil | E-mail | Senha |
|---|---|---|
| Instituição (cliente) | contato@aacd.org.br | 12345678 |
| Laboratório (fornecedor) | fablab@maua.br | 12345678 |

---

## 5. Rotas de autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria a conta e já devolve o token |
| POST | `/api/auth/login` | Entra e devolve o token |
| GET | `/api/auth/me` | Valida o token (header `Authorization: Bearer <token>`) |

---

## 6. Estrutura do projeto

```
ConectaSaude/
├── Backend/
│   ├── Config/db.js        conexão com o MongoDB
│   ├── Models/             User, Printer, Order, Message
│   ├── server.js           rotas e servidor
│   ├── seed.js             dados de exemplo
│   ├── package.json
│   └── .env
└── Front/
    ├── index.html          login e cadastro
    ├── html/               telas internas
    ├── css/
    ├── img/
    └── js/app.js           login, sessão e proteção das páginas
```

---

## 7. Problemas comuns

| Mensagem / sintoma | Causa e solução |
|---|---|
| `ENOENT ... package.json` | O terminal não está na pasta `Backend`. Use `cd Backend` |
| `Não conectado: connect ECONNREFUSED` | O MongoDB não está rodando. Inicie o serviço do MongoDB |
| `Falta JWT_SECRET no arquivo .env` | Adicione a linha `JWT_SECRET=...` ao `.env` |
| `EADDRINUSE` | A porta 5000 já está em uso. Feche o outro processo ou mude `PORT` no `.env` |
| "Não foi possível conectar ao servidor" no site | O back-end não está rodando. Rode `npm start` |
| Login antigo parou de funcionar após a atualização | Senhas agora são guardadas com hash. Rode `npm run seed` ou crie a conta de novo |
