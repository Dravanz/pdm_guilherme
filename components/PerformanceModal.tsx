import { containerPadding, spacing } from "@/constants/Layout";
import { Curso } from "@/model/Curso";
import { CursoService } from "@/services/curso/CursoService";
import { TentativaService } from "@/services/shared/TentativaService";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  List,
  Modal,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";

interface PerformanceModalProps {
  visible: boolean;
  onDismiss: () => void;
  usuarioId: string;
  cursoId: string;
  cursoTitulo: string;
}

export function PerformanceModal({
  visible,
  onDismiss,
  usuarioId,
  cursoId,
  cursoTitulo,
}: PerformanceModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [cursoDetalhes, setCursoDetalhes] = useState<Curso | null>(null);
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    if (visible) {
      carregarDados();
    }
  }, [visible]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const tentativas = await TentativaService.obterTentativasPorCurso(
        usuarioId,
        cursoId
      );
      const estatisticas = TentativaService.calcularEstatisticas(tentativas);
      setStats(estatisticas);

      // Carregar detalhes do curso para obter textos das questões
      const curso = await CursoService.obterCursoPorId(cursoId);
      setCursoDetalhes(curso);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };

  if (!visible) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={[styles.contentWrapper, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Desempenho: {cursoTitulo}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" style={styles.loading} />
          ) : !stats || stats.totalTentativas === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Nenhuma tentativa registrada ainda.
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Comece a responder os exercícios para ver seus dados!
              </Text>
            </View>
          ) : (
            <>
              {/* Resumo Geral */}
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
                    {stats.acertos}
                  </Text>
                  <Text variant="bodySmall">Acertos</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="displaySmall" style={{ color: theme.colors.error }}>
                    {stats.erros}
                  </Text>
                  <Text variant="bodySmall">Erros</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text variant="displaySmall" style={{ color: theme.colors.info }}>
                    {stats.taxaAcerto}%
                  </Text>
                  <Text variant="bodySmall">Precisão</Text>
                </View>
              </View>

              {/* Gráfico de Pizza - Acertos vs Erros */}
              <Text variant="titleMedium" style={styles.chartTitle}>
                Distribuição de Respostas
              </Text>
              <PieChart
                data={[
                  {
                    name: "Acertos",
                    population: stats.acertos,
                    color: theme.colors.primary,
                    legendFontColor: theme.colors.onSurface,
                    legendFontSize: 12,
                  },
                  {
                    name: "Erros",
                    population: stats.erros,
                    color: theme.colors.error,
                    legendFontColor: theme.colors.onSurface,
                    legendFontSize: 12,
                  },
                ]}
                width={screenWidth - 60}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />

              {/* Gráfico de Linha - Evolução */}
              {stats.evolucao.length > 1 && (
                <>
                  <Text variant="titleMedium" style={styles.chartTitle}>
                    Evolução (Últimas 10)
                  </Text>
                  <LineChart
                    data={{
                      labels: stats.evolucao.map((e: any) => e.index.toString()),
                      datasets: [
                        {
                          data: stats.evolucao.map((e: any) => e.taxaAcerto),
                          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                          strokeWidth: 2
                        },
                      ],
                      legend: ["Precisão Acumulada (%)"]
                    }}
                    width={screenWidth - 60}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix="%"
                    chartConfig={{
                      ...chartConfig,
                      formatYLabel: (y) => y,
                    }}
                    bezier
                    style={styles.chart}
                  />
                </>
              )}

              {/* Lista Detalhada de Questões */}
              {cursoDetalhes && stats.porQuestao && (
                <View style={styles.questionsContainer}>
                  <Text variant="titleMedium" style={styles.chartTitle}>
                    Análise Detalhada por Questão
                  </Text>
                  
                  {cursoDetalhes.paginas
                    .flatMap(p => p.questoes || [])
                    .map((questao, index) => {
                      const stat = stats.porQuestao[questao.id];
                      
                      if (!stat) return null; // Mostrar apenas questões respondidas? Ou todas?

                      return (
                        <Card key={questao.id} style={styles.questionCard}>
                          <Card.Content>
                            <View style={styles.questionHeader}>
                              <Text variant="titleSmall" style={{flex: 1}}>
                                {index + 1}. {questao.pergunta}
                              </Text>
                              {stat.ultimaCorreta ? (
                                <List.Icon icon="check-circle" color={theme.colors.primary} />
                              ) : (
                                <List.Icon icon="close-circle" color={theme.colors.error} />
                              )}
                            </View>
                            
                            <Divider style={{ marginVertical: 8 }} />
                            
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                Tentativas: {stat.total} | Acertos: {stat.acertos}
                            </Text>

                            {!stat.ultimaCorreta && (
                                <View style={[styles.explanationContainer, { backgroundColor: theme.colors.errorContainer }]}>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, fontWeight: 'bold' }}>
                                        Explicação:
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                                        {questao.explicacao || "Sem explicação disponível."}
                                    </Text>
                                </View>
                            )}
                          </Card.Content>
                        </Card>
                      );
                    })}
                </View>
              )}
            </>
          )}

          <Button mode="contained" onPress={onDismiss} style={styles.closeButton}>
            Fechar
          </Button>
        </ScrollView>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    maxHeight: "90%",
  },
  contentWrapper: {
    borderRadius: 8,
    flexShrink: 1,
    overflow: "hidden",
  },
  scrollContent: {
    padding: containerPadding.horizontal,
    paddingBottom: spacing.xl,
  },
  title: {
    textAlign: "center",
    marginVertical: spacing.lg,
    fontWeight: "bold",
  },
  loading: {
    marginVertical: spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xl,
  },
  summaryItem: {
    alignItems: "center",
  },
  chartTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  closeButton: {
    marginTop: spacing.xl,
  },
  questionsContainer: {
    marginTop: spacing.lg,
  },
  questionCard: {
    marginBottom: spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  explanationContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
  }
});
