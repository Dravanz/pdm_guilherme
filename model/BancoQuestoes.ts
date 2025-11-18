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