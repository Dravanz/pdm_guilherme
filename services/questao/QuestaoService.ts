import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { CourseConfig } from "../../config/CourseConfig";
import { firestore } from "../../firebase/FirebaseInit";
import { Questao } from "../../model/Curso";

export class QuestaoService {
  private static cache: Map<string, Questao> = new Map();
  private static getQuestoesPorCurso(): { [cursoId: string]: string[] } {
    const questoesPorCurso: { [cursoId: string]: string[] } = {};

    // Gerar IDs de questões dinamicamente baseado nos cursos configurados
    CourseConfig.getAllCourses().forEach((course) => {
      const prefix = course.id.split("-")[0]; // 'javascript', 'python', 'react'
      const questoes: string[] = [];

      // Gerar questões baseado no padrão existente (4 questões por tópico, 4 tópicos)
      const topics = this.getTopicsForCourse(prefix);
      topics.forEach((topic) => {
        for (let i = 1; i <= 4; i++) {
          questoes.push(`${prefix}_${topic}_${String(i).padStart(3, "0")}`);
        }
      });

      questoesPorCurso[course.id] = questoes;
    });

    return questoesPorCurso;
  }

  private static getTopicsForCourse(coursePrefix: string): string[] {
    const topicMap: { [key: string]: string[] } = {
      javascript: ["var", "op", "func", "array", "loop", "obj"],
      python: ["var", "type", "list", "tuple", "if", "loop", "func", "module"],
      react: ["comp", "jsx", "state", "props", "effect"],
    };

    return topicMap[coursePrefix] || ["basic"];
  }

