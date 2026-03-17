import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { firestore } from "../../firebase/FirebaseInit";
import {
  CourseAnalyticsSummary,
  QuestionAlert,
  QuestionAnalytics,
} from "../../model/QuestionAnalytics";

/**
 * Serviço de análise IRT (Item Response Theory) para questões.
 * Inspirado nos métodos de avaliação do Moodle 5:
 * - Cálculo de índice de dificuldade (proporção de acertos)
 * - Cálculo de índice de discriminação (correlação ponto-bisserial)
 * - Geração automática de alertas para questões problemáticas
 */
export class QuestionAnalyticsService {
  private static readonly COLLECTION = "questionAnalytics";

  // Limiares para alertas (baseados no Moodle 5)
  private static readonly LIMIAR_MUITO_FACIL = 0.9;
  private static readonly LIMIAR_MUITO_DIFICIL = 0.1;
  private static readonly LIMIAR_DISCRIMINACAO_BAIXA = 0.2;
  private static readonly LIMIAR_DISCRIMINACAO_NEGATIVA = 0.0;
  private static readonly MIN_TENTATIVAS_ANALISE = 5;

  /**
   * Atualiza os analytics de uma questão após uma nova resposta.
   * Chamado automaticamente após registrarResposta no CursoService.
   */
  static async atualizarAnalytics(
    cursoId: string,
    questaoId: string,
    usuarioId: string,
    acertou: boolean,
    scoreGeralAluno: number
  ): Promise<void> {
    try {
      const analyticsId = `${cursoId}_${questaoId}`;
      const analyticsRef = doc(firestore, this.COLLECTION, analyticsId);
      const analyticsSnap = await getDoc(analyticsRef);

      let analytics: QuestionAnalytics;

      if (analyticsSnap.exists()) {
        analytics = analyticsSnap.data() as QuestionAnalytics;
      } else {
        analytics = {
          id: analyticsId,
          questaoId,
          cursoId,
          totalTentativas: 0,
          totalAcertos: 0,
          indiceDificuldade: 0,
          indiceDiscriminacao: 0,
          tentativasPorAluno: {},
          alertas: [],
          ultimaAtualizacao: new Date(),
        };
      }

      // Atualizar dados do aluno (última tentativa vale)
      analytics.tentativasPorAluno[usuarioId] = {
        acertou,
        scoreGeral: scoreGeralAluno,
      };

      // Recalcular contadores a partir dos dados por aluno
      const alunos = Object.values(analytics.tentativasPorAluno);
      analytics.totalTentativas = alunos.length;
      analytics.totalAcertos = alunos.filter((a) => a.acertou).length;

      // Calcular índice de dificuldade
      analytics.indiceDificuldade =
        analytics.totalTentativas > 0
          ? analytics.totalAcertos / analytics.totalTentativas
          : 0;

      // Calcular índice de discriminação (ponto-bisserial)
      if (analytics.totalTentativas >= this.MIN_TENTATIVAS_ANALISE) {
        analytics.indiceDiscriminacao = this.calcularDiscriminacao(
          analytics.tentativasPorAluno
        );
      }

      // Gerar alertas
      analytics.alertas = this.gerarAlertas(analytics);
      analytics.ultimaAtualizacao = new Date();

      await setDoc(analyticsRef, {
        ...analytics,
        ultimaAtualizacao: serverTimestamp(),
      });
    } catch (error) {
      // Não interromper o fluxo principal se a análise falhar
      console.error("[QuestionAnalytics] Erro ao atualizar analytics:", error);
    }
  }

  /**
   * Calcula o índice de discriminação usando correlação ponto-bisserial.
   *
   * rpb = (M1 - M0) / Sp * sqrt(p * q)
   *
   * Onde:
   * - M1 = média dos scores dos que acertaram
   * - M0 = média dos scores dos que erraram
   * - Sp = desvio padrão dos scores de todos
   * - p = proporção de acertos
   * - q = 1 - p
   */
  static calcularDiscriminacao(
    tentativasPorAluno: QuestionAnalytics["tentativasPorAluno"]
  ): number {
    const alunos = Object.values(tentativasPorAluno);
    if (alunos.length < this.MIN_TENTATIVAS_ANALISE) return 0;

    const acertaram = alunos.filter((a) => a.acertou);
    const erraram = alunos.filter((a) => !a.acertou);

    if (acertaram.length === 0 || erraram.length === 0) return 0;

    const scoresAcertaram = acertaram.map((a) => a.scoreGeral);
    const scoresErraram = erraram.map((a) => a.scoreGeral);
    const todosScores = alunos.map((a) => a.scoreGeral);

    const M1 = this.media(scoresAcertaram);
    const M0 = this.media(scoresErraram);
    const Sp = this.desvioPadrao(todosScores);

    if (Sp === 0) return 0;

    const p = acertaram.length / alunos.length;
    const q = 1 - p;

    const rpb = ((M1 - M0) / Sp) * Math.sqrt(p * q);

    // Limitar entre -1 e 1
    return Math.max(-1, Math.min(1, rpb));
  }

