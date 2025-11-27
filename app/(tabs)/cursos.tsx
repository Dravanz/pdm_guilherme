import { CourseConfig } from "@/config/CourseConfig";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { firestore } from "@/firebase/FirebaseInit";
import { Curso } from "@/model/Curso";
import { ImageService } from "@/services/ImageService";
import { Image } from "expo-image";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

export default function Cursos() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);
  const [cursosStatus, setCursosStatus] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [cursosDisponiveis, setCursosDisponiveis] = useState<Curso[]>([]);

  useEffect(() => {
    // Configurar listener em tempo real para mudanças na coleção de cursos
    const cursosRef = collection(firestore, "cursos");
    const unsubscribe = onSnapshot(
      cursosRef,
      (snapshot) => {
        const cursosAtualizados = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            fonte: data.migradoDeLocal ? "xml" : ("firestore" as const),
          };
        }) as Curso[];

        setCursosDisponiveis(cursosAtualizados);
      },
      (error) => {
        console.error("Erro ao escutar mudanças nos cursos:", error);
        // Fallback para cursos estáticos em caso de erro
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
        setCursosDisponiveis(courses);
      }
    );

    // Cleanup: remover listener quando componente desmontar
    return () => unsubscribe();
  }, []);

  // Listener em tempo real para progresso dos cursos do usuário
  useEffect(() => {
    if (!user?.uid) return;

    const usuariosCursosRef = collection(firestore, "usuariosCursos");
    const q = query(usuariosCursosRef, where("usuarioId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const novoStatus: { [key: string]: boolean } = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        novoStatus[data.cursoId] = data.concluido || false;
      });

      setCursosStatus(novoStatus);
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
    <SafeAreaView
      style={[
        themeStyles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <FlatList
        data={cursosDisponiveis}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={[
              themeStyles.card,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {item.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: ImageService.getImageUrl(item.imageUrl) }}
                  style={styles.courseImage}
                  contentFit="cover"
                  placeholder="https://via.placeholder.com/300x120/cccccc/666666?text=Curso"
                />
              </View>
            )}
            <Card.Title
              title={item.titulo}
              subtitle={`Nível: ${
                item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)
              } • ${
                item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)
              }`}
              titleStyle={{ color: theme.colors.onSurface }}
              subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            <Card.Content>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {item.descricao}
              </Text>
            </Card.Content>
            <Card.Actions>
              {cursosStatus[item.id] ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Text
                    style={{
                      color: "#22c55e",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    ✅ Curso concluído
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => revisarCurso(item)}
                    icon="refresh"
                  >
                    Revisar
                  </Button>
                </View>
              ) : (
                <Button
                  mode="contained"
                  onPress={() => iniciarCurso(item)}
                  style={{ backgroundColor: "#22c55e" }}
                >
                  Iniciar Curso
                </Button>
              )}
            </Card.Actions>
          </Card>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: themeStyles.spacing.sm }} />
        )}
        ListHeaderComponent={
          <Text
            variant="headlineMedium"
            style={[themeStyles.header, { color: theme.colors.onBackground }]}
          >
            Cursos Disponíveis
          </Text>
        }
        contentContainerStyle={{
          padding: themeStyles.spacing.md,
          paddingBottom: 100,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    height: 150,
    overflow: "hidden",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  courseImage: {
    width: "100%",
    height: "100%",
  },
});
