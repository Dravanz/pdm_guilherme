import { Questao } from '../model/Curso';

export const BANCO_QUESTOES: { [key: string]: Questao } = {
  'js_var_001': {
    id: 'js_var_001',
    pergunta: 'Qual é a forma correta de declarar uma variável em JavaScript?',
    alternativas: [
      { id: 'a', texto: 'variable nome = "João";', correta: false },
      { id: 'b', texto: 'let nome = "João";', correta: true },
      { id: 'c', texto: 'string nome = "João";', correta: false },
      { id: 'd', texto: 'declare nome = "João";', correta: false },
    ],
    explicacao: 'A palavra-chave "let" é a forma moderna e recomendada para declarar variáveis em JavaScript.',
  },
  
  'js_op_001': {
    id: 'js_op_001',
    pergunta: 'Qual operador é usado para comparação estrita em JavaScript?',
    alternativas: [
      { id: 'a', texto: '==', correta: false },
      { id: 'b', texto: '===', correta: true },
      { id: 'c', texto: '=', correta: false },
      { id: 'd', texto: '!=', correta: false },
    ],
    explicacao: 'O operador "===" realiza comparação estrita, verificando valor e tipo.',
  },
  
  'js_func_001': {
    id: 'js_func_001',
    pergunta: 'Como chamar uma função chamada "calcular" com os parâmetros 5 e 3?',
    alternativas: [
      { id: 'a', texto: 'calcular(5, 3);', correta: true },
      { id: 'b', texto: 'call calcular(5, 3);', correta: false },
      { id: 'c', texto: 'function calcular(5, 3);', correta: false },
      { id: 'd', texto: 'execute calcular(5, 3);', correta: false },
    ],
    explicacao: 'Para chamar uma função, usamos o nome seguido de parênteses com argumentos.',
  },
};