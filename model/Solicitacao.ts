export enum TipoSolicitacao {
  Colaboracao = "Colaboracao",
  ExclusaoCurso = "ExclusaoCurso",
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

export type Solicitacao = SolicitacaoColaboracao | SolicitacaoExclusaoCurso;