  /**
   * Gera alertas automáticos baseados nos índices da questão.
   */
  static gerarAlertas(analytics: QuestionAnalytics): QuestionAlert[] {
    const alertas: QuestionAlert[] = [];

    if (analytics.totalTentativas < this.MIN_TENTATIVAS_ANALISE) {
      return alertas; // Dados insuficientes
    }

    // Dificuldade
    if (analytics.indiceDificuldade >= this.LIMIAR_MUITO_FACIL) {
      alertas.push({
        tipo: "muito_facil",
        mensagem: `Índice de dificuldade ${(analytics.indiceDificuldade * 100).toFixed(0)}% — a maioria dos alunos acerta. Considere aumentar a complexidade.`,
        severidade: "info",
      });
    } else if (analytics.indiceDificuldade <= this.LIMIAR_MUITO_DIFICIL) {
      alertas.push({
        tipo: "muito_dificil",
        mensagem: `Índice de dificuldade ${(analytics.indiceDificuldade * 100).toFixed(0)}% — a maioria dos alunos erra. Verifique se o enunciado está claro ou se o conteúdo foi coberto.`,
        severidade: "aviso",
      });
    }

    // Discriminação
    if (analytics.indiceDiscriminacao < this.LIMIAR_DISCRIMINACAO_NEGATIVA) {
      alertas.push({
        tipo: "discriminacao_negativa",
        mensagem: `Discriminação negativa (${analytics.indiceDiscriminacao.toFixed(2)}) — alunos com pior desempenho acertam mais esta questão. Possível problema no gabarito ou enunciado.`,
        severidade: "critico",
      });
    } else if (analytics.indiceDiscriminacao < this.LIMIAR_DISCRIMINACAO_BAIXA) {
      alertas.push({
        tipo: "baixa_discriminacao",
        mensagem: `Baixa discriminação (${analytics.indiceDiscriminacao.toFixed(2)}) — a questão não diferencia bem os alunos. Considere reformulá-la.`,
        severidade: "aviso",
      });
    }

    return alertas;
  }

  /**
   * Obtém todos os analytics de um curso.
   */
  static async obterAnalyticsCurso(
    cursoId: string
  ): Promise<QuestionAnalytics[]> {
    try {
      const analyticsRef = collection(firestore, this.COLLECTION);
      const q = query(analyticsRef, where("cursoId", "==", cursoId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => doc.data() as QuestionAnalytics);
    } catch (error) {
      console.error("[QuestionAnalytics] Erro ao obter analytics:", error);
      return [];
    }
  }

  /**
   * Gera resumo de analytics de um curso inteiro.
   */
  static async gerarResumoCurso(
    cursoId: string
  ): Promise<CourseAnalyticsSummary> {
    const analytics = await this.obterAnalyticsCurso(cursoId);

    const totalTentativas = analytics.reduce(
      (sum, a) => sum + a.totalTentativas,
      0
    );
    const mediaAcertos =
      analytics.length > 0
        ? analytics.reduce((sum, a) => sum + a.indiceDificuldade, 0) /
          analytics.length
        : 0;
    const questoesProblematicas = analytics.filter(
      (a) => a.alertas.length > 0
    ).length;

    return {
      cursoId,
      totalQuestoes: analytics.length,
      totalTentativas,
      mediaAcertos,
      questoesProblematicas,
      analytics,
    };
  }

  // --- Utilitários matemáticos ---

  private static media(valores: number[]): number {
    if (valores.length === 0) return 0;
    return valores.reduce((sum, v) => sum + v, 0) / valores.length;
  }

  private static desvioPadrao(valores: number[]): number {
    if (valores.length < 2) return 0;
    const m = this.media(valores);
    const variancia =
      valores.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) /
      valores.length;
    return Math.sqrt(variancia);
  }
}
