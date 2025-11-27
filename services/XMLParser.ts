import { Curso, PaginaCurso, Questao } from '../model/Curso';

export class XMLParser {
  static async loadCursoFromXML(xmlPath: string): Promise<Curso> {
    try {
      // Em React Native, você carregaria o XML dos assets
      const response = await fetch(xmlPath);
      const xmlText = await response.text();
      
      return this.parseXMLToCurso(xmlText);
    } catch (error) {
      throw new Error('Erro ao carregar arquivo XML do curso');
    }
  }

  static parseXMLToCurso(xmlContent: string): Curso {
    // Parser XML básico para React Native
    const lines = xmlContent.split('\n');
    let curso: Partial<Curso> = {};
    let paginas: PaginaCurso[] = [];
    let paginaAtual: Partial<PaginaCurso> = {};
    let questaoAtual: Partial<Questao> = {};
    let questoes: Questao[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Parse curso attributes
      if (trimmed.includes('<curso')) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        const tituloMatch = trimmed.match(/titulo="([^"]+)"/);
        const categoriaMatch = trimmed.match(/categoria="([^"]+)"/);
        const nivelMatch = trimmed.match(/nivel="([^"]+)"/);
        const coefMatch = trimmed.match(/coeficienteMaximo="([^"]+)"/);
        
        curso.id = idMatch?.[1] || '';
        curso.titulo = tituloMatch?.[1] || '';
        curso.categoria = categoriaMatch?.[1] || '';
        curso.nivel = nivelMatch?.[1] as any || 'iniciante';
        curso.coeficienteMaximo = parseInt(coefMatch?.[1] || '100');
      }
      
      // Parse pagina
      if (trimmed.includes('<pagina')) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        const tipoMatch = trimmed.match(/tipo="([^"]+)"/);
        
        paginaAtual = {
          id: idMatch?.[1] || '',
          tipo: tipoMatch?.[1] as 'conteudo' | 'exercicio' || 'conteudo',
        };
        questoes = [];
      }
      
      // Parse content tags
      if (trimmed.includes('<titulo>')) {
        const content = trimmed.replace(/<\/?titulo>/g, '');
        paginaAtual.titulo = content;
      }
      
      if (trimmed.includes('<conteudo>')) {
        const content = trimmed.replace(/<\/?conteudo>/g, '');
        paginaAtual.conteudo = content;
      }
      
      if (trimmed.includes('<imagem>')) {
        const content = trimmed.replace(/<\/?imagem>/g, '');
        paginaAtual.imagem = content;
      }
      
      // Parse questao
      if (trimmed.includes('<questao')) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        questaoAtual = {
          id: idMatch?.[1] || '',
          alternativas: [],
        };
      }
      
      if (trimmed.includes('<pergunta>')) {
        const content = trimmed.replace(/<\/?pergunta>/g, '');
        questaoAtual.pergunta = content;
      }
      
      if (trimmed.includes('<explicacao>')) {
        const content = trimmed.replace(/<\/?explicacao>/g, '');
        questaoAtual.explicacao = content;
      }
      
      if (trimmed.includes('<alternativa')) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        const corretaMatch = trimmed.match(/correta="([^"]+)"/);
        const content = trimmed.replace(/<alternativa[^>]*>([^<]+)<\/alternativa>/, '$1');
        
        questaoAtual.alternativas?.push({
          id: idMatch?.[1] || '',
          texto: content,
          correta: corretaMatch?.[1] === 'true',
        });
      }
      
      // Close tags
      if (trimmed.includes('</questao>')) {
        questoes.push(questaoAtual as Questao);
        questaoAtual = {};
      }
      
      if (trimmed.includes('</pagina>')) {
        if (paginaAtual.tipo === 'exercicio') {
          paginaAtual.questoes = questoes;
        }
        paginas.push(paginaAtual as PaginaCurso);
        paginaAtual = {};
      }
    }

    return {
      id: curso.id || '',
      titulo: curso.titulo || '',
      descricao: '',
      categoria: curso.categoria || '',
      nivel: curso.nivel || 'iniciante',
      paginas,
      coeficienteMaximo: curso.coeficienteMaximo || 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}