export interface Questao {
  id: string;
  pergunta: string;
  alternativas: Alternativa[];
  explicacao: string;
  linkDocumentacao?: string;
}

export interface Alternativa {
  id: string;
  texto: string;
  correta: boolean;
}

export interface PaginaCurso {
  id: string;
  titulo: string;
  tipo: "conteudo" | "exercicio";
  conteudo?: string;
  imagem?: string;
  questoes?: Questao[];
}

export interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  nivel: "iniciante" | "intermediario" | "avancado";
  versaoLinguagem?: string; // Versão da linguagem (ex: "ES6+", "Python 3.12", "React 18")
  imageUrl?: string;
  paginas: PaginaCurso[];
  coeficienteMaximo: number;
  createdAt: any;
  updatedAt: any;
}

export interface UsuarioCurso {
  id: string;
  usuarioId: string;
  cursoId: string;
  coeficiente: number;
  paginaAtual: number;
  questoesRespondidas: string[];
  questoesCorretas: string[];
  questoesErradas?: string[];
  dataInicio: any;
  dataUltimaAtualizacao: any;
  concluido: boolean;
  tentativasPorQuestao?: { [questaoId: string]: number };
}
