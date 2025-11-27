# 🔥 Atualize as Regras do Firestore AGORA!

## ⚠️ IMPORTANTE: As regras de segurança precisam ser aplicadas no Firebase Console

### Passo a Passo:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **pdm-guilherme**
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras** (Rules)
5. **SUBSTITUA TODO O CONTEÚDO** pelas regras abaixo
6. Clique em **Publicar** (Publish)

---

## 📋 Copie e Cole as Regras Abaixo:

```javascript
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

    // ⭐ NOVA REGRA: Badges (catálogo de badges do sistema)
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
    // Regras para documentações
    match /documentacoes/{docId} {
      // Qualquer usuário autenticado pode ler documentações
      allow read: if request.auth != null;
      
      // Colaboradores e admins podem criar documentações
      allow create: if request.auth != null && 
        isColaboradorOrAdmin() &&
        request.resource.data.autorId == request.auth.uid;
      
      // Apenas o autor ou admin pode atualizar
      allow update: if request.auth != null && 
        (resource.data.autorId == request.auth.uid || isAdmin());
      
      // Apenas o autor ou admin pode excluir
      allow delete: if request.auth != null && 
        (resource.data.autorId == request.auth.uid || isAdmin());
    }

    // Regras para tentativas (performance tracking)
    match /tentativas/{tentativaId} {
      // Usuário pode ler suas próprias tentativas
      allow read: if request.auth != null && 
        (resource.data.usuarioId == request.auth.uid || isAdmin());
      
      // Usuário pode criar tentativas (apenas para si mesmo)
      allow create: if request.auth != null &&
        request.resource.data.usuarioId == request.auth.uid;
        
      // Ninguém pode atualizar ou deletar tentativas (histórico imutável)
      allow update, delete: if false;
    }
  }
}
```

---

## ✅ Checklist de Verificação:

Após publicar as regras, verifique:

- [ ] As regras foram publicadas com sucesso (sem erros)
- [ ] Você está logado como Admin no app
- [ ] Recarregue o app completamente
- [ ] Teste criar uma nova badge
- [ ] A lista de badges deve aparecer vazia (normal se não há badges ainda)

---

## 🔍 Como Testar:

1. **Faça logout e login novamente** no app
2. Vá em **Configurações**
3. Role até a seção **"🏅 Gerenciar Badges"** (só aparece para Admin)
4. A lista deve carregar (vazia inicialmente)
5. Clique em **"Nova"** para criar a primeira badge
6. Se funcionar, as regras estão corretas! 🎉

---

## ⚠️ Se ainda houver erro:

1. Verifique se você está logado como **Admin** (não Colaborador)
2. Limpe o cache do app e recarregue
3. Verifique no Firebase Console se a coleção `usuarios` tem o campo `perfil: "Admin"` para seu usuário
4. Confirme que as regras foram publicadas sem erros de sintaxe

---

## 📝 O que mudou?

Foi adicionada a nova regra para a coleção `badges`:

```javascript
match /badges/{badgeId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null && isAdmin();
}
```

Esta regra permite:

- ✅ **Leitura**: Qualquer usuário autenticado
- ✅ **Criação/Edição/Exclusão**: Apenas Administradores
