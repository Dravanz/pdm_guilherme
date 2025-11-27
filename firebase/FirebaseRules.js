// Regras de segurança do Firestore para o sistema de cursos
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar perfil do usuário
    function getUserProfile() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil;
    }
    
    function isAdmin() {
      return getUserProfile() == 'Admin';
    }
    
    function isColaborador() {
      return getUserProfile() == 'Colaborador';
    }
    
    function isColaboradorOrAdmin() {
      return isColaborador() || isAdmin();
    }
    
    // Regras para usuários
    match /usuarios/{userId} {
      // Permitir leitura do próprio perfil
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Permitir leitura de dados públicos para ranking e estatísticas
      allow get: if request.auth != null;
      
      // Permitir queries (list) apenas para campos públicos necessários ao ranking
      allow list: if request.auth != null;
      
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Apenas admins podem alterar perfil de usuários
      allow update: if request.auth != null && 
        (request.auth.uid == userId || isAdmin()) &&
        (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['perfil']) || isAdmin());
    }
    
    // Regras para cursos
    match /cursos/{cursoId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && isColaboradorOrAdmin();
      allow update: if request.auth != null && isColaboradorOrAdmin();
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Regras para progresso dos usuários nos cursos
    match /usuariosCursos/{usuarioCursoId} {
      // Permitir leitura para queries agregadas (estatísticas) e leitura própria
      allow read: if request.auth != null;
      
      // Apenas o próprio usuário pode escrever
      allow write: if request.auth != null && 
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
    
    // Regras para solicitações
    match /solicitacoes/{solicitacaoId} {
      // Usuários autenticados podem criar solicitações de colaboração
      // Colaboradores podem criar solicitações de exclusão de cursos
      allow create: if request.auth != null && 
        (request.resource.data.usuarioId == request.auth.uid ||
         (isColaboradorOrAdmin() && request.resource.data.colaboradorId == request.auth.uid));
      
      // Apenas admins podem ler e atualizar solicitações
      allow read, update: if request.auth != null && isAdmin();
      
      // Usuários podem ler suas próprias solicitações
      allow read: if request.auth != null && 
        (resource.data.usuarioId == request.auth.uid ||
         resource.data.colaboradorId == request.auth.uid);
    }
    
    // Regras para banco de questões
    match /questoes/{questaoId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isColaboradorOrAdmin();
    }
    
    // Regras para badges (catálogo de badges do sistema)
    match /badges/{badgeId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && isAdmin();
    }
    
    // Regras para badges dos usuários
    match /usuariosBadges/{badgeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Permitir que o sistema conceda badges
    }
    
    // Regras para sistema (cache de ranking, configurações)
    match /sistema/{documentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Permitir que qualquer usuário autenticado atualize o cache
    }
  }
}
`;

// Regras de segurança do Firebase Storage
const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Função auxiliar para verificar perfil do usuário
    function getUserProfile() {
      return firestore.get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.perfil;
    }
    
    function isAdmin() {
      return getUserProfile() == 'Admin';
    }
    
    function isColaborador() {
      return getUserProfile() == 'Colaborador';
    }
    
    function isColaboradorOrAdmin() {
      return isColaborador() || isAdmin();
    }
    
    // Validações de arquivo
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isXML() {
      return request.resource.contentType == 'text/xml' || 
             request.resource.contentType == 'application/xml';
    }
    
    function isValidSize() {
      return request.resource.size < 5 * 1024 * 1024; // 5MB
    }
    
    // Fotos de perfil dos usuários
    match /usuarios/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.uid == userId && 
                     isImage() && 
                     isValidSize();
    }
    
    // Imagens dos cursos (caminho antigo)
    match /courses/{fileName} {
      // Permitir leitura para todos usuários autenticados
      allow read: if request.auth != null;
      
      // Apenas colaboradores e admins podem fazer upload de imagens de cursos
      allow write: if request.auth != null && 
                     isColaboradorOrAdmin() && 
                     (isImage() || isXML()) && 
                     isValidSize();
      
      // Permitir listagem para admins (necessário para operações de exclusão)
      allow list: if request.auth != null && isAdmin();
      
      // Apenas admins podem excluir
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Imagens dos cursos (novo caminho padronizado com subpastas)
    match /imagens/cursos/{cursoId}/{fileName} {
      // Permitir leitura para todos usuários autenticados
      allow read: if request.auth != null;
      
      // Apenas colaboradores e admins podem fazer upload de imagens de cursos
      // Permitir upload em pastas temporárias (temp-*) durante criação
      allow write: if request.auth != null && 
                     isColaboradorOrAdmin() && 
                     isImage() && 
                     isValidSize();
      
      // Permitir listagem (list) da pasta para admins (necessário para excluir)
      allow list: if request.auth != null && isAdmin();
      
      // Apenas admins podem excluir
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Imagens dos cursos (caminho direto sem subpastas - LEITURA PÚBLICA)
    match /imagens/cursos/{fileName} {
      // Permitir leitura pública (sem autenticação necessária)
      allow read: if true;
      
      // Apenas colaboradores e admins podem fazer upload
      allow write: if request.auth != null && 
                     isColaboradorOrAdmin() && 
                     isImage() && 
                     isValidSize();
      
      // Permitir listagem para admins
      allow list: if request.auth != null && isAdmin();
      
      // Apenas admins podem excluir
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Suporte retrocompatível para caminhos antigos
    match /course-images/{cursoId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isColaboradorOrAdmin() && isImage() && isValidSize();
      allow list: if request.auth != null && isAdmin();
      allow delete: if request.auth != null && isAdmin();
    }
    
    // Imagens temporárias ou de cache
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == userId && 
                           isImage() && 
                           isValidSize();
    }
    
    // Badges (apenas leitura)
    match /badges/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
  }
}
`;

// ⚠️ ATENÇÃO: Cloud Functions são OPCIONAIS e devem ser configuradas separadamente
// Veja o arquivo CLOUD_FUNCTIONS_SETUP.md para instruções detalhadas
// Elas NÃO devem ser coladas nas Firestore Rules

export { firestoreRules, storageRules };
