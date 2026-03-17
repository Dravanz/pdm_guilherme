import { Curso } from "@/model/Curso";
import { ImageService } from "@/services/image/ImageService";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, IconButton, Modal, Portal, Text, useTheme } from "react-native-paper";

interface CourseDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  curso: Curso | null;
  isCompleted: boolean;
  onOpenPerformance?: (courseId: string, title: string) => void;
}

export function CourseDetailModal({
  visible,
  onDismiss,
  curso,
  isCompleted,
  onOpenPerformance,
}: CourseDetailModalProps) {
  const theme = useTheme();

  if (!curso) return null;

  const treinarCurso = () => {
    onDismiss();
    router.push({
      pathname: "/curso/[id]",
      params: { id: curso.id, modo: "treino" },
    });
  };

  const iniciarAvaliacao = () => {
    Alert.alert(
      "Modo Avaliação",
      "As respostas valerão pontos de coeficiente. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar Avaliação",
          onPress: () => {
            onDismiss();
            router.push({
              pathname: "/curso/[id]",
              params: { id: curso.id },
            });
          },
        },
      ]
    );
  };

  const verDesempenho = () => {
    if (onOpenPerformance) {
      onDismiss();
      onOpenPerformance(curso.id, curso.titulo);
    }
  };

  const getNivelLabel = (nivel: string) => {
    switch (nivel) {
      case "iniciante": return "Iniciante";
      case "intermediario": return "Intermediário";
      case "avancado": return "Avançado";
      default: return nivel;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={[styles.contentWrapper, { backgroundColor: theme.colors.background }]}>
          {/* Header com botão fechar */}
          <View style={styles.header}>
            <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: 'bold', flex: 1 }}>
              Detalhes do Curso
            </Text>
            <IconButton icon="close" onPress={onDismiss} size={24} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Imagem do curso */}
            {curso.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: ImageService.getImageUrl(curso.imageUrl) }}
                  style={styles.courseImage}
                  contentFit="cover"
                  placeholder="https://via.placeholder.com/400x200/cccccc/666666?text=Curso"
                />
              </View>
            )}

            {/* Título */}
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
              {curso.titulo}
            </Text>

            {/* Chips de nível e categoria */}
            <View style={styles.chipRow}>
              <Chip
                icon="signal"
                style={{ backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.onPrimaryContainer }}
                compact
              >
                {getNivelLabel(curso.nivel)}
              </Chip>
              <Chip
                icon="tag"
                style={{ backgroundColor: theme.colors.surfaceVariant }}
                textStyle={{ color: theme.colors.onSurfaceVariant }}
                compact
              >
                {curso.categoria.charAt(0).toUpperCase() + curso.categoria.slice(1)}
              </Chip>
              {curso.versaoLinguagem && (
                <Chip
                  icon="code-tags"
                  style={{ backgroundColor: theme.colors.surfaceVariant }}
                  textStyle={{ color: theme.colors.onSurfaceVariant }}
                  compact
                >
                  {curso.versaoLinguagem}
                </Chip>
              )}
            </View>

            {/* Status de conclusão */}
            {isCompleted && (
              <View style={[styles.completedBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Chip
                  icon="check-circle"
                  style={{ backgroundColor: 'transparent' }}
                  textStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
                >
                  Curso Concluído
                </Chip>
              </View>
            )}

            {/* Descrição */}
            <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
              {curso.descricao}
            </Text>

            {/* Botões de ação */}
            <View style={styles.actionsContainer}>
              <Button
                mode="outlined"
                onPress={treinarCurso}
                icon="school-outline"
                style={[styles.actionButton, { borderColor: theme.colors.primary, borderRadius: 24 }]}
                contentStyle={styles.buttonContent}
                textColor={theme.colors.primary}
              >
                Praticar
              </Button>

              <Button
                mode="contained"
                onPress={iniciarAvaliacao}
                icon="clipboard-check-outline"
                style={[styles.actionButton, { borderRadius: 24 }]}
                contentStyle={styles.buttonContent}
              >
                Realizar Avaliação
              </Button>

              {isCompleted && onOpenPerformance && (
                <Button
                  mode="text"
                  onPress={verDesempenho}
                  icon="chart-line"
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  textColor={theme.colors.primary}
                >
                  Ver Desempenho
                </Button>
              )}
            </View>
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
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    overflow: "hidden",
  },
  courseImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  completedBadge: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 2,
    alignItems: "center",
  },
  description: {
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 22,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    width: "100%",
  },
  buttonContent: {
    minHeight: 48,
  },
});
