import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, listAll, ref } from "firebase/storage";
import { firestore, storage } from "../firebase/FirebaseInit";
import { Perfil } from "../model/Perfil";
import {
  Solicitacao,
  SolicitacaoColaboracao,
  SolicitacaoExclusaoCurso,
  StatusSolicitacao,
  TipoSolicitacao,
} from "../model/Solicitacao";

export class SolicitacaoService {
  /**
   * Cria uma nova solicitação de colaboração
   */
  static async criarSolicitacaoColaboracao(
    usuarioId: string,
    usuarioNome: string,
    usuarioEmail: string,
    usuarioFoto: string,
    conhecimentos: string
  ): Promise<string> {
    try {
      // Verificar se já existe uma solicitação pendente
      const solicitacaoExistente = await this.verificarSolicitacaoPendente(
        usuarioId
      );
      if (solicitacaoExistente) {
        throw new Error("Você já possui uma solicitação pendente");
      }

      const solicitacaoRef = doc(collection(firestore, "solicitacoes"));
      const solicitacao: SolicitacaoColaboracao = {
        id: solicitacaoRef.id,
        tipo: TipoSolicitacao.Colaboracao,
        usuarioId,
        usuarioNome,
        usuarioEmail,
        usuarioFoto,
        mensagem: conhecimentos,
        conhecimentos,
        status: StatusSolicitacao.Pendente,
        dataSolicitacao: serverTimestamp(),
      };

      await setDoc(solicitacaoRef, solicitacao);
      return "ok";
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      throw error;
    }
  }

  /**
   * Cria uma solicitação de exclusão de curso
   */
  static async criarSolicitacaoExclusaoCurso(
    cursoId: string,
    cursoTitulo: string,
    colaboradorId: string,
    colaboradorNome: string,
    motivo: string
  ): Promise<string> {
    try {
      const solicitacaoRef = doc(collection(firestore, "solicitacoes"));
      const solicitacao: SolicitacaoExclusaoCurso = {
        id: solicitacaoRef.id,
        tipo: TipoSolicitacao.ExclusaoCurso,
        cursoId,
        cursoTitulo,
        colaboradorId,
        colaboradorNome,
        motivo,
        status: StatusSolicitacao.Pendente,
        dataSolicitacao: serverTimestamp(),
      };

      await setDoc(solicitacaoRef, solicitacao);
      return "ok";
    } catch (error) {
      console.error("Erro ao criar solicitação de exclusão:", error);
      throw error;
    }
  }

  /**
   * Verifica se usuário tem solicitação pendente
   */
  static async verificarSolicitacaoPendente(
    usuarioId: string
  ): Promise<boolean> {
    try {
      const solicitacoesRef = collection(firestore, "solicitacoes");
      const q = query(
        solicitacoesRef,
        where("usuarioId", "==", usuarioId),
        where("tipo", "==", TipoSolicitacao.Colaboracao),
        where("status", "==", StatusSolicitacao.Pendente)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Erro ao verificar solicitação pendente:", error);
      return false;
    }
  }

  /**
   * Busca todas as solicitações pendentes (para admins)
   */
  static async buscarSolicitacoesPendentes(): Promise<Solicitacao[]> {
    try {
      const solicitacoesRef = collection(firestore, "solicitacoes");
      const q = query(
        solicitacoesRef,
        where("status", "==", StatusSolicitacao.Pendente),
        orderBy("dataSolicitacao", "desc")
      );

      const querySnapshot = await getDocs(q);
      const solicitacoes: Solicitacao[] = [];

      querySnapshot.forEach((doc) => {
        solicitacoes.push(doc.data() as Solicitacao);
      });

      return solicitacoes;
    } catch (error) {
      console.error("Erro ao buscar solicitações pendentes:", error);
      return [];
    }
  }

  /**
   * Busca todas as solicitações (histórico para admins)
   */
  static async buscarTodasSolicitacoes(): Promise<Solicitacao[]> {
    try {
      const solicitacoesRef = collection(firestore, "solicitacoes");
      const q = query(solicitacoesRef, orderBy("dataSolicitacao", "desc"));

      const querySnapshot = await getDocs(q);
      const solicitacoes: Solicitacao[] = [];

      querySnapshot.forEach((doc) => {
        solicitacoes.push(doc.data() as Solicitacao);
      });

      return solicitacoes;
    } catch (error) {
      console.error("Erro ao buscar todas solicitações:", error);
      return [];
    }
  }

  /**
   * Aprova uma solicitação de colaboração
   */
  static async aprovarSolicitacaoColaboracao(
    solicitacaoId: string,
    usuarioId: string,
    adminId: string,
    adminNome: string
  ): Promise<string> {
    try {
      // Atualizar perfil do usuário para Colaborador
      const usuarioRef = doc(firestore, "usuarios", usuarioId);
      await updateDoc(usuarioRef, {
        perfil: Perfil.Colaborador,
      });

      // Atualizar status da solicitação
      const solicitacaoRef = doc(firestore, "solicitacoes", solicitacaoId);
      await updateDoc(solicitacaoRef, {
        status: StatusSolicitacao.Aprovada,
        dataResposta: serverTimestamp(),
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
      });

      return "ok";
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error);
      throw error;
    }
  }

