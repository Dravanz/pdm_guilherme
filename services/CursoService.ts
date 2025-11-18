import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/FirebaseInit';
import { Curso, UsuarioCurso, PaginaCurso, Questao } from '../model/Curso';
import { QuestaoService } from './QuestaoService';
import { BadgeService } from './BadgeService';

export class CursoService {
  
  static async carregarCursoXML(cursoId: string): Promise<Curso> {
    try {
      console.log('Carregando XML para curso:', cursoId);
      

      
      const xmlContent = this.obterXMLCurso(cursoId);
      console.log('XML obtido, tamanho:', xmlContent.length);
      
      if (!xmlContent) {
        throw new Error(`XML não encontrado para curso: ${cursoId}`);
      }
      
      await QuestaoService.criarQuestoesIniciais();
      
      const curso = await this.parseXMLCurso(xmlContent);
      console.log('Curso parseado:', curso);
      return curso;
    } catch (error) {
      console.error('Erro no carregarCursoXML:', error);
      throw new Error(`Erro ao carregar curso ${cursoId}: ${error}`);
    }
  }
  
  static obterXMLCurso(cursoId: string): string {
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
  
  <pagina id="2" tipo="conteudo">
    <titulo>Variáveis e Operadores</titulo>
    <imagem>https://via.placeholder.com/300x200/ffc107/000000?text=Variables</imagem>
    <conteudo>
      Antes de praticar, vamos entender os conceitos básicos:
      
      VARIÁVEIS:
      • var: escopo de função
      • let: escopo de bloco
      • const: valor constante
      
      OPERADORES:
      • Aritméticos: +, -, *, /, %
      • Comparação: ==, ===, !=, !==
      • Lógicos: &&, ||, !
      
      Agora você está pronto para os exercícios!
    </conteudo>
  </pagina>
  
  <pagina id="3" tipo="exercicio">
    <titulo>Exercícios - Conceitos Básicos</titulo>
    <questao-ref id="js_var_001" />
    <questao-ref id="js_op_001" />
  </pagina>
  
  <pagina id="4" tipo="conteudo">
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
      
      As funções podem ser chamadas quantas vezes necessário e são fundamentais para organizar o código.
    </conteudo>
  </pagina>
  
  <pagina id="5" tipo="exercicio">
    <titulo>Exercícios - Funções</titulo>
    <questao-ref id="js_func_001" />
  </pagina>
</curso>`,
      
      'python-basico': `<?xml version="1.0" encoding="UTF-8"?>
<curso id="python-basico" titulo="Python Básico" categoria="programacao" nivel="iniciante" coeficienteMaximo="100">
  <pagina id="1" tipo="conteudo">
    <titulo>Introdução ao Python</titulo>
    <imagem>https://via.placeholder.com/300x200/3776ab/ffffff?text=Python</imagem>
    <conteudo>
      Python é uma linguagem de programação de alto nível, interpretada e de propósito geral.
      
      Características principais:
      • Sintaxe simples e legível
      • Tipagem dinâmica
      • Interpretada
      • Multiplataforma
      
      Python é amplamente usado em ciência de dados, desenvolvimento web e automação.
    </conteudo>
  </pagina>
  
  <pagina id="2" tipo="conteudo">
    <titulo>Variáveis e Listas em Python</titulo>
    <imagem>https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Variables</imagem>
    <conteudo>
      Antes dos exercícios, vamos revisar os conceitos:
      
      VARIÁVEIS:
      • Não precisam ser declaradas
      • Tipagem dinâmica
      • Exemplo: nome = "Python"
      
      LISTAS:
      • Coleção ordenada de itens
      • Mutáveis (podem ser alteradas)
      • Exemplo: numeros = [1, 2, 3, 4]
      • Métodos: append(), remove(), len()
      
      Agora pratique com os exercícios!
    </conteudo>
  </pagina>
  
  <pagina id="3" tipo="exercicio">
    <titulo>Exercícios - Conceitos Básicos</titulo>
    <questao-ref id="py_var_001" />
    <questao-ref id="py_list_001" />
  </pagina>
  
  <pagina id="4" tipo="conteudo">
    <titulo>Estruturas de Controle</titulo>
    <imagem>https://via.placeholder.com/300x200/ffde57/000000?text=Control</imagem>
    <conteudo>
      Python oferece estruturas de controle simples e poderosas.
      
      Exemplo de if:
      if idade >= 18:
          print("Maior de idade")
      else:
          print("Menor de idade")
      
      Exemplo de for:
      for i in range(5):
          print(i)
      
      A indentação é fundamental em Python para definir blocos de código.
    </conteudo>
  </pagina>
</curso>`,
      
      'react-basico': `<?xml version="1.0" encoding="UTF-8"?>
<curso id="react-basico" titulo="React Básico" categoria="frontend" nivel="intermediario" coeficienteMaximo="100">
  <pagina id="1" tipo="conteudo">
    <titulo>Introdução ao React</titulo>
    <imagem>https://via.placeholder.com/300x200/61dafb/000000?text=React</imagem>
    <conteudo>
      React é uma biblioteca JavaScript para construir interfaces de usuário.
      
      Características principais:
      • Baseado em componentes
      • Virtual DOM
      • Unidirecional data flow
      • JSX
      
      React facilita a criação de UIs interativas e reutilizáveis.
    </conteudo>
  </pagina>
  
  <pagina id="2" tipo="conteudo">
    <titulo>Componentes e State</titulo>
    <imagem>https://via.placeholder.com/300x200/4caf50/ffffff?text=Components</imagem>
    <conteudo>
      Antes dos exercícios, vamos revisar os conceitos:
      
      COMPONENTES:
      • Funções que retornam JSX
      • Reutilizáveis e modulares
      • Exemplo: function Button() { return <button>Click</button>; }
      
      STATE:
      • Dados que podem mudar ao longo do tempo
      • Usado com useState hook
      • Exemplo: const [count, setCount] = useState(0);
      
      JSX permite escrever HTML dentro do JavaScript!
    </conteudo>
  </pagina>
  
  <pagina id="3" tipo="exercicio">
    <titulo>Exercícios - Componentes</titulo>
    <questao-ref id="react_comp_001" />
    <questao-ref id="react_state_001" />
  </pagina>
  
  <pagina id="4" tipo="conteudo">
    <titulo>Hooks no React</titulo>
    <imagem>https://via.placeholder.com/300x200/282c34/61dafb?text=Hooks</imagem>
    <conteudo>
      Hooks permitem usar state e outros recursos do React em componentes funcionais.
      
      useState:
      const [count, setCount] = useState(0);
      
      useEffect:
      useEffect(() => {
        document.title = \`Count: \${count}\`;
      }, [count]);
      
      Hooks tornam os componentes mais simples e reutilizáveis.
    </conteudo>
  </pagina>
</curso>`
    };
    
    return xmls[cursoId] || '';
  }
  
  static obterXMLCursoPython(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<curso id="python-basico" titulo="Python Básico" categoria="programacao" nivel="iniciante" coeficienteMaximo="100">
  <pagina id="1" tipo="conteudo">
    <titulo>Introdução ao Python</titulo>
    <imagem>https://via.placeholder.com/300x200/3776ab/ffffff?text=Python</imagem>
    <conteudo>
      Python é uma linguagem de programação de alto nível, interpretada e de propósito geral.
      
      Características principais:
      • Sintaxe simples e legível
      • Tipagem dinâmica
      • Interpretada
      • Multiplataforma
      
      Python é amplamente usado em ciência de dados, desenvolvimento web e automação.
    </conteudo>
  </pagina>
  
  <pagina id="2" tipo="exercicio">
    <titulo>Exercícios - Conceitos Básicos</titulo>
    <questao-ref id="py_var_001" />
    <questao-ref id="py_list_001" />
  </pagina>
  
  <pagina id="3" tipo="conteudo">
    <titulo>Estruturas de Controle</titulo>
    <imagem>https://via.placeholder.com/300x200/ffde57/000000?text=Control</imagem>
    <conteudo>
      Python oferece estruturas de controle simples e poderosas.
      
      Exemplo de if:
      if idade >= 18:
          print("Maior de idade")
      else:
          print("Menor de idade")
      
      Exemplo de for:
      for i in range(5):
          print(i)
    </conteudo>
  </pagina>
</curso>`;
  }
  
  static obterXMLCursoReact(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<curso id="react-basico" titulo="React Básico" categoria="frontend" nivel="intermediario" coeficienteMaximo="100">
  <pagina id="1" tipo="conteudo">
    <titulo>Introdução ao React</titulo>
    <imagem>https://via.placeholder.com/300x200/61dafb/000000?text=React</imagem>
    <conteudo>
      React é uma biblioteca JavaScript para construir interfaces de usuário.
      
      Características principais:
      • Baseado em componentes
      • Virtual DOM
      • Unidirecional data flow
      • JSX
      
      React facilita a criação de UIs interativas e reutilizáveis.
    </conteudo>
  </pagina>
  
  <pagina id="2" tipo="exercicio">
    <titulo>Exercícios - Componentes</titulo>
    <questao-ref id="react_comp_001" />
    <questao-ref id="react_state_001" />
  </pagina>
  
  <pagina id="3" tipo="conteudo">
    <titulo>Hooks no React</titulo>
    <imagem>https://via.placeholder.com/300x200/282c34/61dafb?text=Hooks</imagem>
    <conteudo>
      Hooks permitem usar state e outros recursos do React em componentes funcionais.
      
      useState:
      const [count, setCount] = useState(0);
      
      useEffect:
      useEffect(() => {
        document.title = \`Count: \${count}\`;
      }, [count]);
      
      Hooks tornam os componentes mais simples e reutilizáveis.
    </conteudo>
  </pagina>
</curso>`;
  }
  
  static async parseXMLCurso(xmlContent: string): Promise<Curso> {
    console.log('Iniciando parse do XML com banco de questões');
    
    const lines = xmlContent.split('\n');
    let curso: any = {};
    let paginas: PaginaCurso[] = [];
    let paginaAtual: any = {};
    let questaoRefs: string[] = [];
    let conteudoBuffer = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes('<curso')) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        const tituloMatch = trimmed.match(/titulo="([^"]+)"/);
        const categoriaMatch = trimmed.match(/categoria="([^"]+)"/);
        const nivelMatch = trimmed.match(/nivel="([^"]+)"/);
        const coefMatch = trimmed.match(/coeficienteMaximo="([^"]+)"/);
        
        curso = {
          id: idMatch?.[1] || '',
          titulo: tituloMatch?.[1] || '',
          categoria: categoriaMatch?.[1] || '',
          nivel: nivelMatch?.[1] || 'iniciante',
          coeficienteMaximo: parseInt(coefMatch?.[1] || '100'),
          descricao: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      if (trimmed.includes('<pagina')) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        const tipoMatch = trimmed.match(/tipo="([^"]+)"/);
        
        paginaAtual = {
          id: idMatch?.[1] || '',
          tipo: tipoMatch?.[1] || 'conteudo',
        };
        questaoRefs = [];
        conteudoBuffer = '';
      }
      
      if (trimmed.includes('<titulo>') && trimmed.includes('</titulo>')) {
        paginaAtual.titulo = trimmed.replace(/<\/?titulo>/g, '');
      }
      
      if (trimmed.includes('<conteudo>')) {
        conteudoBuffer = trimmed.replace('<conteudo>', '');
      } else if (trimmed.includes('</conteudo>')) {
        conteudoBuffer += trimmed.replace('</conteudo>', '');
        paginaAtual.conteudo = conteudoBuffer.trim();
      } else if (conteudoBuffer && !trimmed.includes('<') && !trimmed.includes('>')) {
        conteudoBuffer += '\n' + trimmed;
      }
      
      if (trimmed.includes('<imagem>') && trimmed.includes('</imagem>')) {
        paginaAtual.imagem = trimmed.replace(/<\/?imagem>/g, '');
      }
      
      if (trimmed.includes('<questao-ref')) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        if (idMatch) {
          questaoRefs.push(idMatch[1]);
        }
      }
      
      if (trimmed.includes('</pagina>')) {
        if (paginaAtual.tipo === 'exercicio' && questaoRefs.length > 0) {
          console.log('Carregando questões do Firestore:', questaoRefs);
          const questoes = await QuestaoService.obterMultiplasQuestoes(questaoRefs);
          console.log('Questões carregadas:', questoes);
          paginaAtual.questoes = questoes;
        }
        paginas.push(paginaAtual);
      }
    }

    const cursoFinal = { ...curso, paginas };
    console.log('Curso parseado com sucesso:', cursoFinal);
    return cursoFinal;
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
      const usuarioCursoRef = doc(firestore, 'usuariosCursos', usuarioCurso.id);
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
      const usuarioCursoRef = doc(firestore, 'usuariosCursos', `${usuarioId}_${cursoId}`);
      const usuarioCursoSnap = await getDoc(usuarioCursoRef);
      
      if (usuarioCursoSnap.exists()) {
        return usuarioCursoSnap.data() as UsuarioCurso;
      }
    } catch (error) {
      console.log('Erro ao buscar progresso no Firebase:', error);
    }
    
    return null;
  }
  
  static async verificarCursoConcluido(usuarioId: string, cursoId: string): Promise<boolean> {
    const progresso = await this.obterProgressoCurso(usuarioId, cursoId);
    return progresso?.concluido || false;
  }
  
  static async salvarProgresso(usuarioCurso: UsuarioCurso): Promise<void> {
    try {
      const usuarioCursoRef = doc(firestore, 'usuariosCursos', usuarioCurso.id);
      await setDoc(usuarioCursoRef, {
        ...usuarioCurso,
        dataUltimaAtualizacao: serverTimestamp(),
      }, { merge: true });
      
      await this.atualizarCoeficienteTotalUsuario(usuarioCurso.usuarioId);
    } catch (error) {
      console.log('Erro ao salvar progresso no Firebase:', error);
    }
  }
  
  static async verificarConclusaoCurso(
    usuarioCurso: UsuarioCurso,
    curso: Curso
  ): Promise<{ podeCompletar: boolean; questoesErradas: string[]; percentualAcerto: number; novasBadges?: any[] }> {
    const totalQuestoes = curso.paginas
      .filter(p => p.tipo === 'exercicio')
      .reduce((total, p) => total + (p.questoes?.length || 0), 0);
    
    const percentualAcerto = totalQuestoes > 0 
      ? (usuarioCurso.questoesCorretas.length / totalQuestoes) * 100 
      : 0;
    const podeCompletar = percentualAcerto >= 70;
    
    let novasBadges = [];
    
    if (podeCompletar) {
      // Marcar curso como concluído
      await this.marcarCursoConcluido(usuarioCurso);
      
      // Verificar e conceder badges
      novasBadges = await BadgeService.verificarEConcederBadges(usuarioCurso.usuarioId, curso.id);
    }
    
    return {
      podeCompletar,
      questoesErradas: usuarioCurso.questoesErradas || [],
      percentualAcerto: Math.round(percentualAcerto),
      novasBadges,
    };
  }
  
  static async marcarCursoConcluido(usuarioCurso: UsuarioCurso): Promise<void> {
    try {
      const usuarioCursoRef = doc(firestore, 'usuariosCursos', usuarioCurso.id);
      await updateDoc(usuarioCursoRef, {
        concluido: true,
        dataUltimaAtualizacao: serverTimestamp(),
      });
    } catch (error) {
      console.log('Erro ao marcar curso como concluído:', error);
    }
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
  
  static async atualizarCoeficienteTotalUsuario(usuarioId: string): Promise<void> {
    const usuariosCursosRef = collection(firestore, 'usuariosCursos');
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
    
    const usuarioRef = doc(firestore, 'usuarios', usuarioId);
    await updateDoc(usuarioRef, {
      coeficienteConhecimento: coeficienteMedio,
    });
  }
}