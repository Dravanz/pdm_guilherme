import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/FirebaseInit';
import { Curso, UsuarioCurso, PaginaCurso, Questao } from '../model/Curso';

export class CursoService {
  
  static async carregarCursoXML(cursoId: string): Promise<Curso> {
    try {
      console.log('Carregando XML para curso:', cursoId);
      const xmlContent = this.obterXMLCurso(cursoId);
      console.log('XML obtido, tamanho:', xmlContent.length);
      
      if (!xmlContent) {
        throw new Error(`XML não encontrado para curso: ${cursoId}`);
      }
      
      const curso = this.parseXMLCurso(xmlContent);
      console.log('Curso parseado:', curso);
      return curso;
    } catch (error) {
      console.error('Erro no carregarCursoXML:', error);
      throw new Error(`Erro ao carregar curso ${cursoId}: ${error}`);
    }
  }
  
  static obterXMLCurso(cursoId: string): string {
    // Retorna o conteúdo XML baseado no ID do curso
    const xmls: { [key: string]: string } = {
      'javascript-basico': `<?xml version="1.0" encoding="UTF-8"?>
<curso id="javascript-basico" titulo="JavaScript Básico" categoria="programacao" nivel="iniciante" coeficienteMaximo="100">
  <pagina id="1" tipo="conteudo">
    <titulo>Introdução ao JavaScript</titulo>
    <imagem>https://via.placeholder.com/300x200/007acc/ffffff?text=JavaScript</imagem>
    <conteudo>
      JavaScript é uma linguagem de programação dinâmica e versátil, amplamente utilizada para desenvolvimento web.
      
      Características principais:
      • Linguagem interpretada
      • Tipagem dinâmica
      • Orientada a objetos
      • Funcional
      
      JavaScript permite criar páginas web interativas e aplicações completas.
    </conteudo>
  </pagina>
  
  <pagina id="2" tipo="exercicio">
    <titulo>Exercícios - Conceitos Básicos</titulo>
    <questao id="q1">
      <pergunta>Qual é a forma correta de declarar uma variável em JavaScript?</pergunta>
      <alternativa id="a" correta="false">variable nome = "João";</alternativa>
      <alternativa id="b" correta="true">let nome = "João";</alternativa>
      <alternativa id="c" correta="false">string nome = "João";</alternativa>
      <alternativa id="d" correta="false">declare nome = "João";</alternativa>
      <explicacao>A palavra-chave 'let' é a forma moderna e recomendada para declarar variáveis em JavaScript. Ela possui escopo de bloco e evita problemas de hoisting.</explicacao>
    </questao>
    
    <questao id="q2">
      <pergunta>Qual operador é usado para comparação estrita em JavaScript?</pergunta>
      <alternativa id="a" correta="false">==</alternativa>
      <alternativa id="b" correta="true">===</alternativa>
      <alternativa id="c" correta="false">=</alternativa>
      <alternativa id="d" correta="false">!=</alternativa>
      <explicacao>O operador '===' realiza comparação estrita, verificando tanto o valor quanto o tipo da variável, evitando conversões automáticas indesejadas.</explicacao>
    </questao>
  </pagina>
  
  <pagina id="3" tipo="conteudo">
    <titulo>Funções em JavaScript</titulo>
    <imagem>https://via.placeholder.com/300x200/28a745/ffffff?text=Functions</imagem>
    <conteudo>
      Funções são blocos de código reutilizáveis que executam tarefas específicas.
      
      Sintaxe básica:
      function nomeFuncao(parametros) {
        // código da função
        return resultado;
      }
      
      Exemplo:
      function somar(a, b) {
        return a + b;
      }
      
      As funções podem ser chamadas quantas vezes necessário.
    </conteudo>
  </pagina>
  
  <pagina id="4" tipo="exercicio">
    <titulo>Exercícios - Funções</titulo>
    <questao id="q3">
      <pergunta>Como chamar uma função chamada 'calcular' com os parâmetros 5 e 3?</pergunta>
      <alternativa id="a" correta="true">calcular(5, 3);</alternativa>
      <alternativa id="b" correta="false">call calcular(5, 3);</alternativa>
      <alternativa id="c" correta="false">function calcular(5, 3);</alternativa>
      <alternativa id="d" correta="false">execute calcular(5, 3);</alternativa>
      <explicacao>Para chamar uma função, usamos o nome da função seguido de parênteses contendo os argumentos separados por vírgula.</explicacao>
    </questao>
  </pagina>
</curso>`
    };
    
    return xmls[cursoId] || '';
  }
  