  /**
   * Rejeita uma solicitação de colaboração
   */
  static async rejeitarSolicitacaoColaboracao(
    solicitacaoId: string,
    adminId: string,
    adminNome: string,
    motivo?: string
  ): Promise<string> {
    try {
      const solicitacaoRef = doc(firestore, "solicitacoes", solicitacaoId);
      await updateDoc(solicitacaoRef, {
        status: StatusSolicitacao.Rejeitada,
        dataResposta: serverTimestamp(),
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
        motivoRejeicao: motivo || "Não especificado",
      });

      return "ok";
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      throw error;
    }
  }

  /**
   * Aprova uma solicitação de exclusão de curso
   */
  static async aprovarExclusaoCurso(
    solicitacaoId: string,
    cursoId: string,
    adminId: string,
    adminNome: string
  ): Promise<string> {
    try {
      // 1. Excluir documento do Firestore
      const cursoRef = doc(firestore, "cursos", cursoId);
      const cursoDoc = await getDoc(cursoRef);

      if (!cursoDoc.exists()) {
        console.error(`Curso ${cursoId} não encontrado no Firestore`);
      } else {
        await deleteDoc(cursoRef);
      }

      // 2. Excluir XML do Storage
      try {
        const xmlRef = ref(storage, `courses/${cursoId}.xml`);
        await deleteObject(xmlRef);
      } catch (error: any) {
        if (error.code !== "storage/object-not-found") {
          console.error("Erro ao excluir XML:", error);
        }
      }

      // 3. Excluir todas as imagens associadas ao curso no Storage
      try {
        const imagesRef = ref(storage, `imagens/cursos/${cursoId}`);
        const imagesList = await listAll(imagesRef);

        if (imagesList.items.length > 0) {
          // Excluir cada imagem individualmente
          const deletePromises = imagesList.items.map((item) =>
            deleteObject(item)
          );
          await Promise.all(deletePromises);
        }
      } catch (error: any) {
        if (error.code !== "storage/object-not-found") {
          console.error("Erro ao excluir imagens do curso:", error);
        }
      }

      // 4. Atualizar status da solicitação
      const solicitacaoRef = doc(firestore, "solicitacoes", solicitacaoId);
      await updateDoc(solicitacaoRef, {
        status: StatusSolicitacao.Aprovada,
        dataResposta: serverTimestamp(),
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
      });

      return "ok";
    } catch (error) {
      console.error("Erro ao aprovar exclusão de curso:", error);
      throw error;
    }
  }

  /**
   * Rejeita uma solicitação de exclusão de curso
   */
  static async rejeitarExclusaoCurso(
    solicitacaoId: string,
    adminId: string,
    adminNome: string,
    motivo?: string
  ): Promise<string> {
    try {
      const solicitacaoRef = doc(firestore, "solicitacoes", solicitacaoId);
      await updateDoc(solicitacaoRef, {
        status: StatusSolicitacao.Rejeitada,
        dataResposta: serverTimestamp(),
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
        motivoRejeicao: motivo || "Não especificado",
      });

      return "ok";
    } catch (error) {
      console.error("Erro ao rejeitar exclusão de curso:", error);
      throw error;
    }
  }

  /**
   * Busca solicitações de um usuário específico
   */
  static async buscarSolicitacoesUsuario(
    usuarioId: string
  ): Promise<Solicitacao[]> {
    try {
      const solicitacoesRef = collection(firestore, "solicitacoes");
      const q = query(
        solicitacoesRef,
        where("usuarioId", "==", usuarioId),
        orderBy("dataSolicitacao", "desc")
      );

      const querySnapshot = await getDocs(q);
      const solicitacoes: Solicitacao[] = [];

      querySnapshot.forEach((doc) => {
        solicitacoes.push(doc.data() as Solicitacao);
      });

      return solicitacoes;
    } catch (error) {
      console.error("Erro ao buscar solicitações do usuário:", error);
      return [];
    }
  }
}
