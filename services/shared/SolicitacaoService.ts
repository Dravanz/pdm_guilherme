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
import { firestore, storage } from "../../firebase/FirebaseInit";
import {
    Solicitacao,
    SolicitacaoColaboracao,
    SolicitacaoCriacaoCurso,
    SolicitacaoDocumentacao,
    SolicitacaoExclusaoCurso,
    StatusSolicitacao,
    TipoSolicitacao,
} from "../../model/Solicitacao";

export class SolicitacaoService {
  static async criarSolicitacaoColaboracao(
    usuarioId: string,
    usuarioNome: string,
    usuarioEmail: string,
    usuarioFoto: string,
    conhecimentos: string,
    linkedin?: string,
    github?: string,
    portfolio?: string,
    experiencia?: string
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
        linkedin,
        github,
        portfolio,
        experiencia,
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
  /**
   * Busca todas as solicitações (histórico)
   * Se não for admin, busca apenas do próprio usuário
   */
  static async buscarTodasSolicitacoes(
    userId?: string,
    isAdmin: boolean = false
  ): Promise<Solicitacao[]> {
    try {
      const solicitacoesRef = collection(firestore, "solicitacoes");
      let q;

      if (isAdmin) {
        // Moderador vê tudo
        q = query(solicitacoesRef, orderBy("dataSolicitacao", "desc"));
      } else if (userId) {
        // Usuário comum vê apenas as suas
        q = query(
          solicitacoesRef,
          where("usuarioId", "==", userId),
          orderBy("dataSolicitacao", "desc")
        );
      } else {
        return [];
      }

      const querySnapshot = await getDocs(q);
      const solicitacoes: Solicitacao[] = [];

      querySnapshot.forEach((doc) => {
        solicitacoes.push(doc.data() as Solicitacao);
      });

      return solicitacoes;
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      // Se der erro de permissão (ex: tentando ver de outros), retorna lista vazia
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

      // Atualizar status da solicitação
      const solicitacaoRef = doc(firestore, "solicitacoes", solicitacaoId);
      await updateDoc(solicitacaoRef, {
        status: StatusSolicitacao.Aprovada,
        dataResposta: serverTimestamp(),
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
      });

      // Atualizar perfil do usuário para Colaborador
      const usuarioRef = doc(firestore, "usuarios", usuarioId);
      await updateDoc(usuarioRef, {
        perfil: "Colaborador",
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
   * Cria uma solicitação de aprovação de documentação
   */
  static async criarSolicitacaoDocumentacao(
    documentacaoId: string,
    documentacaoTitulo: string,
    documentacaoLink: string,
    documentacaoConteudo: string,
    autorId: string,
    autorNome: string
  ): Promise<string> {
    try {
      const solicitacaoRef = doc(collection(firestore, "solicitacoes"));
      const solicitacao: SolicitacaoDocumentacao = {
        id: solicitacaoRef.id,
        tipo: TipoSolicitacao.Documentacao,
        documentacaoId,
        documentacaoTitulo,
        documentacaoLink,
        documentacaoConteudo,
        autorId,
        autorNome,
        status: StatusSolicitacao.Pendente,
        dataSolicitacao: serverTimestamp(),
      };

      await setDoc(solicitacaoRef, solicitacao);
      return "ok";
    } catch (error) {
      console.error("Erro ao criar solicitação de documentação:", error);
      throw error;
    }
  }

  /**
   * Aprova uma solicitação de documentação
   */
  static async aprovarSolicitacaoDocumentacao(
    solicitacaoId: string,
    documentacaoId: string,
    adminId: string,
    adminNome: string
  ): Promise<string> {
    try {
      // 1. Atualizar status da documentação
      const docRef = doc(firestore, "documentacoes", documentacaoId);
      await updateDoc(docRef, {
        status: "Aprovada", // StatusDocumentacao.Aprovada
        dataPublicacao: serverTimestamp(),
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
      });

      // 2. Atualizar status da solicitação
      const solicitacaoRef = doc(firestore, "solicitacoes", solicitacaoId);
      await updateDoc(solicitacaoRef, {
        status: StatusSolicitacao.Aprovada,
        dataResposta: serverTimestamp(),
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
      });

      return "ok";
    } catch (error) {
      console.error("Erro ao aprovar solicitação de documentação:", error);
      throw error;
    }
  }

  /**
   * Rejeita uma solicitação de documentação
   */
  static async rejeitarSolicitacaoDocumentacao(
    solicitacaoId: string,
    documentacaoId: string,
    adminId: string,
    adminNome: string,
    motivo?: string
  ): Promise<string> {
    try {
      // 1. Atualizar status da documentação
      const docRef = doc(firestore, "documentacoes", documentacaoId);
      await updateDoc(docRef, {
        status: "Rejeitada", // StatusDocumentacao.Rejeitada
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
        motivoRejeicao: motivo || "Não especificado",
      });

      // 2. Atualizar status da solicitação
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
      console.error("Erro ao rejeitar solicitação de documentação:", error);
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
  /**
   * Cria uma solicitação de criação de curso
   */
  static async criarSolicitacaoCriacaoCurso(
    cursoId: string,
    cursoTitulo: string,
    autorId: string,
    autorNome: string
  ): Promise<string> {
    try {
      const solicitacaoRef = doc(collection(firestore, "solicitacoes"));
      const solicitacao: SolicitacaoCriacaoCurso = {
        id: solicitacaoRef.id,
        tipo: TipoSolicitacao.CriacaoCurso,
        cursoId,
        cursoTitulo,
        autorId,
        autorNome,
        status: StatusSolicitacao.Pendente,
        dataSolicitacao: serverTimestamp(),
      };

      await setDoc(solicitacaoRef, solicitacao);
      return "ok";
    } catch (error) {
      console.error("Erro ao criar solicitação de criação de curso:", error);
      throw error;
    }
  }

  /**
   * Aprova a criação de um curso
   */
  static async aprovarCriacaoCurso(
    solicitacaoId: string,
    cursoId: string,
    adminId: string,
    adminNome: string
  ): Promise<string> {
    try {
      // 1. Verificar se o curso ainda existe antes de tentar atualizar
      const cursoRef = doc(firestore, "cursos", cursoId);
      const cursoSnap = await getDoc(cursoRef);

      if (!cursoSnap.exists()) {
        // Curso foi excluído — marcar solicitação como rejeitada automaticamente
        const solicitacaoRef = doc(firestore, "solicitacoes", solicitacaoId);
        await updateDoc(solicitacaoRef, {
          status: StatusSolicitacao.Rejeitada,
          dataResposta: serverTimestamp(),
          aprovadoPorId: adminId,
          aprovadoPorNome: adminNome,
          motivoRejeicao: "Curso não encontrado (foi excluído antes da aprovação)",
        });
        throw new Error("O curso associado a esta solicitação não existe mais. A solicitação foi marcada como rejeitada.");
      }

      // 2. Atualizar status do curso para Aprovado
      await updateDoc(cursoRef, {
        status: "Aprovado",
      });

      // 3. Atualizar status da solicitação
      const solicitacaoRef = doc(firestore, "solicitacoes", solicitacaoId);
      await updateDoc(solicitacaoRef, {
        status: StatusSolicitacao.Aprovada,
        dataResposta: serverTimestamp(),
        aprovadoPorId: adminId,
        aprovadoPorNome: adminNome,
      });

      return "ok";
    } catch (error) {
      console.error("Erro ao aprovar criação de curso:", error);
      throw error;
    }
  }

  /**
   * Rejeita a criação de um curso (exclui o curso)
   */
  static async rejeitarCriacaoCurso(
    solicitacaoId: string,
    cursoId: string,
    adminId: string,
    adminNome: string,
    motivo?: string
  ): Promise<string> {
    try {
      // 1. Excluir o curso (e seus assets)
      // Importar dinamicamente para evitar ciclo de dependência se possível,
      // mas aqui vamos assumir que ColaboradorCursoService pode ser usado ou refatoramos.
      // Como ColaboradorCursoService usa SolicitacaoService, temos um ciclo.
      // Melhor duplicar a lógica de exclusão simples ou mover para um serviço base.
      // Por agora, vamos duplicar a lógica de exclusão de curso 'básica' aqui para evitar o ciclo
      // OU melhor, vamos apenas marcar como Rejeitado no curso por enquanto?
      // O requisito diz "se reprovado ele é excluido".
      
      // Vamos tentar excluir o documento do curso e o XML.
      
      const cursoRef = doc(firestore, "cursos", cursoId);
      const cursoSnap = await getDoc(cursoRef);
      if (cursoSnap.exists()) {
        await deleteDoc(cursoRef);
      }
      
      // Tenta excluir XML
      try {
        const xmlRef = ref(storage, `courses/${cursoId}.xml`);
        await deleteObject(xmlRef);
      } catch (e: any) {
        if (e.code !== "storage/object-not-found") console.error("Erro ao excluir XML", e);
      }
      
      // Tenta excluir imagens
      try {
          const imagesRef = ref(storage, `imagens/cursos/${cursoId}`);
          const imagesList = await listAll(imagesRef);
          const deletePromises = imagesList.items.map((item) => deleteObject(item));
          await Promise.all(deletePromises);
      } catch (e: any) {
         if (e.code !== "storage/object-not-found") console.error("Erro ao excluir imagens", e);
      }

      // 2. Atualizar status da solicitação
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
      console.error("Erro ao rejeitar criação de curso:", error);
      throw error;
    }
  }
}
