import { Asset } from "expo-asset";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { CourseConfig } from "../config/CourseConfig";
import { firestore, storage } from "../firebase/FirebaseInit";
import { Curso, PaginaCurso, UsuarioCurso } from "../model/Curso";
import { BadgeService } from "./BadgeService";
import { ImageUploadService } from "./ImageUploadService";
import { QuestaoService } from "./QuestaoService";

export class CursoService {
  /**
   * Lista todos os cursos disponíveis do Firestore
   */
  static async listarCursos(): Promise<Curso[]> {
    try {
      // Buscar cursos do Firestore (incluindo os migrados)
      const cursosRef = collection(firestore, "cursos");
      const cursosSnapshot = await getDocs(cursosRef);
      const cursosFirestore = cursosSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          fonte: data.migradoDeLocal ? "xml" : ("firestore" as const),
        };
      }) as Curso[];

      return cursosFirestore;
    } catch (error) {
      console.error("Erro ao listar cursos:", error);
      return [];
    }
  }

  static async carregarCursoXML(
    cursoId: string,
    userPhotoUrl?: string
  ): Promise<Curso> {
    try {
      // Tentar carregar de ambas as fontes
      const xmlContent = await this.obterXMLCurso(cursoId, userPhotoUrl);

      if (!xmlContent) {
        throw new Error(`XML não encontrado para curso: ${cursoId}`);
      }

      await QuestaoService.inicializarQuestoesDoCurso(cursoId);

      const curso = await this.parseXMLCurso(xmlContent);

      // Se for curso do Firestore, adicionar metadados adicionais
      try {
        const cursoFirestore = await this.buscarCursoFirestore(cursoId);
        if (cursoFirestore) {
          return {
            ...curso,
            imageUrl: cursoFirestore.imageUrl || curso.imageUrl,
            createdAt: cursoFirestore.createdAt,
            updatedAt: cursoFirestore.updatedAt,
          };
        }
      } catch (e) {
        // Ignorar se não estiver no Firestore (curso XML estático)
      }

      return curso;
    } catch (error) {
      console.error("Erro no carregarCursoXML:", error);
      throw new Error(`Erro ao carregar curso ${cursoId}: ${error}`);
    }
  }

  /**
   * Busca metadados do curso no Firestore
   */
  private static async buscarCursoFirestore(cursoId: string): Promise<any> {
    const cursoRef = doc(firestore, "cursos", cursoId);
    const cursoSnap = await getDoc(cursoRef);
    return cursoSnap.exists() ? cursoSnap.data() : null;
  }

  static async obterXMLCurso(
    cursoId: string,
    userPhotoUrl?: string
  ): Promise<string> {
    try {
      // 1. Tentar carregar XML do Storage (cursos criados por colaboradores)
      try {
        const storageRef = ref(storage, `courses/${cursoId}.xml`);
        const downloadURL = await getDownloadURL(storageRef);
        const response = await fetch(downloadURL);
        let xmlContent = await response.text();

        // Substituir placeholders de imagem
        const storageImages: { [key: string]: string } = {
          "javascript-intro":
            (await ImageUploadService.getImageUrl("javascript-intro.jpg")) ||
            userPhotoUrl ||
            "",
          "javascript-variables":
            (await ImageUploadService.getImageUrl(
              "javascript-variables.jpg"
            )) ||
            userPhotoUrl ||
            "",
          "python-intro":
            (await ImageUploadService.getImageUrl("python-intro.jpg")) ||
            userPhotoUrl ||
            "",
          "python-syntax":
            (await ImageUploadService.getImageUrl("python-syntax.jpg")) ||
            userPhotoUrl ||
            "",
          "react-intro":
            (await ImageUploadService.getImageUrl("react-intro.jpg")) ||
            userPhotoUrl ||
            "",
          "react-components":
            (await ImageUploadService.getImageUrl("react-components.jpg")) ||
            userPhotoUrl ||
            "",
        };

        Object.keys(storageImages).forEach((key) => {
          xmlContent = xmlContent.replace(
            new RegExp(`{{${key}}}`, "g"),
            storageImages[key as keyof typeof storageImages]
          );
        });

        return xmlContent;
      } catch (storageError) {
        // Se não encontrar no Storage, tentar carregar do arquivo local
        console.log("XML não encontrado no Storage, tentando arquivo local...");
      }

      // 2. Carregar XML do arquivo local (cursos estáticos)
      let xmlContent = await this.carregarXMLDoArquivo(cursoId);

      // Obter URLs das imagens do Firebase Storage
      const storageImages: { [key: string]: string } = {
        "javascript-intro":
          (await ImageUploadService.getImageUrl("javascript-intro.jpg")) ||
          userPhotoUrl ||
          "",
        "javascript-variables":
          (await ImageUploadService.getImageUrl("javascript-variables.jpg")) ||
          userPhotoUrl ||
          "",
        "python-intro":
          (await ImageUploadService.getImageUrl("python-intro.jpg")) ||
          userPhotoUrl ||
          "",
        "python-syntax":
          (await ImageUploadService.getImageUrl("python-syntax.jpg")) ||
          userPhotoUrl ||
          "",
        "react-intro":
          (await ImageUploadService.getImageUrl("react-intro.jpg")) ||
          userPhotoUrl ||
          "",
        "react-components":
          (await ImageUploadService.getImageUrl("react-components.jpg")) ||
          userPhotoUrl ||
          "",
      };

      // Substituir placeholders de imagem
      Object.keys(storageImages).forEach((key) => {
        xmlContent = xmlContent.replace(
          new RegExp(`{{${key}}}`, "g"),
          storageImages[key as keyof typeof storageImages]
        );
      });

      return xmlContent;
    } catch (error) {
      console.error("Erro ao carregar XML:", error);
      return this.obterXMLCursoFallback(cursoId, userPhotoUrl);
    }
  }

  private static async carregarXMLDoArquivo(cursoId: string): Promise<string> {
    const xmlFiles: { [key: string]: any } = {
      "javascript-basico": require("../assets/courses/javascript-basico.xml"),
      "python-basico": require("../assets/courses/python-basico.xml"),
      "react-basico": require("../assets/courses/react-basico.xml"),
    };

    const xmlAsset = xmlFiles[cursoId as keyof typeof xmlFiles];
    if (!xmlAsset) {
      throw new Error(`XML não encontrado para curso: ${cursoId}`);
    }

    const asset = Asset.fromModule(xmlAsset);
    await asset.downloadAsync();

    const response = await fetch(asset.localUri || asset.uri);
    return await response.text();
  }

  private static obterXMLCursoFallback(
    cursoId: string,
    userPhotoUrl?: string
  ): string {
    return "";
  }

  static async uploadCourseImagesAndUpdateXML(): Promise<void> {
    try {
      const uploadedImages = await ImageUploadService.uploadCourseImages();
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
    }
  }

  static async parseXMLCurso(xmlContent: string): Promise<Curso> {
    const lines = xmlContent.split("\n");
    let curso: any = {};
    let paginas: PaginaCurso[] = [];
    let paginaAtual: any = {};
    let questaoRefs: string[] = [];
    let conteudoBuffer = "";
    let dentroConteudo = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes("<curso")) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        const tituloMatch = trimmed.match(/titulo="([^"]+)"/);
        const categoriaMatch = trimmed.match(/categoria="([^"]+)"/);
        const nivelMatch = trimmed.match(/nivel="([^"]+)"/);
        const coefMatch = trimmed.match(/coeficienteMaximo="([^"]+)"/);

        curso = {
          id: idMatch?.[1] || "",
          titulo: tituloMatch?.[1] || "",
          categoria: categoriaMatch?.[1] || "",
          nivel: nivelMatch?.[1] || "iniciante",
          coeficienteMaximo: parseInt(coefMatch?.[1] || "100"),
          descricao: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      if (trimmed.includes("<pagina")) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        const tipoMatch = trimmed.match(/tipo="([^"]+)"/);

        paginaAtual = {
          id: idMatch?.[1] || "",
          tipo: tipoMatch?.[1] || "conteudo",
        };
        questaoRefs = [];
        conteudoBuffer = "";
      }

      if (trimmed.includes("<titulo>") && trimmed.includes("</titulo>")) {
        paginaAtual.titulo = trimmed.replace(/<\/?titulo>/g, "");
      }

      if (trimmed.includes("<conteudo>")) {
        dentroConteudo = true;
        conteudoBuffer = trimmed.replace("<conteudo>", "");
        if (trimmed.includes("</conteudo>")) {
          // Conteúdo em uma linha só
          paginaAtual.conteudo = conteudoBuffer
            .replace("</conteudo>", "")
            .trim();
          dentroConteudo = false;
          conteudoBuffer = "";
        }
      } else if (trimmed.includes("</conteudo>")) {
        conteudoBuffer +=
          (conteudoBuffer ? "\n" : "") + trimmed.replace("</conteudo>", "");
        paginaAtual.conteudo = conteudoBuffer.trim();
        dentroConteudo = false;
        conteudoBuffer = "";
      } else if (dentroConteudo && trimmed !== "") {
        conteudoBuffer += (conteudoBuffer ? "\n" : "") + trimmed;
      }

      if (trimmed.includes("<imagem>") && trimmed.includes("</imagem>")) {
        paginaAtual.imagem = trimmed.replace(/<\/?imagem>/g, "");
      }

      if (trimmed.includes("<questao-ref")) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        if (idMatch) {
          questaoRefs.push(idMatch[1]);
        }
      }

      if (trimmed.includes("</pagina>")) {
        if (paginaAtual.tipo === "exercicio" && questaoRefs.length > 0) {
          const questoes = await QuestaoService.obterMultiplasQuestoes(
            questaoRefs
          );
          paginaAtual.questoes = questoes;
        }
        paginas.push(paginaAtual);
      }
    }

    const cursoFinal = { ...curso, paginas };
    return cursoFinal;
  }

  static async iniciarCurso(
    usuarioId: string,
    cursoId: string
  ): Promise<UsuarioCurso> {
    const usuarioCurso: UsuarioCurso = {
      id: `${usuarioId}_${cursoId}`,
      usuarioId,
      cursoId,
      coeficiente: 0,
      paginaAtual: 1,
      questoesRespondidas: [],
      questoesCorretas: [],
      questoesErradas: [],
      dataInicio: new Date(),
      dataUltimaAtualizacao: new Date(),
      concluido: false,
    };

    try {
      const usuarioCursoRef = doc(firestore, "usuariosCursos", usuarioCurso.id);
      await setDoc(usuarioCursoRef, {
        ...usuarioCurso,
        dataInicio: serverTimestamp(),
        dataUltimaAtualizacao: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
    }

    return usuarioCurso;
  }

  static async obterProgressoCurso(
    usuarioId: string,
    cursoId: string
  ): Promise<UsuarioCurso | null> {
    try {
      const usuarioCursoRef = doc(
        firestore,
        "usuariosCursos",
        `${usuarioId}_${cursoId}`
      );
      const usuarioCursoSnap = await getDoc(usuarioCursoRef);

      if (usuarioCursoSnap.exists()) {
        return usuarioCursoSnap.data() as UsuarioCurso;
      }
    } catch (error) {
      console.error("Erro ao buscar progresso no Firebase:", error);
    }

    return null;
  }

  static async verificarCursoConcluido(
    usuarioId: string,
    cursoId: string
  ): Promise<boolean> {
    const progresso = await this.obterProgressoCurso(usuarioId, cursoId);
    return progresso?.concluido || false;
  }

  static async salvarProgresso(usuarioCurso: UsuarioCurso): Promise<void> {
    try {
      const usuarioCursoRef = doc(firestore, "usuariosCursos", usuarioCurso.id);
      await setDoc(
        usuarioCursoRef,
        {
          ...usuarioCurso,
          dataUltimaAtualizacao: serverTimestamp(),
        },
        { merge: true }
      );

      await this.atualizarCoeficienteTotalUsuario(usuarioCurso.usuarioId);
    } catch (error) {
      console.error("Erro ao salvar progresso no Firebase:", error);
    }
  }

  static async verificarConclusaoCurso(
    usuarioCurso: UsuarioCurso,
    curso: Curso
  ): Promise<{
    podeCompletar: boolean;
    questoesErradas: string[];
    percentualAcerto: number;
    novasBadges?: any[];
  }> {
    const totalQuestoes = curso.paginas
      .filter((p) => p.tipo === "exercicio")
      .reduce((total, p) => total + (p.questoes?.length || 0), 0);

    const percentualAcerto =
      totalQuestoes > 0
        ? (usuarioCurso.questoesCorretas.length / totalQuestoes) * 100
        : 0;
    const podeCompletar = percentualAcerto >= 70;

    let novasBadges: any[] = [];

    if (podeCompletar) {
      // Marcar curso como concluído
      await this.marcarCursoConcluido(usuarioCurso);

      // Verificar e conceder badges (usar usuarioCurso.cursoId que é o ID correto do Firestore)
      novasBadges = await BadgeService.verificarEConcederBadges(
        usuarioCurso.usuarioId,
        usuarioCurso.cursoId
      );
    }

    return {
      podeCompletar,
      questoesErradas: usuarioCurso.questoesErradas || [],
      percentualAcerto: Math.round(percentualAcerto),
      novasBadges,
    };
  }

  static async marcarCursoConcluido(usuarioCurso: UsuarioCurso): Promise<void> {
    try {
      const usuarioCursoRef = doc(firestore, "usuariosCursos", usuarioCurso.id);
      await updateDoc(usuarioCursoRef, {
        concluido: true,
        dataUltimaAtualizacao: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao marcar curso como concluído:", error);
    }
  }

  static reiniciarQuestoes(
    usuarioCurso: UsuarioCurso,
    questoesErradas: string[]
  ): UsuarioCurso {
    const questoesRespondidas = usuarioCurso.questoesRespondidas.filter(
      (q) => !questoesErradas.includes(q)
    );
    const questoesCorretas = usuarioCurso.questoesCorretas.filter(
      (q) => !questoesErradas.includes(q)
    );

    return {
      ...usuarioCurso,
      questoesRespondidas,
      questoesCorretas,
      questoesErradas: [],
      coeficiente:
        questoesRespondidas.length > 0
          ? Math.round(
              (questoesCorretas.length / questoesRespondidas.length) * 100
            )
          : 0,
    };
  }

  static async atualizarCoeficienteTotalUsuario(
    usuarioId: string
  ): Promise<void> {
    try {
      // Obter total de questões dinamicamente
      const totalQuestoesSistema = CourseConfig.getTotalQuestions();

      // Buscar progresso do usuário em todos os cursos
      const usuariosCursosRef = collection(firestore, "usuariosCursos");
      const q = query(usuariosCursosRef, where("usuarioId", "==", usuarioId));
      const querySnapshot = await getDocs(q);

      let questoesCorretasTotal = 0;

      querySnapshot.forEach((doc) => {
        const usuarioCurso = doc.data() as UsuarioCurso;
        questoesCorretasTotal += usuarioCurso.questoesCorretas.length;
      });

      // Calcular coeficiente baseado no total de questões do sistema
      const coeficienteGeral =
        totalQuestoesSistema > 0
          ? Math.round((questoesCorretasTotal / totalQuestoesSistema) * 100)
          : 0;

      const usuarioRef = doc(firestore, "usuarios", usuarioId);
      await updateDoc(usuarioRef, {
        coeficienteConhecimento: coeficienteGeral,
      });
    } catch (error) {
      console.error("Erro ao atualizar coeficiente total:", error);
    }
  }
}
