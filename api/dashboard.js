const { MongoClient, ObjectId } = require('mongodb');

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Pegamos a senha e ação que o usuário enviou
    const { senha, action, id } = req.body;

    // Se a senha estiver errada ou não enviada, bloqueia o acesso
    if (!senha || (senha !== ACESSO_SENHA && senha !== SENHA_FALLBACK)) {
      return res.status(401).json({ success: false, error: 'Senha incorreta!' });
    }

    const client = await connectToDatabase();
    const db = client.db('festa_acs');
    const collection = db.collection('inscritos');

    // ── AÇÃO: EXCLUIR INSCRIÇÃO ──
    if (action === 'delete' || req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID da inscrição não informado.' });
      }

      let filter;
      try {
        filter = { _id: new ObjectId(id) };
      } catch (err) {
        filter = { _id: id };
      }

      const resultadoDelete = await collection.deleteOne(filter);

      if (resultadoDelete.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Inscrição não encontrada para exclusão.' });
      }

      return res.status(200).json({ success: true, message: 'Inscrição excluída com sucesso!' });
    }

    // ── AÇÃO: CONFIRMAR / ALTERNAR STATUS DE PAGAMENTO ──
    if (action === 'togglePayment' || action === 'updatePayment') {
      const { pago, status } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID da inscrição não informado.' });
      }

      let filter;
      try {
        filter = { _id: new ObjectId(id) };
      } catch (err) {
        filter = { _id: id };
      }

      let isPago;
      if (typeof pago === 'boolean') {
        isPago = pago;
      } else if (status) {
        isPago = (status === 'pago');
      } else {
        const doc = await collection.findOne(filter);
        if (!doc) return res.status(404).json({ success: false, error: 'Inscrição não encontrada.' });
        isPago = !(doc.pago === true || doc.statusPagamento === 'pago');
      }

      await collection.updateOne(filter, {
        $set: {
          pago: isPago,
          statusPagamento: isPago ? 'pago' : 'pendente',
          dataConfirmacaoPagamento: isPago ? new Date() : null
        }
      });

      return res.status(200).json({
        success: true,
        pago: isPago,
        message: isPago ? 'Pagamento confirmado com sucesso!' : 'Pagamento marcado como pendente.'
      });
    }

    // ── AÇÃO: LISTAR INSCRIÇÕES (Padrão) ──
    // Ordenados por ordem de inscrição (mais antigos primeiro para prioridade de vagas)
    const inscritos = await collection.find({}).sort({ dataInscricao: 1 }).toArray();
    const qtdAcs = inscritos.length;
    const qtdPagos = inscritos.filter(i => i.pago === true || i.statusPagamento === 'pago').length;
    const qtdPendentes = qtdAcs - qtdPagos;
    const totalArrecadado = qtdPagos * 15;

    return res.status(200).json({
      success: true,
      totais: {
        qtdAcs,
        qtdPagos,
        qtdPendentes,
        totalArrecadado,
        totalParticipantes: qtdAcs
      },
      lista: inscritos
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};