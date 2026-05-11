# Execlog — Plataforma Mobile de Aprendizagem em Programação

Aplicativo mobile educacional desenvolvido como Trabalho de Conclusão de Curso (TCC) para a disciplina de Programação para Dispositivos Móveis. A plataforma permite que alunos aprendam programação por meio de cursos interativos com exercícios de múltipla escolha, escrita de código e ordenação de blocos, com execução real de código em sandbox isolado.

---

## Objetivo

Criar uma plataforma gamificada de ensino de programação onde:

- **Alunos** progridem por cursos, respondem exercícios e acompanham seu desempenho por meio de coeficiente de conhecimento, ranking e conquistas (badges).
- **Colaboradores** submetem novos cursos para aprovação, contribuindo com o banco de conteúdo.
- **Moderadores** aprovam ou rejeitam cursos e gerenciam o conteúdo da plataforma.

---

## Funcionalidades

### Para Alunos
- Cadastro, login e recuperação de senha via Firebase Auth
- Catálogo de cursos com níveis (Iniciante, Intermediário, Avançado) e categorias
- **Modo Prática:** resolve exercícios sem pontuação para treinar o conteúdo
- **Modo Avaliação:** desbloqueado após concluir a prática; respostas valem pontos de coeficiente
- Três tipos de exercício por página de curso:
  - **Quiz (múltipla escolha)** com explicação pós-resposta
  - **Escrita de código** com execução real via Jobe sandbox (Python 3, JavaScript/Node.js, C, SQL/SQLite)
  - **Ordenação de blocos de código** — montar a sequência correta de instruções
- Feedback detalhado por caso de teste (saída esperada vs. obtida, similaridade, dicas)
- **Coeficiente de Conhecimento** — métrica acumulada de desempenho com decaimento por inatividade
- **Ranking** global de alunos
- **Badges/Conquistas** — desbloqueadas por conclusão de cursos, desempenho, sequência de dias e posição no ranking
- Sequência de dias estudados (weekly streak)
- Dashboard com resumo de progresso e cursos em destaque
- Modal de desempenho por curso com gráficos (pizza e linha) e análise por questão
- Perfil público com foto, nível e conquistas

### Para Colaboradores
- Criação de cursos com editor de conteúdo e upload de XML estruturado
- Editor de exercícios: quiz, escrita de código (com gabarito e casos de teste) e blocos
- Vinculação de documentação de referência ao curso
- Acompanhamento do status de aprovação das submissões (Pendente / Aprovado / Rejeitado)

### Para Moderadores
- Painel de solicitações pendentes (criação e exclusão de cursos)
- Aprovação ou rejeição com justificativa
- Gerenciamento completo do catálogo de cursos

### Geral
- Tema claro e escuro (Material Design 3)
- Envio de feedback pelo botão flutuante (FAB) disponível em todas as telas
- Firebase Analytics com rastreamento automático de telas e eventos personalizados
- Notificações push via Expo Notifications

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework mobile | React Native 0.81 + Expo SDK 54 |
| Navegação | Expo Router 6 (file-based routing) |
| UI / Design System | React Native Paper 5 (Material Design 3) |
| Linguagem | TypeScript |
| Autenticação | Firebase Authentication |
| Banco de dados | Cloud Firestore |
| Armazenamento de arquivos | Firebase Storage (XMLs, imagens) |
| Analytics | @react-native-firebase/analytics |
| Execução de código | Jobe API (sandbox isolado com cputime de 5s) |
| Gráficos | react-native-chart-kit |
| Imagens | expo-image |
| Notificações | expo-notifications |
| Formulários | react-hook-form + yup |
| Build / Deploy | EAS Build + EAS Update |
| Testes | Vitest |

---

## Linguagens Suportadas nos Exercícios de Código

| Linguagem | Runner no Jobe | Extensão |
|---|---|---|
| Python 3 | `python3` | `.py` |
| JavaScript (Node.js) | `nodejs` | `.js` |
| C | `c` | `.c` |
| SQL (SQLite) | `sqlite3` | `.sql` |

A execução é protegida contra loops infinitos via limite de CPU de 5 segundos. Caracteres especiais e aspas tipográficas do teclado mobile são normalizados automaticamente antes do envio ao servidor.

---

## Estrutura do Projeto

```
app/
  (tabs)/           # Telas principais (Dashboard, Cursos, Ranking, Perfil, etc.)
  curso/[id].tsx    # Tela de execução do curso (viewer de páginas e exercícios)
  gerenciar-cursos.tsx      # Painel do colaborador
  gerenciar-documentacao.tsx
  signIn / signUp / recuperarSenha

components/
  CourseList / CourseDetailModal  # Listagem e detalhes de cursos
  CursoViewer                     # Renderizador de páginas e exercícios
  CodeEditor                      # Editor de código com execução Jobe
  CodeBlocksEditor                # Editor de blocos de código
  PerformanceModal                # Análise de desempenho com gráficos
  BadgeManager / WeeklyStreak     # Gamificação

services/
  curso/      # CursoService, ColaboradorCursoService, CourseStatsService
  codigo/     # JobeService (execução e comparação de saídas)
  badge/      # BadgeService, BadgeAdminService
  shared/     # AnalyticsService, RankingService, TentativaService, DashboardService, ...
  image/      # ImageService, ImageUploadService, ImageCacheService

model/        # Interfaces TypeScript: Curso, Usuario, Badge, Tentativa, Solicitacao...
config/       # CourseConfig, Config (Jobe URLs)
firebase/     # FirebaseInit
context/      # AuthProvider, UserProvider, ThemeProvider
```

---

## Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npx expo start
```

> O app requer **Expo Development Client** para funcionar completamente (Firebase Analytics e módulos nativos não funcionam no Expo Go padrão). Use `expo-dev-client` ou gere um APK de desenvolvimento.

---

## Gerar APK para Distribuição

O projeto usa **EAS Build** com perfil `preview` configurado para gerar um APK instalável diretamente em dispositivos Android.

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login na conta Expo
eas login

# Gerar APK (build na nuvem)
eas build --profile preview --platform android
```

Ao finalizar, o EAS disponibiliza um link de download. O arquivo `.apk` pode ser instalado em qualquer dispositivo Android com "instalar de fontes desconhecidas" habilitado.

---

## Variáveis de Ambiente

As URLs do servidor Jobe e a chave de API estão configuradas em `app.json` dentro de `extra`. Para ambiente de produção, defina via EAS Secrets:

```bash
eas secret:create --name JOBE_BASE_URL --value "https://seu-servidor-jobe/"
eas secret:create --name JOBE_API_KEY  --value "sua-chave"
```

O arquivo `google-services.json` (Firebase Android) deve estar na raiz do projeto e ser atualizado sempre que um novo app Android for adicionado no Firebase Console.

---

## Testes

```bash
# Executar todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

---

## Perfis de Usuário

| Perfil | Permissões |
|---|---|
| Aluno | Acessa cursos, resolve exercícios, visualiza ranking e conquistas |
| Colaborador | Tudo do Aluno + cria e submete cursos para aprovação |
| Moderador | Tudo do Colaborador + aprova/rejeita cursos e gerencia a plataforma |

---

## Desenvolvedor

**Guilherme Dravanz** — Trabalho de Conclusão de Curso  
Disciplina: Programação para Dispositivos Móveis
