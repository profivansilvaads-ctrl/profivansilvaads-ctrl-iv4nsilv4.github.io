// backend/server.js
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI; // Sua string de conexão do MongoDB Atlas
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log('✅ Conectado ao MongoDB');
    } catch (err) {
        console.error('❌ Erro ao conectar:', err);
    }
}
connectDB();

// Rota para salvar inscrição
app.post('/api/inscricoes', async (req, res) => {
    try {
        const { acsName, guestName, agree } = req.body;
        
        const database = client.db('seu-banco-de-dados'); // Nome do seu DB
        const inscricoes = database.collection('inscricoes');
        
        const resultado = await inscricoes.insertOne({
            acsName,
            guestName: guestName || null,
            agree,
            dataInscricao: new Date()
        });
        
        res.status(201).json({ 
            success: true, 
            id: resultado.insertedId,
            message: 'Inscrição salva com sucesso!'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Rota para listar inscrições (opcional)
app.get('/api/inscricoes', async (req, res) => {
    try {
        const database = client.db('seu-banco-de-dados');
        const inscricoes = database.collection('inscricoes');
        const todas = await inscricoes.find({}).toArray();
        res.json(todas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));