import { UserContext } from "@/context/UserProvider";
import {
    CourseStats,
    CourseStatsService,
} from "@/services/curso/CourseStatsService";
import { ImageService } from "@/services/image/ImageService";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Icon, Text, useTheme } from "react-native-paper";

interface FeaturedCoursesProps {
  showHeader?: boolean;
  limit?: number;
}

export function FeaturedCourses({
  showHeader = true,
  limit = 3,
}: FeaturedCoursesProps) {
  const theme = useTheme();
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { userFirebase } = useContext<any>(UserContext);

  useEffect(() => {
    loadCourseStats();
  }, []);

  const loadCourseStats = async () => {
    try {
      const stats = await CourseStatsService.obterEstatisticasCursos();
      setCourseStats(limit ? stats.slice(0, limit) : stats);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      // Em caso de erro, usar dados vazios
      setCourseStats([]);
    } finally {
      setLoading(false);
    }
  };

  const navegarParaCurso = (cursoId: string) => {
    router.push({
      pathname: "/curso/[id]",
      params: { id: cursoId, modo: 'preview' },
    });
  };



  if (loading) {
    return (
      <View>
        {showHeader && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon source="star-circle" size={24} color={theme.colors.tertiary || '#d97706'} />
            <Text
              variant="headlineMedium"
              style={[styles.header, { color: theme.colors.onBackground, marginVertical: 0 }]}
            >
              Cursos em Destaque
            </Text>
          </View>
        )}
        <Text
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: "center",
            padding: 20,
          }}
        >
          Carregando cursos...
        </Text>
      </View>
    );
  }

  return (
    <View>
      {showHeader && (
        <Text
          variant="headlineMedium"
          style={[styles.header, { color: theme.colors.onBackground }]}
        >
          Cursos em Destaque
        </Text>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {courseStats.map((course) => (
          <TouchableOpacity
            key={course.cursoId}
            onPress={() => navegarParaCurso(course.cursoId)}
          >
            <Card
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
            >
              {course.imageUrl && (
                <Image
                  source={{
                    uri: course.imageUrl.startsWith("http")
                      ? course.imageUrl
                      : ImageService.getImageUrl(course.imageUrl),
                  }}
                  style={styles.courseImage}
                  contentFit="contain"
                  placeholder="https://via.placeholder.com/200x100/cccccc/666666?text=Curso"
                />
              )}

              <Card.Content style={styles.content}>
                <Text
                  variant="titleMedium"
                  style={[styles.title, { color: theme.colors.onSurface }]}
                  numberOfLines={2}
                >
                  {course.titulo}
                </Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Icon source="account-group" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>
                      {course.totalUsuarios} alunos
                    </Text>
                  </View>
                </View>

                {course.usuariosAtivos > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon source="fire" size={14} color={theme.colors.streak} />
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.activeUsers,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {course.usuariosAtivos} estudando agora
                    </Text>
                  </View>
                )}


              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    textAlign: "center",
    marginVertical: 16,
    fontWeight: "bold",
  },
  container: {
    paddingHorizontal: 4,
  },
  card: {
    width: 250,
    marginRight: 12,
    marginBottom: 8,
    borderRadius: 20,
    elevation: 2,
  },
  courseImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: 4,
  },
  content: {
    padding: 12,
  },
  title: {
    fontWeight: "600",
    marginBottom: 8,
    minHeight: 40,
  },
  statsContainer: {
    flexDirection: "column",
    gap: 6,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeUsers: {
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
});
