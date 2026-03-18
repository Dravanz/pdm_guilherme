import { CursoViewer } from "@/components/CursoViewer";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Curso, UsuarioCurso } from "@/model/Curso";
import { Documentacao } from "@/model/Documentacao";
import { CursoService } from "@/services/curso/CursoService";
import { DocumentacaoService } from "@/services/shared/DocumentacaoService";
import { router, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Button,
    Chip,
    IconButton,
    Modal,
    Portal,
    ProgressBar as PaperProgressBar,
    Text,
    useTheme
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CursoDetalhes() {
  const { id, modo } = useLocalSearchParams<{ id: string; modo?: string }>();
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);

  const [curso, setCurso] = useState<Curso | null>(null);
  const [progressoCurso, setProgressoCurso] = useState<UsuarioCurso | null>(
    null
  );
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [modoRevisao, setModoRevisao] = useState(false);
  const [modoTreino, setModoTreino] = useState(false);
  const [respostasRevisao, setRespostasRevisao] = useState<string[]>([]);
  
  // Documentação vinculada
  const [documentacao, setDocumentacao] = useState<Documentacao | null>(null);
  const [modalDocVisivel, setModalDocVisivel] = useState(false);

  useEffect(() => {
    carregarCurso();
  }, [id]);

  // Agendar notificação ao sair do curso
  useEffect(() => {
    return () => {
      if (curso && !modoRevisao && !modoTreino && modo !== "preview") {
        import("@/services/shared/NotificationService").then(({ NotificationService }) => {
            NotificationService.scheduleCourseReminder(curso.titulo);
        });
      }
    };
  }, [curso, modoRevisao, modoTreino, modo]);

  const carregarCurso = async () => {
    if (!id) {
      setCarregando(false);
      return;
    }

    if (!user) {
      setTimeout(() => carregarCurso(), 1000);
      return;
    }

    try {
      setCarregando(true);

      const cursoCarregado = await CursoService.carregarCursoXML(
        id,
        user?.urlFoto
      );
      setCurso(cursoCarregado);

      console.log("Curso carregado:", cursoCarregado.titulo, "DocID:", cursoCarregado.documentacaoId);

      // Carregar documentação vinculada se houver
      if (cursoCarregado.documentacaoId) {
        try {
          console.log("Buscando documentação:", cursoCarregado.documentacaoId);
          const doc = await DocumentacaoService.obterDocumentacaoPorId(cursoCarregado.documentacaoId);
          console.log("Documentação encontrada:", doc ? doc.titulo : "null");
          setDocumentacao(doc);
        } catch (error) {
          console.error("Erro ao carregar documentação vinculada:", error);
        }
      } else {
        console.log("Nenhuma documentação vinculada a este curso.");
      }

      const isRevisao = modo === "revisao";
      const isPreview = modo === "preview";
      const isTreino = modo === "treino";
      setModoRevisao(isRevisao);
      setModoTreino(isTreino);

      // Filtrar páginas se for preview
      if (isPreview) {
        console.log(`[CursoDetalhes] Preview Mode: Filtering content pages only. Total before: ${cursoCarregado.paginas.length}`);
        cursoCarregado.paginas = cursoCarregado.paginas.filter(p => p.tipo === 'conteudo');
        console.log(`[CursoDetalhes] Preview Mode: Total after: ${cursoCarregado.paginas.length}`);
        setCurso(cursoCarregado); // Atualizar com páginas filtradas
      } else {
         console.log(`[CursoDetalhes] Normal/Review Mode: Total pages: ${cursoCarregado.paginas.length}`);
      }

      // Se for preview, não carrega nem cria progresso
      if (isPreview) {
        setProgressoCurso({
          id: "preview",
          usuarioId: user.uid,
          cursoId: id,
          coeficiente: 0,
          paginaAtual: 1,
          questoesRespondidas: [],
          questoesCorretas: [],
          questoesErradas: [],
          dataInicio: new Date(),
          dataUltimaAtualizacao: new Date(),
          concluido: false,
        });
        setPaginaAtual(0);
        setCarregando(false);
        return;
      }

      let progresso = await CursoService.obterProgressoCurso(user.uid, id);

      if (!progresso && !isRevisao && !isTreino) {
        progresso = await CursoService.iniciarCurso(user.uid, id);
      } else if ((isRevisao || isTreino) && !progresso) {
        // Criar progresso temporário para revisão/treino
        progresso = {
          id: `${user.uid}_${id}_revisao`,
          usuarioId: user.uid,
          cursoId: id,
          coeficiente: 0,
          paginaAtual: 1,
          questoesRespondidas: [],
          questoesCorretas: [],
          questoesErradas: [],
          dataInicio: new Date(),
          dataUltimaAtualizacao: new Date(),
          concluido: false,
        };
      }

      setProgressoCurso(progresso);
      
      // Restaurar página salva (progresso é 1-based, state é 0-based)
      if (progresso && progresso.paginaAtual > 0 && !isRevisao && !isTreino) {
        setPaginaAtual(progresso.paginaAtual - 1);
      } else {
        setPaginaAtual(0);
      }
      
      setRespostasRevisao([]);
    } catch (error) {
      console.error("Erro detalhado:", error);
      Alert.alert("Erro", `Não foi possível carregar o curso: ${error}`);
      router.back();
    } finally {
      setCarregando(false);
    }
  };

  const responderQuestao = async (
    questaoId: string,
    alternativaId: string,
    correta: boolean,
    explicacao: string,
    linkDocumentacao?: string
  ) => {
    if (!progressoCurso) return;

    if (modoRevisao || modoTreino) {
      // Modo revisão/treino: não salvar dados, apenas dar feedback
      if (respostasRevisao.includes(questaoId)) {
        throw new Error("Questão já foi respondida nesta sessão");
      }

      setRespostasRevisao((prev) => [...prev, questaoId]);

      return {
        sucesso: correta,
        explicacao: `${explicacao}\n\n(${modoTreino ? 'Modo Prática' : 'Modo Revisão'} - Dados não salvos)`,
        novoCoeficiente: 0,
      };
    }

    // Modo normal
    // A verificação de "já respondida" agora é feita dentro do CursoService.registrarResposta
    // ou podemos manter aqui se quisermos bloquear na UI antes de chamar o serviço.
    // Mas para permitir múltiplas tentativas (para o decaimento), NÃO devemos bloquear se já foi respondida ERRADA.
    // Se foi respondida CORRETA, aí sim talvez bloquear.
    
    if (progressoCurso.questoesCorretas.includes(questaoId)) {
       throw new Error("Você já acertou esta questão!");
    }

    // Usar o novo método do serviço que lida com tentativas e decaimento
    const { novoCoeficiente, usuarioCursoAtualizado } = await CursoService.registrarResposta(
      progressoCurso,
      questaoId,
      correta,
      curso?.categoria ? [curso.categoria] : [] // Tags básicas
    );

    setProgressoCurso(usuarioCursoAtualizado);

    return {
      sucesso: correta,
      explicacao,
      novoCoeficiente,
    };
  };

  const responderQuestaoEscrita = async (
    questaoId: string,
    correta: boolean,
    explicacao: string
  ) => {
    if (!progressoCurso) return;

    if (modoRevisao || modoTreino) {
      if (respostasRevisao.includes(questaoId)) {
        throw new Error("Questão já foi respondida nesta sessão");
      }
      setRespostasRevisao((prev) => [...prev, questaoId]);
      return {
        sucesso: correta,
        explicacao: `${explicacao}\n\n(${modoTreino ? 'Modo Prática' : 'Modo Revisão'} - Dados não salvos)`,
        novoCoeficiente: 0,
      };
    }

    if (progressoCurso.questoesCorretas.includes(questaoId)) {
      throw new Error("Você já acertou esta questão!");
    }

    const { novoCoeficiente, usuarioCursoAtualizado } = await CursoService.registrarResposta(
      progressoCurso,
      questaoId,
      correta,
      curso?.categoria ? [curso.categoria] : []
    );

    setProgressoCurso(usuarioCursoAtualizado);

    return {
      sucesso: correta,
      explicacao,
      novoCoeficiente,
    };
  };

  const proximaPagina = async () => {
    if (!curso || !progressoCurso) return;

    if (paginaAtual < curso.paginas.length - 1) {
      const novaPagina = paginaAtual + 1;
      setPaginaAtual(novaPagina);
      
      // Atualizar progresso localmente para garantir que salvará o correto ao sair
      if (progressoCurso && !modoRevisao && !modoTreino && modo !== "preview") {
          const novoProgresso = {
              ...progressoCurso,
              paginaAtual: novaPagina + 1 // 1-based
          };
          setProgressoCurso(novoProgresso);
          // Opcional: Salvar a cada página para garantir
          // await CursoService.salvarProgresso(novoProgresso);
      }
    } else {
      if (modo === 'preview') {
        router.back();
        return;
      }

      if (modoRevisao) {
        Alert.alert(
          "Revisão Concluída!",
          "Você terminou de revisar o curso. Esperamos que tenha refrescado sua memória!",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      if (modoTreino) {
        if (user?.uid && id) {
          CursoService.marcarPraticaCompleta(user.uid, id);
        }
        Alert.alert(
          "Prática Concluída!",
          "Parabéns! Você completou a prática. O modo Avaliação agora está desbloqueado para este curso.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        return;
      }

      const resultado = await CursoService.verificarConclusaoCurso(
        progressoCurso,
        curso
      );

      if (resultado.podeCompletar) {
        let mensagem = `Parabéns! Você concluiu o curso com ${resultado.percentualAcerto}% de acerto.`;

        if (resultado.novasBadges && resultado.novasBadges.length > 0) {
          const badgesTexto = resultado.novasBadges
            .map((b) => `${b.icone} ${b.nome}`)
            .join("\n");
          mensagem += `\n\nNovas badges conquistadas:\n${badgesTexto}`;
        }

        Alert.alert("Curso Concluído!", mensagem, [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(
          "Curso Não Concluído",
          `Você precisa de pelo menos 70% de acerto. Atual: ${resultado.percentualAcerto}%.\n\nRefazer questões erradas?`,
          [
            { text: "Não", onPress: () => router.back() },
            {
              text: "Sim",
              onPress: () => {
                const novoProgresso = CursoService.reiniciarQuestoes(
                  progressoCurso,
                  resultado.questoesErradas
                );
                setProgressoCurso(novoProgresso);
                setPaginaAtual(0);
              },
            },
          ]
        );
      }
    }
  };

  if (carregando) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" style={styles.loading} />
        <Text style={{ textAlign: "center", color: theme.colors.onBackground }}>
          Carregando curso... {id}
        </Text>
        <Text
          style={{
            textAlign: "center",
            color: theme.colors.onBackground,
            marginTop: 10,
          }}
        >
          Usuário: {user?.nome || "Carregando..."}
        </Text>
      </SafeAreaView>
    );
  }

  const voltarParaDashboard = async () => {
    // Só salvar progresso se o curso for válido e tiver páginas
    const cursoValido = curso && curso.paginas && curso.paginas.length > 0;
    
    if (!modoRevisao && !modoTreino && modo !== "preview" && progressoCurso && cursoValido) {
      try {
        await CursoService.salvarProgresso(progressoCurso);
      } catch (e) {
        console.error("Erro ao salvar progresso ao sair:", e);
      }
    }
    
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace("/(tabs)");
    }
  };

  if (!curso || !progressoCurso) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={{ textAlign: "center", color: theme.colors.onBackground }}>
          Curso não encontrado
        </Text>
      </SafeAreaView>
    );
  }

  if (!curso.paginas || curso.paginas.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.header}>
            <IconButton
            icon="arrow-left"
            size={24}
            onPress={voltarParaDashboard}
            iconColor={theme.colors.onBackground}
            />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: 'center', padding: 20 }}>
            <Text style={{ textAlign: "center", color: theme.colors.onBackground, marginBottom: 10 }} variant="titleMedium">
            Este curso não possui páginas disponíveis para visualização.
            </Text>
            {modo === 'preview' && (
                <Text style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }} variant="bodySmall">
                    (Modo Preview exibe apenas páginas de conteúdo)
                </Text>
            )}
        </View>
      </SafeAreaView>
    );
  }

  const pagina = curso.paginas[paginaAtual];
  console.log(`[CursoDetalhes] Render: id=${id}, pag=${paginaAtual}, total=${curso.paginas.length}, pagina defined=${!!pagina}`);

  if (!pagina) {
     return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
         <View style={styles.header}>
            <IconButton
            icon="arrow-left"
            size={24}
            onPress={voltarParaDashboard}
            iconColor={theme.colors.onBackground}
            />
        </View>
        <Text style={{ textAlign: "center", color: theme.colors.onBackground, marginTop: 20 }}>
          Página {paginaAtual + 1} não encontrada. (Index inválido)
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={voltarParaDashboard}
          iconColor={theme.colors.onBackground}
        />
        <Text
          variant="titleLarge"
          style={[styles.titulo, { color: theme.colors.onBackground }]}
        >
          {curso.titulo} {modoRevisao ? "(Revisão)" : modoTreino ? "(Treino)" : ""} - Página{" "}
          {paginaAtual + 1}/{curso.paginas.length}
        </Text>
        {documentacao ? (
          <Button
            mode="text"
            compact
            onPress={() => setModalDocVisivel(true)}
            textColor={theme.colors.primary}
            icon="book-open-variant"
          >
            Ver Doc
          </Button>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {/* Progress bar */}
      <PaperProgressBar
        progress={(paginaAtual + 1) / curso.paginas.length}
        color={modo === 'treino' ? theme.colors.tertiary : modo === 'revisao' ? theme.colors.secondary : theme.colors.primary}
        style={{ height: 6, marginHorizontal: 16, borderRadius: 3 }}
      />

      {/* Mode banner */}
      {(modo === 'treino' || modo === 'revisao' || modoRevisao) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 16, marginTop: 8, borderRadius: 8, backgroundColor: (modo === 'treino') ? theme.colors.tertiaryContainer : theme.colors.secondaryContainer }}>
          <Chip
            icon={(modo === 'treino') ? 'school-outline' : 'eye-outline'}
            style={{ backgroundColor: 'transparent' }}
            textStyle={{ color: (modo === 'treino') ? theme.colors.tertiary : theme.colors.secondary, fontWeight: 'bold' }}
          >
            {(modo === 'treino') ? 'Modo Prática — sem pontuação' : 'Modo Revisão — dados não salvos'}
          </Chip>
        </View>
      )}

      {!modo && !modoRevisao && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, marginHorizontal: 16, marginTop: 8, borderRadius: 8, backgroundColor: theme.colors.primaryContainer }}>
          <Chip
            icon='clipboard-check-outline'
            style={{ backgroundColor: 'transparent' }}
            textStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
          >
            {'Modo Avaliação — vale pontos de coeficiente'}
          </Chip>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <CursoViewer
          pagina={pagina}
          onProximaPagina={proximaPagina}
          questoesRespondidas={
            (modoRevisao || modoTreino) ? respostasRevisao : progressoCurso.questoesRespondidas
          }
          onResponderQuestao={responderQuestao}
          onResponderQuestaoEscrita={responderQuestaoEscrita}
          isLastPage={paginaAtual === curso.paginas.length - 1}
          modo={modo}
          onVerDocumentacao={documentacao ? () => setModalDocVisivel(true) : undefined}
        />
      </KeyboardAvoidingView>
      <Portal>
        <Modal
          visible={modalDocVisivel}
          onDismiss={() => setModalDocVisivel(false)}
          contentContainerStyle={{ backgroundColor: theme.colors.surface, margin: 20, padding: 20, borderRadius: 8, maxHeight: '80%' }}
        >
          <ScrollView>
            <Text variant="headlineMedium" style={{ marginBottom: 16 }}>{documentacao?.titulo}</Text>
            {documentacao?.link && (
               <Button mode="contained" onPress={() => Linking.openURL(documentacao.link)} style={{ marginBottom: 16 }}>
                 Abrir Link Externo
               </Button>
            )}
            <Text variant="bodyMedium">{documentacao?.conteudo}</Text>
          </ScrollView>
          <Button onPress={() => setModalDocVisivel(false)} style={{ marginTop: 16 }}>Fechar</Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  titulo: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
  },
});
