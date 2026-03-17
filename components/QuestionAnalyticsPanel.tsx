import { QuestionAnalyticsService } from "@/services/questao/QuestionAnalyticsService";
import { CourseAnalyticsSummary, QuestionAnalytics } from "@/model/QuestionAnalytics";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Icon,
  Modal,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";

interface QuestionAnalyticsPanelProps {
  visible: boolean;
  onDismiss: () => void;
  cursoId: string;
  cursoTitulo: string;
}

export function QuestionAnalyticsPanel({
  visible,
  onDismiss,
  cursoId,
  cursoTitulo,
}: QuestionAnalyticsPanelProps) {
  const theme = useTheme();
  const [resumo, setResumo] = useState<CourseAnalyticsSummary | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregarAnalytics = useCallback(async () => {
    if (!cursoId || !visible) return;
    setCarregando(true);
    try {
      const data = await QuestionAnalyticsService.gerarResumoCurso(cursoId);
      setResumo(data);
    } catch (error) {
      console.error("[AnalyticsPanel] Erro:", error);
    } finally {
      setCarregando(false);
    }
  }, [cursoId, visible]);

  useEffect(() => {
    carregarAnalytics();
  }, [carregarAnalytics]);

  const getSeverityColor = (severidade: string) => {
    switch (severidade) {
      case "critico":
        return theme.colors.error;
      case "aviso":
        return (theme.colors as any).warning || "#d97706";
      case "info":
        return (theme.colors as any).info || "#2563eb";
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getDifficultyColor = (dificuldade: number) => {
    if (dificuldade >= 0.9) return (theme.colors as any).info || "#2563eb"; // muito fácil
    if (dificuldade >= 0.7) return theme.colors.primary; // adequada
    if (dificuldade >= 0.3) return (theme.colors as any).warning || "#d97706"; // moderada
    return theme.colors.error; // muito difícil
  };

  const getDiscriminationColor = (disc: number) => {
    if (disc >= 0.4) return theme.colors.primary; // boa
    if (disc >= 0.2) return (theme.colors as any).warning || "#d97706"; // aceitável
    return theme.colors.error; // ruim
  };

  const getDiscriminationLabel = (disc: number) => {
    if (disc >= 0.4) return "Boa";
    if (disc >= 0.2) return "Aceitável";
    if (disc >= 0) return "Baixa";
    return "Negativa";
  };

  const renderQuestionCard = (analytics: QuestionAnalytics, index: number) => (
    <Card
      key={analytics.id}
      style={[
        styles.questionCard,
        {
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor:
            analytics.alertas.length > 0
              ? analytics.alertas.some((a) => a.severidade === "critico")
                ? theme.colors.error
                : (theme.colors as any).warning || "#d97706"
              : theme.colors.primary,
        },
      ]}
    >
      <Card.Content>
        <Text
          variant="titleSmall"
          style={{ color: theme.colors.onSurface, fontWeight: "bold" }}
        >
          Questão {index + 1}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
        >
          ID: {analytics.questaoId}
        </Text>

        {/* Indicadores */}
        <View style={styles.indicatorsRow}>
          {/* Dificuldade */}
          <View style={styles.indicator}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Dificuldade
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(analytics.indiceDificuldade * 100, 2)}%`,
                    backgroundColor: getDifficultyColor(
                      analytics.indiceDificuldade
                    ),
                  },
                ]}
              />
            </View>
            <Text
              variant="bodySmall"
              style={{
                color: getDifficultyColor(analytics.indiceDificuldade),
                fontWeight: "bold",
              }}
            >
              {(analytics.indiceDificuldade * 100).toFixed(0)}% acertos
            </Text>
          </View>

          {/* Discriminação */}
          <View style={styles.indicator}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Discriminação
            </Text>
            <Chip
              compact
              style={{
                backgroundColor: "transparent",
                borderColor: getDiscriminationColor(
                  analytics.indiceDiscriminacao
                ),
                borderWidth: 1,
              }}
              textStyle={{
                color: getDiscriminationColor(analytics.indiceDiscriminacao),
                fontSize: 11,
              }}
            >
              {getDiscriminationLabel(analytics.indiceDiscriminacao)} (
              {analytics.indiceDiscriminacao.toFixed(2)})
            </Chip>
          </View>
        </View>

        {/* Contagem */}
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
        >
          {analytics.totalTentativas} alunos responderam •{" "}
          {analytics.totalAcertos} acertaram
        </Text>

        {/* Alertas */}
        {analytics.alertas.map((alerta, i) => (
          <View
            key={i}
            style={[
              styles.alertRow,
              {
                backgroundColor:
                  alerta.severidade === "critico"
                    ? theme.colors.errorContainer
                    : alerta.severidade === "aviso"
                    ? `${(theme.colors as any).warning || "#d97706"}15`
                    : `${(theme.colors as any).info || "#2563eb"}15`,
              },
            ]}
          >
            <Icon
              source={
                alerta.severidade === "critico"
                  ? "alert-circle"
                  : alerta.severidade === "aviso"
                  ? "alert"
                  : "information"
              }
              size={16}
              color={getSeverityColor(alerta.severidade)}
            />
            <Text
              variant="bodySmall"
              style={{
                color: getSeverityColor(alerta.severidade),
                flex: 1,
                marginLeft: 6,
              }}
            >
              {alerta.mensagem}
            </Text>
          </View>
        ))}

        {analytics.totalTentativas < 5 && (
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              fontStyle: "italic",
              marginTop: 4,
            }}
          >
            Dados insuficientes (mínimo 5 alunos para análise completa)
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Icon source="chart-bar" size={28} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onBackground, fontWeight: "bold" }}
              >
                Análise de Questões
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {cursoTitulo}
              </Text>
            </View>
          </View>

          {carregando ? (
            <Text
              style={{
                textAlign: "center",
                color: theme.colors.onSurfaceVariant,
                padding: 32,
              }}
            >
              Carregando análises...
            </Text>
          ) : !resumo || resumo.analytics.length === 0 ? (
            <Card
              style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content style={{ alignItems: "center", padding: 24 }}>
                <Icon
                  source="chart-line"
                  size={48}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  Nenhuma análise disponível ainda.{"\n"}Os dados serão gerados
                  conforme os alunos respondam as questões do curso.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <>
              {/* Resumo geral */}
              <Card
                style={[
                  styles.summaryCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content>
                  <Text
                    variant="titleMedium"
                    style={{
                      color: theme.colors.onSurface,
                      fontWeight: "bold",
                      marginBottom: 12,
                    }}
                  >
                    Resumo do Curso
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Text
                        variant="headlineMedium"
                        style={{
                          color: theme.colors.primary,
                          fontWeight: "bold",
                        }}
                      >
                        {resumo.totalQuestoes}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Questões analisadas
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text
                        variant="headlineMedium"
                        style={{
                          color: theme.colors.primary,
                          fontWeight: "bold",
                        }}
                      >
                        {(resumo.mediaAcertos * 100).toFixed(0)}%
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Média de acertos
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text
                        variant="headlineMedium"
                        style={{
                          color:
                            resumo.questoesProblematicas > 0
                              ? theme.colors.error
                              : theme.colors.primary,
                          fontWeight: "bold",
                        }}
                      >
                        {resumo.questoesProblematicas}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Com alertas
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              {/* Questões individuais */}
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.onBackground,
                  fontWeight: "bold",
                  marginTop: 16,
                  marginBottom: 8,
                }}
              >
                Detalhamento por Questão
              </Text>
              {resumo.analytics
                .sort((a, b) => b.alertas.length - a.alertas.length)
                .map((analytics, index) =>
                  renderQuestionCard(analytics, index)
                )}
            </>
          )}

          <Button
            mode="outlined"
            onPress={onDismiss}
            style={{ marginTop: 16, borderRadius: 24 }}
          >
            Fechar
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    marginBottom: 8,
    elevation: 1,
  },
  emptyCard: {
    borderRadius: 16,
    marginTop: 8,
    elevation: 1,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  questionCard: {
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  indicatorsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
  },
  indicator: {
    flex: 1,
    gap: 4,
  },
  barContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
});
