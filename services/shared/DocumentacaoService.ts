import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";
import { firestore } from "../../firebase/FirebaseInit";
import { Documentacao, StatusDocumentacao, TipoDocumentacao } from "../../model/Documentacao";

export class DocumentacaoService {
  /**
   * Criar documentação (Colaborador cria com status Pendente, Admin cria Aprovada)
   */
  static async criarDocumentacao(
    titulo: string,
    conteudo: string,
    link: string,
    versao: string,
    dataReferencia: string,
    tipo: TipoDocumentacao,
    autorId: string,
    autorNome: string,
    isAdmin: boolean
  ): Promise<string> {
    try {
      const docRef = doc(collection(firestore, "documentacoes"));
      const status = isAdmin ? StatusDocumentacao.Aprovada : StatusDocumentacao.Pendente;

      const documentacao: any = {
        id: docRef.id,
        titulo,
        conteudo,
        link,
        versao,
        dataReferencia,
        tipo,
        autorId,
        autorNome,
        status,
        dataCriacao: serverTimestamp(),
        dataPublicacao: isAdmin ? serverTimestamp() : null,
      };

      await setDoc(docRef, documentacao);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar documentação:", error);
      throw error;
    }
  }

  /**
   * Atualizar documentação
   */
  static async atualizarDocumentacao(
    id: string,
    dados: Partial<Documentacao>
  ): Promise<void> {
    try {
      const docRef = doc(firestore, "documentacoes", id);
      await updateDoc(docRef, {
        ...dados,
        dataAtualizacao: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar documentação:", error);
      throw error;
    }
  }

  /**
   * Excluir documentação
   */
  static async excluirDocumentacao(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, "documentacoes", id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao excluir documentação:", error);
      throw error;
    }
  }

  /**
   * Buscar documentações aprovadas (para exibir na dashboard)
   */
  static async buscarDocumentacoesAprovadas(limite?: number): Promise<Documentacao[]> {
    try {
      const docsRef = collection(firestore, "documentacoes");
      let q = query(
        docsRef,
        where("status", "==", StatusDocumentacao.Aprovada),
        orderBy("dataPublicacao", "desc")
      );

      const querySnapshot = await getDocs(q);
      let docs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao,
          dataPublicacao:
            data.dataPublicacao?.toDate?.() || data.dataPublicacao,
        } as Documentacao;
      });

      if (limite) {
        docs = docs.slice(0, limite);
      }

      return docs;
    } catch (error) {
      console.error("Erro ao buscar documentações aprovadas:", error);
      return [];
    }
  }

  /**
   * Observar documentações aprovadas em tempo real
   */
  static observarDocumentacoesAprovadas(
    callback: (docs: Documentacao[]) => void,
    limite?: number
  ): () => void {
    const docsRef = collection(firestore, "documentacoes");
    let q = query(
      docsRef,
      where("status", "==", StatusDocumentacao.Aprovada),
      orderBy("dataPublicacao", "desc")
    );

    console.log("onSnapshot type:", typeof onSnapshot);
    return onSnapshot(
      q,
      (snapshot) => {
        let docs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao,
            dataPublicacao:
              data.dataPublicacao?.toDate?.() || data.dataPublicacao,
          } as Documentacao;
        });

        if (limite) {
          docs = docs.slice(0, limite);
        }

        callback(docs);
      },
      (error) => {
        console.error("Erro ao observar documentações:", error);
      }
    );
  }

  /**
   * Buscar todas as documentações (admin)
   */
  static async buscarTodasDocumentacoes(): Promise<Documentacao[]> {
    try {
      const docsRef = collection(firestore, "documentacoes");
      const q = query(docsRef, orderBy("dataCriacao", "desc"));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao,
          dataPublicacao:
            data.dataPublicacao?.toDate?.() || data.dataPublicacao,
        } as Documentacao;
      });
    } catch (error) {
      console.error("Erro ao buscar todas as documentações:", error);
      return [];
    }
  }

  /**
   * Buscar documentações do autor
   */
  static async buscarDocumentacoesPorAutor(autorId: string): Promise<Documentacao[]> {
    try {
      const docsRef = collection(firestore, "documentacoes");
      const q = query(
        docsRef,
        where("autorId", "==", autorId),
        orderBy("dataCriacao", "desc")
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataCriacao: data.dataCriacao?.toDate?.() || data.dataCriacao,
          dataPublicacao:
            data.dataPublicacao?.toDate?.() || data.dataPublicacao,
        } as Documentacao;
      });
    } catch (error) {
      console.error("Erro ao buscar documentações do autor:", error);
      return [];
    }
  }

  /**
   * Aprovar documentação (admin)
   */
  static async aprovarDocumentacao(
    id: string,
    aprovadorId: string,
    aprovadorNome: string
  ): Promise<void> {
    try {
      const docRef = doc(firestore, "documentacoes", id);
      await updateDoc(docRef, {
        status: StatusDocumentacao.Aprovada,
        dataPublicacao: serverTimestamp(),
        aprovadoPorId: aprovadorId,
        aprovadoPorNome: aprovadorNome,
      });
    } catch (error) {
      console.error("Erro ao aprovar documentação:", error);
      throw error;
    }
  }

  /**
   * Rejeitar documentação (admin)
   */
  static async rejeitarDocumentacao(
    id: string,
    aprovadorId: string,
    aprovadorNome: string,
    motivo: string
  ): Promise<void> {
    try {
      const docRef = doc(firestore, "documentacoes", id);
      await updateDoc(docRef, {
        status: StatusDocumentacao.Rejeitada,
        aprovadoPorId: aprovadorId,
        aprovadoPorNome: aprovadorNome,
        motivoRejeicao: motivo,
      });
    } catch (error) {
      console.error("Erro ao rejeitar documentação:", error);
      throw error;
    }
  }
}
