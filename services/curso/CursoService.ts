import { Asset } from "expo-asset";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { CourseConfig } from "../../config/CourseConfig";
import { firestore, storage } from "../../firebase/FirebaseInit";
import { CasoTeste, Curso, LinguagemCodigo, PaginaCurso, QuestaoEscrita, UsuarioCurso } from "../../model/Curso";
import { BadgeService } from "../badge/BadgeService";
import { ImageUploadService } from "../image/ImageUploadService";
import { QuestaoService } from "../questao/QuestaoService";
import { DecayService } from "../shared/DecayService";
import { TentativaService } from "../shared/TentativaService";
import { QuestionAnalyticsService } from "../questao/QuestionAnalyticsService";

// Helpers para decodificar entidades XML
function unescapeXML(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}

function unescapeXMLAttr(str: string): string {
    return unescapeXML(str);
}

export class CursoService {
  /**
   * Lista todos os cursos disponíveis do Firestore
   */
  static async listarCursos(): Promise<Curso[]> {
    try {
      // Buscar cursos do Firestore (incluindo os migrados)
      const cursosRef = collection(firestore, "cursos");
      const cursosSnapshot = await getDocs(cursosRef);
      const cursosFirestore = cursosSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          ...data,
          fonte: data.migradoDeLocal ? "xml" : ("firestore" as const),
        } as any;
      }) as Curso[];

      // Filtrar cursos: Aprovados ou sem status (legado)
      return cursosFirestore.filter(c => !c.status || c.status === "Aprovado");

    } catch (error) {
      console.error("Erro ao listar cursos:", error);
      return [];
    }
  }

  /**
   * Obtém um curso pelo ID, carregando do XML se necessário
   */
  static async obterCursoPorId(cursoId: string): Promise<Curso | null> {
    try {
      // Tentar carregar como XML primeiro (já que nossa estrutura principal é XML)
      // Se falhar, tenta buscar do Firestore direto se tivermos cursos puramente Firestore no futuro
      return await this.carregarCursoXML(cursoId);
    } catch (error) {
      console.error(`Erro ao obter curso ${cursoId}:`, error);
      // Fallback: tentar buscar apenas no Firestore se o XML falhar
      const cursoFirestore = await this.buscarCursoFirestore(cursoId);
      if (cursoFirestore) {
        return cursoFirestore as Curso;
      }
      return null;
    }
  }

  static async carregarCursoXML(
    cursoId: string,
    userPhotoUrl?: string
  ): Promise<Curso> {
    try {
      // Tentar carregar de ambas as fontes
      const xmlContent = await this.obterXMLCurso(cursoId, userPhotoUrl);

      if (!xmlContent) {
        throw new Error(`XML não encontrado para curso: ${cursoId}`);
      }

      await QuestaoService.inicializarQuestoesDoCurso(cursoId);

      const curso = await this.parseXMLCurso(xmlContent);

      // Se for curso do Firestore, adicionar metadados adicionais
      try {
        const cursoFirestore = await this.buscarCursoFirestore(cursoId);
        if (cursoFirestore) {
          console.log(`[CursoService] Merging Firestore data. Firestore has pages? ${!!cursoFirestore.paginas}`);
          return {
            ...curso,
            ...cursoFirestore, // Merge all Firestore fields
            // GARANTIR QUE PAGINAS DO XML PREVALECEM
            paginas: curso.paginas && curso.paginas.length > 0 ? curso.paginas : (cursoFirestore.paginas || []),
            imageUrl: cursoFirestore.imageUrl || curso.imageUrl || "",
            createdAt: cursoFirestore.createdAt,
            updatedAt: cursoFirestore.updatedAt,
          };
        }
      } catch (e) {
        // Ignorar se não estiver no Firestore (curso XML estático)
      }

      return curso;
    } catch (error) {
      console.error("Erro no carregarCursoXML:", error);
      throw new Error(`Erro ao carregar curso ${cursoId}: ${error}`);
    }
  }

  /**
   * Busca metadados do curso no Firestore
   */
  private static async buscarCursoFirestore(cursoId: string): Promise<any> {
    const cursoRef = doc(firestore, "cursos", cursoId);
    const cursoSnap = await getDoc(cursoRef);
    return cursoSnap.exists() ? cursoSnap.data() : null;
  }

  static async obterXMLCurso(
    cursoId: string,
    userPhotoUrl?: string
  ): Promise<string> {
    try {
      // 1. Tentar carregar XML do Storage (cursos criados por colaboradores)
      try {
        const storageRef = ref(storage, `courses/${cursoId}.xml`);
        const downloadURL = await getDownloadURL(storageRef);
        const response = await fetch(downloadURL);
        let xmlContent = await response.text();

        // Substituir placeholders de imagem
        const storageImages: { [key: string]: string } = {
          "javascript-intro":
            (await ImageUploadService.getImageUrl("javascript-intro.jpg")) ||
            userPhotoUrl ||
            "",
          "javascript-variables":
            (await ImageUploadService.getImageUrl(
              "javascript-variables.jpg"
            )) ||
            userPhotoUrl ||
            "",
          "python-intro":
            (await ImageUploadService.getImageUrl("python-intro.jpg")) ||
            userPhotoUrl ||
            "",
          "python-syntax":
            (await ImageUploadService.getImageUrl("python-syntax.jpg")) ||
            userPhotoUrl ||
            "",
          "react-intro":
            (await ImageUploadService.getImageUrl("react-intro.jpg")) ||
            userPhotoUrl ||
            "",
          "react-components":
            (await ImageUploadService.getImageUrl("react-components.jpg")) ||
            userPhotoUrl ||
            "",
        };

        Object.keys(storageImages).forEach((key) => {
          xmlContent = xmlContent.replace(
            new RegExp(`{{${key}}}`, "g"),
            storageImages[key as keyof typeof storageImages]
          );
        });

        return xmlContent;
      } catch (storageError) {
        // Se não encontrar no Storage, tentar carregar do arquivo local
        console.log("XML não encontrado no Storage, tentando arquivo local...");
      }

      // 2. Carregar XML do arquivo local (cursos estáticos)
      let xmlContent = await this.carregarXMLDoArquivo(cursoId);

      // Obter URLs das imagens do Firebase Storage
      const storageImages: { [key: string]: string } = {
        "javascript-intro":
          (await ImageUploadService.getImageUrl("javascript-intro.jpg")) ||
          userPhotoUrl ||
          "",
        "javascript-variables":
          (await ImageUploadService.getImageUrl("javascript-variables.jpg")) ||
          userPhotoUrl ||
          "",
        "python-intro":
          (await ImageUploadService.getImageUrl("python-intro.jpg")) ||
          userPhotoUrl ||
          "",
        "python-syntax":
          (await ImageUploadService.getImageUrl("python-syntax.jpg")) ||
          userPhotoUrl ||
          "",
        "react-intro":
          (await ImageUploadService.getImageUrl("react-intro.jpg")) ||
          userPhotoUrl ||
          "",
        "react-components":
          (await ImageUploadService.getImageUrl("react-components.jpg")) ||
          userPhotoUrl ||
          "",
      };

      // Substituir placeholders de imagem
      Object.keys(storageImages).forEach((key) => {
        xmlContent = xmlContent.replace(
          new RegExp(`{{${key}}}`, "g"),
          storageImages[key as keyof typeof storageImages]
        );
      });

      return xmlContent;
    } catch (error) {
      console.error("Erro ao carregar XML:", error);
      return this.obterXMLCursoFallback(cursoId, userPhotoUrl);
    }
  }

  private static async carregarXMLDoArquivo(cursoId: string): Promise<string> {
    const xmlFiles: { [key: string]: any } = {
      "javascript-basico": require("../../assets/courses/javascript-basico.xml"),
      "python-basico": require("../../assets/courses/python-basico.xml"),
      "react-basico": require("../../assets/courses/react-basico.xml"),
    };

    const xmlAsset = xmlFiles[cursoId as keyof typeof xmlFiles];
    if (!xmlAsset) {
      throw new Error(`XML não encontrado para curso: ${cursoId}`);
    }

    const asset = Asset.fromModule(xmlAsset);
    await asset.downloadAsync();

    const response = await fetch(asset.localUri || asset.uri);
    return await response.text();
  }

  private static obterXMLCursoFallback(
    cursoId: string,
    userPhotoUrl?: string
  ): string {
    return "";
  }

  static async uploadCourseImagesAndUpdateXML(): Promise<void> {
    try {
      const uploadedImages = await ImageUploadService.uploadCourseImages();
    } catch (error) {
      console.error("Erro ao fazer upload das imagens:", error);
    }
  }

  static async parseXMLCurso(xmlContent: string): Promise<Curso> {
    console.log(`[CursoService] Parsing XML (Regex). Length: ${xmlContent.length}`);
    
    // 1. Extrair metadados do curso
    const cursoMatch = xmlContent.match(/<curso\s+id="([^"]*)"\s+titulo="([^"]*)"\s+categoria="([^"]*)"\s+nivel="([^"]*)"(?:\s+coeficienteMaximo="([^"]*)")?/i);
    
    let curso: any = {};
    if (cursoMatch) {
        curso = {
            id: cursoMatch[1] || "",
            titulo: cursoMatch[2] || "",
            categoria: cursoMatch[3] || "",
            nivel: cursoMatch[4] || "iniciante",
            coeficienteMaximo: parseInt(cursoMatch[5] || "100"),
            descricao: "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    } else {
        console.warn("[CursoService] Failed to match <curso> tag metadata");
        // Fallback or empty init
         curso = {
            id: "",
            titulo: "Curso Desconhecido",
            categoria: "Geral",
            nivel: "iniciante",
            coeficienteMaximo: 100,
            descricao: "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }

    // 2. Extrair Páginas
    // Regex global para capturar todas as páginas
    // flags: g (global), i (case insensitive), s (dotAll - mas no JS . não casa newline, felizmente [\s\S] resolve)
    const pageRegex = /<pagina\s+id="([^"]*)"\s+tipo="([^"]*)"\s*>([\s\S]*?)<\/pagina>/gi;
    let match;
    const paginas: PaginaCurso[] = [];

    while ((match = pageRegex.exec(xmlContent)) !== null) {
        const paginaId = match[1];
        const paginaTipo = match[2] as "conteudo" | "exercicio" | "exercicio_codigo";
        const paginaBody = match[3];

        const novaPagina: PaginaCurso = {
            id: paginaId,
            tipo: paginaTipo,
            titulo: "",
            conteudo: "",
        };

        // Extrair Título
        const tituloMatch = paginaBody.match(/<titulo>([\s\S]*?)<\/titulo>/i);
        if (tituloMatch) novaPagina.titulo = tituloMatch[1].trim();

        // Extrair Conteúdo
        const conteudoMatch = paginaBody.match(/<conteudo>([\s\S]*?)<\/conteudo>/i);
        if (conteudoMatch) novaPagina.conteudo = conteudoMatch[1].trim();

        // Extrair Imagem
        const imagemMatch = paginaBody.match(/<imagem>([\s\S]*?)<\/imagem>/i);
        if (imagemMatch) novaPagina.imagem = imagemMatch[1].trim();

        // Extrair Questões (Refs) - para exercicio de múltipla escolha
        if (paginaTipo === "exercicio") {
            const questaoRefRegex = /<questao-ref\s+id="([^"]*)"/gi;
            const questaoRefs: string[] = [];
            let qMatch;
            while ((qMatch = questaoRefRegex.exec(paginaBody)) !== null) {
                questaoRefs.push(qMatch[1]);
            }

            if (questaoRefs.length > 0) {
                 const questoes = await QuestaoService.obterMultiplasQuestoes(questaoRefs);
                 novaPagina.questoes = questoes;
            }
        }

        // Extrair Questões de Código - para exercicio_codigo
        if (paginaTipo === "exercicio_codigo") {
            const questoesEscrita: QuestaoEscrita[] = [];
            const qeRegex = /<questao-escrita\s+id="([^"]*)"\s+linguagem="([^"]*)"\s*>([\s\S]*?)<\/questao-escrita>/gi;
            let qeMatch;

            while ((qeMatch = qeRegex.exec(paginaBody)) !== null) {
                const qeId = qeMatch[1];
                const qeLinguagem = qeMatch[2] as LinguagemCodigo;
                const qeBody = qeMatch[3];

                // Extrair campos da questão de código
                const enunciadoMatch = qeBody.match(/<enunciado>([\s\S]*?)<\/enunciado>/i);
                const codigoBaseMatch = qeBody.match(/<codigo-base>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/codigo-base>/i);
                const gabaritoMatch = qeBody.match(/<gabarito>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/gabarito>/i);
                const dicaMatch = qeBody.match(/<dica>([\s\S]*?)<\/dica>/i);
                const explicacaoMatch = qeBody.match(/<explicacao>([\s\S]*?)<\/explicacao>/i);

                // Extrair casos de teste
                const casosTeste: CasoTeste[] = [];
                const ctRegex = /<caso-teste\s+id="([^"]*)"(?:\s+descricao="([^"]*)")?\s*>([\s\S]*?)<\/caso-teste>/gi;
                let ctMatch;
                while ((ctMatch = ctRegex.exec(qeBody)) !== null) {
                    const ctId = ctMatch[1];
                    const ctDescricao = ctMatch[2] || "";
                    const ctBody = ctMatch[3];

                    const entradaMatch = ctBody.match(/<entrada>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/entrada>/i);
                    const saidaMatch = ctBody.match(/<saida-esperada>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/saida-esperada>/i);

                    casosTeste.push({
                        id: ctId,
                        entrada: entradaMatch ? entradaMatch[1].trim() : "",
                        saidaEsperada: saidaMatch ? saidaMatch[1].trim() : "",
                        descricao: ctDescricao ? unescapeXMLAttr(ctDescricao) : undefined,
                    });
                }

                questoesEscrita.push({
                    id: qeId,
                    enunciado: enunciadoMatch ? unescapeXML(enunciadoMatch[1].trim()) : "",
                    linguagem: qeLinguagem,
                    codigoBase: codigoBaseMatch ? codigoBaseMatch[1] : "",
                    gabarito: gabaritoMatch ? gabaritoMatch[1] : "",
                    casosTeste,
                    dica: dicaMatch ? unescapeXML(dicaMatch[1].trim()) : undefined,
                    explicacao: explicacaoMatch ? unescapeXML(explicacaoMatch[1].trim()) : "",
                });
            }

            novaPagina.questoesEscrita = questoesEscrita;
        }

        paginas.push(novaPagina);
    }

    console.log(`[CursoService] Parsed ${paginas.length} pages.`);
    
    const cursoFinal = { ...curso, paginas };
    return cursoFinal;
  }

  static async iniciarCurso(
    usuarioId: string,
    cursoId: string
  ): Promise<UsuarioCurso> {
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
      tentativasPorQuestao: {},
    };

    try {
      const usuarioCursoRef = doc(firestore, "usuariosCursos", usuarioCurso.id);
      await setDoc(usuarioCursoRef, {
        ...usuarioCurso,
        dataInicio: serverTimestamp(),
        dataUltimaAtualizacao: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
    }

    return usuarioCurso;
  }

  static async obterProgressoCurso(
    usuarioId: string,
    cursoId: string
  ): Promise<UsuarioCurso | null> {
    try {
      const usuarioCursoRef = doc(
        firestore,
        "usuariosCursos",
        `${usuarioId}_${cursoId}`
      );
      const usuarioCursoSnap = await getDoc(usuarioCursoRef);

      if (usuarioCursoSnap.exists()) {
        return usuarioCursoSnap.data() as UsuarioCurso;
      }
    } catch (error) {
      console.error("Erro ao buscar progresso no Firebase:", error);
    }

    return null;
  }

  static async verificarCursoConcluido(
    usuarioId: string,
    cursoId: string
  ): Promise<boolean> {
    const progresso = await this.obterProgressoCurso(usuarioId, cursoId);
    return progresso?.concluido || false;
  }

  static async salvarProgresso(usuarioCurso: UsuarioCurso): Promise<void> {
    try {
      const usuarioCursoRef = doc(firestore, "usuariosCursos", usuarioCurso.id);
      await setDoc(
        usuarioCursoRef,
        {
          ...usuarioCurso,
          dataUltimaAtualizacao: serverTimestamp(),
        },
        { merge: true }
      );

      await this.atualizarCoeficienteTotalUsuario(usuarioCurso.usuarioId);
    } catch (error) {
      console.error("Erro ao salvar progresso no Firebase:", error);
    }
  }

  static async verificarConclusaoCurso(
    usuarioCurso: UsuarioCurso,
    curso: Curso
  ): Promise<{
    podeCompletar: boolean;
    questoesErradas: string[];
    percentualAcerto: number;
    novasBadges?: any[];
  }> {
    const totalQuestoes = curso.paginas
      .filter((p) => p.tipo === "exercicio" || p.tipo === "exercicio_codigo")
      .reduce((total, p) => total + (p.questoes?.length || 0) + (p.questoesEscrita?.length || 0), 0);

    const percentualAcerto =
      totalQuestoes > 0
        ? (usuarioCurso.questoesCorretas.length / totalQuestoes) * 100
        : 0;
    const podeCompletar = percentualAcerto >= 70;

    let novasBadges: any[] = [];

    if (podeCompletar) {
      // Marcar curso como concluído
      await this.marcarCursoConcluido(usuarioCurso);

      // Verificar e conceder badges (usar usuarioCurso.cursoId que é o ID correto do Firestore)
      novasBadges = await BadgeService.verificarEConcederBadges(
        usuarioCurso.usuarioId,
        usuarioCurso.cursoId
      );
    }

    return {
      podeCompletar,
      questoesErradas: usuarioCurso.questoesErradas || [],
      percentualAcerto: Math.round(percentualAcerto),
      novasBadges,
    };
  }

  static async registrarResposta(
    usuarioCurso: UsuarioCurso,
    questaoId: string,
    correta: boolean,
    tags: string[] = []
  ): Promise<{ novoCoeficiente: number; usuarioCursoAtualizado: UsuarioCurso }> {
    // 1. Atualizar contagem de tentativas
    const tentativasAtuais = usuarioCurso.tentativasPorQuestao?.[questaoId] || 0;
    const novasTentativas = tentativasAtuais + 1;
    
    const tentativasPorQuestao = {
      ...(usuarioCurso.tentativasPorQuestao || {}),
      [questaoId]: novasTentativas,
    };

    // 2. Registrar tentativa no histórico
    await TentativaService.registrarTentativa({
      usuarioId: usuarioCurso.usuarioId,
      cursoId: usuarioCurso.cursoId,
      questaoId,
      respostaUsuario: "", // Idealmente passaríamos a resposta aqui
      correta,
      tags,
    });

    // 2.5 Atualizar analytics IRT da questão (não bloqueia fluxo principal)
    QuestionAnalyticsService.atualizarAnalytics(
      usuarioCurso.cursoId,
      questaoId,
      usuarioCurso.usuarioId,
      correta,
      usuarioCurso.coeficiente
    ).catch((err) =>
      console.warn("[IRT] Falha ao atualizar analytics:", err)
    );

    // 3. Atualizar listas de questões
    let questoesRespondidas = [...usuarioCurso.questoesRespondidas];
    if (!questoesRespondidas.includes(questaoId)) {
      questoesRespondidas.push(questaoId);
    }

    let questoesCorretas = [...usuarioCurso.questoesCorretas];
    if (correta && !questoesCorretas.includes(questaoId)) {
      questoesCorretas.push(questaoId);
    }

    let questoesErradas = [...(usuarioCurso.questoesErradas || [])];
    if (!correta && !questoesErradas.includes(questaoId)) {
      questoesErradas.push(questaoId);
    } else if (correta) {
      // Se acertou, remove dos erros (opcional, dependendo da lógica desejada)
      // questoesErradas = questoesErradas.filter(q => q !== questaoId);
    }

    // 4. Calcular novo coeficiente com decaimento
    let pontuacaoTotal = 0;
    const totalQuestoesRespondidas = questoesRespondidas.length;

    questoesCorretas.forEach((qId) => {
      const tentativas = tentativasPorQuestao[qId] || 1;
      pontuacaoTotal += DecayService.calcularPontuacaoComDecaimento(tentativas);
    });

    // Coeficiente é a média da pontuação das questões respondidas
    // (ou poderia ser sobre o total do curso, mas mantendo a lógica anterior de progresso)
    const novoCoeficiente =
      totalQuestoesRespondidas > 0
        ? Math.round(pontuacaoTotal / totalQuestoesRespondidas)
        : 0;

    const novoUsuarioCurso: UsuarioCurso = {
      ...usuarioCurso,
      questoesRespondidas,
      questoesCorretas,
      questoesErradas,
      tentativasPorQuestao,
      coeficiente: novoCoeficiente,
      dataUltimaAtualizacao: new Date(), // Será convertido para Timestamp ao salvar
    };

    await this.salvarProgresso(novoUsuarioCurso);

    return {
      novoCoeficiente,
      usuarioCursoAtualizado: novoUsuarioCurso,
    };
  }

  static async marcarCursoConcluido(usuarioCurso: UsuarioCurso): Promise<void> {
    try {
      const usuarioCursoRef = doc(firestore, "usuariosCursos", usuarioCurso.id);
      await updateDoc(usuarioCursoRef, {
        concluido: true,
        dataUltimaAtualizacao: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao marcar curso como concluído:", error);
    }
  }

  static reiniciarQuestoes(
    usuarioCurso: UsuarioCurso,
    questoesErradas: string[]
  ): UsuarioCurso {
    const questoesRespondidas = usuarioCurso.questoesRespondidas.filter(
      (q) => !questoesErradas.includes(q)
    );
    const questoesCorretas = usuarioCurso.questoesCorretas.filter(
      (q) => !questoesErradas.includes(q)
    );

    return {
      ...usuarioCurso,
      questoesRespondidas,
      questoesCorretas,
      questoesErradas: [],
      coeficiente:
        questoesRespondidas.length > 0
          ? Math.round(
              (questoesCorretas.length / questoesRespondidas.length) * 100
            )
          : 0,
    };
  }

  static async atualizarCoeficienteTotalUsuario(
    usuarioId: string
  ): Promise<void> {
    try {
      // Obter total de questões dinamicamente
      const totalQuestoesSistema = CourseConfig.getTotalQuestions();

      // Buscar progresso do usuário em todos os cursos
      const usuariosCursosRef = collection(firestore, "usuariosCursos");
      const q = query(usuariosCursosRef, where("usuarioId", "==", usuarioId));
      const querySnapshot = await getDocs(q);

      let questoesCorretasTotal = 0;

      // Para cada curso que o usuário fez, verificar se o curso ainda existe e se é APROVADO
      // Isso evita que cursos excluídos ou em rascunho contem pontos
      for (const docSnapshot of querySnapshot.docs) {
        const usuarioCurso = docSnapshot.data() as UsuarioCurso;
        const cursoId = usuarioCurso.cursoId;

        // Se o curso for um dos hardcoded (XML), assumimos que é válido e aprovado por padrão
        // (A menos que queiramos verificar se ele foi desativado, mas XMLs base são fixos)
        const isHardcoded = ["javascript-basico", "python-basico", "react-basico"].includes(cursoId);
        
        if (isHardcoded) {
             questoesCorretasTotal += usuarioCurso.questoesCorretas.length;
        } else {
             // Verificar status no Firestore
             try {
                const cursoRef = doc(firestore, "cursos", cursoId);
                const cursoSnap = await getDoc(cursoRef);

                if (cursoSnap.exists()) {
                    const cursoData = cursoSnap.data();
                    // Apenas somar se Status for Aprovado (ou undefined/null que seria legado, mas ideal ser estrito)
                    // Assumindo que cursos legados sem status contam, mas novos rascunhos não.
                    // Para segurança: Status tem que ser explicitamente 'Aprovado' ou não ter status (legado)
                    if (cursoData.status === "Aprovado" || !cursoData.status) {
                        questoesCorretasTotal += usuarioCurso.questoesCorretas.length;
                    } 
                } else {
                    // Curso não existe mais (excluído), não contar pontos.
                    // Opcional: Poderíamos deletar esse usuarioCurso órfão aqui para limpar o banco
                }
             } catch (err) {
                 console.warn(`Erro ao verificar status do curso ${cursoId}`, err);
             }
        }
      }

      // Calcular coeficiente baseado no total de questões do sistema
      const coeficienteGeral =
        totalQuestoesSistema > 0
          ? Math.round((questoesCorretasTotal / totalQuestoesSistema) * 100)
          : 0;

      const usuarioRef = doc(firestore, "usuarios", usuarioId);
      await updateDoc(usuarioRef, {
        coeficienteConhecimento: coeficienteGeral,
      });
    } catch (error) {
      console.error("Erro ao atualizar coeficiente total:", error);
    }
  }
}
