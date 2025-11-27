import { ImageService } from "@/services/image/ImageService";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";

interface ImageManagerProps {
  courseId: string;
  currentImageUrl?: string;
  onImageUpdate: (newUrl: string) => void;
  type: "course" | "content";
  contentId?: string;
}

export function ImageManager({
  courseId,
  currentImageUrl,
  onImageUpdate,
  type,
  contentId,
}: ImageManagerProps) {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async () => {
    try {
      const imageUri = await ImageService.pickImage();
      if (!imageUri) return;

      setUploading(true);

      let downloadUrl: string;
      if (type === "course") {
        downloadUrl = await ImageService.uploadImageWithPattern(
          `${courseId}-cover`,
          imageUri
        );
      } else {
        downloadUrl = await ImageService.uploadImageWithPattern(
          `${courseId}-${contentId}`,
          imageUri
        );
      }

      onImageUpdate(downloadUrl);
      Alert.alert("Sucesso", "Imagem atualizada com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao fazer upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>
          {type === "course" ? "Imagem do Curso" : "Imagem do Conteúdo"}
        </Text>

        {currentImageUrl && (
          <Image
            source={{ uri: currentImageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        )}

        <Button
          mode="contained"
          onPress={handleImagePick}
          loading={uploading}
          disabled={uploading}
          style={styles.button}
        >
          {currentImageUrl ? "Alterar Imagem" : "Adicionar Imagem"}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
});
