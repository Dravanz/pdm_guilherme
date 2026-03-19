import { BadgeManager } from "@/components/BadgeManager";
import { CourseListModal } from "@/components/CourseListModal";
import { DocumentationList } from "@/components/DocumentationList";
import { FeaturedCourses } from "@/components/FeaturedCourses";
import { PerformanceModal } from "@/components/PerformanceModal";
import { WeeklyStreak } from "@/components/WeeklyStreak";
import { CourseConfig } from "@/config/CourseConfig";
import { containerPadding, spacing } from "@/constants/Layout";
import { UserContext } from "@/context/UserProvider";
import { firestore } from "@/firebase/FirebaseInit";
import { Curso } from "@/model/Curso";
import { Perfil } from "@/model/Perfil";
import { StatusSolicitacao } from "@/model/Solicitacao";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart } from "react-native-chart-kit";
import {
    ActivityIndicator,
    Button,
    Card,
    Icon,
    ProgressBar,
    Text,
    useTheme,
} from "react-native-paper";


const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {
  const theme = useTheme();
  const { userFirebase, userStats } = useContext<any>(UserContext);
  const [carregando, setCarregando] = useState(false);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState(0);
  const [badgeManagerVisible, setBadgeManagerVisible] = useState(false); // State for Badge Manager
  useEffect(() => {
    if (userFirebase?.perfil === Perfil.Moderador) {
      fetchSolicitacoesPendentes();
    }
  }, [userFirebase]);

  const fetchSolicitacoesPendentes = async () => {
    try {
      const q = query(
        collection(firestore, "solicitacoes"),
        where("status", "==", StatusSolicitacao.Pendente)
      );
      const snapshot = await getDocs(q);
      setSolicitacoesPendentes(snapshot.size);
    } catch (error) {
      console.error("Erro ao buscar solicitações pendentes:", error);
    }
  };

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalCourses, setModalCourses] = useState<Curso[]>([]);
  const [modalType, setModalType] = useState<"completed" | "in_progress">("in_progress");
  
  // Performance Modal State
  const [perfModalVisible, setPerfModalVisible] = useState(false);
  const [selectedPerfCourse, setSelectedPerfCourse] = useState<{id: string, titulo: string} | null>(null);

  const openCourseList = async (type: "completed" | "in_progress") => {
    if (!userFirebase) return;

    setModalType(type);
    setModalTitle(type === "completed" ? "Cursos Concluídos" : "Cursos em Progresso");
    setModalCourses([]); // Limpar lista anterior

    setModalVisible(true);

    try {
      // 1. Buscar progresso do usuário
      const usuariosCursosRef = collection(firestore, "usuariosCursos");
      const q = query(usuariosCursosRef, where("usuarioId", "==", userFirebase.uid));
      const snapshot = await getDocs(q);

      const userCoursesMap: {[key: string]: any} = {};
      snapshot.docs.forEach(doc => {
        userCoursesMap[doc.data().cursoId] = doc.data();
      });

      // 2. Buscar todos os cursos (para ter os detalhes)
      // Idealmente, buscaríamos apenas os IDs necessários, mas o Firestore não tem "where in" ilimitado
      // Como fallback, pegamos do Config ou buscamos todos.
      // Vamos pegar do Config para ser mais rápido e garantir dados, 
      // mas se quiser dados dinâmicos do Firestore, precisaria buscar lá.
      // Vamos tentar buscar do Firestore primeiro.
      
      const cursosRef = collection(firestore, "cursos");
      const cursosSnapshot = await getDocs(cursosRef);
      let allCourses: Curso[] = cursosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Curso));

      if (allCourses.length === 0) {
         allCourses = CourseConfig.getAllCourses() as unknown as Curso[];
      } else {
        // Merge: garantir que cursos estáticos do Config também estejam na lista se não vieram do Firestore
        const staticCourses = CourseConfig.getAllCourses();
        staticCourses.forEach(staticCourse => {
            if (!allCourses.find(c => c.id === staticCourse.id)) {
                allCourses.push(staticCourse as unknown as Curso);
            }
        });
      }

      // 3. Filtrar
      const filteredCourses = allCourses.filter(curso => {
        const userProgress = userCoursesMap[curso.id];
        if (!userProgress) return false;

        if (type === "completed") {
          return userProgress.concluido;
        } else {
          return !userProgress.concluido; // Assumindo que se tem progresso e não tá concluído, tá em progresso
        }
      });

      setModalCourses(filteredCourses);

    } catch (error) {
      console.error("Erro ao carregar cursos para modal:", error);
    }
  };

  const openPerformance = (courseId: string, title: string) => {
    setSelectedPerfCourse({ id: courseId, titulo: title });
    setPerfModalVisible(true);
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };


  const pieData =
    userStats?.totalQuestoes && userStats.totalQuestoes > 0
      ? [
          {
            name: "Corretas",
            population: userStats.questoesCorretas,
            color: theme.colors.primary,
            legendFontColor: theme.colors.onBackground,
            legendFontSize: 12,
          },
          {
            name: "Incorretas",
            population: userStats.questoesErradas,
            color: theme.colors.error,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              variant="headlineMedium"
              style={[styles.welcomeText, { color: theme.colors.onBackground }]}
            >
              Olá, {userFirebase?.nome || "Usuário"}!
            </Text>
            <Icon source="hand-wave" size={24} color={theme.colors.primary} />
          </View>
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

        {/* Sequência Semanal */}
        <View style={[styles.section, { marginBottom: spacing.md }]}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <WeeklyStreak loginDays={userFirebase?.diasLogin ?? []} />
            </Card.Content>
          </Card>
        </View>

        {/* Card de Moderação */}
        {/* Card de Moderação */}
        {userFirebase?.perfil === Perfil.Moderador && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.outlineVariant }]}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Icon source="shield-account" size={32} color={theme.colors.primary} />
                <View style={{ flex: 1, minWidth: 200 }}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                    Moderação
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Você tem {solicitacoesPendentes} solicitações pendentes.
                  </Text>
                </View>
                <Button 
                  mode="contained" 
                  onPress={() => router.push("/(tabs)/solicitacoes")}
                  style={{ flexGrow: 1 }}
                >
                  Gerenciar Solicitações
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Card de Colaboração */}
        {/* Card de Colaboração */}
        {(userFirebase?.perfil === Perfil.Colaborador || userFirebase?.perfil === Perfil.Moderador) && (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.outlineVariant }]}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Icon source="handshake" size={32} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                    Área do Colaborador
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Contribua com a comunidade!
                  </Text>
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <Button 
                  mode="contained" 
                  onPress={() => router.push("/gerenciar-cursos" as any)}
                  style={{ width: '100%' }}
                  icon="school"
                  
                >
                  Gerenciar Cursos
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => router.push("/gerenciar-documentacao" as any)}
                  style={{ width: '100%' }}
                  icon="file-document"
                  
                >
                  Gerenciar Docs
                </Button>
                
                 {/* Botão de Badge - Só para Moderador */}
                 {userFirebase?.perfil === Perfil.Moderador && (
                    <Button 
                    mode="contained" 
                    onPress={() => setBadgeManagerVisible(true)}
                    style={{ width: '100%' }}
                    icon="medal"
                    
                    >
                    Gerenciar Badges
                    </Button>
                 )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Estatísticas Rápidas */}
        <View style={styles.section}>
          {!userStats ? (
            <View style={styles.statsGrid}>
              {[0, 1].map((i) => (
                <View
                  key={i}
                  style={[styles.statCard, { flex: 1, height: 110, backgroundColor: theme.colors.surfaceVariant, borderRadius: 16, opacity: 0.5 }]}
                />
              ))}
            </View>
          ) : (
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={{ flex: 1 }}
              onPress={() => openCourseList("completed")}
            >
              <Card
                style={[
                  styles.statCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Icon source="book-check" size={32} color={theme.colors.primary} />
                  </View>
                  <Text
                    variant="titleMedium"
                    style={[styles.statValue, { color: theme.colors.onSurface }]}
                  >
                    {userStats?.cursosCompletos ?? 0}
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
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ flex: 1 }}
              onPress={() => openCourseList("in_progress")}
            >
              <Card
                style={[
                  styles.statCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Icon source="target" size={32} color={theme.colors.primary} />
                  </View>
                  <Text
                    variant="titleMedium"
                    style={[styles.statValue, { color: theme.colors.onSurface }]}
                  >
                    {userStats?.cursosAtivos ?? 0}
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
            </TouchableOpacity>
          </View>
          )}
        </View>

        {/* Coeficiente Geral */}
        <View style={styles.section}>
          {!userStats ? (
            <View style={{ height: 140, backgroundColor: theme.colors.surfaceVariant, borderRadius: 16, opacity: 0.5 }} />
          ) : (
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
                  {userStats.coeficienteGeral}%
                </Text>
                <ProgressBar
                  progress={userStats.coeficienteGeral / 100}
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
                  {userStats.questoesCorretas} de{" "}
                  {userStats.totalQuestoes} questões corretas
                </Text>
              </View>
            </Card.Content>
          </Card>
          )}
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

      <CourseListModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        title={modalTitle}
        courses={modalCourses}
        type={modalType}
        onOpenPerformance={openPerformance}
      />

      {selectedPerfCourse && userFirebase && (
        <PerformanceModal
          visible={perfModalVisible}
          onDismiss={() => setPerfModalVisible(false)}
          usuarioId={userFirebase.uid}
          cursoId={selectedPerfCourse.id}
          cursoTitulo={selectedPerfCourse.titulo}
        />
      )}

      <BadgeManager 
        visible={badgeManagerVisible} 
        onDismiss={() => setBadgeManagerVisible(false)} 
      />
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
  card: {
    borderRadius: spacing.md,
    elevation: 2,
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
  statIconContainer: {
    marginBottom: 8,
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
