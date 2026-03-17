import { Timestamp } from "firebase/firestore";

/**
 * Análise IRT (Item Response Theory) por questão.
 * Inspirado nos métodos de avaliação do Moodle 5:
 * - O aluno é avaliado no geral
 * - A questão também é avaliada de acordo com os alunos
 */
export interface QuestionAnalytics {
  id: string;
  questaoId: string;
  cursoId: string;

  // Contadores
  totalTentativas: number;
  totalAcertos: number;

  // Índices IRT
  /** Proporção de acertos (0 a 1). Quanto mais próximo de 0, mais difícil. */
  indiceDificuldade: number;
  /** Correlação ponto-bisserial (-1 a 1). Mede o poder de discriminação da questão. */
  indiceDiscriminacao: number;

  // Dados por aluno (para cálculo de discriminação)
  /** Map<usuarioId, { acertou: boolean, scoreGeral: number }> */
  tentativasPorAluno: {
    [usuarioId: string]: {
      acertou: boolean;
      scoreGeral: number; // coeficiente geral do aluno no curso
    };
  };

  // Alertas gerados automaticamente
  alertas: QuestionAlert[];

  ultimaAtualizacao: Timestamp | Date;
}

export interface QuestionAlert {
  tipo: "muito_facil" | "muito_dificil" | "baixa_discriminacao" | "discriminacao_negativa";
  mensagem: string;
  severidade: "info" | "aviso" | "critico";
}

/**
 * Resumo de analytics de um curso inteiro (para exibição no painel do colaborador)
 */
export interface CourseAnalyticsSummary {
  cursoId: string;
  totalQuestoes: number;
  totalTentativas: number;
  mediaAcertos: number;
  questoesProblematicas: number;
  analytics: QuestionAnalytics[];
}
