// api/inscricao.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  // Permitir CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  try {
    const { nomeACS, nomeConvidado } = req.body;

    if (!nomeACS) return res.status(400).json({ erro: 'Nome do ACS é obrigatório' });

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db('festa_acs'); // nome do banco
    const colecao = db.collection('inscricoes');

    const inscricao = {
      nomeACS: nomeACS.trim(),
      nomeConvidado: nomeConvidado ? nomeConvidado.trim() : null,
      temConvidado: !!nomeConvidado,
      dataInscricao: new Date(),
    };

    const resultado = await colecao.insertOne(inscricao);
    await client.close();

    res.status(200).json({ 
      sucesso: true, 
      id: resultado.insertedId,
      mensagem: 'Inscrição realizada com sucesso!' 
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ erro: 'Erro ao salvar inscrição. Tente novamente.' });
  }
}
