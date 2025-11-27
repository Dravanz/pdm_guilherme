import { DocumentationList } from "@/components/DocumentationList";
import { FeaturedCourses } from "@/components/FeaturedCourses";
import { containerPadding, spacing } from "@/constants/Layout";
import { UserContext } from "@/context/UserProvider";
import {
    DashboardData,
    DashboardService,
} from "@/services/shared/DashboardService";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import {
    ActivityIndicator,
    Card,
    ProgressBar,
    Text,
    useTheme,
} from "react-native-paper";

const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {
  const theme = useTheme();
  const { userFirebase } = useContext<any>(UserContext);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [carregando, setCarregando] = useState(true);
  const dadosCarregados = useRef(false);

  const carregarDados = async (forcar = false) => {
    if (!userFirebase) return;
    if (dadosCarregados.current && !forcar) return;

    try {
      setCarregando(true);
      const dados = await DashboardService.obterDadosDashboard(
        userFirebase.uid
      );
      setDashboardData(dados);
      dadosCarregados.current = true;
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [userFirebase])
  );

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  if (carregando) {
    return (
      <SafeAreaView
        style={[{ flex: 1, backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ color: theme.colors.onBackground, marginTop: 16 }}>
            Carregando dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const pieData =
    dashboardData?.estatisticas?.totalQuestoes &&
    dashboardData.estatisticas.totalQuestoes > 0
      ? [
          {
            name: "Corretas",
            population: dashboardData?.estatisticas?.questoesCorretas || 0,
            color: "#22c55e",
            legendFontColor: theme.colors.onBackground,
            legendFontSize: 12,
          },
          {
            name: "Incorretas",
            population: dashboardData?.estatisticas?.questoesErradas || 0,
            color: "#ef4444",
            legendFontColor: theme.colors.onBackground,
            legendFontSize: 12,
          },
        ]
      : [];

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            variant="headlineMedium"
            style={[styles.welcomeText, { color: theme.colors.onBackground }]}
          >
            Olá, {userFirebase?.nome || "Usuário"}! 👋
          </Text>
          <Text
            variant="bodyLarge"
            style={[
              styles.subtitleText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Continue sua jornada de aprendizado
          </Text>
        </View>

        {/* Estatísticas Rápidas */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <Card
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content style={styles.statContent}>
                <Text
                  variant="headlineMedium"
                  style={[styles.statNumber, { color: "#22c55e" }]}
                >
                  📚
                </Text>
                <Text
                  variant="titleMedium"
                  style={[styles.statValue, { color: theme.colors.onSurface }]}
                >
                  {dashboardData?.estatisticas.cursosCompletos || 0}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.statLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Concluídos
                </Text>
              </Card.Content>
            </Card>

            <Card
              style={[
                styles.statCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content style={styles.statContent}>
                <Text
                  variant="headlineMedium"
                  style={[styles.statNumber, { color: "#3b82f6" }]}
                >
                  🎯
                </Text>
                <Text
                  variant="titleMedium"
                  style={[styles.statValue, { color: theme.colors.onSurface }]}
                >
                  {dashboardData?.estatisticas.cursosAtivos || 0}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.statLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Em Progresso
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Coeficiente Geral */}
        <View style={styles.section}>
          <Card
            style={[
              styles.performanceCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Text
                variant="titleLarge"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                Seu Desempenho
              </Text>
              <View style={styles.progressContainer}>
                <Text
                  variant="headlineLarge"
                  style={[
                    styles.percentageText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {dashboardData?.estatisticas.coeficienteGeral || 0}%
                </Text>
                <ProgressBar
                  progress={
                    (dashboardData?.estatisticas.coeficienteGeral || 0) / 100
                  }
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.progressText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {dashboardData?.estatisticas.questoesCorretas || 0} de{" "}
                  {dashboardData?.estatisticas.totalQuestoes || 0} questões
                  corretas
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Gráfico de Acertos/Erros */}
        {pieData.length > 0 && (
          <View style={styles.section}>
            <Card
              style={[
                styles.chartCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  Distribuição de Respostas
                </Text>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={pieData}
                    width={screenWidth - 80}
                    height={200}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Notícias */}
        <View style={styles.section}>
          <DocumentationList showHeader={true} horizontal={true} />
        </View>

        {/* Cursos em Destaque */}
        <View style={styles.section}>
          <FeaturedCourses showHeader={true} limit={5} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: containerPadding.horizontal,
    paddingVertical: containerPadding.vertical,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: spacing.xl,
  },
  welcomeText: {
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitleText: {
    fontWeight: "400",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: spacing.md,
    elevation: 2,
  },
  statContent: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  statNumber: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    textAlign: "center",
    fontWeight: "500",
  },
  performanceCard: {
    borderRadius: spacing.md,
    elevation: 2,
  },
  progressContainer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  percentageText: {
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  progressBar: {
    width: "100%",
    height: spacing.sm,
    borderRadius: spacing.xs,
    marginBottom: spacing.sm,
  },
  progressText: {
    textAlign: "center",
  },
  chartCard: {
    borderRadius: spacing.md,
    elevation: 2,
  },
  chartContainer: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  newsCard: {
    marginBottom: spacing.md,
    borderRadius: spacing.md,
    elevation: 2,
  },
  newsContent: {
    flexDirection: "row",
    padding: spacing.md,
  },
  newsImage: {
    width: 80,
    height: 60,
    borderRadius: spacing.sm,
    marginRight: spacing.md,
  },
  newsText: {
    flex: 1,
  },
  newsTitle: {
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  newsDescription: {
    lineHeight: 18,
  },
  coursesScroll: {
    marginHorizontal: -containerPadding.horizontal,
    paddingHorizontal: containerPadding.horizontal,
  },
  courseHighlightCard: {
    width: 200,
    marginRight: spacing.md,
    borderRadius: spacing.md,
    elevation: 2,
  },
  courseImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
  },
  courseHighlightContent: {
    padding: spacing.md,
  },
  courseHighlightTitle: {
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  courseCategory: {
    marginBottom: spacing.xs,
    fontWeight: "500",
  },
  courseDescription: {
    lineHeight: 16,
  },
});
