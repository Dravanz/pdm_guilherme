import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { firestore, storage } from "../firebase/FirebaseInit";

import { Curso } from "../model/Curso";
import { SolicitacaoService } from "./SolicitacaoService";

export class ColaboradorCursoService {
  /**
   * Cria um novo curso no Firestore
   */
  static async criarCurso(
    curso: Curso,
    xmlContent: string,
    colaboradorId: string
  ): Promise<string> {
    try {
      const cursoRef = doc(collection(firestore, "cursos"));
      const cursoId = cursoRef.id;

      // Upload do arquivo XML para o Storage
      await this.uploadXMLCurso(cursoId, xmlContent);

      // Contar páginas no XML
      const numeroPaginas = this.contarPaginasXML(xmlContent);

      // Preparar dados do curso, removendo campos undefined
      const cursoData: any = {
        id: cursoId,
        titulo: curso.titulo || "",
        descricao: curso.descricao || "",
        categoria: curso.categoria || "",
        nivel: curso.nivel || "iniciante",
        coeficienteMaximo: curso.coeficienteMaximo || 100,
        numeroPaginas: numeroPaginas,
        criadoPor: colaboradorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Adicionar campos opcionais apenas se existirem
      if (curso.imageUrl) {
        cursoData.imageUrl = curso.imageUrl;
      }

      await setDoc(cursoRef, cursoData);
      return cursoId;
    } catch (error) {
      console.error("Erro ao criar curso:", error);
      throw error;
    }
  }

  /**
   * Atualiza um curso existente
   */
  static async atualizarCurso(
    cursoId: string,
    curso: Partial<Curso>,
    xmlContent?: string
  ): Promise<string> {
    try {
      const cursoRef = doc(firestore, "cursos", cursoId);

      // Se houver novo XML, fazer upload
      if (xmlContent) {
        await this.uploadXMLCurso(cursoId, xmlContent);
        // Atualizar contagem de páginas
        const numeroPaginas = this.contarPaginasXML(xmlContent);
        (curso as any).numeroPaginas = numeroPaginas;
      }

      // Atualizar dados do curso
      await updateDoc(cursoRef, {
        ...curso,
        updatedAt: serverTimestamp(),
      });

      return "ok";
    } catch (error) {
      console.error("Erro ao atualizar curso:", error);
      throw error;
    }
  }

  /**
   * Solicita exclusão de um curso (requer aprovação de admin)
   */
  static async solicitarExclusaoCurso(
    cursoId: string,
    cursoTitulo: string,
    colaboradorId: string,
    colaboradorNome: string,
    motivo: string
  ): Promise<string> {
    try {
      return await SolicitacaoService.criarSolicitacaoExclusaoCurso(
        cursoId,
        cursoTitulo,
        colaboradorId,
        colaboradorNome,
        motivo
      );
    } catch (error) {
      console.error("Erro ao solicitar exclusão:", error);
      throw error;
    }
  }

  /**
   * Exclui um curso (somente após aprovação de admin)
   */
  static async excluirCurso(cursoId: string): Promise<string> {
    try {
      // Excluir XML do Storage
      await this.deleteXMLCurso(cursoId);

      // Excluir imagem do curso se existir
      try {
        const imageRef = ref(storage, `imagens/cursos/${cursoId}.jpg`);
        await deleteObject(imageRef);
      } catch (e) {
        console.error("Imagem não encontrada ou já excluída");
      }

      // Excluir documento do Firestore
      const cursoRef = doc(firestore, "cursos", cursoId);
      await deleteDoc(cursoRef);

      return "ok";
    } catch (error) {
      console.error("Erro ao excluir curso:", error);
      throw error;
    }
  }

  /**
   * Upload de arquivo XML para o Storage
   */
  static async uploadXMLCurso(
    cursoId: string,
    xmlContent: string
  ): Promise<string> {
    try {
      const xmlBlob = new Blob([xmlContent], { type: "text/xml" });
      const storageRef = ref(storage, `courses/${cursoId}.xml`);

      await uploadBytes(storageRef, xmlBlob);
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error("Erro ao fazer upload do XML:", error);
      throw error;
    }
  }

  /**
   * Busca o conteúdo XML de um curso do Storage
   */
  static async downloadXMLCurso(cursoId: string): Promise<string> {
    try {
      const storageRef = ref(storage, `courses/${cursoId}.xml`);
      const downloadURL = await getDownloadURL(storageRef);

      const response = await fetch(downloadURL);
      const xmlContent = await response.text();

      return xmlContent;
    } catch (error) {
      console.error("Erro ao baixar XML:", error);
      throw error;
    }
  }

  /**
   * Deleta arquivo XML do Storage
   */
  static async deleteXMLCurso(cursoId: string): Promise<void> {
    try {
      const storageRef = ref(storage, `courses/${cursoId}.xml`);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Erro ao deletar XML:", error);
      // Não lançar erro se arquivo não existir
    }
  }

  /**
   * Busca um curso específico
   */
  static async buscarCurso(cursoId: string): Promise<Curso | null> {
    try {
      const cursoRef = doc(firestore, "cursos", cursoId);
      const cursoSnap = await getDoc(cursoRef);

      if (cursoSnap.exists()) {
        return cursoSnap.data() as Curso;
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar curso:", error);
      return null;
    }
  }

  /**
   * Busca todos os cursos criados por um colaborador específico
   */
  static async buscarCursosColaborador(
    colaboradorId: string
  ): Promise<Curso[]> {
    try {
      const cursosRef = collection(firestore, "cursos");
      const q = query(cursosRef, where("criadoPor", "==", colaboradorId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Curso[];
    } catch (error) {
      console.error("Erro ao buscar cursos do colaborador:", error);
      return [];
    }
  }

  /**
   * Busca todos os cursos disponíveis no sistema (XML estáticos + Firestore)
   */
  static async buscarTodosCursos(
    colaboradorId?: string,
    isAdmin: boolean = false
  ): Promise<Curso[]> {
    try {
      // Buscar TODOS os cursos do Firestore (incluindo os migrados)
      const cursosRef = collection(firestore, "cursos");
      const querySnapshot = await getDocs(cursosRef);
      const cursosFirestore = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fonte: data.migradoDeLocal ? "xml" : ("firestore" as const),
          // Curso é editável se:
          // - Usuário é Admin (acesso total)
          // - Foi criado pelo colaborador atual
          // - Não foi migrado de local
          editavel:
            isAdmin ||
            (colaboradorId && data.criadoPor === colaboradorId) ||
            !data.migradoDeLocal,
        };
      }) as Curso[];

      return cursosFirestore;
    } catch (error) {
      console.error("Erro ao buscar todos os cursos:", error);
      return [];
    }
  }

  /**
   * Conta o número de páginas no XML
   */
  static contarPaginasXML(xmlContent: string): number {
    const matches = xmlContent.match(/<pagina/g);
    return matches ? matches.length : 0;
  }

  /**
   * Valida estrutura do XML antes de salvar
   */
  static validarXML(xmlContent: string): { valido: boolean; erro?: string } {
    try {
      // Verificações básicas
      if (!xmlContent.includes("<curso")) {
        return { valido: false, erro: "XML deve conter tag <curso>" };
      }

      if (!xmlContent.includes("<pagina")) {
        return {
          valido: false,
          erro: "XML deve conter ao menos uma tag <pagina>",
        };
      }

      // Verificar atributos obrigatórios no curso
      const cursoMatch = xmlContent.match(/<curso[^>]*>/);
      if (!cursoMatch) {
        return { valido: false, erro: "Tag <curso> inválida" };
      }

      const cursoTag = cursoMatch[0];
      if (!cursoTag.includes("id=") || !cursoTag.includes("titulo=")) {
        return {
          valido: false,
          erro: "Tag <curso> deve conter atributos id e titulo",
        };
      }

      return { valido: true };
    } catch (error) {
      return { valido: false, erro: "Erro ao validar XML: " + error };
    }
  }

  /**
   * Gera template de XML para novo curso
   */
  static gerarTemplateXML(cursoId: string, titulo: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<curso id="${cursoId}" titulo="${titulo}" categoria="Programacao" nivel="iniciante" coeficienteMaximo="100">
  
  <pagina id="1" tipo="conteudo">
    <titulo>Introdução</titulo>
    <conteudo>
      Bem-vindo ao curso de ${titulo}!
      
      Neste curso você aprenderá os conceitos fundamentais e práticos.
    </conteudo>
    <imagem>{{${cursoId}-intro}}</imagem>
  </pagina>
  
  <pagina id="2" tipo="exercicio">
    <titulo>Exercícios</titulo>
    <conteudo>
      Pratique o que você aprendeu!
    </conteudo>
    <questao-ref id="questao-${cursoId}-1"/>
  </pagina>
  
</curso>`;
  }
}
