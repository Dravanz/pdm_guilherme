# Proposta: Sistema Híbrido de Badges

## Situação Atual

- Badges definidas localmente em `model/Badge.ts`
- Sistema funcional com badges genéricas e específicas de cursos
- Badges específicas: JavaScript, Python, React (hardcoded)

## Problema

Quando um colaborador cria um novo curso, não há como automaticamente criar uma badge para ele sem editar código.

## Solução Proposta: Sistema Híbrido

### 1. Badges do Sistema (Locais - `Badge.ts`)

Mantidas no código por serem genéricas e independentes de cursos:

- ✅ Primeiro Passo (primeiro curso concluído)
- ✅ Mestre dos Cursos (3+ cursos)
- ✅ Alto Desempenho (coeficiente > 90%)
- ✅ Aprendiz Dedicado (7 dias consecutivos)
- ✅ Badges de Ranking (Top 1, 3, 5, 10, 20)

### 2. Badges de Curso (Firestore)

Armazenadas no Firestore, vinculadas ao curso:

```typescript
// Estrutura no documento do curso
interface Curso {
  // ... campos existentes
  badge?: {
    ativo: boolean;
    nome: string;
    icone: string;
    descricao: string;
  };
}
```

### 3. Implementação

#### 3.1. Atualizar modelo Badge.ts

```typescript
export interface Badge {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  tipo: "curso" | "conquista" | "especial" | "ranking";
  requisitos: BadgeRequisito;
  dataObtencao?: Date;
  usuarioId?: string;
  cursoId?: string; // Para badges de curso dinâmicas
  origem: "sistema" | "curso"; // Novo campo
}
```

#### 3.2. Atualizar formulário de criação de curso

Adicionar seção opcional "Badge do Curso":

- Checkbox: "Criar badge para este curso"
- Campo: Nome da badge (ex: "HTML5 Expert")
- Campo: Ícone (emoji picker ou lista)
- Campo: Descrição (ex: "Concluiu o curso de HTML5")

#### 3.3. Atualizar BadgeService

```typescript
static async verificarEConcederBadges(usuarioId: string, cursoId?: string) {
  const novasBadges: Badge[] = [];

  // 1. Verificar badges do sistema (locais)
  for (const badge of BADGES_DISPONIVEIS) {
    // ... lógica existente
  }

  // 2. Verificar badge do curso (Firestore)
  if (cursoId) {
    const cursoBadge = await this.verificarBadgeCurso(usuarioId, cursoId);
    if (cursoBadge) {
      novasBadges.push(cursoBadge);
    }
  }

  return novasBadges;
}

static async verificarBadgeCurso(usuarioId: string, cursoId: string) {
  const cursoRef = doc(firestore, 'cursos', cursoId);
  const cursoSnap = await getDoc(cursoRef);

  if (cursoSnap.exists() && cursoSnap.data().badge?.ativo) {
    const badgeId = `badge_${cursoId}`;
    const jaTemBadge = await this.usuarioTemBadge(usuarioId, badgeId);

    if (!jaTemBadge) {
      const badge: Badge = {
        id: badgeId,
        nome: cursoSnap.data().badge.nome,
        icone: cursoSnap.data().badge.icone,
        descricao: cursoSnap.data().badge.descricao,
        tipo: 'curso',
        cursoId: cursoId,
        origem: 'curso',
        requisitos: { tipo: 'curso_concluido', cursoId }
      };

      await this.concederBadge(usuarioId, badge);
      return badge;
    }
  }

  return null;
}
```

### 4. Vantagens

✅ **Flexibilidade**: Colaboradores podem criar badges customizadas
✅ **Sem código**: Não precisa editar código para adicionar badges de curso
✅ **Compatibilidade**: Mantém badges do sistema funcionando
✅ **Escalabilidade**: Suporta infinitos cursos com badges únicas
✅ **Opcional**: Colaborador decide se quer badge ou não

### 5. Migração de Badges Existentes

Opcional: Migrar badges hardcoded (JS, Python, React) para o Firestore:

```typescript
// Script de migração uma única vez
const migrarBadgesParaCursos = async () => {
  await updateDoc(doc(firestore, "cursos", "javascript-basico"), {
    badge: {
      ativo: true,
      nome: "JavaScript Básico",
      icone: "🕹️",
      descricao: "Concluiu o curso de JavaScript Básico",
    },
  });

  // Repetir para Python e React
};
```

Depois remover do `BADGES_DISPONIVEIS` local.

### 6. Interface do Usuário

Na criação/edição de curso, adicionar card:

```tsx
<Card>
  <Card.Title title="Badge do Curso (Opcional)" />
  <Card.Content>
    <Switch
      value={badgeAtiva}
      onValueChange={setBadgeAtiva}
      label="Criar badge para este curso"
    />

    {badgeAtiva && (
      <>
        <TextInput label="Nome da Badge" value={badgeNome} />
        <TextInput label="Ícone (emoji)" value={badgeIcone} />
        <TextInput label="Descrição" value={badgeDescricao} />
      </>
    )}
  </Card.Content>
</Card>
```

## Conclusão

**Recomendo implementar o sistema híbrido** porque:

1. Mantém badges genéricas eficientes (no código)
2. Permite badges customizadas por curso (no Firestore)
3. Não quebra funcionalidade existente
4. Dá autonomia aos colaboradores
5. Escalável para futuro

**Alternativa mais simples**: Manter tudo como está e documentar que badges de curso específicas precisam ser adicionadas por desenvolvedores no código. Funciona bem para projetos menores.
