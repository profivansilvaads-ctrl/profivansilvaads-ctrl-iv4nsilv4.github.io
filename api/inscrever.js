const { MongoClient } = require('mongodb');

// Pegamos a URI das variáveis de ambiente do Vercel (Configuraremos no passo a passo)
const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  if (!uri) throw new Error("A variável MONGODB_URI não foi definida.");
  
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = async (req, res) => {
  // Configuração simples de CORS para permitir requisições do próprio frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const { acsName, guestName } = req.body;

    if (!acsName) {
      return res.status(400).json({ success: false, error: 'Nome principal é obrigatório.' });
    }

    const client = await connectToDatabase();
    // Nome do seu banco de dados: "festa_acs" e da coleção: "inscritos"
    const db = client.db('festa_acs');
    const collection = db.collection('inscritos');

    const novoInscrito = {
      acsName,
      guestName: guestName || null,
      dataInscricao: new Date()
    };

    await collection.insertOne(novoInscrito);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return res.status(500).json({ success: false, error: 'Erro interno ao salvar no banco de dados.' });
  }
};