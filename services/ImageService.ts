import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/FirebaseInit";

export class ImageService {
  // Mapeamento de cursos para IDs curtos
  private static courseMap = {
    "javascript-basico": "js",
    "python-basico": "py",
    "react-basico": "rx",
  };

  // Upload com nomenclatura padronizada: courseShort + pageNumber + '-' + contentType
  // Exemplo: js1-function, py2-variables, rx3-components
  static async uploadImageWithPattern(
    pattern: string,
    imageUri: string
  ): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const imageRef = ref(storage, `imagens/cursos/${pattern}.jpg`);
      await uploadBytes(imageRef, blob);

      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      throw error;
    }
  }

  // Gerar URL da imagem baseado no padrão
  // Pattern pode ser: js1-intro, py2-variables, rx3-components, js-cover, etc.
  static getImageUrl(pattern: string): string {
    // Se já é uma URL completa, retorna diretamente
    if (pattern.startsWith("http")) {
      return pattern;
    }

    // Todas as imagens estão diretamente em imagens/cursos/ sem subpastas
    const url = `https://firebasestorage.googleapis.com/v0/b/pdm-guilherme.firebasestorage.app/o/imagens%2Fcursos%2F${encodeURIComponent(
      pattern
    )}.jpg?alt=media`;
    return url;
  }

  // Verificar se imagem existe no storage
  static async checkImageExists(pattern: string): Promise<boolean> {
    try {
      const imageRef = ref(storage, `imagens/cursos/${pattern}.jpg`);
      await getDownloadURL(imageRef);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Selecionar imagem da galeria
  static async pickImage(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Permissão necessária para acessar a galeria!");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }

    return null;
  }

  // URLs padrão das imagens dos cursos
  static getCourseImageUrl(courseId: string): string {
    const defaultImages = {
      "javascript-basico":
        "https://firebasestorage.googleapis.com/v0/b/your-project/o/courses%2Fjavascript-basico%2Fcover.jpg?alt=media",
      "python-basico":
        "https://firebasestorage.googleapis.com/v0/b/your-project/o/courses%2Fpython-basico%2Fcover.jpg?alt=media",
      "react-basico":
        "https://firebasestorage.googleapis.com/v0/b/your-project/o/courses%2Freact-basico%2Fcover.jpg?alt=media",
    };

    return (
      defaultImages[courseId as keyof typeof defaultImages] ||
      "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Curso"
    );
  }
}
