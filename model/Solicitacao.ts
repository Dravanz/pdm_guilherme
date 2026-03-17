export enum TipoSolicitacao {
  Colaboracao = "Colaboracao",
  ExclusaoCurso = "ExclusaoCurso",
  Documentacao = "Documentacao",
  CriacaoCurso = "CriacaoCurso",
}

export enum StatusSolicitacao {
  Pendente = "Pendente",
  Aprovada = "Aprovada",
  Rejeitada = "Rejeitada",
}

export interface SolicitacaoColaboracao {
  id: string;
  tipo: TipoSolicitacao.Colaboracao;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  usuarioFoto: string;
  mensagem: string;
  conhecimentos: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  experiencia?: string;
  status: StatusSolicitacao;
  dataSolicitacao: any;
  dataResposta?: any;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  motivoRejeicao?: string;
}

export interface SolicitacaoCriacaoCurso {
  id: string;
  tipo: TipoSolicitacao.CriacaoCurso;
  cursoId: string;
  cursoTitulo: string;
  autorId: string;
  autorNome: string;
  status: StatusSolicitacao;
  dataSolicitacao: any;
  dataResposta?: any;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  motivoRejeicao?: string;
}

export interface SolicitacaoExclusaoCurso {
  id: string;
  tipo: TipoSolicitacao.ExclusaoCurso;
  cursoId: string;
  cursoTitulo: string;
  colaboradorId: string;
  colaboradorNome: string;
  motivo: string;
  status: StatusSolicitacao;
  dataSolicitacao: any;
  dataResposta?: any;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  motivoRejeicao?: string;
}

export interface SolicitacaoDocumentacao {
  id: string;
  tipo: TipoSolicitacao.Documentacao;
  documentacaoId: string;
  documentacaoTitulo: string;
  documentacaoLink: string;
  documentacaoConteudo: string;
  autorId: string;
  autorNome: string;
  status: StatusSolicitacao;
  dataSolicitacao: any;
  dataResposta?: any;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  motivoRejeicao?: string;
}

export type Solicitacao =
  | SolicitacaoColaboracao
  | SolicitacaoExclusaoCurso
  | SolicitacaoDocumentacao
  | SolicitacaoCriacaoCurso;
