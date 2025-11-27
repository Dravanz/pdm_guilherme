import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "../../firebase/FirebaseInit";
import { QuestaoFirestore } from "../../model/BancoQuestoes";
import { Questao } from "../../model/Curso";

export class BancoQuestoesService {
  static async obterQuestao(questaoId: string): Promise<Questao | null> {
    try {
      const questaoRef = doc(firestore, "questoes", questaoId);
      const questaoSnap = await getDoc(questaoRef);

      if (questaoSnap.exists()) {
        const questaoData = questaoSnap.data() as QuestaoFirestore;
        return {
          id: questaoData.id,
          pergunta: questaoData.pergunta,
          alternativas: questaoData.alternativas,
          explicacao: questaoData.explicacao,
        };
      }
    } catch (error) {
      console.log("Erro ao buscar questão no Firebase:", error);
    }

    return null;
  }

  static async obterMultiplasQuestoes(
    questaoIds: string[]
  ): Promise<Questao[]> {
    const questoes: Questao[] = [];

    for (const id of questaoIds) {
      const questao = await this.obterQuestao(id);
      if (questao) {
        questoes.push(questao);
      }
    }

    return questoes;
  }

  /**
   * Salva uma questão no Firestore
   */
  static async salvarQuestao(questao: Questao): Promise<void> {
    try {
      const questaoRef = doc(firestore, "questoes", questao.id);
      const questaoData: QuestaoFirestore = {
        id: questao.id,
        pergunta: questao.pergunta,
        alternativas: questao.alternativas,
        explicacao: questao.explicacao || "",
        categoria: "geral",
        nivel: "iniciante",
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(questaoRef, questaoData);
    } catch (error) {
      console.error(`Erro ao salvar questão ${questao.id}:`, error);
      throw error;
    }
  }

  static async criarQuestoesIniciais(): Promise<void> {
    const questoes: QuestaoFirestore[] = [
      {
        id: "js_var_001",
        pergunta:
          "Qual é a forma correta de declarar uma variável em JavaScript?",
        alternativas: [
          { id: "a", texto: 'variable nome = "João";', correta: false },
          { id: "b", texto: 'let nome = "João";', correta: true },
          { id: "c", texto: 'string nome = "João";', correta: false },
          { id: "d", texto: 'declare nome = "João";', correta: false },
        ],
        explicacao:
          'A palavra-chave "let" é a forma moderna e recomendada para declarar variáveis em JavaScript. Ela possui escopo de bloco e evita problemas de hoisting.',
        categoria: "javascript",
        nivel: "iniciante",
        tags: ["variaveis", "let", "declaracao"],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        id: "js_op_001",
        pergunta:
          "Qual operador é usado para comparação estrita em JavaScript?",
        alternativas: [
          { id: "a", texto: "==", correta: false },
          { id: "b", texto: "===", correta: true },
          { id: "c", texto: "=", correta: false },
          { id: "d", texto: "!=", correta: false },
        ],
        explicacao:
          'O operador "===" realiza comparação estrita, verificando tanto o valor quanto o tipo da variável, evitando conversões automáticas indesejadas.',
        categoria: "javascript",
        nivel: "iniciante",
        tags: ["operadores", "comparacao", "strict"],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        id: "js_func_001",
        pergunta:
          'Como chamar uma função chamada "calcular" com os parâmetros 5 e 3?',
        alternativas: [
          { id: "a", texto: "calcular(5, 3);", correta: true },
          { id: "b", texto: "call calcular(5, 3);", correta: false },
          { id: "c", texto: "function calcular(5, 3);", correta: false },
          { id: "d", texto: "execute calcular(5, 3);", correta: false },
        ],
        explicacao:
          "Para chamar uma função, usamos o nome da função seguido de parênteses contendo os argumentos separados por vírgula.",
        categoria: "javascript",
        nivel: "iniciante",
        tags: ["funcoes", "chamada", "parametros"],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    ];

    for (const questao of questoes) {
      try {
        const questaoRef = doc(firestore, "questoes", questao.id);
        await setDoc(questaoRef, questao);
        console.log(`Questão ${questao.id} criada com sucesso`);
      } catch (error) {
        console.error(`Erro ao criar questão ${questao.id}:`, error);
      }
    }
  }
}