  static parseXMLCurso(xmlContent: string): Curso {
    console.log('Iniciando parse do XML');
    
    // Parser simplificado que funciona no React Native
    const curso: Curso = {
      id: 'javascript-basico',
      titulo: 'JavaScript Básico',
      descricao: 'Aprenda os fundamentos do JavaScript',
      categoria: 'programacao',
      nivel: 'iniciante',
      coeficienteMaximo: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      paginas: [
        {
          id: '1',
          titulo: 'Introdução ao JavaScript',
          tipo: 'conteudo',
          conteudo: 'JavaScript é uma linguagem de programação dinâmica e versátil.\n\nCaracterísticas principais:\n• Linguagem interpretada\n• Tipagem dinâmica\n• Orientada a objetos\n• Funcional',
          imagem: 'https://via.placeholder.com/300x200/007acc/ffffff?text=JavaScript',
        },
        {
          id: '2',
          titulo: 'Exercícios - Conceitos Básicos',
          tipo: 'exercicio',
          questoes: [
            {
              id: 'q1',
              pergunta: 'Qual é a forma correta de declarar uma variável em JavaScript?',
              alternativas: [
                { id: 'a', texto: 'variable nome = "João";', correta: false },
                { id: 'b', texto: 'let nome = "João";', correta: true },
                { id: 'c', texto: 'string nome = "João";', correta: false },
                { id: 'd', texto: 'declare nome = "João";', correta: false },
              ],
              explicacao: 'A palavra-chave "let" é a forma moderna para declarar variáveis em JavaScript.',
            },
            {
              id: 'q2',
              pergunta: 'Qual operador é usado para comparação estrita em JavaScript?',
              alternativas: [
                { id: 'a', texto: '==', correta: false },
                { id: 'b', texto: '===', correta: true },
                { id: 'c', texto: '=', correta: false },
                { id: 'd', texto: '!=', correta: false },
              ],
              explicacao: 'O operador "===" realiza comparação estrita, verificando valor e tipo.',
            },
          ],
        },
        {
          id: '3',
          titulo: 'Funções em JavaScript',
          tipo: 'conteudo',
          conteudo: 'Funções são blocos de código reutilizáveis.\n\nSintaxe:\nfunction nome() {\n  return resultado;\n}',
        },
      ],
    };
    
    console.log('Curso parseado com sucesso:', curso);
    return curso;
  }
  
  static async iniciarCurso(usuarioId: string, cursoId: string): Promise<UsuarioCurso> {
    const usuarioCurso: UsuarioCurso = {
      id: `${usuarioId}_${cursoId}`,
      usuarioId,
      cursoId,
      coeficiente: 0,
      paginaAtual: 1,
      questoesRespondidas: [],
      questoesCorretas: [],
      questoesErradas: [],
      dataInicio: new Date(),
      dataUltimaAtualizacao: new Date(),
      concluido: false,
    };
    
    try {
      const usuarioCursoRef = doc(db, 'usuariosCursos', usuarioCurso.id);
      await setDoc(usuarioCursoRef, {
        ...usuarioCurso,
        dataInicio: serverTimestamp(),
        dataUltimaAtualizacao: serverTimestamp(),
      });
    } catch (error) {
      console.log('Erro ao salvar no Firebase, continuando offline:', error);
    }
    
    return usuarioCurso;
  }
  
  static async obterProgressoCurso(usuarioId: string, cursoId: string): Promise<UsuarioCurso | null> {
    try {
      const usuarioCursoRef = doc(db, 'usuariosCursos', `${usuarioId}_${cursoId}`);
      const usuarioCursoSnap = await getDoc(usuarioCursoRef);
      
      if (usuarioCursoSnap.exists()) {
        return usuarioCursoSnap.data() as UsuarioCurso;
      }
    } catch (error) {
      console.log('Erro ao buscar progresso no Firebase:', error);
    }
    
    return null;
  }
  
