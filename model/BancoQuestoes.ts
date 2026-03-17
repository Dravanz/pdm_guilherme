export interface QuestaoFirestore {
  id: string;
  pergunta: string;
  alternativas: AlternativaFirestore[];
  explicacao: string;
  categoria: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

export interface AlternativaFirestore {
  id: string;
  texto: string;
  correta: boolean;
}

export interface CasoTesteFirestore {
  id: string;
  entrada: string;
  saidaEsperada: string;
  descricao?: string;
}

export interface QuestaoEscritaFirestore {
  id: string;
  enunciado: string;
  linguagem: string;
  codigoBase: string;
  gabarito: string;
  casosTeste: CasoTesteFirestore[];
  dica?: string;
  explicacao: string;
  categoria: string;
  nivel: 'iniciante' | 'intermediario' | 'avancado';
  tags: string[];
  createdAt: any;
  updatedAt: any;
}