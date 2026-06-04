const { MongoClient } = require('mongodb');

// ── DEFINA AQUI APENAS A SUA SENHA DE ACESSO ──
const ACESSO_SENHA = 'Festa30AnosSenha'; 

const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = async (req, res) => {
  // Configuração de CORS para permitir a leitura do frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Pegamos a senha que o usuário digitou na tela
    const { senha } = req.body;

    // Se a senha estiver errada ou não enviada, bloqueia o acesso
    if (!senha || senha !== ACESSO_SENHA) {
      return res.status(401).json({ success: false, error: 'Senha incorreta!' });
    }

    // Se a senha estiver certa, busca os dados no MongoDB
    const client = await connectToDatabase();
    const db = client.db('festa_acs');
    const collection = db.collection('inscritos');

    const inscritos = await collection.find({}).toArray();

    const qtdAcs = inscritos.length;
    const qtdConvidados = inscritos.filter(i => i.guestName && i.guestName.trim() !== '').length;
    const totalParticipantes = qtdAcs + qtdConvidados;

    return res.status(200).json({
      success: true,
      totais: {
        qtdAcs,
        qtdConvidados,
        totalParticipantes
      },
      lista: inscritos
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};