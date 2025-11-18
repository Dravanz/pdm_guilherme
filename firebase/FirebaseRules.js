// Regras de segurança do Firestore para o sistema de cursos
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regras para usuários
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para cursos (apenas leitura para usuários autenticados)
    match /cursos/{cursoId} {
      allow read: if request.auth != null;
      allow write: if false; // Apenas admins podem criar/editar cursos
    }
    
    // Regras para progresso dos usuários nos cursos
    match /usuariosCursos/{usuarioCursoId} {
      allow read, write: if request.auth != null && 
        resource.data.usuarioId == request.auth.uid;
      
      // Validações para criação/atualização
      allow create: if request.auth != null && 
        request.resource.data.usuarioId == request.auth.uid &&
        request.resource.data.keys().hasAll(['usuarioId', 'cursoId', 'coeficiente', 'paginaAtual']) &&
        request.resource.data.coeficiente >= 0 &&
        request.resource.data.coeficiente <= 100 &&
        request.resource.data.paginaAtual >= 1;
      
      allow update: if request.auth != null && 
        resource.data.usuarioId == request.auth.uid &&
        // Não permite alterar usuarioId e cursoId
        request.resource.data.usuarioId == resource.data.usuarioId &&
        request.resource.data.cursoId == resource.data.cursoId &&
        // Validações de coeficiente
        request.resource.data.coeficiente >= 0 &&
        request.resource.data.coeficiente <= 100 &&
        // Não permite diminuir o número de questões respondidas
        request.resource.data.questoesRespondidas.size() >= resource.data.questoesRespondidas.size() &&
        request.resource.data.questoesCorretas.size() >= resource.data.questoesCorretas.size();
    }
    
    // Regras para ranking (apenas leitura)
    match /ranking/{rankingId} {
      allow read: if request.auth != null;
      allow write: if false; // Gerado automaticamente por Cloud Functions
    }
  }
}
`;

// Funções Cloud Functions para manter integridade dos dados
const cloudFunctions = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Função para atualizar coeficiente total quando usuário responde questão
exports.atualizarCoeficienteTotal = functions.firestore
  .document('usuariosCursos/{usuarioCursoId}')
  .onUpdate(async (change, context) => {
    const novosDados = change.after.data();
    const usuarioId = novosDados.usuarioId;
    
    // Buscar todos os cursos do usuário
    const usuariosCursosRef = db.collection('usuariosCursos');
    const snapshot = await usuariosCursosRef
      .where('usuarioId', '==', usuarioId)
      .get();
    
    let coeficienteTotal = 0;
    let totalCursos = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      coeficienteTotal += data.coeficiente;
      totalCursos++;
    });
    
    const coeficienteMedio = totalCursos > 0 ? Math.round(coeficienteTotal / totalCursos) : 0;
    
    // Atualizar usuário
    await db.collection('usuarios').doc(usuarioId).update({
      coeficienteConhecimento: coeficienteMedio
    });
  });

// Função para gerar ranking automaticamente
exports.gerarRanking = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef
      .orderBy('coeficienteConhecimento', 'desc')
      .limit(100)
      .get();
    
    const ranking = [];
    let posicao = 1;
    
    snapshot.forEach(doc => {
      const usuario = doc.data();
      ranking.push({
        posicao,
        usuarioId: doc.id,
        nome: usuario.nome,
        coeficiente: usuario.coeficienteConhecimento || 0,
        urlFoto: usuario.urlFoto
      });
      posicao++;
    });
    
    // Salvar ranking
    await db.collection('ranking').doc('global').set({
      ranking,
      dataAtualizacao: admin.firestore.FieldValue.serverTimestamp()
    });
  });

// Função para validar integridade dos dados
exports.validarIntegridade = functions.firestore
  .document('usuariosCursos/{usuarioCursoId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    
    const dados = change.after.data();
    
    // Validações de integridade
    if (dados.questoesCorretas.length > dados.questoesRespondidas.length) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Número de questões corretas não pode ser maior que respondidas'
      );
    }
    
    if (dados.coeficiente < 0 || dados.coeficiente > 100) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Coeficiente deve estar entre 0 e 100'
      );
    }
  });
`;

export { firestoreRules, cloudFunctions };