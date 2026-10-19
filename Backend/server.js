const express = require('express'); 
const dotenv = require('dotenv'); 
const connectDB = require('./config/db'); 

dotenv.config(); 
connectDB(); 

const app = express(); 
app.use(express.json()); 

app.get('/', (req, res) => { 
    res.send('API do PrintBridge rodando com sucesso!'); 
}); 

const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => { 
    console.log(`🚀 Servidor rodando na porta ${PORT}`); 
});