export interface Badge {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  tipo: 'curso' | 'conquista' | 'especial' | 'ranking';
  requisitos: BadgeRequisito;
  dataObtencao?: Date;
  usuarioId?: string;
}

export interface BadgeRequisito {
  tipo: 'curso_concluido' | 'primeiro_curso' | 'multiplos_cursos' | 'coeficiente_alto' | 'sequencia_dias' | 'ranking_posicao';
  valor?: string | number;
  cursoId?: string;
}

export const BADGES_DISPONIVEIS: Badge[] = [
  {
    id: 'first_course',
    nome: 'Primeiro Passo',
    icone: '🎁',
    descricao: 'Concluiu o primeiro curso',
    tipo: 'conquista',
    requisitos: { tipo: 'primeiro_curso' }
  },
  {
    id: 'javascript_basic',
    nome: 'JavaScript Básico',
    icone: '🕹️',
    descricao: 'Concluiu o curso de JavaScript Básico',
    tipo: 'curso',
    requisitos: { tipo: 'curso_concluido', cursoId: 'javascript-basico' }
  },
  {
    id: 'high_achiever',
    nome: 'Alto Desempenho',
    icone: '🏆',
    descricao: 'Atingiu coeficiente acima de 90%',
    tipo: 'conquista',
    requisitos: { tipo: 'coeficiente_alto', valor: 90 }
  },
  {
    id: 'course_master',
    nome: 'Mestre dos Cursos',
    icone: '👑',
    descricao: 'Concluiu 3 cursos',
    tipo: 'conquista',
    requisitos: { tipo: 'multiplos_cursos', valor: 3 }
  },
  {
    id: 'python_basic',
    nome: 'Python Básico',
    icone: '🐍',
    descricao: 'Concluiu o curso de Python Básico',
    tipo: 'curso',
    requisitos: { tipo: 'curso_concluido', cursoId: 'python-basico' }
  },
  {
    id: 'react_basic',
    nome: 'React Básico',
    icone: '⚛️',
    descricao: 'Concluiu o curso de React Básico',
    tipo: 'curso',
    requisitos: { tipo: 'curso_concluido', cursoId: 'react-basico' }
  },
  {
    id: 'dedicated_learner',
    nome: 'Aprendiz Dedicado',
    icone: '🔥',
    descricao: 'Estudou por 7 dias consecutivos',
    tipo: 'especial',
    requisitos: { tipo: 'sequencia_dias', valor: 7 }
  },
  {
    id: 'ranking_1',
    nome: 'Campeão 🥇',
    icone: '🥇',
    descricao: 'Primeiro lugar no ranking geral',
    tipo: 'ranking',
    requisitos: { tipo: 'ranking_posicao', valor: 1 }
  },
  {
    id: 'ranking_2',
    nome: 'Vice-Campeão 🥈',
    icone: '🥈',
    descricao: 'Segundo lugar no ranking geral',
    tipo: 'ranking',
    requisitos: { tipo: 'ranking_posicao', valor: 2 }
  },
  {
    id: 'ranking_3',
    nome: 'Terceiro Lugar 🥉',
    icone: '🥉',
    descricao: 'Terceiro lugar no ranking geral',
    tipo: 'ranking',
    requisitos: { tipo: 'ranking_posicao', valor: 3 }
  },
  {
    id: 'ranking_top5',
    nome: 'Top 5 🏆',
    icone: '🏆',
    descricao: 'Entre os 5 melhores do ranking',
    tipo: 'ranking',
    requisitos: { tipo: 'ranking_posicao', valor: 5 }
  },
  {
    id: 'ranking_top10',
    nome: 'Top 10 🏅',
    icone: '🏅',
    descricao: 'Entre os 10 melhores do ranking',
    tipo: 'ranking',
    requisitos: { tipo: 'ranking_posicao', valor: 10 }
  },
  {
    id: 'ranking_top20',
    nome: 'Top 20 🏵️',
    icone: '🏵️',
    descricao: 'Entre os 20 melhores do ranking',
    tipo: 'ranking',
    requisitos: { tipo: 'ranking_posicao', valor: 20 }
  }
];