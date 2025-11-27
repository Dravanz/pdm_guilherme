import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
} from "firebase/firestore";
import { firestore } from "../../firebase/FirebaseInit";
import { Tentativa } from "../../model/Tentativa";

export class TentativaService {
  /**
   * Registra uma nova tentativa de resposta
   */
  static async registrarTentativa(
    tentativa: Omit<Tentativa, "id" | "dataTentativa">
  ): Promise<string> {
    try {
      const tentativaRef = doc(collection(firestore, "tentativas"));
      
      const novaTentativa: any = {
        ...tentativa,
        id: tentativaRef.id,
        dataTentativa: serverTimestamp(),
      };

      await setDoc(tentativaRef, novaTentativa);
      return tentativaRef.id;
    } catch (error) {
      console.error("Erro ao registrar tentativa:", error);
      throw error;
    }
  }

  /**
   * Obtém todas as tentativas de um usuário em um curso
   */
  static async obterTentativasPorCurso(
    usuarioId: string,
    cursoId: string
  ): Promise<Tentativa[]> {
    try {
      const tentativasRef = collection(firestore, "tentativas");
      const q = query(
        tentativasRef,
        where("usuarioId", "==", usuarioId),
        where("cursoId", "==", cursoId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataTentativa: data.dataTentativa?.toDate?.() || data.dataTentativa,
        } as Tentativa;
      });
    } catch (error) {
      console.error("Erro ao obter tentativas:", error);
      return [];
    }
  }

  /**
   * Calcula estatísticas de desempenho baseadas nas tentativas
   */
  static calcularEstatisticas(tentativas: Tentativa[]) {
    if (tentativas.length === 0) {
      return {
        totalTentativas: 0,
        acertos: 0,
        erros: 0,
        taxaAcerto: 0,
        porTag: {},
        porQuestao: {},
        evolucao: [],
      };
    }

    const totalTentativas = tentativas.length;
    const acertos = tentativas.filter((t) => t.correta).length;
    const erros = totalTentativas - acertos;
    const taxaAcerto = Math.round((acertos / totalTentativas) * 100);

    // Estatísticas por tag
    const porTag: { [tag: string]: { total: number; acertos: number } } = {};

    // Estatísticas por questão
    const porQuestao: { [questaoId: string]: { total: number; acertos: number; ultimaCorreta: boolean } } = {};
    
    // Ordenar por data para garantir que sabemos qual foi a última tentativa
    const tentativasOrdenadas = [...tentativas].sort((a: any, b: any) => 
      a.dataTentativa - b.dataTentativa
    );

    tentativasOrdenadas.forEach((t) => {
      // Por Tag
      t.tags.forEach((tag) => {
        if (!porTag[tag]) {
          porTag[tag] = { total: 0, acertos: 0 };
        }
        porTag[tag].total++;
        if (t.correta) porTag[tag].acertos++;
      });

      // Por Questão
      if (!porQuestao[t.questaoId]) {
        porQuestao[t.questaoId] = { total: 0, acertos: 0, ultimaCorreta: false };
      }
      porQuestao[t.questaoId].total++;
      if (t.correta) porQuestao[t.questaoId].acertos++;
      porQuestao[t.questaoId].ultimaCorreta = t.correta;
    });
    
    const evolucao = tentativasOrdenadas.slice(-10).map((t, index) => ({
      index: index + 1,
      correta: t.correta ? 1 : 0,
    }));

    return {
      totalTentativas,
      acertos,
      erros,
      taxaAcerto,
      porTag,
      porQuestao,
      evolucao,
    };
  }
}
