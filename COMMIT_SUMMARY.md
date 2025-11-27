# Resumo do Commit

## App & Tabs
- `app/(tabs)/colaboracao.tsx`: Refatorado para usar Modal e melhor UX.
- `app/(tabs)/configuracoes.tsx`: Refatorado Badge Dialog para Modal.
- `app/(tabs)/cursos.tsx`: Adicionado modal de desempenho do usuário.
- `app/(tabs)/index.tsx`: Atualizações para exibir estatísticas de cursos.
- `app/_layout.tsx`: Configuração de providers e navegação.
- `app/curso/[id].tsx`: Lógica de resposta e salvamento de tentativas.

## Components
- `components/DocumentationList.tsx`: Atualização em tempo real das documentações.
- `components/FeaturedCourses.tsx`: Melhorias visuais e integração de dados.
- `components/PerformanceModal.tsx`: Novo componente para análise de desempenho.
- `components/CursoViewer.tsx`: Alerta com link para documentação.
- `components/ParallaxScrollView.tsx`: Ajustes de layout e scroll.
- `components/ThemedText.tsx`: Padronização de tipografia.
- `components/ThemedView.tsx`: Padronização de containers.
- `components/ExternalLink.tsx`: Componente para links externos.
- `components/HelloWave.tsx`: Animação de boas-vindas.
- `components/Collapsible.tsx`: Componente de lista expansível.
- `components/HapticTab.tsx`: Feedback tátil para abas.

## Models
- `model/Curso.ts`: Adicionado campos de tentativas e documentação.
- `model/Documentacao.ts`: Definição de tipos para documentação.
- `model/Tentativa.ts`: Novo modelo para rastreamento de tentativas.
- `model/Badge.ts`: Definição de modelo de medalhas.
- `model/Perfil.ts`: Definição de tipos de perfil.
- `model/Usuario.ts`: Definição de modelo de usuário.

## Services
- `services/badge/BadgeAdminService.ts`: Gestão administrativa de badges.
- `services/badge/BadgeService.ts`: Lógica de negócio para badges.
- `services/curso/ColaboradorCursoService.ts`: Serviços para colaboradores de curso.
- `services/curso/CourseStatsService.ts`: Cálculo de estatísticas de cursos.
- `services/curso/CursoService.ts`: Integração com tentativas e decaimento.
- `services/image/ImageCacheService.ts`: Cacheamento de imagens.
- `services/image/ImageService.ts`: Manipulação de imagens.
- `services/image/ImageUploadService.ts`: Upload de imagens para storage.
- `services/questao/BancoQuestoesService.ts`: Gestão do banco de questões.
- `services/questao/QuestaoService.ts`: Lógica para questões individuais.
- `services/shared/DashboardService.ts`: Dados para o dashboard principal.
- `services/shared/DecayService.ts`: Lógica de decaimento de pontuação.
- `services/shared/DocumentacaoService.ts`: Listener em tempo real para docs.
- `services/shared/RankingService.ts`: Cálculo de ranking de usuários.
- `services/shared/SolicitacaoService.ts`: Gestão de solicitações de colaboração.
- `services/shared/TentativaService.ts`: Serviço para salvar/ler tentativas.
- `services/XMLParser.ts`: Parser para importar cursos XML.

## Documentation & Config
- `ATUALIZAR_REGRAS_FIRESTORE.md`: Novas regras de segurança para tentativas.
- `BADGES_PROPOSAL.md`: Proposta de sistema de gamificação.
- `CRUD_BADGES_GUIDE.md`: Guia para gestão de badges.
- `DOCUMENTACAO_TCC.txt`: Documentação geral do projeto.
- `ESTRUTURA_PROJETO_TCC.md`: Estrutura de pastas e arquivos.
- `SCALABILITY_GUIDE.md`: Guia de escalabilidade do sistema.
- `ANALISE_ARQUIVOS.md`: Análise de estrutura de arquivos.
- `firebase/FirebaseInit.ts`: Inicialização do Firebase.
- `hooks/useColorScheme.ts`: Hook para tema claro/escuro.
- `hooks/useThemeColor.ts`: Hook para cores do tema.
- `constants/Colors.ts`: Definição de paleta de cores.
- `config/CourseConfig.ts`: Configurações estáticas de cursos.

## Assets & Others
- `assets/images/*`: Imagens e ícones do projeto.
- `assets/fonts/*`: Fontes personalizadas.
- `scripts/*`: Scripts de automação.
- `changes.txt`: Lista temporária de alterações.