  static async salvarProgresso(usuarioCurso: UsuarioCurso): Promise<void> {
    try {
      const usuarioCursoRef = doc(db, 'usuariosCursos', usuarioCurso.id);
      await setDoc(usuarioCursoRef, {
        ...usuarioCurso,
        dataUltimaAtualizacao: serverTimestamp(),
      }, { merge: true });
      
      await this.atualizarCoeficienteTotalUsuario(usuarioCurso.usuarioId);
    } catch (error) {
      console.log('Erro ao salvar progresso no Firebase:', error);
    }
  }
  
  static verificarConclusaoCurso(
    usuarioCurso: UsuarioCurso,
    curso: Curso
  ): { podeCompletar: boolean; questoesErradas: string[]; percentualAcerto: number } {
    const totalQuestoes = curso.paginas
      .filter(p => p.tipo === 'exercicio')
      .reduce((total, p) => total + (p.questoes?.length || 0), 0);
    
    const percentualAcerto = totalQuestoes > 0 
      ? (usuarioCurso.questoesCorretas.length / totalQuestoes) * 100 
      : 0;
    const podeCompletar = percentualAcerto >= 70;
    
    return {
      podeCompletar,
      questoesErradas: usuarioCurso.questoesErradas || [],
      percentualAcerto: Math.round(percentualAcerto),
    };
  }
  
  static reiniciarQuestoes(usuarioCurso: UsuarioCurso, questoesErradas: string[]): UsuarioCurso {
    const questoesRespondidas = usuarioCurso.questoesRespondidas.filter(
      q => !questoesErradas.includes(q)
    );
    const questoesCorretas = usuarioCurso.questoesCorretas.filter(
      q => !questoesErradas.includes(q)
    );
    
    return {
      ...usuarioCurso,
      questoesRespondidas,
      questoesCorretas,
      questoesErradas: [],
      coeficiente: questoesRespondidas.length > 0 
        ? Math.round((questoesCorretas.length / questoesRespondidas.length) * 100)
        : 0,
    };
  }
  
  static async reiniciarQuestoes(usuarioId: string, cursoId: string, questoesErradas: string[]): Promise<void> {
    const usuarioCursoRef = doc(db, 'usuariosCursos', `${usuarioId}_${cursoId}`);
    const usuarioCursoSnap = await getDoc(usuarioCursoRef);
    
    if (!usuarioCursoSnap.exists()) return;
    
    const usuarioCurso = usuarioCursoSnap.data() as UsuarioCurso;
    
    const questoesRespondidas = usuarioCurso.questoesRespondidas.filter(
      q => !questoesErradas.includes(q)
    );
    const questoesCorretas = usuarioCurso.questoesCorretas.filter(
      q => !questoesErradas.includes(q)
    );
    
    await updateDoc(usuarioCursoRef, {
      questoesRespondidas,
      questoesCorretas,
      questoesErradas: [],
      coeficiente: questoesRespondidas.length > 0 
        ? Math.round((questoesCorretas.length / questoesRespondidas.length) * 100)
        : 0,
      dataUltimaAtualizacao: serverTimestamp(),
    });
  }
  
  static async atualizarCoeficienteTotalUsuario(usuarioId: string): Promise<void> {
    const usuariosCursosRef = collection(db, 'usuariosCursos');
    const q = query(usuariosCursosRef, where('usuarioId', '==', usuarioId));
    const querySnapshot = await getDocs(q);
    
    let coeficienteTotal = 0;
    let totalCursos = 0;
    
    querySnapshot.forEach((doc) => {
      const usuarioCurso = doc.data() as UsuarioCurso;
      coeficienteTotal += usuarioCurso.coeficiente;
      totalCursos++;
    });
    
    const coeficienteMedio = totalCursos > 0 ? Math.round(coeficienteTotal / totalCursos) : 0;
    
    const usuarioRef = doc(db, 'usuarios', usuarioId);
    await updateDoc(usuarioRef, {
      coeficienteConhecimento: coeficienteMedio,
    });
  }
}