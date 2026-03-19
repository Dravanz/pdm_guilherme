export interface Questao {
  id: string;
  pergunta: string;
  alternativas: Alternativa[];
  explicacao: string;
  linkDocumentacao?: string;
  criadoPor?: string;
  criadoPorNome?: string;
}

export interface Alternativa {
  id: string;
  texto: string;
  correta: boolean;
}

// Linguagens suportadas pelo Jobe API
export type LinguagemCodigo = "python3" | "nodejs" | "c";

// Caso de teste para exercícios de código
export interface CasoTeste {
  id: string;
  entrada: string;      // stdin enviado ao programa
  saidaEsperada: string; // stdout esperado
  descricao?: string;    // descrição opcional do caso de teste
}

// Exercício de escrita de código
export interface QuestaoEscrita {
  id: string;
  enunciado: string;           // descrição do problema
  linguagem: LinguagemCodigo;  // linguagem de programação  
  codigoBase: string;          // código template com __EDITAR__ (o que o aluno vê)
  gabarito: string;            // código solução completo (para validar os testes)
  casosTeste: CasoTeste[];     // casos de teste para validação
  dica?: string;               // dica opcional
  explicacao: string;          // explicação pós-resposta
  // Modo encapsulado: o aluno digita apenas o núcleo, wrapper é adicionado automaticamente
  modoEncapsulado?: boolean;
  wrapperAntes?: string;       // código read-only exibido acima do input do aluno
  wrapperDepois?: string;      // código read-only exibido abaixo do input do aluno
  criadoPor?: string;
  criadoPorNome?: string;
}

// Bloco de código para exercício de ordenação
export interface BlocoCodigoCodigo {
  id: string;
  codigo: string;    // conteúdo do bloco (uma linha ou instrução)
  ordem: number;     // ordem correta definida pelo colaborador (gabarito)
  distrator?: boolean; // se true, é um bloco falso que não deve ser incluído
}

// Exercício de ordenação de blocos de código
export interface QuestaoBlocos {
  id: string;
  enunciado: string;
  linguagem: LinguagemCodigo;
  blocos: BlocoCodigoCodigo[];  // todos os blocos (inclusive distradores)
  saidaEsperada: string;        // stdout esperado quando executado na ordem correta
  explicacao: string;
  dica?: string;
}

export interface PaginaCurso {
  id: string;
  titulo: string;
  tipo: "conteudo" | "exercicio" | "exercicio_codigo" | "exercicio_blocos";
  conteudo?: string;
  imagem?: string;
  questoes?: Questao[];
  questoesEscrita?: QuestaoEscrita[];
  questoesBlocos?: QuestaoBlocos[];
}

export interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  nivel: "iniciante" | "intermediario" | "avancado";
  versaoLinguagem?: string; // Versão da linguagem (ex: "ES6+", "Python 3.12", "React 18")
  imageUrl?: string;
  documentacaoId?: string; // ID da documentação vinculada
  paginas: PaginaCurso[];
  coeficienteMaximo: number;
  status?: "Pendente" | "Aprovado" | "Rejeitado";
  criadoPor?: string;
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
  praticaCompleta?: boolean;
}
