import { ThemeContext } from "@/context/ThemeProvider";
import { Curso } from "@/model/Curso";
import { ImageService } from "@/services/image/ImageService";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useContext } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button, Card, IconButton, Modal, Portal, Text, useTheme } from "react-native-paper";

interface CourseListModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  courses: Curso[];
  type: "completed" | "in_progress";
  onOpenPerformance?: (courseId: string, title: string) => void;
}

export function CourseListModal({
  visible,
  onDismiss,
  title,
  courses,
  type,
  onOpenPerformance,
}: CourseListModalProps) {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);

  const handleAction = (curso: Curso) => {
    onDismiss();
    if (type === "completed") {
      // Revisar
      router.push({
        pathname: "/curso/[id]",
        params: { id: curso.id, modo: "revisao" },
      });
    } else {
      // Continuar
      router.push({
        pathname: "/curso/[id]",
        params: { id: curso.id },
      });
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
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
            {title}
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        {courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Nenhum curso encontrado nesta categoria.
            </Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <Card
                style={[
                  themeStyles.card,
                  { backgroundColor: theme.colors.surface, marginBottom: 16 },
                ]}
              >
                <View style={{ flexDirection: "row" }}>
                  {item.imageUrl && (
                    <Image
                      source={{ uri: ImageService.getImageUrl(item.imageUrl) }}
                      style={styles.courseImage}
                      contentFit="cover"
                    />
                  )}
                  <View style={{ flex: 1, padding: 8, justifyContent: 'space-between' }}>
                    <View>
                        <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.onSurface }}>
                            {item.titulo}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                            {item.categoria}
                        </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {type === "completed" && onOpenPerformance && (
                        <Button
                          mode="outlined"
                          compact
                          icon="chart-bar"
                          onPress={() => {
                            onDismiss();
                            onOpenPerformance(item.id, item.titulo);
                          }}
                          style={{ flexGrow: 1, borderColor: theme.colors.outline, minWidth: 120 }}
                          labelStyle={{ fontSize: 12 }}
                        >
                          Desempenho
                        </Button>
                      )}
                      <Button
                        mode="contained"
                        compact
                        icon={type === "completed" ? "book-open-variant" : "play-circle"}
                        onPress={() => handleAction(item)}
                        style={{ flexGrow: 1, minWidth: 120 }}
                        labelStyle={{ fontSize: 12 }}
                      >
                        {type === "completed" ? "Revisar" : "Continuar"}
                      </Button>
                    </View>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    height: "90%",
    maxHeight: "90%",
  },
  contentWrapper: {
    padding: 20,
    borderRadius: 12,
    flex: 1, // Ensure it fills the modal container
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  courseImage: {
    width: 100,
    height: 120,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
});
