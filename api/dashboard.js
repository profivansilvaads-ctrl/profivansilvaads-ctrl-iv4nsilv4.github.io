const { MongoClient } = require('mongodb');

// ── DEFINA AQUI A SENHA DE ACESSO AO PAINEL ──
const ACESSO_SENHA = process.env.ADMIN_PASSWORD || 'Araocas2026Senha';
const SENHA_FALLBACK = 'Festa30AnosSenha';

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
    if (!senha || (senha !== ACESSO_SENHA && senha !== SENHA_FALLBACK)) {
      return res.status(401).json({ success: false, error: 'Senha incorreta!' });
    }

    // Se a senha estiver certa, busca os dados no MongoDB
    const client = await connectToDatabase();
    const db = client.db('festa_acs');
    const collection = db.collection('inscritos');

    // Ordenados por ordem de inscrição (mais antigos primeiro para prioridade de vagas)
    const inscritos = await collection.find({}).sort({ dataInscricao: 1 }).toArray();

    const qtdAcs = inscritos.length;

    return res.status(200).json({
      success: true,
      totais: {
        qtdAcs,
        totalParticipantes: qtdAcs
      },
      lista: inscritos
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};