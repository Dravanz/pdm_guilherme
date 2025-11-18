import React, { useContext, useState, useEffect, useCallback } from "react";
import { SafeAreaView, StyleSheet, View, ScrollView, Image, Dimensions, TouchableOpacity } from "react-native";
import { Card, Text, useTheme, Button, ProgressBar, ActivityIndicator } from "react-native-paper";
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { UserContext } from "@/context/UserProvider";
import { DashboardService, DashboardData } from "@/services/DashboardService";

const screenWidth = Dimensions.get('window').width;

export default function Dashboard() {
  const theme = useTheme();
  const { userFirebase } = useContext<any>(UserContext);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  const carregarDados = async () => {
    if (!userFirebase) return;
    
    try {
      setCarregando(true);
      const dados = await DashboardService.obterDadosDashboard(userFirebase.uid);
      setDashboardData(dados);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [userFirebase])
  );

  const navegarParaCurso = (cursoId: string) => {
    router.push({
      pathname: "/curso/[id]",
      params: { id: cursoId }
    });
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  if (carregando) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ color: theme.colors.onBackground, marginTop: 16 }}>Carregando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pieData = dashboardData?.estatisticas.totalQuestoes > 0 ? [
    {
      name: 'Corretas',
      population: dashboardData.estatisticas.questoesCorretas,
      color: '#22c55e',
      legendFontColor: theme.colors.onBackground,
      legendFontSize: 12,
    },
    {
      name: 'Erradas',
      population: dashboardData.estatisticas.questoesErradas,
      color: '#ef4444',
      legendFontColor: theme.colors.onBackground,
      legendFontSize: 12,
    },
  ] : [];
  
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={[styles.welcomeText, { color: theme.colors.onBackground }]}>
            Olá, {userFirebase?.nome || "Usuário"}! 👋
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitleText, { color: theme.colors.onSurfaceVariant }]}>
            Continue sua jornada de aprendizado
          </Text>
        </View>

        {/* Estatísticas Rápidas */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#22c55e' }]}>📚</Text>
                <Text variant="titleMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>
                  {dashboardData?.estatisticas.cursosCompletos || 0}
                </Text>
                <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Concluídos</Text>
              </Card.Content>
            </Card>
            
            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: '#3b82f6' }]}>🎯</Text>
                <Text variant="titleMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>
                  {dashboardData?.estatisticas.cursosAtivos || 0}
                </Text>
                <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Em Progresso</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Coeficiente Geral */}
        <View style={styles.section}>
          <Card style={[styles.performanceCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Desempenho Geral</Text>
              <View style={styles.progressContainer}>
                <Text variant="headlineLarge" style={[styles.percentageText, { color: theme.colors.primary }]}>
                  {dashboardData?.estatisticas.coeficienteGeral || 0}%
                </Text>
                <ProgressBar 
                  progress={(dashboardData?.estatisticas.coeficienteGeral || 0) / 100} 
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
                <Text variant="bodyMedium" style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                  {dashboardData?.estatisticas.questoesCorretas || 0} de {dashboardData?.estatisticas.totalQuestoes || 0} questões corretas
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Gráfico de Acertos/Erros */}
        {pieData.length > 0 && (
          <View style={styles.section}>
            <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Distribuição de Respostas</Text>
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
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>📰 Novidades</Text>
          {dashboardData?.noticias.map((noticia) => (
            <Card key={noticia.id} style={[styles.newsCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.newsContent}>
                <Image source={{ uri: noticia.imagem }} style={styles.newsImage} />
                <View style={styles.newsText}>
                  <Text variant="titleMedium" style={[styles.newsTitle, { color: theme.colors.onSurface }]}>
                    {noticia.titulo}
                  </Text>
                  <Text variant="bodyMedium" style={[styles.newsDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {noticia.descricao}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Cursos em Destaque */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>🌟 Cursos em Destaque</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coursesScroll}>
            {dashboardData?.cursosDestaque.map((curso) => (
              <TouchableOpacity key={curso.id} onPress={() => navegarParaCurso(curso.id)}>
                <Card style={[styles.courseHighlightCard, { backgroundColor: theme.colors.surface }]}>
                  <Image source={{ uri: curso.imagem }} style={styles.courseImage} />
                  <Card.Content style={styles.courseHighlightContent}>
                    <Text variant="titleMedium" style={[styles.courseHighlightTitle, { color: theme.colors.onSurface }]}>
                      {curso.titulo}
                    </Text>
                    <Text variant="bodySmall" style={[styles.courseCategory, { color: theme.colors.onSurfaceVariant }]}>
                      {curso.categoria} • {curso.nivel}
                    </Text>
                    <Text variant="bodySmall" style={[styles.courseDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {curso.descricao}
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitleText: {
    fontWeight: '400',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
    fontWeight: '500',
  },
  performanceCard: {
    borderRadius: 12,
    elevation: 2,
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  percentageText: {
    fontWeight: '700',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 12,
    elevation: 2,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  newsCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  newsContent: {
    flexDirection: 'row',
    padding: 12,
  },
  newsImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  newsText: {
    flex: 1,
  },
  newsTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  newsDescription: {
    lineHeight: 18,
  },
  coursesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  courseHighlightCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    elevation: 2,
  },
  courseImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  courseHighlightContent: {
    padding: 12,
  },
  courseHighlightTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  courseCategory: {
    marginBottom: 4,
    fontWeight: '500',
  },
  courseDescription: {
    lineHeight: 16,
  },
});