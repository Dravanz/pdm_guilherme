import { PerformanceModal } from "@/components/PerformanceModal";
import { CourseConfig } from "@/config/CourseConfig";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { firestore } from "@/firebase/FirebaseInit";
import { Curso } from "@/model/Curso";
import { ImageService } from "@/services/image/ImageService";
import { Image } from "expo-image";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { Button, Card, Searchbar, Text, useTheme } from "react-native-paper";

export default function Cursos() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);
  const [cursosStatus, setCursosStatus] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [cursosDisponiveis, setCursosDisponiveis] = useState<Curso[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursosFiltrados, setCursosFiltrados] = useState<Curso[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{id: string, titulo: string} | null>(null);

  useEffect(() => {
    // Configurar listener em tempo real para mudanças na coleção de cursos
    const cursosRef = collection(firestore, "cursos");
    const unsubscribe = onSnapshot(
      cursosRef,
      (snapshot) => {
        const cursosAtualizados = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fonte: data.migradoDeLocal ? "xml" : ("firestore" as const),
          } as unknown as Curso;
        });

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

  // Filtrar cursos com base na busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCursosFiltrados(cursosDisponiveis);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtrados = cursosDisponiveis.filter((curso) => {
      return (
        curso.titulo.toLowerCase().includes(query) ||
        curso.descricao.toLowerCase().includes(query) ||
        curso.categoria.toLowerCase().includes(query) ||
        curso.nivel.toLowerCase().includes(query) ||
        (curso.versaoLinguagem && curso.versaoLinguagem.toLowerCase().includes(query))
      );
    });

    setCursosFiltrados(filtrados);
  }, [searchQuery, cursosDisponiveis]);

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

  const abrirDesempenho = (cursoId: string, titulo: string) => {
    setSelectedCourse({ id: cursoId, titulo });
    setModalVisible(true);
  };

  return (
    <SafeAreaView
      style={[
        themeStyles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar cursos..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ backgroundColor: theme.colors.surface }}
        />
      </View>
      <FlatList
        data={cursosFiltrados}
        extraData={cursosStatus}
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
              }${item.versaoLinguagem ? ` • ${item.versaoLinguagem}` : ""}`}
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
            <View style={{ padding: 16, paddingTop: 8 }}>
                {cursosStatus[item.id] ? (
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ color: "#22c55e", fontWeight: "bold", fontSize: 16 }}>
                        ✅ Concluído
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <Button
                        mode="outlined"
                        onPress={() => abrirDesempenho(item.id, item.titulo)}
                        icon="chart-bar"
                        style={{ borderColor: theme.colors.outline, minWidth: 40, justifyContent: 'center' }}
                        contentStyle={{ height: 40 }}
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
                  <View style={{ flexDirection: "row", gap: 4 }}>
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
                      onPress={() => abrirDesempenho(item.id, item.titulo)}
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
      {selectedCourse && user && (
        <PerformanceModal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          usuarioId={user.uid}
          cursoId={selectedCourse.id}
          cursoTitulo={selectedCourse.titulo}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
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
