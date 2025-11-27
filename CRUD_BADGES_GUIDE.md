# CRUD de Badges - Guia de Uso

## 📍 Localização

**Aba Configurações** → Seção "🏅 Gerenciar Badges" (visível apenas para Administradores)

## ✨ Funcionalidades

### 1. **Visualizar Badges**

- Lista todas as badges cadastradas no Firestore
- Exibe: ícone, nome, tipo, descrição, requisito e ID
- Badges organizadas por tipo

### 2. **Criar Nova Badge**

Clique no botão **"Nova"** e preencha:

#### Campos Obrigatórios:

- **ID da Badge**: Identificador único (gerado automaticamente se vazio)
  - Use apenas: letras minúsculas, números, `_` e `-`
  - Exemplo: `javascript_master`, `top-10-ranking`
- **Nome**: Título da badge
  - Exemplo: "Mestre em JavaScript"
- **Ícone (Emoji)**: Emoji representativo
  - Exemplo: 🏆, 🎯, ⭐, 🥇
- **Descrição**: Explicação da conquista
  - Exemplo: "Concluiu o curso de JavaScript avançado"

#### Tipo da Badge:

- **📚 Curso**: Badge relacionada à conclusão de curso
- **🏆 Conquista**: Badge de realização geral
- **⭐ Especial**: Badge especial/rara
- **🥇 Ranking**: Badge de posição no ranking

#### Tipo de Requisito:

| Requisito       | Descrição                    | Campo Adicional |
| --------------- | ---------------------------- | --------------- |
| **1º Curso**    | Concluir o primeiro curso    | -               |
| **Curso**       | Concluir um curso específico | ID do Curso     |
| **Múltiplos**   | Concluir N cursos            | Quantidade      |
| **Coeficiente** | Atingir coeficiente mínimo   | Percentual (%)  |
| **Sequência**   | Estudar N dias seguidos      | Dias            |
| **Ranking**     | Atingir posição no ranking   | Posição         |

### 3. **Editar Badge**

- Clique no ícone ✏️ (lápis)
- Altere os campos desejados
- **Nota**: O ID não pode ser alterado

### 4. **Excluir Badge**

- Clique no ícone 🗑️ (lixeira)
- Confirme a exclusão
- **⚠️ Importante**: Badges já conquistadas por usuários não podem ser excluídas

## 🎯 Exemplos de Uso

### Exemplo 1: Badge de Curso Específico

```
Nome: JavaScript Expert
Ícone: 🕹️
Descrição: Concluiu o curso de JavaScript Avançado
Tipo: Curso
Requisito: Curso
ID do Curso: javascript-avancado
```

### Exemplo 2: Badge de Múltiplos Cursos

```
Nome: Poliglota
Ícone: 🌍
Descrição: Concluiu 5 cursos diferentes
Tipo: Conquista
Requisito: Múltiplos
Quantidade: 5
```

### Exemplo 3: Badge de Ranking

```
Nome: Campeão Mundial
Ícone: 👑
Descrição: Primeiro lugar no ranking global
Tipo: Ranking
Requisito: Ranking
Posição: 1
```

### Exemplo 4: Badge de Coeficiente

```
Nome: Perfeccionista
Ícone: 💯
Descrição: Atingiu 95% de coeficiente
Tipo: Especial
Requisito: Coeficiente
Percentual: 95
```

## 🔄 Sistema Híbrido

O sistema funciona de forma híbrida:

### Badges Locais (Código)

- Definidas em `model/Badge.ts`
- Genéricas e sempre disponíveis
- Exemplos: "Primeiro Passo", badges de ranking padrão

### Badges Firestore (CRUD)

- Criadas dinamicamente pelos admins
- Específicas de cursos e conquistas
- Totalmente customizáveis

**Ambas são verificadas e concedidas automaticamente!**

## 🔒 Segurança

### Firestore Rules:

```javascript
match /badges/{badgeId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null && isAdmin();
}
```

- ✅ Leitura: Todos usuários autenticados
- ✅ Escrita: Apenas Administradores
- ✅ Badges conquistadas: Protegidas contra exclusão

## 🚀 Integração

As badges criadas são automaticamente:

- ✅ Incluídas na verificação de conquistas
- ✅ Concedidas quando requisitos são atingidos
- ✅ Exibidas no perfil do usuário
- ✅ Mostradas nas notificações de conquista

## 📝 Boas Práticas

1. **IDs Descritivos**: Use IDs que identifiquem claramente a badge

   - ✅ `react_master`, `python_expert`
   - ❌ `badge1`, `b123`

2. **Emojis Apropriados**: Escolha emojis que representem a conquista

   - Cursos: 📚, 🕹️, 🐍, ⚛️
   - Conquistas: 🏆, 🎯, ⭐
   - Ranking: 🥇, 🥈, 🥉, 👑

3. **Descrições Claras**: Explique exatamente como obter a badge

   - ✅ "Concluiu o curso de Python Avançado com 100%"
   - ❌ "Badge especial"

4. **Requisitos Alcançáveis**: Configure valores realistas
   - ✅ Top 10 no ranking
   - ❌ Top 1000 no ranking (se há poucos usuários)

## 🐛 Solução de Problemas

### Badge não aparece na lista

- Verifique se o admin está autenticado
- Recarregue a página

### Não consegue excluir badge

- Verifique se algum usuário já possui essa badge
- Badges conquistadas não podem ser excluídas

### Badge não é concedida automaticamente

- Verifique se o requisito está configurado corretamente
- Confirme que o tipo de requisito corresponde ao valor fornecido
- Exemplo: Requisito "Curso" precisa do campo "ID do Curso"

## 🔮 Futuras Melhorias

- [ ] Seletor de emoji visual
- [ ] Preview da badge antes de criar
- [ ] Estatísticas: quantos usuários têm cada badge
- [ ] Importar/exportar badges em JSON
- [ ] Badges temporárias (eventos especiais)
