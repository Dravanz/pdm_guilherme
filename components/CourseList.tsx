import { CourseConfig } from "@/config/CourseConfig";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Curso } from "@/model/Curso";
import { CursoService } from "@/services/curso/CursoService";
import { ImageService } from "@/services/image/ImageService";
import { CourseDetailModal } from "@/components/CourseDetailModal";
import { PerformanceModal } from "@/components/PerformanceModal";
import { Image } from "expo-image";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Icon, Text, useTheme } from "react-native-paper";

interface CourseListProps {
  showHeader?: boolean;
  limit?: number;
}

export function CourseList({ showHeader = true, limit }: CourseListProps) {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);
  const [cursosStatus, setCursosStatus] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [cursosDisponiveis, setCursosDisponiveis] = useState<Curso[]>([]);
  
  // Modal state
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [perfModalVisible, setPerfModalVisible] = useState(false);
  const [perfCurso, setPerfCurso] = useState<{id: string, titulo: string} | null>(null);

  const carregarCursos = useCallback(async () => {
    try {
      // Buscar cursos de ambas as fontes (XML + Firestore)
      const todosCursos = await CursoService.listarCursos();

      // Adicionar cursos do Firestore ao CourseConfig dinamicamente
      todosCursos.forEach((curso) => {
        if ((curso as any).fonte === "firestore") {
          // Verificar se já não existe
          if (!CourseConfig.getCourseById(curso.id)) {
            CourseConfig.addCourse({
              id: curso.id,
              titulo: curso.titulo,
              categoria: curso.categoria,
              nivel: curso.nivel,
              questionsCount: 0, // Será calculado do XML
              icon: "book-open-variant",
              color: "#6366f1",
              description: curso.descricao,
              imageUrl: curso.imageUrl,
              thumbnailUrl: curso.imageUrl,
            });
          }
        }
      });

      const limitedCourses = limit ? todosCursos.slice(0, limit) : todosCursos;
      setCursosDisponiveis(limitedCourses);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      // Fallback para cursos estáticos do CourseConfig
      const courses = CourseConfig.getAllCourses().map((course) => ({
        id: course.id,
        titulo: course.titulo,
        descricao: course.description,
        categoria: course.categoria,
        nivel: course.nivel as "iniciante" | "intermediario" | "avancado",
        imageUrl: course.imageUrl,
        paginas: [],
        coeficienteMaximo: 100,
        createdAt: null,
        updatedAt: null,
      }));

      const limitedCourses = limit ? courses.slice(0, limit) : courses;
      setCursosDisponiveis(limitedCourses);
    }
  }, [limit]);

  const verificarStatusCursos = useCallback(async () => {
    if (!user?.uid) return;

    const status: { [key: string]: boolean } = {};

    for (const curso of cursosDisponiveis) {
      const concluido = await CursoService.verificarCursoConcluido(
        user.uid,
        curso.id
      );
      status[curso.id] = concluido;
    }

    setCursosStatus(status);
  }, [user, cursosDisponiveis]);

  useEffect(() => {
    carregarCursos();
  }, [carregarCursos]);

  useEffect(() => {
    if (user && cursosDisponiveis.length > 0) {
      verificarStatusCursos();
    }
  }, [user, cursosDisponiveis, verificarStatusCursos]);

  const abrirDetalhes = (curso: Curso) => {
    setSelectedCurso(curso);
    setModalVisible(true);
  };

  const abrirDesempenho = (courseId: string, title: string) => {
    setPerfCurso({ id: courseId, titulo: title });
    setPerfModalVisible(true);
  };

  return (
    <View>
      <FlatList
        data={cursosDisponiveis}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.7} onPress={() => abrirDetalhes(item)}>
            <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
              <View style={styles.imageContainer}>
                {item.imageUrl ? (
                  <Image
                    source={{
                      uri: item.imageUrl.startsWith("http")
                        ? item.imageUrl
                        : ImageService.getImageUrl(item.imageUrl),
                    }}
                    style={styles.courseImage}
                    contentFit="cover"
                    placeholder="https://via.placeholder.com/300x140/cccccc/666666?text=Curso"
                  />
                ) : (
                  <View style={[styles.courseImage, { backgroundColor: theme.colors.surfaceVariant, justifyContent: "center", alignItems: "center" }]}>
                    <Icon source="book-open-variant" size={48} color={theme.colors.onSurfaceVariant} />
                  </View>
                )}
                {cursosStatus[item.id] && (
                  <View style={[styles.completedBadge, { backgroundColor: theme.colors.primary }]}>
                    <Icon source="check" size={16} color="#fff" />
                  </View>
                )}
              </View>
              <Card.Content style={{ paddingTop: 12, paddingBottom: 14 }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: "bold" }}>
                  {item.titulo}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {`${item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)} • ${item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}${item.versaoLinguagem ? ` • ${item.versaoLinguagem}` : ""}`}
                </Text>
                {item.descricao ? (
                  <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                    {item.descricao}
                  </Text>
                ) : null}
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: themeStyles.spacing.sm }} />
        )}
        ListHeaderComponent={
          showHeader ? (
            <Text
              variant="headlineMedium"
              style={[themeStyles.header, { color: theme.colors.onBackground }]}
            >
              Cursos Disponíveis
            </Text>
          ) : null
        }
        scrollEnabled={false}
      />

      <CourseDetailModal
        visible={modalVisible}
        onDismiss={() => { setModalVisible(false); setSelectedCurso(null); }}
        curso={selectedCurso}
        isCompleted={selectedCurso ? !!cursosStatus[selectedCurso.id] : false}
        onOpenPerformance={abrirDesempenho}
      />

      {perfCurso && user?.uid && (
        <PerformanceModal
          visible={perfModalVisible}
          onDismiss={() => { setPerfModalVisible(false); setPerfCurso(null); }}
          usuarioId={user.uid}
          cursoId={perfCurso.id}
          cursoTitulo={perfCurso.titulo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  courseImage: {
    width: "100%",
    height: 140,
  },
  completedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
