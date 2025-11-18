import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/FirebaseInit';
import { Questao } from '../model/Curso';

export class QuestaoService {
  
  static async obterQuestao(questaoId: string): Promise<Questao | null> {
    try {
      console.log('Buscando questão:', questaoId);
      const questaoRef = doc(firestore, 'questoes', questaoId);
      const questaoSnap = await getDoc(questaoRef);
      
      if (questaoSnap.exists()) {
        const questao = questaoSnap.data() as Questao;
        console.log('Questão encontrada:', questao);
        return questao;
      } else {
        console.log('Questão não encontrada:', questaoId);
      }
    } catch (error) {
      console.log('Erro ao buscar questão:', error);
    }
    
    return null;
  }

  static async obterMultiplasQuestoes(questaoIds: string[]): Promise<Questao[]> {
    const questoes: Questao[] = [];
    
    for (const id of questaoIds) {
      const questao = await this.obterQuestao(id);
      if (questao) {
        questoes.push(questao);
      }
    }
    
    return questoes;
  }

  static async criarQuestoesIniciais(): Promise<void> {
    const questoes: Questao[] = [
      {
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
      {
        id: 'js_op_001',
        pergunta: 'Qual operador é usado para comparação estrita em JavaScript?',
        alternativas: [
          { id: 'a', texto: '==', correta: false },
          { id: 'b', texto: '===', correta: true },
          { id: 'c', texto: '=', correta: false },
          { id: 'd', texto: '!=', correta: false },
        ],
        explicacao: 'O operador "===" realiza comparação estrita, verificando tanto o valor quanto o tipo.',
      },
      {
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
      {
        id: 'py_var_001',
        pergunta: 'Como declarar uma variável em Python?',
        alternativas: [
          { id: 'a', texto: 'var nome = "João"', correta: false },
          { id: 'b', texto: 'nome = "João"', correta: true },
          { id: 'c', texto: 'let nome = "João"', correta: false },
          { id: 'd', texto: 'string nome = "João"', correta: false },
        ],
        explicacao: 'Em Python, variáveis são declaradas simplesmente atribuindo um valor.',
      },
      {
        id: 'py_list_001',
        pergunta: 'Como criar uma lista em Python?',
        alternativas: [
          { id: 'a', texto: 'lista = [1, 2, 3]', correta: true },
          { id: 'b', texto: 'lista = (1, 2, 3)', correta: false },
          { id: 'c', texto: 'lista = {1, 2, 3}', correta: false },
          { id: 'd', texto: 'lista = <1, 2, 3>', correta: false },
        ],
        explicacao: 'Listas em Python são criadas usando colchetes [].',
      },
      {
        id: 'react_comp_001',
        pergunta: 'Como criar um componente funcional em React?',
        alternativas: [
          { id: 'a', texto: 'function MeuComponente() { return <div>Hello</div>; }', correta: true },
          { id: 'b', texto: 'class MeuComponente() { return <div>Hello</div>; }', correta: false },
          { id: 'c', texto: 'component MeuComponente() { return <div>Hello</div>; }', correta: false },
          { id: 'd', texto: 'const MeuComponente = <div>Hello</div>;', correta: false },
        ],
        explicacao: 'Componentes funcionais em React são funções que retornam JSX.',
      },
      {
        id: 'react_state_001',
        pergunta: 'Como usar state em componentes funcionais React?',
        alternativas: [
          { id: 'a', texto: 'this.state = { count: 0 }', correta: false },
          { id: 'b', texto: 'const [count, setCount] = useState(0)', correta: true },
          { id: 'c', texto: 'state.count = 0', correta: false },
          { id: 'd', texto: 'var count = useState(0)', correta: false },
        ],
        explicacao: 'O hook useState gerencia state em componentes funcionais.',
      },
    ];

    for (const questao of questoes) {
      try {
        const questaoRef = doc(firestore, 'questoes', questao.id);
        await setDoc(questaoRef, {
          ...questao,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log(`Questão ${questao.id} criada com sucesso`);
      } catch (error) {
        console.error(`Erro ao criar questão ${questao.id}:`, error);
      }
    }
  }
}