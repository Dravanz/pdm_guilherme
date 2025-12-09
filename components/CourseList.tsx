import { CourseConfig } from "@/config/CourseConfig";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Curso } from "@/model/Curso";
import { CursoService } from "@/services/curso/CursoService";
import { ImageService } from "@/services/image/ImageService";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

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
              icon: "📚",
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

  const iniciarCurso = (curso: Curso) => {
    router.push({
      pathname: "/curso/[id]",
      params: { id: curso.id },
    });
  };

  const revisarCurso = (curso: Curso) => {
    router.push({
      pathname: "/curso/[id]",
      params: { id: curso.id, modo: "revisao" },
    });
  };

  return (
    <FlatList
      data={cursosDisponiveis}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card
          style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}
        >
          {item.imageUrl && (
            <Image
              source={{
                uri: item.imageUrl.startsWith("http")
                  ? item.imageUrl
                  : ImageService.getImageUrl(item.imageUrl),
              }}
              style={styles.courseImage}
              contentFit="contain"
              placeholder="https://via.placeholder.com/300x120/cccccc/666666?text=Curso"
            />
          )}
          <Card.Title
            title={item.titulo}
            subtitle={`Nível: ${
              item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)
            } • ${
              item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)
            }${item.versaoLinguagem ? ` • ${item.versaoLinguagem}` : ""}`}
            titleStyle={{ color: theme.colors.onSurface }}
            subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <Card.Content>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
            >
              {item.descricao || "Sem descrição"}
            </Text>
          </Card.Content>
          <View style={{ padding: 16, paddingTop: 8 }}>
            {cursosStatus[item.id] ? (
              <View style={{ gap: 12 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: "#22c55e", fontWeight: "bold", fontSize: 16 }}>
                      ✅ Concluído
                    </Text>
                 </View>
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button
                      mode="outlined"
                      onPress={() => router.push({ pathname: "/curso/[id]", params: { id: item.id, modo: "revisao" } })}
                      icon="chart-bar"
                      style={{ borderColor: theme.colors.outline, minWidth: 40 }}
                      contentStyle={{ height: 40, paddingHorizontal: 0 }}
                      compact
                    >
                      {""}
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => revisarCurso(item)}
                      icon="refresh"
                      style={{ flex: 1, borderColor: theme.colors.outline }}
                      contentStyle={{ height: 40 }}
                    >
                      Revisar
                    </Button>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Button
                    mode="contained"
                    onPress={() => iniciarCurso(item)}
                    style={{ backgroundColor: "#22c55e", flex: 1 }}
                    contentStyle={{ height: 40 }}
                    labelStyle={{ fontSize: 12 }}
                    compact
                  >
                    Iniciar
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => router.push({ pathname: "/curso/[id]", params: { id: item.id, modo: "preview" } })}
                    style={{ flex: 1, borderColor: theme.colors.outline }}
                    contentStyle={{ height: 40 }}
                    labelStyle={{ fontSize: 12 }}
                    icon="magnify"
                    compact
                  >
                    Visualizar
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => router.push({ pathname: "/curso/[id]", params: { id: item.id, modo: "revisao" } })} // Using revisao/performance route
                    style={{ borderColor: theme.colors.outline, minWidth: 40, justifyContent: 'center' }}
                    contentStyle={{ height: 40 }}
                    icon="chart-bar"
                    compact
                  >
                    {""}
                  </Button>
              </View>
            )}
          </View>
        </Card>
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
  );
}

const styles = StyleSheet.create({
  courseImage: {
    width: "100%",
    height: 60,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});
