import { borderRadius, containerPadding, spacing } from "@/constants/Layout";
import { ImageService } from "@/services/image/ImageService";
import { ResultadoExecucao } from "@/services/codigo/JobeService";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Icon, RadioButton, Text, useTheme } from "react-native-paper";
import { PaginaCurso, Questao, QuestaoEscrita } from "../model/Curso";
import { ResponsiveImage } from "./ResponsiveImage";
import { CodeEditor } from "./CodeEditor";
import { CodeBlocksEditor } from "./CodeBlocksEditor";

interface CursoViewerProps {
  pagina: PaginaCurso;
  onProximaPagina: () => void;
  questoesRespondidas: string[];
  onResponderQuestao: (
    questaoId: string,
    alternativaId: string,
    correta: boolean,
    explicacao: string,
    linkDocumentacao?: string
  ) => Promise<any>;
  onResponderQuestaoEscrita?: (
    questaoId: string,
    correta: boolean,
    explicacao: string
  ) => Promise<any>;
  isLastPage?: boolean;
  modo?: string;
  onVerDocumentacao?: () => void;
}

export function CursoViewer({
  pagina,
  onProximaPagina,
  questoesRespondidas,
  onResponderQuestao,
  onResponderQuestaoEscrita,
  isLastPage,
  modo,
  onVerDocumentacao,
}: CursoViewerProps) {
  const [respostasQuestoes, setRespostasQuestoes] = useState<{
    [key: string]: string;
  }>({});
  const [processando, setProcessando] = useState(false);
  const [feedbackQuestao, setFeedbackQuestao] = useState<{
    [key: string]: { sucesso: boolean; explicacao: string; coeficiente: number };
  }>({});
  const theme = useTheme();

  const handleResposta = (questaoId: string, alternativaId: string) => {
    if (questoesRespondidas.includes(questaoId)) return;

    setRespostasQuestoes((prev) => ({
      ...prev,
      [questaoId]: alternativaId,
    }));
  };

  const enviarResposta = async (questao: Questao) => {
    const alternativaSelecionada = respostasQuestoes[questao.id];
    if (!alternativaSelecionada) {
      Alert.alert("Atenção", "Selecione uma alternativa antes de enviar.");
      return;
    }

    setProcessando(true);

    try {
      const alternativa = questao.alternativas.find(
        (alt) => alt.id === alternativaSelecionada
      );
      const correta = alternativa?.correta || false;

      const resultado = await onResponderQuestao(
        questao.id,
        alternativaSelecionada,
        correta,
        questao.explicacao,
        questao.linkDocumentacao
      );

      // Feedback inline em vez de Alert
      setFeedbackQuestao((prev) => ({
        ...prev,
        [questao.id]: {
          sucesso: resultado.sucesso,
          explicacao: resultado.explicacao,
          coeficiente: resultado.novoCoeficiente,
        },
      }));
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível processar a resposta."
      );
    } finally {
      setProcessando(false);
    }
  };

  // Handler para exercícios de código
  const handleResultadoCodigo = async (
    questao: QuestaoEscrita,
    resultado: ResultadoExecucao,
    correta: boolean
  ) => {
    if (onResponderQuestaoEscrita) {
      try {
        await onResponderQuestaoEscrita(questao.id, correta, questao.explicacao);
      } catch (error) {
        console.error("Erro ao registrar resposta de código:", error);
      }
    }
  };

  if (pagina.tipo === "conteudo") {
    return (
      <ScrollView style={styles.container} accessible={false}>
        <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.secondary }]} accessible accessibilityRole="text">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 }}>
            <Icon source="book-open-variant" size={24} color={theme.colors.secondary} />
            <Text variant="labelMedium" style={{ color: theme.colors.secondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Conteúdo</Text>
          </View>
          <Card.Title 
            title={pagina.titulo || "Título não encontrado"} 
            titleVariant="titleLarge"
            titleStyle={{ fontWeight: "bold" }}
          />
          <Card.Content>
            {pagina.imagem && (
              <ResponsiveImage
                source={{
                  uri: pagina.imagem.startsWith("http")
                    ? pagina.imagem
                    : ImageService.getImageUrl(pagina.imagem),
                }}
                placeholder="https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Carregando..."
              />
            )}
            <View
              style={[
                styles.conteudoContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
              accessible
              accessibilityRole="text"
            >
              <Text
                variant="bodyMedium"
                style={[styles.conteudo, { color: theme.colors.onSurface }]}
              >
                {pagina.conteudo || "Conteúdo não encontrado"}
              </Text>
            </View>
          </Card.Content>
          <Card.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12 }}>
            {onVerDocumentacao && (
                <Button 
                    mode="text" 
                    onPress={onVerDocumentacao} 
                    icon="book-open-variant"
                    textColor={theme.colors.primary}
                    accessibilityLabel="Ver documentação vinculada"
                    accessibilityRole="button"
                >
                    Ver Doc
                </Button>
            )}
            <View style={{ flex: 1, alignItems: 'flex-end'}}>
                <Button 
                  mode="contained" 
                  onPress={onProximaPagina}
                  style={{ borderRadius: 10, minHeight: 44 }}
                  contentStyle={{ minHeight: 44 }}
                  accessibilityLabel={isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir curso") : "Ir para próxima página"}
                  accessibilityRole="button"
                >
                {isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir") : "Próxima"}
                </Button>
            </View>
          </Card.Actions>
        </Card>
      </ScrollView>
    );
  }

  // ============ EXERCÍCIO DE CÓDIGO ============
  if (pagina.tipo === "exercicio_codigo" && pagina.questoesEscrita) {
    return (
      <ScrollView style={styles.container} accessible={false} keyboardShouldPersistTaps="handled">
        <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.tertiary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 }}>
            <Icon source="code-braces" size={24} color={theme.colors.tertiary} />
            <Text variant="labelMedium" style={{ color: theme.colors.tertiary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Exercício de Código</Text>
          </View>
          <Card.Title 
            title={pagina.titulo} 
            titleVariant="titleLarge"
            titleStyle={{ fontWeight: "bold" }}
          />
          <Card.Content>
            {pagina.questoesEscrita.map((questao) => {
              const jaRespondida = questoesRespondidas.includes(questao.id);

              return (
                <View key={questao.id} style={{ marginBottom: spacing.xl }}>
                  <CodeEditor
                    questao={questao}
                    onResultado={(resultado, correta) =>
                      handleResultadoCodigo(questao, resultado, correta)
                    }
                    desabilitado={modo === "preview"}
                    modo={modo === "preview" ? "preview" : "resolver"}
                    jaRespondida={jaRespondida}
                  />
                </View>
              );
            })}
          </Card.Content>

          <Card.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12 }}>
            {onVerDocumentacao && (
              <Button
                mode="text"
                onPress={onVerDocumentacao}
                icon="book-open-variant"
                textColor={theme.colors.primary}
                accessibilityLabel="Ver documentação vinculada"
                accessibilityRole="button"
              >
                Ver Doc
              </Button>
            )}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Button 
                mode="outlined" 
                onPress={onProximaPagina}
                style={{ borderRadius: 10, minHeight: 44 }}
                contentStyle={{ minHeight: 44 }}
                accessibilityLabel={isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir curso") : "Ir para próxima página"}
                accessibilityRole="button"
              >
                {isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir") : "Próxima Página"}
              </Button>
            </View>
          </Card.Actions>
        </Card>
      </ScrollView>
    );
  }

  // ============ EXERCÍCIO DE BLOCOS ============
  if (pagina.tipo === "exercicio_blocos" && pagina.questoesBlocos) {
    return (
      <ScrollView style={styles.container} accessible={false} keyboardShouldPersistTaps="handled">
        <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.secondary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 }}>
            <Icon source="drag" size={24} color={theme.colors.secondary} />
            <Text variant="labelMedium" style={{ color: theme.colors.secondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Exercício de Blocos</Text>
          </View>
          <Card.Title
            title={pagina.titulo}
            titleVariant="titleLarge"
            titleStyle={{ fontWeight: "bold" }}
          />
          <Card.Content>
            {pagina.questoesBlocos.map((questao) => {
              const jaRespondida = questoesRespondidas.includes(questao.id);
              return (
                <View key={questao.id} style={{ marginBottom: 24 }}>
                  <CodeBlocksEditor
                    questao={questao}
                    onResultado={async (resultado, correta) => {
                      if (onResponderQuestaoEscrita) {
                        try {
                          await onResponderQuestaoEscrita(questao.id, correta, questao.explicacao);
                        } catch (err) {
                          console.error("Erro ao registrar resposta de blocos:", err);
                        }
                      }
                    }}
                    desabilitado={modo === "preview"}
                    jaRespondida={jaRespondida}
                  />
                </View>
              );
            })}
          </Card.Content>
          <Card.Actions style={{ justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 12 }}>
            <Button
              mode="outlined"
              onPress={onProximaPagina}
              style={{ borderRadius: 10, minHeight: 44 }}
              contentStyle={{ minHeight: 44 }}
              accessibilityLabel={isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir curso") : "Ir para próxima página"}
              accessibilityRole="button"
            >
              {isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir") : "Próxima Página"}
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    );
  }

  // ============ EXERCÍCIO DE MÚLTIPLA ESCOLHA ============

  // ============ EXERCÍCIO DE MÚLTIPLA ESCOLHA ============
  return (
    <ScrollView style={styles.container} accessible={false}>
      <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 }}>
          <Icon source="head-question" size={24} color={theme.colors.primary} />
          <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Exercício</Text>
        </View>
        <Card.Title 
          title={pagina.titulo} 
          titleVariant="titleLarge"
          titleStyle={{ fontWeight: "bold" }}
        />
        <Card.Content>
          {pagina.questoes?.map((questao) => {
            const jaRespondida = questoesRespondidas.includes(questao.id);
            const feedback = feedbackQuestao[questao.id];

            return (
              <View
                key={questao.id}
                style={[
                  styles.questaoContainer,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                accessible
                accessibilityRole="radiogroup"
                accessibilityLabel={`Questão: ${questao.pergunta}`}
              >
                <Text
                  variant="titleMedium"
                  style={[
                    styles.pergunta,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {questao.pergunta}
                </Text>

                <RadioButton.Group
                  onValueChange={(value) => handleResposta(questao.id, value)}
                  value={respostasQuestoes[questao.id] || ""}
                >
                  {questao.alternativas.map((alternativa) => (
                    <View
                      key={alternativa.id}
                      style={[
                        styles.alternativaContainer,
                        {
                          backgroundColor: respostasQuestoes[questao.id] === alternativa.id 
                            ? theme.colors.primaryContainer 
                            : theme.colors.surface,
                          borderColor: respostasQuestoes[questao.id] === alternativa.id 
                            ? theme.colors.primary 
                            : theme.colors.outline,
                          borderWidth: respostasQuestoes[questao.id] === alternativa.id ? 2 : 1,
                          borderRadius: 10,
                        },
                      ]}
                      accessible
                      accessibilityRole="radio"
                      accessibilityState={{ 
                        checked: respostasQuestoes[questao.id] === alternativa.id,
                        disabled: jaRespondida 
                      }}
                    >
                      <RadioButton.Item
                        label={alternativa.texto}
                        value={alternativa.id}
                        disabled={jaRespondida}
                        labelStyle={{ color: theme.colors.onSurface, lineHeight: 22 }}
                        style={{ minHeight: 48 }}
                        status={
                          respostasQuestoes[questao.id] === alternativa.id
                            ? "checked"
                            : "unchecked"
                        }
                      />
                    </View>
                  ))}
                </RadioButton.Group>

                {!jaRespondida && !feedback && (
                  <Button
                    mode="contained"
                    onPress={() => enviarResposta(questao)}
                    loading={processando}
                    disabled={processando || !respostasQuestoes[questao.id]}
                    style={[styles.botaoEnviar, { borderRadius: 10 }]}
                    contentStyle={{ minHeight: 48 }}
                    accessibilityLabel="Enviar resposta"
                    accessibilityRole="button"
                  >
                    Enviar Resposta
                  </Button>
                )}

                {/* Feedback inline (substitui Alert.alert) */}
                {feedback && (
                  <View
                    style={[
                      styles.feedbackContainer,
                      {
                        backgroundColor: feedback.sucesso
                          ? theme.colors.primaryContainer
                          : theme.colors.errorContainer,
                        borderLeftColor: feedback.sucesso
                          ? theme.colors.primary
                          : theme.colors.error,
                      },
                    ]}
                    accessible
                    accessibilityRole="alert"
                    accessibilityLabel={feedback.sucesso ? "Resposta correta" : "Resposta incorreta"}
                  >
                    <View style={styles.feedbackHeader}>
                      <Icon
                        source={feedback.sucesso ? "check-circle" : "close-circle"}
                        size={20}
                        color={feedback.sucesso ? theme.colors.primary : theme.colors.error}
                      />
                      <Text
                        variant="titleSmall"
                        style={{
                          color: feedback.sucesso ? theme.colors.primary : theme.colors.error,
                          fontWeight: "bold",
                          marginLeft: 8,
                        }}
                      >
                        {feedback.sucesso ? "Correto!" : "Incorreto"}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          marginLeft: "auto",
                        }}
                      >
                        Coeficiente: {feedback.coeficiente}%
                      </Text>
                    </View>
                    {feedback.explicacao && (
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 8, lineHeight: 22 }}>
                        {feedback.explicacao}
                      </Text>
                    )}
                  </View>
                )}

                {jaRespondida && !feedback && (
                  <View style={[styles.jaRespondidaView, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Icon source="check-circle" size={18} color={theme.colors.primary} />
                    <Text
                      style={[
                        styles.jaRespondida,
                        { color: theme.colors.onPrimaryContainer },
                      ]}
                      accessibilityLabel="Questão já respondida"
                    >
                      Questão já respondida
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Card.Content>

        <Card.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 12 }}>
           {onVerDocumentacao && (
                <Button 
                    mode="text" 
                    onPress={onVerDocumentacao} 
                    icon="book-open-variant"
                    textColor={theme.colors.primary}
                    accessibilityLabel="Ver documentação vinculada"
                    accessibilityRole="button"
                >
                    Ver Doc
                </Button>
            )}
           <View style={{ flex: 1, alignItems: 'flex-end'}}>
              <Button 
                mode="outlined" 
                onPress={onProximaPagina}
                style={{ borderRadius: 10, minHeight: 44 }}
                contentStyle={{ minHeight: 44 }}
                accessibilityLabel={isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir curso") : "Ir para próxima página"}
                accessibilityRole="button"
              >
                {isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir") : "Próxima Página"}
              </Button>
           </View>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: containerPadding.horizontal,
    paddingVertical: containerPadding.vertical,
  },
  card: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    elevation: 2,
  },
  conteudoContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
  },
  conteudo: {
    lineHeight: 24,
    fontSize: 15,
  },
  questaoContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 12,
  },
  pergunta: {
    marginBottom: spacing.md,
    fontWeight: "bold",
    lineHeight: 24,
  },
  alternativaContainer: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
  },
  botaoEnviar: {
    marginTop: spacing.md,
  },
  feedbackContainer: {
    marginTop: spacing.md,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  jaRespondidaView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.md,
    padding: 10,
    borderRadius: 8,
  },
  jaRespondida: {
    fontWeight: "bold",
  },
});
