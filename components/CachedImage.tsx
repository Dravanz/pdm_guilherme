import { ImageCacheService } from "@/services/image/ImageCacheService";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageProps, View } from "react-native";

interface CachedImageProps extends Omit<ImageProps, "source"> {
  userId: string;
  firebaseUrl: string;
  placeholder?: React.ReactNode;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  userId,
  firebaseUrl,
  placeholder,
  style,
  ...props
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImage();
  }, [firebaseUrl, userId]);

  const loadImage = async () => {
    if (!firebaseUrl || !userId) {
      setLoading(false);
      return;
    }

    // Se não é uma URL válida do Firebase, usar diretamente
    if (
      !firebaseUrl.startsWith("https://") ||
      firebaseUrl.includes("/path/to/image.png")
    ) {
      setImageUri(firebaseUrl);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const cachedUri = await ImageCacheService.getCachedImage(
        userId,
        firebaseUrl
      );
      setImageUri(cachedUri);
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
      setImageUri(firebaseUrl); // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[style, { justifyContent: "center", alignItems: "center" }]}>
        {placeholder || <ActivityIndicator size="small" />}
      </View>
    );
  }

  if (!imageUri) {
    return (
      <View style={[style, { justifyContent: "center", alignItems: "center" }]}>
        {placeholder}
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: imageUri }}
      style={style}
      onError={() => {
        // Em caso de erro, tentar usar URL original
        if (imageUri !== firebaseUrl) {
          setImageUri(firebaseUrl);
        }
      }}
    />
  );
};
