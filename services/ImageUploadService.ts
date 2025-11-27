import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/FirebaseInit";

export class ImageUploadService {
  private static readonly COURSE_IMAGES_PATH = "imagens/cursos";

  static async uploadImageFromUrl(
    imageUrl: string,
    fileName: string
  ): Promise<string> {
    try {
      // Baixar a imagem da URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erro ao baixar imagem: ${response.status}`);
      }

      const blob = await response.blob();

      // Criar referência no Storage
      const imageRef = ref(storage, `${this.COURSE_IMAGES_PATH}/${fileName}`);

      // Upload da imagem
      await uploadBytes(imageRef, blob);

      // Obter URL de download
      const downloadURL = await getDownloadURL(imageRef);

      return downloadURL;
    } catch (error) {
      console.error(`Erro ao fazer upload da imagem ${fileName}:`, error);
      throw error;
    }
  }

  static async uploadCourseImages(): Promise<{ [key: string]: string }> {
    const imagesToUpload = [
      {
        url: "https://picsum.photos/400/200?random=1",
        name: "javascript-intro.jpg",
      },
      {
        url: "https://picsum.photos/400/200?random=2",
        name: "javascript-variables.jpg",
      },
      {
        url: "https://picsum.photos/400/200?random=3",
        name: "python-intro.jpg",
      },
      {
        url: "https://picsum.photos/400/200?random=4",
        name: "python-syntax.jpg",
      },
      {
        url: "https://picsum.photos/400/200?random=5",
        name: "react-intro.jpg",
      },
      {
        url: "https://picsum.photos/400/200?random=6",
        name: "react-components.jpg",
      },
    ];

    const uploadedImages: { [key: string]: string } = {};

    for (const image of imagesToUpload) {
      try {
        const downloadURL = await this.uploadImageFromUrl(
          image.url,
          image.name
        );
        uploadedImages[image.name] = downloadURL;

        // Salvar as URLs no AsyncStorage para uso posterior
        await this.saveImageUrl(image.name, downloadURL);
      } catch (error) {
        console.error(`Falha ao fazer upload de ${image.name}:`, error);
      }
    }

    return uploadedImages;
  }

  private static async saveImageUrl(
    imageName: string,
    url: string
  ): Promise<void> {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem(`course_image_${imageName}`, url);
    } catch (error) {
      console.error("Erro ao salvar URL da imagem:", error);
    }
  }

  static async getImageUrl(imageName: string): Promise<string | null> {
    try {
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      return await AsyncStorage.getItem(`course_image_${imageName}`);
    } catch (error) {
      console.error("Erro ao obter URL da imagem:", error);
      return null;
    }
  }

  /**
   * Upload de imagem local (URI do dispositivo) para o Storage
   */
  static async uploadImage(
    localUri: string,
    fileName: string
  ): Promise<string | null> {
    try {
      // Converter URI local para blob
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Criar referência no Storage
      const imageRef = ref(storage, `${this.COURSE_IMAGES_PATH}/${fileName}`);

      // Upload da imagem
      await uploadBytes(imageRef, blob);

      // Obter URL de download
      const downloadURL = await getDownloadURL(imageRef);

      return downloadURL;
    } catch (error) {
      console.error(`Erro ao fazer upload da imagem ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Upload de imagem de curso com estrutura de pasta correta
   * Estrutura: imagens/cursos/{cursoId}/{fileName}
   */
  static async uploadCourseImage(
    localUri: string,
    cursoId: string,
    fileName: string
  ): Promise<string | null> {
    try {
      // Converter URI local para blob
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Criar referência no Storage com estrutura de pasta correta
      const imageRef = ref(
        storage,
        `${this.COURSE_IMAGES_PATH}/${cursoId}/${fileName}`
      );

      // Upload da imagem
      await uploadBytes(imageRef, blob);

      // Obter URL de download
      const downloadURL = await getDownloadURL(imageRef);

      return downloadURL;
    } catch (error) {
      console.error(`Erro ao fazer upload da imagem ${fileName}:`, error);
      return null;
    }
  }
}