  static async obterQuestao(questaoId: string): Promise<Questao | null> {
    if (this.cache.has(questaoId)) {
      return this.cache.get(questaoId)!;
    }

    try {
      const questaoRef = doc(firestore, "questoes", questaoId);
      const questaoSnap = await getDoc(questaoRef);

      if (questaoSnap.exists()) {
        const questao = questaoSnap.data() as Questao;
        this.cache.set(questaoId, questao);
        return questao;
      }
    } catch (error) {
      console.error("Erro ao buscar questão:", error);
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

  static async inicializarQuestoesDoCurso(cursoId: string): Promise<void> {
    const questoesPorCurso = this.getQuestoesPorCurso();
    const questoesDoCurso = questoesPorCurso[cursoId];
    if (!questoesDoCurso) return;

    const questoesParaCriar = this.obterQuestoesPorIds(questoesDoCurso);

    for (const questao of questoesParaCriar) {
      try {
        const questaoRef = doc(firestore, "questoes", questao.id);
        const questaoExistente = await getDoc(questaoRef);

        if (!questaoExistente.exists()) {
          await setDoc(questaoRef, {
            ...questao,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error(`Erro ao criar questão ${questao.id}:`, error);
      }
    }
  }

  static async criarQuestoesIniciais(): Promise<void> {
    const cursos = CourseConfig.getAllCourses();
    for (const curso of cursos) {
      await this.inicializarQuestoesDoCurso(curso.id);
    }
  }

  private static obterQuestoesPorIds(questaoIds: string[]): Questao[] {
    const todasQuestoes: Questao[] = [
      // JavaScript Questions
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
          'A palavra-chave "let" é a forma moderna e recomendada para declarar variáveis em JavaScript.',
      },
      {
        id: "js_var_002",
        pergunta: 'Qual a diferença entre "let" e "const"?',
        alternativas: [
          { id: "a", texto: "Não há diferença", correta: false },
          { id: "b", texto: "const não pode ser reatribuída", correta: true },
          { id: "c", texto: "let é mais rápido", correta: false },
          { id: "d", texto: "const é apenas para números", correta: false },
        ],
        explicacao:
          "const cria uma variável que não pode ser reatribuída, enquanto let permite reatribuição.",
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
          'O operador "===" realiza comparação estrita, verificando tanto o valor quanto o tipo.',
      },
      {
        id: "js_op_002",
        pergunta: 'Qual o resultado de "5" + 3 em JavaScript?',
        alternativas: [
          { id: "a", texto: "8", correta: false },
          { id: "b", texto: '"53"', correta: true },
          { id: "c", texto: "erro", correta: false },
          { id: "d", texto: '"8"', correta: false },
        ],
        explicacao:
          'JavaScript converte o número 3 para string e concatena, resultando em "53".',
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
          "Para chamar uma função, usamos o nome seguido de parênteses com argumentos.",
      },
      {
        id: "js_func_002",
        pergunta: "Como definir uma função que retorna a soma de dois números?",
        alternativas: [
          {
            id: "a",
            texto: "function soma(a, b) { return a + b; }",
            correta: true,
          },
          { id: "b", texto: "function soma(a, b) { a + b; }", correta: false },
          { id: "c", texto: "soma(a, b) = a + b;", correta: false },
          { id: "d", texto: "def soma(a, b): return a + b", correta: false },
        ],
        explicacao:
          'Funções em JavaScript usam "function" e "return" para retornar valores.',
      },
      {
        id: "js_func_003",
        pergunta: "O que são arrow functions?",
        alternativas: [
          { id: "a", texto: "Funções que apontam para cima", correta: false },
          {
            id: "b",
            texto: "Sintaxe mais concisa: (a, b) => a + b",
            correta: true,
          },
          { id: "c", texto: "Funções que não funcionam", correta: false },
          { id: "d", texto: "Apenas para arrays", correta: false },
        ],
        explicacao:
          "Arrow functions são uma sintaxe mais concisa para escrever funções em JavaScript.",
      },
      {
        id: "js_func_004",
        pergunta: "Como definir parâmetros padrão em uma função?",
        alternativas: [
          { id: "a", texto: "function teste(x = 10) { }", correta: true },
          {
            id: "b",
            texto: "function teste(x default 10) { }",
            correta: false,
          },
          { id: "c", texto: "function teste(x || 10) { }", correta: false },
          { id: "d", texto: "function teste(x: 10) { }", correta: false },
        ],
        explicacao:
          "Parâmetros padrão são definidos usando = na declaração da função.",
      },
      {
        id: "js_array_001",
        pergunta: "Como adicionar um elemento ao final de um array?",
        alternativas: [
          { id: "a", texto: "array.push(elemento)", correta: true },
          { id: "b", texto: "array.add(elemento)", correta: false },
          { id: "c", texto: "array.append(elemento)", correta: false },
          { id: "d", texto: "array.insert(elemento)", correta: false },
        ],
        explicacao: "O método push() adiciona elementos ao final de um array.",
      },
      {
        id: "js_array_002",
        pergunta: "Como acessar o primeiro elemento de um array?",
        alternativas: [
          { id: "a", texto: "array[1]", correta: false },
          { id: "b", texto: "array[0]", correta: true },
          { id: "c", texto: "array.first()", correta: false },
          { id: "d", texto: "array.get(0)", correta: false },
        ],
        explicacao:
          "Arrays em JavaScript começam no índice 0, então array[0] é o primeiro elemento.",
      },
      {
        id: "js_loop_001",
        pergunta: "Como criar um loop for que conta de 0 a 4?",
        alternativas: [
          { id: "a", texto: "for (let i = 0; i < 5; i++)", correta: true },
          { id: "b", texto: "for (let i = 0; i <= 4; i++)", correta: false },
          { id: "c", texto: "for (i = 0; i < 5)", correta: false },
          { id: "d", texto: "for (let i = 1; i <= 5; i++)", correta: false },
        ],
        explicacao:
          "O loop for (let i = 0; i < 5; i++) executa com i = 0, 1, 2, 3, 4.",
      },
      {
        id: "js_loop_002",
        pergunta: "Qual método percorre todos os elementos de um array?",
        alternativas: [
          { id: "a", texto: "array.forEach()", correta: true },
          { id: "b", texto: "array.loop()", correta: false },
          { id: "c", texto: "array.iterate()", correta: false },
          { id: "d", texto: "array.each()", correta: false },
        ],
        explicacao:
          "O método forEach() executa uma função para cada elemento do array.",
      },
      {
        id: "js_obj_001",
        pergunta: "Como criar um objeto em JavaScript?",
        alternativas: [
          { id: "a", texto: 'let obj = { nome: "João" }', correta: true },
          { id: "b", texto: 'let obj = [ nome: "João" ]', correta: false },
          { id: "c", texto: 'let obj = ( nome: "João" )', correta: false },
          { id: "d", texto: 'let obj = < nome: "João" >', correta: false },
        ],
        explicacao:
          "Objetos em JavaScript são criados usando chaves {} com pares chave:valor.",
      },
      {
        id: "js_obj_002",
        pergunta: 'Como acessar a propriedade "nome" de um objeto?',
        alternativas: [
          { id: "a", texto: 'obj.nome ou obj["nome"]', correta: true },
          { id: "b", texto: "obj->nome", correta: false },
          { id: "c", texto: "obj::nome", correta: false },
          { id: "d", texto: 'obj.get("nome")', correta: false },
        ],
        explicacao:
          "Propriedades podem ser acessadas com notação de ponto ou colchetes.",
      },
      {
        id: "js_obj_003",
        pergunta: "Como adicionar um método a um objeto?",
        alternativas: [
          { id: "a", texto: "obj.metodo = function() { }", correta: true },
          { id: "b", texto: "obj.metodo() = { }", correta: false },
          { id: "c", texto: "obj->metodo = function() { }", correta: false },
          {
            id: "d",
            texto: 'obj.add("metodo", function() { })',
            correta: false,
          },
        ],
        explicacao: "Métodos são propriedades que contêm funções.",
      },
      {
        id: "js_obj_004",
        pergunta: "Como obter todas as chaves de um objeto?",
        alternativas: [
          { id: "a", texto: "Object.keys(obj)", correta: true },
          { id: "b", texto: "obj.keys()", correta: false },
          { id: "c", texto: "obj.getKeys()", correta: false },
          { id: "d", texto: "keys(obj)", correta: false },
        ],
        explicacao:
          "Object.keys() retorna um array com todas as chaves do objeto.",
      },

      // Python Questions
      {
        id: "py_var_001",
        pergunta: "Como declarar uma variável em Python?",
        alternativas: [
          { id: "a", texto: 'var nome = "João"', correta: false },
          { id: "b", texto: 'nome = "João"', correta: true },
          { id: "c", texto: 'let nome = "João"', correta: false },
          { id: "d", texto: 'string nome = "João"', correta: false },
        ],
        explicacao:
          "Em Python, variáveis são declaradas simplesmente atribuindo um valor.",
      },
      {
        id: "py_var_002",
        pergunta: "Python é case-sensitive?",
        alternativas: [
          { id: "a", texto: "Não", correta: false },
          { id: "b", texto: "Sim", correta: true },
          { id: "c", texto: "Apenas para strings", correta: false },
          { id: "d", texto: "Apenas para números", correta: false },
        ],
        explicacao:
          'Python é case-sensitive, então "Nome" e "nome" são variáveis diferentes.',
      },
      {
        id: "py_type_001",
        pergunta: "Como verificar o tipo de uma variável em Python?",
        alternativas: [
          { id: "a", texto: "type(variavel)", correta: true },
          { id: "b", texto: "typeof(variavel)", correta: false },
          { id: "c", texto: "variavel.type()", correta: false },
          { id: "d", texto: "gettype(variavel)", correta: false },
        ],
        explicacao: "A função type() retorna o tipo de uma variável em Python.",
      },
      {
        id: "py_type_002",
        pergunta: "Como converter string para inteiro?",
        alternativas: [
          { id: "a", texto: 'int("123")', correta: true },
          { id: "b", texto: 'integer("123")', correta: false },
          { id: "c", texto: 'toInt("123")', correta: false },
          { id: "d", texto: 'parse("123")', correta: false },
        ],
        explicacao: "A função int() converte strings para números inteiros.",
      },
      {
        id: "py_list_001",
        pergunta: "Como criar uma lista em Python?",
        alternativas: [
          { id: "a", texto: "lista = [1, 2, 3]", correta: true },
          { id: "b", texto: "lista = (1, 2, 3)", correta: false },
          { id: "c", texto: "lista = {1, 2, 3}", correta: false },
          { id: "d", texto: "lista = <1, 2, 3>", correta: false },
        ],
        explicacao: "Listas em Python são criadas usando colchetes [].",
      },
      {
        id: "py_list_002",
        pergunta: "Como adicionar um elemento ao final de uma lista?",
        alternativas: [
          { id: "a", texto: "lista.append(elemento)", correta: true },
          { id: "b", texto: "lista.add(elemento)", correta: false },
          { id: "c", texto: "lista.push(elemento)", correta: false },
          { id: "d", texto: "lista.insert(elemento)", correta: false },
        ],
        explicacao: "O método append() adiciona um elemento ao final da lista.",
      },
      {
        id: "py_tuple_001",
        pergunta: "Como criar uma tupla em Python?",
        alternativas: [
          { id: "a", texto: "tupla = (1, 2, 3)", correta: true },
          { id: "b", texto: "tupla = [1, 2, 3]", correta: false },
          { id: "c", texto: "tupla = {1, 2, 3}", correta: false },
          { id: "d", texto: "tupla = <1, 2, 3>", correta: false },
        ],
        explicacao: "Tuplas são criadas usando parênteses () e são imutáveis.",
      },
      {
        id: "py_tuple_002",
        pergunta: "Qual a principal diferença entre lista e tupla?",
        alternativas: [
          { id: "a", texto: "Tuplas são imutáveis", correta: true },
          { id: "b", texto: "Listas são mais rápidas", correta: false },
          { id: "c", texto: "Tuplas só armazenam números", correta: false },
          { id: "d", texto: "Não há diferença", correta: false },
        ],
        explicacao:
          "Tuplas são imutáveis (não podem ser alteradas), listas são mutáveis.",
      },
      {
        id: "py_if_001",
        pergunta: "Como escrever uma condição if em Python?",
        alternativas: [
          { id: "a", texto: "if idade >= 18:", correta: true },
          { id: "b", texto: "if (idade >= 18) {", correta: false },
          { id: "c", texto: "if idade >= 18 then", correta: false },
          { id: "d", texto: "if idade >= 18;", correta: false },
        ],
        explicacao:
          "Em Python, if termina com dois pontos (:) e usa indentação.",
      },
      {
        id: "py_if_002",
        pergunta: "Como escrever else if em Python?",
        alternativas: [
          { id: "a", texto: "elif", correta: true },
          { id: "b", texto: "else if", correta: false },
          { id: "c", texto: "elseif", correta: false },
          { id: "d", texto: "elsif", correta: false },
        ],
        explicacao: 'Em Python, "else if" é escrito como "elif".',
      },
      {
        id: "py_loop_001",
        pergunta: "Como criar um loop for que conta de 0 a 4?",
        alternativas: [
          { id: "a", texto: "for i in range(5):", correta: true },
          { id: "b", texto: "for i in range(0, 4):", correta: false },
          { id: "c", texto: "for i = 0 to 4:", correta: false },
          { id: "d", texto: "for (i = 0; i < 5; i++):", correta: false },
        ],
        explicacao: "range(5) gera números de 0 a 4 (5 não incluído).",
      },
      {
        id: "py_loop_002",
        pergunta: "Como percorrer uma lista em Python?",
        alternativas: [
          { id: "a", texto: "for item in lista:", correta: true },
          { id: "b", texto: "for item of lista:", correta: false },
          { id: "c", texto: "foreach item in lista:", correta: false },
          { id: "d", texto: "for (item in lista):", correta: false },
        ],
        explicacao:
          'Em Python, usamos "for item in lista:" para percorrer listas.',
      },
      {
        id: "py_func_001",
        pergunta: "Como definir uma função em Python?",
        alternativas: [
          { id: "a", texto: "def minha_funcao():", correta: true },
          { id: "b", texto: "function minha_funcao():", correta: false },
          { id: "c", texto: "func minha_funcao():", correta: false },
          { id: "d", texto: "define minha_funcao():", correta: false },
        ],
        explicacao:
          'Funções em Python são definidas com a palavra-chave "def".',
      },
      {
        id: "py_func_002",
        pergunta: "Como retornar um valor de uma função?",
        alternativas: [
          { id: "a", texto: "return valor", correta: true },
          { id: "b", texto: "give valor", correta: false },
          { id: "c", texto: "send valor", correta: false },
          { id: "d", texto: "output valor", correta: false },
        ],
        explicacao:
          'A palavra-chave "return" é usada para retornar valores de funções.',
      },
      {
        id: "py_module_001",
        pergunta: "Como importar o módulo math?",
        alternativas: [
          { id: "a", texto: "import math", correta: true },
          { id: "b", texto: "include math", correta: false },
          { id: "c", texto: "require math", correta: false },
          { id: "d", texto: "use math", correta: false },
        ],
        explicacao:
          'A palavra-chave "import" é usada para importar módulos em Python.',
      },
      {
        id: "py_module_002",
        pergunta: "Como importar apenas a função sqrt do módulo math?",
        alternativas: [
          { id: "a", texto: "from math import sqrt", correta: true },
          { id: "b", texto: "import math.sqrt", correta: false },
          { id: "c", texto: "import sqrt from math", correta: false },
          { id: "d", texto: "use math.sqrt", correta: false },
        ],
        explicacao:
          'Use "from módulo import função" para importar funções específicas.',
      },

      // React Questions
      {
        id: "react_comp_001",
        pergunta: "Como criar um componente funcional em React?",
        alternativas: [
          {
            id: "a",
            texto: "function MeuComponente() { return <div>Hello</div>; }",
            correta: true,
          },
          {
            id: "b",
            texto: "class MeuComponente() { return <div>Hello</div>; }",
            correta: false,
          },
          {
            id: "c",
            texto: "component MeuComponente() { return <div>Hello</div>; }",
            correta: false,
          },
          {
            id: "d",
            texto: "const MeuComponente = <div>Hello</div>;",
            correta: false,
          },
        ],
        explicacao:
          "Componentes funcionais em React são funções que retornam JSX.",
      },
      {
        id: "react_comp_002",
        pergunta: "Como exportar um componente para uso em outros arquivos?",
        alternativas: [
          { id: "a", texto: "export default MeuComponente", correta: true },
          { id: "b", texto: "export MeuComponente", correta: false },
          { id: "c", texto: "module.exports = MeuComponente", correta: false },
          { id: "d", texto: "return MeuComponente", correta: false },
        ],
        explicacao:
          'Use "export default" para exportar o componente principal do arquivo.',
      },
      {
        id: "react_jsx_001",
        pergunta: "O que é JSX?",
        alternativas: [
          {
            id: "a",
            texto: "Sintaxe que mistura HTML e JavaScript",
            correta: true,
          },
          { id: "b", texto: "Uma linguagem de programação", correta: false },
          { id: "c", texto: "Um framework CSS", correta: false },
          { id: "d", texto: "Um banco de dados", correta: false },
        ],
        explicacao: "JSX permite escrever elementos HTML dentro do JavaScript.",
      },
      {
        id: "react_jsx_002",
        pergunta: "Como usar uma variável JavaScript dentro do JSX?",
        alternativas: [
          { id: "a", texto: "{variavel}", correta: true },
          { id: "b", texto: "{{variavel}}", correta: false },
          { id: "c", texto: "$(variavel)", correta: false },
          { id: "d", texto: "%variavel%", correta: false },
        ],
        explicacao: "Use chaves {} para inserir expressões JavaScript no JSX.",
      },
      {
        id: "react_state_001",
        pergunta: "Como usar state em componentes funcionais React?",
        alternativas: [
          { id: "a", texto: "this.state = { count: 0 }", correta: false },
          {
            id: "b",
            texto: "const [count, setCount] = useState(0)",
            correta: true,
          },
          { id: "c", texto: "state.count = 0", correta: false },
          { id: "d", texto: "var count = useState(0)", correta: false },
        ],
        explicacao: "O hook useState gerencia state em componentes funcionais.",
      },
      {
        id: "react_state_002",
        pergunta: "Como atualizar o state em React?",
        alternativas: [
          { id: "a", texto: "setCount(novoValor)", correta: true },
          { id: "b", texto: "count = novoValor", correta: false },
          { id: "c", texto: "updateCount(novoValor)", correta: false },
          {
            id: "d",
            texto: "this.setState({count: novoValor})",
            correta: false,
          },
        ],
        explicacao:
          "Use a função setter retornada pelo useState para atualizar o state.",
      },
      {
        id: "react_state_003",
        pergunta: "O que acontece quando o state muda?",
        alternativas: [
          { id: "a", texto: "O componente re-renderiza", correta: true },
          { id: "b", texto: "Nada acontece", correta: false },
          { id: "c", texto: "A página recarrega", correta: false },
          { id: "d", texto: "O componente é destruído", correta: false },
        ],
        explicacao:
          "Mudanças no state fazem o React re-renderizar o componente.",
      },
      {
        id: "react_state_004",
        pergunta: "Qual é o valor inicial do useState(0)?",
        alternativas: [
          { id: "a", texto: "0", correta: true },
          { id: "b", texto: "null", correta: false },
          { id: "c", texto: "undefined", correta: false },
          { id: "d", texto: '""', correta: false },
        ],
        explicacao: "O valor passado para useState é o valor inicial do state.",
      },
      {
        id: "react_props_001",
        pergunta: "O que são props em React?",
        alternativas: [
          { id: "a", texto: "Dados passados de pai para filho", correta: true },
          { id: "b", texto: "Funções do componente", correta: false },
          { id: "c", texto: "Estilos CSS", correta: false },
          { id: "d", texto: "Estados internos", correta: false },
        ],
        explicacao:
          "Props são propriedades passadas de componentes pais para filhos.",
      },
      {
        id: "react_props_002",
        pergunta: "Como acessar props em um componente funcional?",
        alternativas: [
          {
            id: "a",
            texto: "function Comp(props) { return props.nome; }",
            correta: true,
          },
          {
            id: "b",
            texto: "function Comp() { return this.props.nome; }",
            correta: false,
          },
          {
            id: "c",
            texto: "function Comp() { return props.nome; }",
            correta: false,
          },
          {
            id: "d",
            texto: "function Comp() { return state.nome; }",
            correta: false,
          },
        ],
        explicacao:
          "Props são recebidas como parâmetro da função do componente.",
      },
      {
        id: "react_props_003",
        pergunta: "Como usar destructuring com props?",
        alternativas: [
          {
            id: "a",
            texto: "function Comp({ nome, idade }) { }",
            correta: true,
          },
          { id: "b", texto: "function Comp(nome, idade) { }", correta: false },
          {
            id: "c",
            texto: "function Comp([nome, idade]) { }",
            correta: false,
          },
          {
            id: "d",
            texto: "function Comp(props.nome, props.idade) { }",
            correta: false,
          },
        ],
        explicacao:
          "Use destructuring {} para extrair propriedades específicas das props.",
      },
      {
        id: "react_props_004",
        pergunta: "Props podem ser modificadas pelo componente filho?",
        alternativas: [
          { id: "a", texto: "Não, props são read-only", correta: true },
          { id: "b", texto: "Sim, sempre", correta: false },
          { id: "c", texto: "Apenas strings", correta: false },
          { id: "d", texto: "Apenas números", correta: false },
        ],
        explicacao:
          "Props são imutáveis - componentes filhos não podem modificá-las.",
      },
      {
        id: "react_effect_001",
        pergunta: "Para que serve o useEffect?",
        alternativas: [
          { id: "a", texto: "Gerenciar efeitos colaterais", correta: true },
          { id: "b", texto: "Criar componentes", correta: false },
          { id: "c", texto: "Estilizar elementos", correta: false },
          { id: "d", texto: "Definir rotas", correta: false },
        ],
        explicacao:
          "useEffect gerencia efeitos colaterais como API calls, timers, etc.",
      },
      {
        id: "react_effect_002",
        pergunta: "Como fazer useEffect executar apenas uma vez?",
        alternativas: [
          { id: "a", texto: "useEffect(() => {}, [])", correta: true },
          { id: "b", texto: "useEffect(() => {})", correta: false },
          { id: "c", texto: "useEffect(() => {}, [1])", correta: false },
          { id: "d", texto: "useEffect(() => {}, null)", correta: false },
        ],
        explicacao:
          "Array vazio [] como dependência faz useEffect executar apenas uma vez.",
      },
      {
        id: "react_effect_003",
        pergunta: "Quando useEffect executa por padrão?",
        alternativas: [
          { id: "a", texto: "Após cada renderização", correta: true },
          { id: "b", texto: "Antes da renderização", correta: false },
          { id: "c", texto: "Apenas na primeira renderização", correta: false },
          { id: "d", texto: "Nunca executa automaticamente", correta: false },
        ],
        explicacao:
          "Por padrão, useEffect executa após cada renderização do componente.",
      },
      {
        id: "react_effect_004",
        pergunta: "Como fazer cleanup no useEffect?",
        alternativas: [
          { id: "a", texto: "return () => { /* cleanup */ }", correta: true },
          { id: "b", texto: "cleanup(() => { })", correta: false },
          { id: "c", texto: "useEffect.cleanup(() => { })", correta: false },
          { id: "d", texto: "destroy(() => { })", correta: false },
        ],
        explicacao:
          "Retorne uma função do useEffect para fazer cleanup quando necessário.",
      },
    ];

    return todasQuestoes.filter((questao) => questaoIds.includes(questao.id));
  }

  static limparCache(): void {
    this.cache.clear();
  }
}
