import { CourseConfig } from "@/config/CourseConfig";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { firestore } from "@/firebase/FirebaseInit";
import { Curso } from "@/model/Curso";
import { ImageService } from "@/services/image/ImageService";
import { PerformanceModal } from "@/components/PerformanceModal";
import { Image } from "expo-image";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Icon, Modal, Portal, Text, useTheme, Searchbar } from "react-native-paper";

export default function Cursos() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);
  const [cursosStatus, setCursosStatus] = useState<{ [key: string]: boolean }>({});
  const [cursosPratica, setCursosPratica] = useState<{ [key: string]: boolean }>({});
  const [cursosDisponiveis, setCursosDisponiveis] = useState<Curso[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursosFiltrados, setCursosFiltrados] = useState<Curso[]>([]);

  // Modal de ações do curso
  const [cursoSelecionado, setCursoSelecionado] = useState<Curso | null>(null);
  const [modalAcoesVisivel, setModalAcoesVisivel] = useState(false);

  // Modal de desempenho
  const [perfModalVisivel, setPerfModalVisivel] = useState(false);
  const [cursoPerfSelecionado, setCursoPerfSelecionado] = useState<{ id: string; titulo: string } | null>(null);

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
      const novaPratica: { [key: string]: boolean } = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        novoStatus[data.cursoId] = data.concluido || false;
        novaPratica[data.cursoId] = data.praticaCompleta || false;
      });

      setCursosStatus(novoStatus);
      setCursosPratica(novaPratica);
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

  const abrirModalCurso = (curso: Curso) => {
    setCursoSelecionado(curso);
    setModalAcoesVisivel(true);
  };

  const fecharModal = () => {
    setModalAcoesVisivel(false);
    setCursoSelecionado(null);
  };

  const irParaPratica = (curso: Curso) => {
    fecharModal();
    router.push({ pathname: "/curso/[id]", params: { id: curso.id, modo: "treino" } });
  };

  const irParaAvaliacao = (curso: Curso) => {
    fecharModal();
    router.push({ pathname: "/curso/[id]", params: { id: curso.id } });
  };

  const abrirDesempenho = (curso: Curso) => {
    fecharModal();
    setCursoPerfSelecionado({ id: curso.id, titulo: curso.titulo });
    setPerfModalVisivel(true);
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
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            style={[
              themeStyles.card,
              { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
            ]}
            onPress={() => abrirModalCurso(item)}
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
              right={() =>
                cursosStatus[item.id] ? (
                  <View style={{ paddingRight: 12 }}>
                    <Icon source="check-circle" size={24} color="#22c55e" />
                  </View>
                ) : null
              }
            />
            <Card.Content>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {item.descricao}
              </Text>
            </Card.Content>
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

      {/* Modal de ações do curso */}
      <Portal>
        <Modal
          visible={modalAcoesVisivel}
          onDismiss={fecharModal}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {cursoSelecionado && (
            <>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "bold", marginBottom: 4 }}>
                {cursoSelecionado.titulo}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}>
                {cursosStatus[cursoSelecionado.id] ? "Curso concluído" : "Em andamento"}
              </Text>

              <Button
                mode="contained"
                icon="school-outline"
                onPress={() => irParaPratica(cursoSelecionado)}
                style={{ marginBottom: 10 }}
                buttonColor={theme.colors.tertiary}
              >
                Praticar
              </Button>

              <Button
                mode="contained"
                icon="clipboard-check-outline"
                onPress={() => irParaAvaliacao(cursoSelecionado)}
                style={{ marginBottom: 10 }}
                disabled={!cursosStatus[cursoSelecionado.id] && !cursosPratica[cursoSelecionado.id]}
              >
                {!cursosStatus[cursoSelecionado.id] && !cursosPratica[cursoSelecionado.id]
                  ? "Avaliação (complete Praticar primeiro)"
                  : "Avaliação"}
              </Button>

              <Button
                mode="outlined"
                icon="chart-bar"
                onPress={() => abrirDesempenho(cursoSelecionado)}
                style={{ marginBottom: 16 }}
              >
                Ver Desempenho
              </Button>

              <Button mode="text" onPress={fecharModal}>
                Fechar
              </Button>
            </>
          )}
        </Modal>
      </Portal>

      {/* Modal de desempenho */}
      {cursoPerfSelecionado && user && (
        <PerformanceModal
          visible={perfModalVisivel}
          onDismiss={() => setPerfModalVisivel(false)}
          usuarioId={user.uid}
          cursoId={cursoPerfSelecionado.id}
          cursoTitulo={cursoPerfSelecionado.titulo}
        />
      )}
    </SafeAreaView>
  );
}
 //TODO: 
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
  modal: {
    margin: 24,
    borderRadius: 16,
    padding: 24,
  },
});
