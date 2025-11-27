export enum TipoDocumentacao {
  Documentacao = "Documentacao",
  Atualizacao = "Atualizacao",
  Tutorial = "Tutorial",
}

export enum StatusDocumentacao {
  Pendente = "Pendente",
  Aprovada = "Aprovada",
  Rejeitada = "Rejeitada",
}

export interface Documentacao {
  id: string;
  titulo: string;
  conteudo: string; // Changed from descricao to conteudo as requested, or keep both? User said "conteudo".
  descricao?: string; // Keep for short summary?
  link: string;
  versao?: string; // New field
  dataReferencia?: string; // New field for "data em formato DD/MM/AAAA"
  tipo: TipoDocumentacao;
  autorId: string;
  autorNome: string;
  status: StatusDocumentacao;
  dataCriacao: any;
  dataPublicacao?: any;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  motivoRejeicao?: string;
}
