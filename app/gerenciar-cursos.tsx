import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { firestore } from "@/firebase/FirebaseInit";
import { Alternativa, BlocoCodigoCodigo, CasoTeste, Curso, LinguagemCodigo, PaginaCurso, Questao, QuestaoBlocos, QuestaoEscrita } from "@/model/Curso";
import { Perfil } from "@/model/Perfil";
import { ColaboradorCursoService } from "@/services/curso/ColaboradorCursoService";
import { ImageUploadService } from "@/services/image/ImageUploadService";
import { BancoQuestoesService } from "@/services/questao/BancoQuestoesService";
import { JobeService } from "@/services/codigo/JobeService";
import { QuestionAnalyticsPanel } from "@/components/QuestionAnalyticsPanel";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Button,
    Card,
    Chip,
    Dialog,
    Divider,
    Icon,
    IconButton,
    Menu,
    Modal,
    Portal,
    SegmentedButtons,
    Text,
    TextInput,
    useTheme
} from "react-native-paper";

export default function GerenciarCursos() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase } = useContext<any>(UserContext);

  // Estados principais
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);
  const [etapaCriacao, setEtapaCriacao] = useState<
    "info" | "paginas" | "revisao"
  >("info");
  
  // Documentação
  const [documentacoesDisponiveis, setDocumentacoesDisponiveis] = useState<Documentacao[]>([]);
  const [documentacaoSelecionada, setDocumentacaoSelecionada] = useState<string | undefined>(undefined);
  const [menuDocVisivel, setMenuDocVisivel] = useState(false);

  // Dialogs
  const [dialogCriarVisivel, setDialogCriarVisivel] = useState(false);
  const [dialogPaginaVisivel, setDialogPaginaVisivel] = useState(false);
  const [dialogQuestaoVisivel, setDialogQuestaoVisivel] = useState(false);
  const [dialogExcluirVisivel, setDialogExcluirVisivel] = useState(false);
  const [dialogMensagemVisivel, setDialogMensagemVisivel] = useState(false);

  // Dados do curso
  const [cursoId, setCursoId] = useState("");
  const [siglaCurso, setSiglaCurso] = useState(""); // Sigla para nomenclatura de imagens
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [nivel, setNivel] = useState<
    "iniciante" | "intermediario" | "avancado"
  >("iniciante");
  const [versaoLinguagem, setVersaoLinguagem] = useState(""); // Versão da linguagem
  const [imagemCapaUrl, setImagemCapaUrl] = useState(""); // URL da imagem de capa
  const [imagemCapaLocal, setImagemCapaLocal] = useState(""); // URI local antes do upload
  const [paginas, setPaginas] = useState<PaginaCurso[]>([]);

  // Dados da página
  const [paginaEditando, setPaginaEditando] = useState<PaginaCurso | null>(
    null
  );
  const [paginaTitulo, setPaginaTitulo] = useState("");
  const [paginaTipo, setPaginaTipo] = useState<"conteudo" | "exercicio" | "exercicio_codigo" | "exercicio_blocos">(
    "conteudo"
  );
  const [paginaConteudo, setPaginaConteudo] = useState("");
  const [paginaImagemUrl, setPaginaImagemUrl] = useState("");
  const [questoesPagina, setQuestoesPagina] = useState<Questao[]>([]);

  // Dados da questão
  const [questaoEditando, setQuestaoEditando] = useState<Questao | null>(null);
  const [questaoPergunta, setQuestaoPergunta] = useState("");
  const [questaoExplicacao, setQuestaoExplicacao] = useState("");
  const [alternativas, setAlternativas] = useState<Alternativa[]>([
    { id: "a", texto: "", correta: false },
    { id: "b", texto: "", correta: false },
    { id: "c", texto: "", correta: false },
    { id: "d", texto: "", correta: false },
  ]);

  const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });
  const [motivoExclusao, setMotivoExclusao] = useState("");
  const [cursoExcluir, setCursoExcluir] = useState<Curso | null>(null);

  // EXERCÍCIO DE CÓDIGO STATE
  const [dialogQuestaoEscritaVisivel, setDialogQuestaoEscritaVisivel] = useState(false);
  const [questoesEscritaPagina, setQuestoesEscritaPagina] = useState<QuestaoEscrita[]>([]);
  const [questaoEscritaEditando, setQuestaoEscritaEditando] = useState<QuestaoEscrita | null>(null);
  const [escritaEnunciado, setEscritaEnunciado] = useState("");
  const [escritaLinguagem, setEscritaLinguagem] = useState<LinguagemCodigo>("python3");
  const [escritaCodigoBase, setEscritaCodigoBase] = useState("");
  const [escritaGabarito, setEscritaGabarito] = useState("");
  const [escritaDica, setEscritaDica] = useState("");
  const [escritaExplicacao, setEscritaExplicacao] = useState("");
  const [escritaCasosTeste, setEscritaCasosTeste] = useState<CasoTeste[]>([
    { id: "ct_1", entrada: "", saidaEsperada: "", descricao: "Teste 1" },
  ]);
  const [testandoGabarito, setTestandoGabarito] = useState(false);
  const [resultadoTesteGabarito, setResultadoTesteGabarito] = useState<string | null>(null);

  // MODO ENCAPSULADO (wrapper) — exercicio_codigo
  const [escritaModoEncapsulado, setEscritaModoEncapsulado] = useState(false);
  const [escritaWrapperAntes, setEscritaWrapperAntes] = useState("");
  const [escritaWrapperDepois, setEscritaWrapperDepois] = useState("");

  // EXERCÍCIO DE BLOCOS STATE
  const [dialogQuestaoBlocosVisivel, setDialogQuestaoBlocosVisivel] = useState(false);
  const [questoesBlocosPagina, setQuestoesBlocosPagina] = useState<QuestaoBlocos[]>([]);
  const [questaoBlocosEditando, setQuestaoBlocosEditando] = useState<QuestaoBlocos | null>(null);
  const [blocosEnunciado, setBlocosEnunciado] = useState("");
  const [blocosLinguagem, setBlocosLinguagem] = useState<LinguagemCodigo>("python3");
  const [blocosSaidaEsperada, setBlocosSaidaEsperada] = useState("");
  const [blocosDica, setBlocosDica] = useState("");
  const [blocosExplicacao, setBlocosExplicacao] = useState("");
  const [blocosLista, setBlocosLista] = useState<BlocoCodigoCodigo[]>([
    { id: "b1", codigo: "", ordem: 1, distrator: false },
  ]);

  // ANALYTICS STATE
  const [analyticsCursoId, setAnalyticsCursoId] = useState("");
  const [analyticsCursoTitulo, setAnalyticsCursoTitulo] = useState("");
  const [analyticsVisivel, setAnalyticsVisivel] = useState(false);

  const [menuAcoesVisivel, setMenuAcoesVisivel] = useState<string | null>(null);

  // Refs para inputs
  const siglaRef = React.useRef<any>(null);
  const descricaoRef = React.useRef<any>(null);
  const categoriaRef = React.useRef<any>(null);
  const versaoRef = React.useRef<any>(null);
  const alternativaRefs = React.useRef<Array<any>>([]);
  const explicacaoRef = React.useRef<any>(null);

  // Recarregar cursos quando a tab receber foco
  useFocusEffect(
    useCallback(() => {
      if (userFirebase?.uid) {
        carregarCursos();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userFirebase?.uid])
  );

  // Listener em tempo real para mudanças nos cursos
  useEffect(() => {
    if (!userFirebase) return;

    const cursosRef = collection(firestore, "cursos");
    const unsubscribe = onSnapshot(
      cursosRef,
      (snapshot) => {
        const cursosAtualizados = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Curso[];

        const cursosFiltrados = cursosAtualizados.filter((curso) => {
          // 1. Moderador vê tudo (check string literal to be safe)
          if (userFirebase.perfil === "Moderador" || userFirebase.perfil === Perfil.Moderador) return true;
          
          // 2. Criador vê seu curso (check if IDs exist)
          if (curso.criadoPor && userFirebase.uid && curso.criadoPor === userFirebase.uid) return true;
          
          // 3. Aprovados: Visível para todos
          if (curso.status === "Aprovado") return true;
          
          return false;
        });

        setCursos(cursosFiltrados);
      },
      (error) => {
        console.error("Erro ao escutar mudanças nos cursos:", error);
      }
    );

    // Cleanup: remover listener quando componente desmontar
    return () => unsubscribe();
  }, [userFirebase]);

  async function carregarCursos() {
    if (!userFirebase) return;

    try {
      setCarregando(true);
      // Buscar TODOS os cursos do sistema (XML + Firestore)
      const isAdmin = userFirebase?.perfil === "Moderador" || userFirebase?.perfil === Perfil.Moderador;
      const todosCursos = await ColaboradorCursoService.buscarTodosCursos(
        userFirebase.uid,
        isAdmin
      );
      setCursos(todosCursos);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      mostrarMensagem("erro", "Erro ao carregar seus cursos");
    } finally {
      setCarregando(false);
    }
  }


  // Carregar documentações aprovadas quando o dialog abrir
  useEffect(() => {
    if (dialogCriarVisivel) {
      const unsubscribe = DocumentacaoService.observarDocumentacoesAprovadas((docs) => {
        setDocumentacoesDisponiveis(docs);
      });
      return () => unsubscribe();
    }
  }, [dialogCriarVisivel]);

  function abrirCriacaoCurso() {
    limparFormularioCurso();
    setModoEdicao(false);
    setCursoEditando(null);
    setEtapaCriacao("info");
    setDocumentacaoSelecionada(undefined);
    setDialogCriarVisivel(true);
  }

  async function abrirEdicaoCurso(curso: Curso) {
    try {
      setCarregando(true);

      // Carregar XML do Storage
      const xmlContent = await ColaboradorCursoService.downloadXMLCurso(
        curso.id
      );

      // Parsear XML para extrair páginas
      const cursoCompleto = await parsearXMLParaEdicao(xmlContent);

      // Preencher formulário
      setCursoId(curso.id);
      setTitulo(curso.titulo);
      setDescricao(curso.descricao);
      setCategoria(curso.categoria);
      setNivel(curso.nivel);
      setPaginas(cursoCompleto.paginas || []);

      setModoEdicao(true);
      setCursoEditando(curso);
      setDocumentacaoSelecionada(curso.documentacaoId);
      setEtapaCriacao("info");
      setDialogCriarVisivel(true);
    } catch (error) {
      console.error("Erro ao carregar curso para edição:", error);
      mostrarMensagem("erro", "Erro ao carregar curso para edição");
    } finally {
      setCarregando(false);
    }
  }

  async function parsearXMLParaEdicao(xmlContent: string): Promise<Curso> {
    const paginas: PaginaCurso[] = [];
    const lines = xmlContent.split("\n");
    let paginaAtual: any = {};
    let questaoRefs: string[] = [];
    let conteudoBuffer = "";
    let dentroConteudo = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes("<pagina")) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        const tipoMatch = trimmed.match(/tipo="([^"]+)"/);
        paginaAtual = {
          id: idMatch?.[1] || "",
          tipo: tipoMatch?.[1] || "conteudo",
        };
        questaoRefs = [];
        conteudoBuffer = "";
      }

      if (trimmed.includes("<titulo>") && trimmed.includes("</titulo>")) {
        paginaAtual.titulo = trimmed.replace(/<\/?titulo>/g, "");
      }

      if (trimmed.includes("<conteudo>")) {
        dentroConteudo = true;
        conteudoBuffer = trimmed.replace("<conteudo>", "");
        if (trimmed.includes("</conteudo>")) {
          paginaAtual.conteudo = conteudoBuffer
            .replace("</conteudo>", "")
            .trim();
          dentroConteudo = false;
          conteudoBuffer = "";
        }
      } else if (trimmed.includes("</conteudo>")) {
        conteudoBuffer +=
          (conteudoBuffer ? "\n" : "") + trimmed.replace("</conteudo>", "");
        paginaAtual.conteudo = conteudoBuffer.trim();
        dentroConteudo = false;
        conteudoBuffer = "";
      } else if (dentroConteudo && trimmed !== "") {
        conteudoBuffer += (conteudoBuffer ? "\n" : "") + trimmed;
      }

      if (trimmed.includes("<imagem>") && trimmed.includes("</imagem>")) {
        paginaAtual.imagem = trimmed.replace(/<\/?imagem>/g, "");
      }

      if (trimmed.includes("<questao-ref")) {
        const idMatch = trimmed.match(/id="([^"]+)"/);
        if (idMatch) {
          questaoRefs.push(idMatch[1]);
        }
      }

      if (trimmed.includes("</pagina>")) {
        if (paginaAtual.tipo === "exercicio" && questaoRefs.length > 0) {
          const questoes = await BancoQuestoesService.obterMultiplasQuestoes(
            questaoRefs
          );
          paginaAtual.questoes = questoes;
        }
        paginas.push(paginaAtual);
      }
    }

    return { paginas } as Curso;
  }

  function limparFormularioCurso() {
    setCursoId(`curso-${Date.now()}`);
    setTitulo("");
    setDescricao("");
    setCategoria("");
    setNivel("iniciante");
    setVersaoLinguagem("");
    setPaginas([]);
  }

  function avancarEtapa() {
    if (etapaCriacao === "info") {
      if (!titulo.trim() || !descricao.trim() || !categoria.trim()) {
        mostrarMensagem("erro", "Preencha todos os campos obrigatórios");
        return;
      }
      setEtapaCriacao("paginas");
    } else if (etapaCriacao === "paginas") {
      if (paginas.length === 0) {
        mostrarMensagem("erro", "Adicione pelo menos uma página ao curso");
        return;
      }
      setEtapaCriacao("revisao");
    }
  }

  function voltarEtapa() {
    if (etapaCriacao === "revisao") {
      setEtapaCriacao("paginas");
    } else if (etapaCriacao === "paginas") {
      setEtapaCriacao("info");
    }
  }

  // GERENCIAR PÁGINAS
  function abrirDialogPagina(pagina?: PaginaCurso) {
    if (pagina) {
      setPaginaEditando(pagina);
      setPaginaTitulo(pagina.titulo);
      setPaginaTipo(pagina.tipo);
      setPaginaConteudo(pagina.conteudo || "");
      setPaginaImagemUrl(pagina.imagem || "");
      setQuestoesPagina(pagina.questoes || []);
      setQuestoesEscritaPagina(pagina.questoesEscrita || []);
      setQuestoesBlocosPagina(pagina.questoesBlocos || []);
    } else {
      setPaginaEditando(null);
      setPaginaTitulo("");
      setPaginaTipo("conteudo");
      setPaginaConteudo("");
      setPaginaImagemUrl("");
      setQuestoesPagina([]);
      setQuestoesEscritaPagina([]);
      setQuestoesBlocosPagina([]);
    }
    setDialogPaginaVisivel(true);
  }

  async function selecionarImagemCapa() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        mostrarMensagem("erro", "Permissão para acessar galeria negada");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImagemCapaLocal(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem de capa:", error);
    }
  }

  async function selecionarImagem() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        mostrarMensagem("erro", "Permissão para acessar galeria negada");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Usar padrão de nomenclatura: sigla{numeroPagina}-descricao
        const numeroPagina = paginas.length + 1;
        const fileName = `${siglaCurso || "curso"}${numeroPagina}-page.jpg`;
        const url = await ImageUploadService.uploadCourseImage(
          result.assets[0].uri,
          cursoId || `temp-${Date.now()}`,
          fileName
        );
        setPaginaImagemUrl(url || "");
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
    }
  }

  function salvarPagina() {
    if (!paginaTitulo.trim()) {
      mostrarMensagem("erro", "Informe o título da página");
      return;
    }

    if (paginaTipo === "conteudo" && !paginaConteudo.trim()) {
      mostrarMensagem("erro", "Informe o conteúdo da página");
      return;
    }

    if (paginaTipo === "exercicio" && questoesPagina.length === 0) {
      mostrarMensagem("erro", "Adicione pelo menos uma questão");
      return;
    }

    if (paginaTipo === "exercicio_codigo" && questoesEscritaPagina.length === 0) {
      mostrarMensagem("erro", "Adicione pelo menos um exercício de código");
      return;
    }

    if (paginaTipo === "exercicio_blocos" && questoesBlocosPagina.length === 0) {
      mostrarMensagem("erro", "Adicione pelo menos um exercício de blocos");
      return;
    }

    const novaPagina: PaginaCurso = {
      id: paginaEditando?.id || `${paginas.length + 1}`,
      titulo: paginaTitulo,
      tipo: paginaTipo,
      conteudo: paginaConteudo,
      imagem: paginaImagemUrl,
      questoes: paginaTipo === "exercicio" ? questoesPagina : undefined,
      questoesEscrita: paginaTipo === "exercicio_codigo" ? questoesEscritaPagina : undefined,
      questoesBlocos: paginaTipo === "exercicio_blocos" ? questoesBlocosPagina : undefined,
    };

    if (paginaEditando) {
      setPaginas(
        paginas.map((p) => (p.id === paginaEditando.id ? novaPagina : p))
      );
    } else {
      setPaginas([...paginas, novaPagina]);
    }

    setDialogPaginaVisivel(false);
  }

  function removerPagina(paginaId: string) {
    setPaginas(paginas.filter((p) => p.id !== paginaId));
  }

  // GERENCIAR QUESTÕES
  function abrirDialogQuestao(questao?: Questao) {
    if (questao) {
      setQuestaoEditando(questao);
      setQuestaoPergunta(questao.pergunta);
      setQuestaoExplicacao(questao.explicacao);
      setAlternativas(questao.alternativas);
    } else {
      setQuestaoEditando(null);
      setQuestaoPergunta("");
      setQuestaoExplicacao("");
      setAlternativas([
        { id: "a", texto: "", correta: false },
        { id: "b", texto: "", correta: false },
        { id: "c", texto: "", correta: false },
        { id: "d", texto: "", correta: false },
      ]);
    }
    setDialogQuestaoVisivel(true);
  }

  function atualizarAlternativa(
    index: number,
    campo: "texto" | "correta",
    valor: any
  ) {
    const novasAlternativas = [...alternativas];
    if (campo === "correta" && valor) {
      // Desmarcar todas as outras
      novasAlternativas.forEach((alt, i) => {
        alt.correta = i === index;
      });
    } else {
      (novasAlternativas[index] as any)[campo] = valor;
    }
    setAlternativas(novasAlternativas);
  }

  async function salvarQuestao() {
    if (!questaoPergunta.trim()) {
      mostrarMensagem("erro", "Informe a pergunta");
      return;
    }

    if (alternativas.some((alt) => !alt.texto.trim())) {
      mostrarMensagem("erro", "Preencha todas as alternativas");
      return;
    }

    if (!alternativas.some((alt) => alt.correta)) {
      mostrarMensagem("erro", "Marque a alternativa correta");
      return;
    }

    // Gerar ID no formato: cursoAbrev_conteudo_NNN (ex: js_array_001)
    let questaoId = questaoEditando?.id;
    if (!questaoId) {
      // Extrair abreviatura do curso (primeira parte até o primeiro hífen ou primeiro 2-3 caracteres)
      const cursoAbrev = cursoId.includes("-")
        ? cursoId.split("-")[0]
        : cursoId.substring(0, 3);

      // Usar título da página como conteúdo (transformar em snake_case sem números)
      const conteudoPart = paginaTitulo
        .toLowerCase()
        .replace(/[^a-z\s]/g, "") // Remove caracteres especiais e números
        .trim()
        .split(/\s+/)
        .slice(0, 2) // Pegar até 2 palavras
        .join("_");

      // Número sequencial com padding
      const numeroQuestao = String(questoesPagina.length + 1).padStart(3, "0");

      questaoId = `${cursoAbrev}_${conteudoPart}_${numeroQuestao}`;
    }

    const novaQuestao: Questao = {
      id: questaoId,
      pergunta: questaoPergunta,
      alternativas: alternativas,
      explicacao: questaoExplicacao,
      ...(questaoEditando
        ? {}
        : { criadoPor: userFirebase?.uid, criadoPorNome: userFirebase?.nome }),
    };

    if (questaoEditando) {
      setQuestoesPagina(
        questoesPagina.map((q) =>
          q.id === questaoEditando.id ? novaQuestao : q
        )
      );
    } else {
      setQuestoesPagina([...questoesPagina, novaQuestao]);
    }

    setDialogQuestaoVisivel(false);
  }

  function removerQuestao(questaoId: string) {
    setQuestoesPagina(questoesPagina.filter((q) => q.id !== questaoId));
  }

  // ============ GERENCIAR QUESTÕES DE CÓDIGO ============
  function abrirDialogQuestaoEscrita(questao?: QuestaoEscrita) {
    if (questao) {
      setQuestaoEscritaEditando(questao);
      setEscritaEnunciado(questao.enunciado);
      setEscritaLinguagem(questao.linguagem);
      setEscritaCodigoBase(questao.codigoBase);
      setEscritaGabarito(questao.gabarito || "");
      setEscritaDica(questao.dica || "");
      setEscritaExplicacao(questao.explicacao);
      setEscritaCasosTeste(questao.casosTeste.length > 0 ? questao.casosTeste : [
        { id: "ct_1", entrada: "", saidaEsperada: "", descricao: "Teste 1" },
      ]);
      setEscritaModoEncapsulado(questao.modoEncapsulado || false);
      setEscritaWrapperAntes(questao.wrapperAntes || "");
      setEscritaWrapperDepois(questao.wrapperDepois || "");
    } else {
      setQuestaoEscritaEditando(null);
      setEscritaEnunciado("");
      setEscritaLinguagem("python3");
      setEscritaCodigoBase(getCodigoBasePadrao("python3"));
      setEscritaGabarito("");
      setEscritaDica("");
      setEscritaExplicacao("");
      setEscritaCasosTeste([
        { id: "ct_1", entrada: "", saidaEsperada: "", descricao: "Teste 1" },
      ]);
      setEscritaModoEncapsulado(false);
      setEscritaWrapperAntes("");
      setEscritaWrapperDepois("");
    }
    setResultadoTesteGabarito(null);
    setDialogQuestaoEscritaVisivel(true);
  }

  function getCodigoBasePadrao(lang: LinguagemCodigo): string {
    switch (lang) {
      case "python3":
        return '# Complete o código abaixo\n# __EDITAR__ marca onde você deve escrever\n\ndef solucao():\n    # __EDITAR__\n    pass\n\nsolucao()';
      case "nodejs":
        return '// Complete o código abaixo\n// __EDITAR__ marca onde você deve escrever\n\nfunction solucao() {\n    // __EDITAR__\n}\n\nsolucao();';
      case "c":
        return '#include <stdio.h>\n\n// Complete o código abaixo\n// __EDITAR__ marca onde você deve escrever\n\nint main() {\n    // __EDITAR__\n    return 0;\n}';
      default:
        return "// __EDITAR__";
    }
  }

  function adicionarCasoTeste() {
    const novoId = `ct_${escritaCasosTeste.length + 1}`;
    setEscritaCasosTeste([
      ...escritaCasosTeste,
      { id: novoId, entrada: "", saidaEsperada: "", descricao: `Teste ${escritaCasosTeste.length + 1}` },
    ]);
  }

  function removerCasoTeste(id: string) {
    if (escritaCasosTeste.length <= 1) {
      mostrarMensagem("erro", "É necessário pelo menos um caso de teste");
      return;
    }
    setEscritaCasosTeste(escritaCasosTeste.filter((ct) => ct.id !== id));
  }

  function atualizarCasoTeste(id: string, campo: keyof CasoTeste, valor: string) {
    setEscritaCasosTeste(
      escritaCasosTeste.map((ct) =>
        ct.id === id ? { ...ct, [campo]: valor } : ct
      )
    );
  }

  async function testarGabarito() {
    if (!escritaGabarito.trim()) {
      mostrarMensagem("erro", "Informe o gabarito (solução) antes de testar");
      return;
    }
    if (escritaCasosTeste.some((ct) => !ct.saidaEsperada.trim())) {
      mostrarMensagem("erro", "Preencha a saída esperada de todos os casos de teste");
      return;
    }

    setTestandoGabarito(true);
    setResultadoTesteGabarito(null);

    try {
      const resultado = await JobeService.executarComTestes(
        escritaLinguagem,
        escritaGabarito,
        escritaCasosTeste
      );

      if (resultado.sucesso) {
        setResultadoTesteGabarito("[OK] Todos os testes passaram com o gabarito!");
      } else {
        const falhas = resultado.casosTeste.filter((c) => !c.passou);
        setResultadoTesteGabarito(
          `[FALHA] ${falhas.length} teste(s) falharam:\n${falhas
            .map((f) => `• ${f.descricao || f.casoTesteId}: esperado "${f.saidaEsperada}", obtido "${f.saidaObtida}"`)
            .join("\n")}`
        );
      }
    } catch (error: any) {
      setResultadoTesteGabarito(`[ERRO] Erro: ${error.message}`);
    } finally {
      setTestandoGabarito(false);
    }
  }

  function salvarQuestaoEscrita() {
    if (!escritaEnunciado.trim()) {
      mostrarMensagem("erro", "Informe o enunciado do exercício");
      return;
    }
    if (!escritaCodigoBase.trim()) {
      mostrarMensagem("erro", "Informe o código base (template do aluno)");
      return;
    }
    if (!escritaGabarito.trim()) {
      mostrarMensagem("erro", "Informe o gabarito (solução completa)");
      return;
    }
    if (escritaGabarito.includes("__EDITAR__")) {
      mostrarMensagem("erro", "O gabarito não pode conter __EDITAR__. Substitua cada marcador pelo código da solução correta. O gabarito deve ser o programa completo e executável.");
      return;
    }
    if (escritaCasosTeste.some((ct) => !ct.saidaEsperada.trim())) {
      mostrarMensagem("erro", "Preencha a saída esperada de todos os casos de teste");
      return;
    }

    const cursoAbrev = cursoId.includes("-")
      ? cursoId.split("-")[0]
      : cursoId.substring(0, 3);
    const conteudoPart = paginaTitulo
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join("_");
    const numero = String(questoesEscritaPagina.length + 1).padStart(3, "0");

    const novaQuestao: QuestaoEscrita = {
      id: questaoEscritaEditando?.id || `${cursoAbrev}_code_${conteudoPart}_${numero}`,
      enunciado: escritaEnunciado,
      linguagem: escritaLinguagem,
      codigoBase: escritaCodigoBase,
      gabarito: escritaGabarito,
      casosTeste: escritaCasosTeste,
      dica: escritaDica || undefined,
      explicacao: escritaExplicacao,
      ...(escritaModoEncapsulado && {
        modoEncapsulado: true,
        wrapperAntes: escritaWrapperAntes || undefined,
        wrapperDepois: escritaWrapperDepois || undefined,
      }),
      ...(questaoEscritaEditando
        ? {}
        : { criadoPor: userFirebase?.uid, criadoPorNome: userFirebase?.nome }),
    };

    if (questaoEscritaEditando) {
      setQuestoesEscritaPagina(
        questoesEscritaPagina.map((q) =>
          q.id === questaoEscritaEditando.id ? novaQuestao : q
        )
      );
    } else {
      setQuestoesEscritaPagina([...questoesEscritaPagina, novaQuestao]);
    }

    setDialogQuestaoEscritaVisivel(false);
  }

  function removerQuestaoEscrita(questaoId: string) {
    setQuestoesEscritaPagina(questoesEscritaPagina.filter((q) => q.id !== questaoId));
  }

  // ==================== BLOCOS ====================

  function abrirDialogQuestaoBlocos(questao?: QuestaoBlocos) {
    if (questao) {
      setQuestaoBlocosEditando(questao);
      setBlocosEnunciado(questao.enunciado);
      setBlocosLinguagem(questao.linguagem);
      setBlocosSaidaEsperada(questao.saidaEsperada);
      setBlocosDica(questao.dica || "");
      setBlocosExplicacao(questao.explicacao);
      setBlocosLista(questao.blocos.length > 0 ? questao.blocos : [{ id: "b1", codigo: "", ordem: 1, distrator: false }]);
    } else {
      setQuestaoBlocosEditando(null);
      setBlocosEnunciado("");
      setBlocosLinguagem("python3");
      setBlocosSaidaEsperada("");
      setBlocosDica("");
      setBlocosExplicacao("");
      setBlocosLista([{ id: "b1", codigo: "", ordem: 1, distrator: false }]);
    }
    setDialogQuestaoBlocosVisivel(true);
  }

  function adicionarBloco() {
    const newId = `b${blocosLista.length + 1}`;
    setBlocosLista([...blocosLista, { id: newId, codigo: "", ordem: blocosLista.length + 1, distrator: false }]);
  }

  function removerBloco(blocoId: string) {
    if (blocosLista.length <= 1) {
      mostrarMensagem("erro", "É necessário pelo menos um bloco");
      return;
    }
    const restantes = blocosLista.filter((b) => b.id !== blocoId);
    // Reordenar os não-distradores
    let ordemCount = 1;
    const reordenados = restantes.map((b) =>
      b.distrator ? b : { ...b, ordem: ordemCount++ }
    );
    setBlocosLista(reordenados);
  }

  function atualizarBloco(blocoId: string, campo: keyof BlocoCodigoCodigo, valor: any) {
    setBlocosLista(blocosLista.map((b) => (b.id === blocoId ? { ...b, [campo]: valor } : b)));
  }

  function salvarQuestaoBlocos() {
    if (!blocosEnunciado.trim()) {
      mostrarMensagem("erro", "Informe o enunciado do exercício de blocos");
      return;
    }
    if (!blocosSaidaEsperada.trim()) {
      mostrarMensagem("erro", "Informe a saída esperada");
      return;
    }
    if (blocosLista.some((b) => !b.codigo.trim())) {
      mostrarMensagem("erro", "Preencha o código de todos os blocos");
      return;
    }
    if (!blocosExplicacao.trim()) {
      mostrarMensagem("erro", "Informe a explicação do exercício");
      return;
    }

    const numero = String(questoesBlocosPagina.length + 1).padStart(3, "0");
    const novaQuestao: QuestaoBlocos = {
      id: questaoBlocosEditando?.id || `blocos_${numero}_${Date.now()}`,
      enunciado: blocosEnunciado,
      linguagem: blocosLinguagem,
      blocos: blocosLista,
      saidaEsperada: blocosSaidaEsperada,
      dica: blocosDica || undefined,
      explicacao: blocosExplicacao,
    };

    if (questaoBlocosEditando) {
      setQuestoesBlocosPagina(questoesBlocosPagina.map((q) => (q.id === questaoBlocosEditando.id ? novaQuestao : q)));
    } else {
      setQuestoesBlocosPagina([...questoesBlocosPagina, novaQuestao]);
    }
    setDialogQuestaoBlocosVisivel(false);
  }

  // SALVAR CURSO
  async function salvarCurso() {
    if (!userFirebase) return;

    try {
      console.log(`[Colaboracao] Salvando curso. Paginas: ${paginas.length}`);
      setCarregando(true);

      // Upload da imagem de capa se houver
      let imagemCapaUploadUrl = imagemCapaUrl;
      if (imagemCapaLocal && siglaCurso) {
        const uploadedUrl = await ImageUploadService.uploadCourseImage(
          imagemCapaLocal,
          cursoId,
          `${siglaCurso}-cover.jpg`
        );
        if (uploadedUrl) {
          imagemCapaUploadUrl = uploadedUrl;
        }
      }

      // Gerar XML do curso
      const xmlContent = gerarXMLCurso();

      // Preparar dados do curso
      const dadosCurso: any = {
        id: cursoId,
        titulo,
        descricao,
        categoria,
        nivel,
        paginas: [], // Não será salvo no Firestore
        coeficienteMaximo: 100,
        createdAt: null, // Será gerado pelo servidor
        updatedAt: null, // Será gerado pelo servidor
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (versaoLinguagem) dadosCurso.versaoLinguagem = versaoLinguagem;
      if (imagemCapaUploadUrl) dadosCurso.imageUrl = imagemCapaUploadUrl;
      if (documentacaoSelecionada) dadosCurso.documentacaoId = documentacaoSelecionada;

      // Salvar questões no Firestore primeiro
      for (const pagina of paginas) {
        if (pagina.tipo === "exercicio" && pagina.questoes) {
          for (const questao of pagina.questoes) {
            await BancoQuestoesService.salvarQuestao(questao);
          }
        }
        // Também salvar questões de código no banco
        if (pagina.tipo === "exercicio_codigo" && pagina.questoesEscrita) {
          for (const questao of pagina.questoesEscrita) {
            await BancoQuestoesService.salvarQuestaoEscrita(questao);
          }
        }
      }

      if (modoEdicao && cursoEditando) {
        // Atualizar curso existente
        await ColaboradorCursoService.atualizarCurso(
          cursoId,
          dadosCurso,
          xmlContent
        );
        mostrarMensagem("sucesso", "Curso atualizado com sucesso!");
      } else {
        // Criar novo curso
        await ColaboradorCursoService.criarCurso(
          dadosCurso,
          xmlContent,
          userFirebase.uid,
          userFirebase.nome
        );
        mostrarMensagem("sucesso", "Curso criado com sucesso!");
      }

      setDialogCriarVisivel(false);
      limparFormularioCurso();
      setModoEdicao(false);
      setCursoEditando(null);
      await carregarCursos();
    } catch (error: any) {
      mostrarMensagem("erro", error.message || "Erro ao salvar curso");
    } finally {
      setCarregando(false);
    }
  }

  function gerarXMLCurso(): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<curso id="${cursoId}" titulo="${titulo}" categoria="${categoria}" nivel="${nivel}" coeficienteMaximo="100">\n`;

    for (const pagina of paginas) {
      xml += `  <pagina id="${pagina.id}" tipo="${pagina.tipo}">\n`;
      xml += `    <titulo>${pagina.titulo}</titulo>\n`;

      if (pagina.conteudo) {
        xml += `    <conteudo>\n${pagina.conteudo}\n    </conteudo>\n`;
      }

      if (pagina.imagem) {
        xml += `    <imagem>${pagina.imagem}</imagem>\n`;
      }

      if (pagina.tipo === "exercicio" && pagina.questoes) {
        for (const questao of pagina.questoes) {
          xml += `    <questao-ref id="${questao.id}"/>\n`;
        }
      }

      if (pagina.tipo === "exercicio_codigo" && pagina.questoesEscrita) {
        for (const qe of pagina.questoesEscrita) {
          const modoAttr = qe.modoEncapsulado ? ` modo="encapsulado"` : "";
          xml += `    <questao-escrita id="${qe.id}" linguagem="${qe.linguagem}"${modoAttr}>\n`;
          xml += `      <enunciado>${escapeXML(qe.enunciado)}</enunciado>\n`;
          xml += `      <codigo-base><![CDATA[${qe.codigoBase}]]></codigo-base>\n`;
          xml += `      <gabarito><![CDATA[${qe.gabarito}]]></gabarito>\n`;
          if (qe.modoEncapsulado && qe.wrapperAntes) {
            xml += `      <wrapper-antes><![CDATA[${qe.wrapperAntes}]]></wrapper-antes>\n`;
          }
          if (qe.modoEncapsulado && qe.wrapperDepois) {
            xml += `      <wrapper-depois><![CDATA[${qe.wrapperDepois}]]></wrapper-depois>\n`;
          }
          if (qe.dica) xml += `      <dica>${escapeXML(qe.dica)}</dica>\n`;
          xml += `      <explicacao>${escapeXML(qe.explicacao)}</explicacao>\n`;
          for (const ct of qe.casosTeste) {
            xml += `      <caso-teste id="${ct.id}"`;
            if (ct.descricao) xml += ` descricao="${escapeXMLAttr(ct.descricao)}"`;
            xml += `>\n`;
            xml += `        <entrada><![CDATA[${ct.entrada}]]></entrada>\n`;
            xml += `        <saida-esperada><![CDATA[${ct.saidaEsperada}]]></saida-esperada>\n`;
            xml += `      </caso-teste>\n`;
          }
          xml += `    </questao-escrita>\n`;
        }
      }

      if (pagina.tipo === "exercicio_blocos" && pagina.questoesBlocos) {
        for (const qb of pagina.questoesBlocos) {
          xml += `    <questao-blocos id="${qb.id}" linguagem="${qb.linguagem}">\n`;
          xml += `      <enunciado>${escapeXML(qb.enunciado)}</enunciado>\n`;
          xml += `      <saida-esperada><![CDATA[${qb.saidaEsperada}]]></saida-esperada>\n`;
          if (qb.dica) xml += `      <dica>${escapeXML(qb.dica)}</dica>\n`;
          xml += `      <explicacao>${escapeXML(qb.explicacao)}</explicacao>\n`;
          for (const bloco of qb.blocos) {
            const distratorAttr = bloco.distrator ? ` distrator="true"` : "";
            xml += `      <bloco id="${bloco.id}" ordem="${bloco.ordem}"${distratorAttr}>${escapeXML(bloco.codigo)}</bloco>\n`;
          }
          xml += `    </questao-blocos>\n`;
        }
      }

      xml += `  </pagina>\n\n`;
    }

    xml += `</curso>`;
    return xml;
  }

  function escapeXML(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function escapeXMLAttr(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  async function solicitarExclusao(curso: Curso) {
    if (!userFirebase || !motivoExclusao.trim()) return;

    try {
      setCarregando(true);
      await ColaboradorCursoService.solicitarExclusaoCurso(
        curso.id,
        curso.titulo,
        userFirebase.uid,
        userFirebase.nome,
        motivoExclusao
      );
      mostrarMensagem("sucesso", "Solicitação de exclusão enviada!");
      setDialogExcluirVisivel(false);
      setMotivoExclusao("");
      setCursoExcluir(null);
    } catch (error: any) {
      mostrarMensagem("erro", error.message || "Erro ao solicitar exclusão");
    } finally {
      setCarregando(false);
    }
  }

  function mostrarMensagem(tipo: string, mensagem: string) {
    setMensagem({ tipo, mensagem });
    setDialogMensagemVisivel(true);
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView
        style={[
          themeStyles.container,
          { backgroundColor: theme.colors.background, flex: 1 },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  variant="headlineMedium"
                  style={[
                    styles.pageTitle,
                    { color: theme.colors.onBackground },
                  ]}
                >
                  Gerenciar Cursos
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
                >
                  Crie e gerencie cursos para a plataforma
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  mode="contained"
                  icon="plus"
                  onPress={abrirCriacaoCurso}
                  style={{ flex: 1 }}
                >
                  Novo Curso
                </Button>
              </View>
            </View>
          </View>

          {cursos.length === 0 && !carregando ? (
            <Card
              style={[
                themeStyles.card,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content style={{ alignItems: "center", padding: 32 }}>
                <Text
                  style={{
                    textAlign: "center",
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 16,
                  }}
                >
                  Nenhum curso disponível no momento.
                </Text>
                <Button
                  mode="contained"
                  onPress={abrirCriacaoCurso}
                  icon="plus"
                >
                  Criar Novo Curso
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <FlatList
              data={cursos}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card
                  style={[
                    themeStyles.card,
                    { 
                      backgroundColor: theme.colors.surface,
                      // Destaque para cursos pendentes
                      opacity: item.status === "Pendente" ? 0.8 : 1,
                      borderColor: item.status === "Pendente" ? theme.colors.warning || "orange" : "transparent",
                      borderWidth: item.status === "Pendente" ? 2 : 0,
                    },
                  ]}
                >
                  <Card.Content>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          variant="titleLarge"
                          style={{ color: theme.colors.onSurface }}
                        >
                          {item.titulo}
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            marginTop: 4,
                          }}
                        >
                          {item.descricao}
                        </Text>
                      </View>
                      {(item as any).fonte && (
                        <Chip
                          compact
                          style={{ marginLeft: 8 }}
                          icon={
                            (item as any).fonte === "xml"
                              ? "file-document"
                              : "cloud"
                          }
                        >
                          {(item as any).fonte === "xml" ? "XML" : "Cloud"}
                        </Chip>
                      )}
                      
                      {item.status === "Pendente" && (
                        <Chip
                          compact
                          style={{ marginLeft: 8, backgroundColor: theme.colors.errorContainer }}
                          textStyle={{ color: theme.colors.onErrorContainer }}
                          icon="clock-alert-outline"
                        >
                          Pendente
                        </Chip>
                      )}
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      <Chip compact>{item.categoria}</Chip>
                      <Chip compact>{item.nivel}</Chip>
                      <Chip compact>
                        {(item as any).numeroPaginas ||
                          item.paginas?.length ||
                          0}{" "}
                        páginas
                      </Chip>
                      {!(item as any).editavel && (
                        <Chip compact icon="lock">
                          Protegido
                        </Chip>
                      )}
                    </View>
                  </Card.Content>
                  <Card.Actions>
                    {(item as any).editavel && (
                      <Button
                        icon="pencil"
                        onPress={() => abrirEdicaoCurso(item)}
                        disabled={carregando}
                      >
                        Editar
                      </Button>
                    )}
                    {item.status === "Aprovado" && (
                      <Menu
                        visible={menuAcoesVisivel === item.id}
                        onDismiss={() => setMenuAcoesVisivel(null)}
                        anchor={
                          <IconButton
                            icon="dots-vertical"
                            onPress={() => setMenuAcoesVisivel(item.id)}
                          />
                        }
                      >
                        {(item.criadoPor === userFirebase?.uid || userFirebase?.perfil === Perfil.Moderador) && (
                          <Menu.Item
                            leadingIcon="chart-bar"
                            onPress={() => {
                              setMenuAcoesVisivel(null);
                              setAnalyticsCursoId(item.id);
                              setAnalyticsCursoTitulo(item.titulo);
                              setAnalyticsVisivel(true);
                            }}
                            title="Análise"
                          />
                        )}
                        <Menu.Item
                          leadingIcon="delete"
                          onPress={() => {
                            setMenuAcoesVisivel(null);
                            setCursoExcluir(item);
                            setDialogExcluirVisivel(true);
                          }}
                          title="Solicitar Exclusão"
                        />
                      </Menu>
                    )}
                  </Card.Actions>
                </Card>
              )}
            />
          )}

        </ScrollView>

        {/* Dialog Criar/Editar Curso */}
        <Portal>
          <Modal
            visible={dialogCriarVisivel}
            onDismiss={() => {
              setDialogCriarVisivel(false);
              setModoEdicao(false);
              setCursoEditando(null);
            }}
            contentContainerStyle={{
              margin: 20,
              height: "90%",
            }}
          >
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, padding: 20, backgroundColor: theme.colors.surface, borderRadius: 12, overflow: 'hidden' }}>
              <Text
                variant="headlineSmall"
                style={{ marginBottom: 16, fontWeight: "bold" }}
              >
                {modoEdicao
                  ? "Editar Curso"
                  : etapaCriacao === "info"
                  ? "Informações do Curso"
                  : etapaCriacao === "paginas"
                  ? "Páginas do Curso"
                  : "Revisão"}
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* ETAPA 1: INFORMAÇÕES */}
                {etapaCriacao === "info" && (
                  <View>
                    <TextInput
                      label="Título do Curso *"
                      value={titulo}
                      onChangeText={setTitulo}
                      mode="outlined"
                      style={styles.input}
                      returnKeyType="next"
                      onSubmitEditing={() => siglaRef.current?.focus()}
                    />
                    <TextInput
                      ref={siglaRef}
                      label="Sigla do Curso *"
                      value={siglaCurso}
                      onChangeText={(text) =>
                        setSiglaCurso(
                          text.toLowerCase().replace(/[^a-z0-9]/g, "")
                        )
                      }
                      mode="outlined"
                      placeholder="Ex: js, py, react (para nomenclatura de imagens)"
                      style={styles.input}
                      returnKeyType="next"
                      onSubmitEditing={() => descricaoRef.current?.focus()}
                    />
                    <TextInput
                      ref={descricaoRef}
                      label="Descrição *"
                      value={descricao}
                      onChangeText={setDescricao}
                      mode="outlined"
                      multiline
                      numberOfLines={3}
                      style={styles.input}
                      returnKeyType="next"
                    />
                    <TextInput
                      ref={categoriaRef}
                      label="Categoria *"
                      value={categoria}
                      onChangeText={setCategoria}
                      mode="outlined"
                      placeholder="Ex: Programação, Design, Marketing..."
                      style={styles.input}
                      returnKeyType="next"
                      onSubmitEditing={() => versaoRef.current?.focus()}
                    />

                    <TextInput
                      ref={versaoRef}
                      label="Versão da Linguagem"
                      value={versaoLinguagem}
                      onChangeText={setVersaoLinguagem}
                      mode="outlined"
                      placeholder="Ex: ES6+, Python 3.12, React 18..."
                      style={styles.input}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                      }}
                    />

                    {/* Imagem de Capa */}
                    <Text
                      variant="bodySmall"
                      style={{ marginTop: 16, marginBottom: 4 }}
                    >
                      Imagem de Capa do Curso:
                    </Text>
                    <Button
                      mode="outlined"
                      icon="image"
                      onPress={selecionarImagemCapa}
                      style={styles.input}
                    >
                      {imagemCapaLocal
                        ? "Alterar Imagem de Capa"
                        : "Selecionar Imagem de Capa"}
                    </Button>
                    {imagemCapaLocal && (
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.primary, marginTop: 4 }}
                      >
                        ✓ Imagem selecionada
                      </Text>
                    )}

                    <Text
                      variant="bodySmall"
                      style={{ marginTop: 12, marginBottom: 4 }}
                    >
                      Nível do Curso:
                    </Text>
                    <SegmentedButtons
                      value={nivel}
                      onValueChange={(value) => setNivel(value as any)}
                      buttons={[
                        { value: "iniciante", label: "Iniciante" },
                        { value: "intermediario", label: "Intermediário" },
                        { value: "avancado", label: "Avançado" },
                      ]}
                    />

                    {/* Documentação Vinculada */}
                    <Text variant="bodySmall" style={{ marginTop: 16, marginBottom: 4 }}>
                      Documentação Vinculada (Opcional):
                    </Text>
                    <Menu
                      visible={menuDocVisivel}
                      onDismiss={() => setMenuDocVisivel(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setMenuDocVisivel(true)}
                          style={styles.input}
                          icon="file-document"
                        >
                          {documentacaoSelecionada
                            ? documentacoesDisponiveis.find(d => d.id === documentacaoSelecionada)?.titulo || "Documentação Selecionada"
                            : "Selecionar Documentação"}
                        </Button>
                      }
                    >
                      <Menu.Item 
                        onPress={() => {
                          setDocumentacaoSelecionada(undefined);
                          setMenuDocVisivel(false);
                        }} 
                        title="Nenhuma" 
                      />
                      <Divider />
                      {documentacoesDisponiveis.map((doc) => (
                        <Menu.Item
                          key={doc.id}
                          onPress={() => {
                            setDocumentacaoSelecionada(doc.id);
                            setMenuDocVisivel(false);
                          }}
                          title={doc.titulo}
                        />
                      ))}
                    </Menu>
                  </View>
                )}

                {/* ETAPA 2: PÁGINAS */}
                {etapaCriacao === "paginas" && (
                  <View>
                    <Button
                      mode="contained"
                      icon="plus"
                      onPress={() => abrirDialogPagina()}
                      style={{ marginBottom: 16 }}
                    >
                      Adicionar Página
                    </Button>

                    {paginas.map((pagina, index) => (
                      <Card
                        key={pagina.id}
                        style={{
                          marginBottom: 12,
                          backgroundColor: theme.colors.surfaceVariant,
                        }}
                      >
                        <Card.Content>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text variant="titleMedium">
                                Página {index + 1}: {pagina.titulo}
                              </Text>
                              <Text variant="bodySmall">
                                {pagina.tipo === "conteudo"
                                  ? "📄 Conteúdo"
                                  : pagina.tipo === "exercicio_codigo"
                                  ? "Exercício de Código"
                                  : "Exercício"}
                              </Text>
                              {pagina.tipo === "exercicio" && (
                                <Text variant="bodySmall">
                                  {pagina.questoes?.length || 0} questões
                                </Text>
                              )}
                              {pagina.tipo === "exercicio_codigo" && (
                                <Text variant="bodySmall">
                                  {pagina.questoesEscrita?.length || 0} exercício(s) de código
                                </Text>
                              )}
                            </View>
                            <View style={{ flexDirection: "row" }}>
                              <IconButton
                                icon="pencil"
                                size={20}
                                onPress={() => abrirDialogPagina(pagina)}
                              />
                              <IconButton
                                icon="delete"
                                size={20}
                                onPress={() => removerPagina(pagina.id)}
                              />
                            </View>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}

                {/* ETAPA 3: REVISÃO */}
                {etapaCriacao === "revisao" && (
                  <View>
                    <Card
                      style={{
                        marginBottom: 12,
                        backgroundColor: theme.colors.surfaceVariant,
                      }}
                    >
                      <Card.Content>
                        <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                          Informações Gerais
                        </Text>
                        <Text variant="bodyMedium">
                          <Text style={{ fontWeight: "bold" }}>Título:</Text>{" "}
                          {titulo}
                        </Text>
                        <Text variant="bodyMedium">
                          <Text style={{ fontWeight: "bold" }}>Categoria:</Text>{" "}
                          {categoria}
                        </Text>
                        <Text variant="bodyMedium">
                          <Text style={{ fontWeight: "bold" }}>Nível:</Text>{" "}
                          {nivel}
                        </Text>
                        <Text variant="bodyMedium">
                          <Text style={{ fontWeight: "bold" }}>
                            Total de Páginas:
                          </Text>{" "}
                          {paginas.length}
                        </Text>
                      </Card.Content>
                    </Card>

                    <Text variant="titleSmall" style={{ marginVertical: 8 }}>
                      Estrutura do Curso:
                    </Text>
                    {paginas.map((pagina, index) => (
                      <Text
                        key={pagina.id}
                        variant="bodyMedium"
                        style={{ marginBottom: 4 }}
                      >
                        {index + 1}. {pagina.titulo} ({pagina.tipo})
                      </Text>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 8,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.outlineVariant,
                }}
              >
                {etapaCriacao !== "info" && (
                  <Button onPress={voltarEtapa}>Voltar</Button>
                )}
                <Button
                  onPress={() => {
                    setDialogCriarVisivel(false);
                    limparFormularioCurso();
                  }}
                >
                  Cancelar
                </Button>
                {etapaCriacao !== "revisao" ? (
                  <Button mode="contained" onPress={avancarEtapa}>
                    Avançar
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    onPress={salvarCurso}
                    loading={carregando}
                    disabled={carregando}
                  >
                    {modoEdicao ? "Salvar Alterações" : "Criar Curso"}
                  </Button>
                )}
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>

        {/* Dialog Página */}
        <Portal>
          <Modal
            visible={dialogPaginaVisivel}
            onDismiss={() => setDialogPaginaVisivel(false)}
            contentContainerStyle={{
              margin: 20,
              height: "90%",
            }}
          >
            <KeyboardAvoidingView 
              behavior="padding" 
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
              style={{ flex: 1, padding: 20, backgroundColor: theme.colors.surface, borderRadius: 12, overflow: 'hidden' }}
            >
              <Text
                variant="headlineSmall"
                style={{ marginBottom: 16, fontWeight: "bold" }}
              >
                {paginaEditando ? "Editar Página" : "Nova Página"}
              </Text>
              
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <TextInput
                  label="Título da Página *"
                  value={paginaTitulo}
                  onChangeText={setPaginaTitulo}
                  mode="outlined"
                  style={styles.input}
                  returnKeyType={paginaTipo === "conteudo" ? "next" : "done"}
                  onSubmitEditing={() => {
                    if (paginaTipo === "conteudo") {
                      // Focus no campo de conteúdo
                    }
                  }}
                />

                <Text
                  variant="bodySmall"
                  style={{ marginTop: 12, marginBottom: 4 }}
                >
                  Tipo de Página:
                </Text>
                <SegmentedButtons
                  value={paginaTipo}
                  onValueChange={(value) => setPaginaTipo(value as any)}
                  buttons={[
                    { value: "conteudo", label: "Conteúdo", icon: "text-box" },
                    {
                      value: "exercicio",
                      label: "Quiz",
                      icon: "file-question",
                    },
                    {
                      value: "exercicio_codigo",
                      label: "Código",
                      icon: "code-braces",
                    },
                    {
                      value: "exercicio_blocos",
                      label: "Blocos",
                      icon: "drag",
                    },
                  ]}
                  style={{ marginBottom: 16 }}
                />

                {paginaTipo === "conteudo" && (
                  <TextInput
                    label="Conteúdo *"
                    value={paginaConteudo}
                    onChangeText={setPaginaConteudo}
                    mode="outlined"
                    multiline
                    numberOfLines={8}
                    style={styles.input}
                  />
                )}

                <Button
                  mode="outlined"
                  icon="image"
                  onPress={selecionarImagem}
                  style={{ marginVertical: 8 }}
                >
                  {paginaImagemUrl
                    ? "Alterar Imagem"
                    : "Adicionar Imagem (Opcional)"}
                </Button>

                {paginaTipo === "exercicio" && (
                  <View style={{ marginTop: 16 }}>
                    <Button
                      mode="contained"
                      icon="plus"
                      onPress={() => abrirDialogQuestao()}
                      style={{ marginBottom: 12 }}
                    >
                      Adicionar Questão
                    </Button>

                    {questoesPagina.map((questao, index) => (
                      <Card
                        key={questao.id}
                        style={{
                          marginBottom: 8,
                          backgroundColor: theme.colors.surfaceVariant,
                        }}
                      >
                        <Card.Content>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text variant="bodyMedium" numberOfLines={2}>
                                {index + 1}. {questao.pergunta}
                              </Text>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                              <IconButton
                                icon="pencil"
                                size={18}
                                onPress={() => abrirDialogQuestao(questao)}
                              />
                              <IconButton
                                icon="delete"
                                size={18}
                                onPress={() => removerQuestao(questao.id)}
                              />
                            </View>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}

                {/* EXERCÍCIOS DE CÓDIGO */}
                {paginaTipo === "exercicio_codigo" && (
                  <View style={{ marginTop: 16 }}>
                    <Button
                      mode="contained"
                      icon="plus"
                      onPress={() => abrirDialogQuestaoEscrita()}
                      style={{ marginBottom: 12 }}
                      accessibilityLabel="Adicionar exercício de código"
                    >
                      Adicionar Exercício de Código
                    </Button>

                    {questoesEscritaPagina.map((questao, index) => (
                      <Card
                        key={questao.id}
                        style={{
                          marginBottom: 8,
                          backgroundColor: theme.colors.surfaceVariant,
                        }}
                      >
                        <Card.Content>
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text variant="bodyMedium" numberOfLines={2}>
                                {index + 1}. {questao.enunciado}
                              </Text>
                              <Chip compact style={{ marginTop: 4, alignSelf: "flex-start" }}>
                                {questao.linguagem === "python3" ? "Python" : questao.linguagem === "nodejs" ? "JavaScript" : "C"} • {questao.casosTeste.length} teste(s)
                              </Chip>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                              <IconButton
                                icon="pencil"
                                size={18}
                                onPress={() => abrirDialogQuestaoEscrita(questao)}
                              />
                              <IconButton
                                icon="delete"
                                size={18}
                                onPress={() => removerQuestaoEscrita(questao.id)}
                              />
                            </View>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}

                {/* EXERCÍCIOS DE BLOCOS */}
                {paginaTipo === "exercicio_blocos" && (
                  <View style={{ marginTop: 16 }}>
                    <Button
                      mode="contained"
                      icon="plus"
                      onPress={() => abrirDialogQuestaoBlocos()}
                      style={{ marginBottom: 12 }}
                      accessibilityLabel="Adicionar exercício de blocos de código"
                    >
                      Adicionar Exercício de Blocos
                    </Button>

                    {questoesBlocosPagina.map((questao, index) => (
                      <Card
                        key={questao.id}
                        style={{ marginBottom: 8, backgroundColor: theme.colors.surfaceVariant }}
                      >
                        <Card.Content>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <View style={{ flex: 1 }}>
                              <Text variant="bodyMedium" numberOfLines={2}>
                                {index + 1}. {questao.enunciado}
                              </Text>
                              <Chip compact style={{ marginTop: 4, alignSelf: "flex-start" }}>
                                {questao.linguagem === "python3" ? "Python" : questao.linguagem === "nodejs" ? "JavaScript" : "C"} • {questao.blocos.length} bloco(s)
                              </Chip>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                              <IconButton
                                icon="pencil"
                                size={18}
                                onPress={() => abrirDialogQuestaoBlocos(questao)}
                              />
                              <IconButton
                                icon="delete"
                                size={18}
                                onPress={() => setQuestoesBlocosPagina(questoesBlocosPagina.filter((q) => q.id !== questao.id))}
                              />
                            </View>
                          </View>
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}
              </ScrollView>
              
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 8,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.outlineVariant,
                }}
              >
                <Button onPress={() => setDialogPaginaVisivel(false)}>
                  Cancelar
                </Button>
                <Button onPress={salvarPagina} mode="contained">Salvar Página</Button>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>

        {/* Dialog Questão */}
        <Portal>
          <Modal
            visible={dialogQuestaoVisivel}
            onDismiss={() => setDialogQuestaoVisivel(false)}
            contentContainerStyle={{
              margin: 20,
              height: "90%",
            }}
          >
            <KeyboardAvoidingView 
              behavior="padding" 
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
              style={{ flex: 1, padding: 20, backgroundColor: theme.colors.surface, borderRadius: 12, overflow: 'hidden' }}
            >
              <Text
                variant="headlineSmall"
                style={{ marginBottom: 16, fontWeight: "bold" }}
              >
                {questaoEditando ? "Editar Questão" : "Nova Questão"}
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <TextInput
                  label="Pergunta *"
                  value={questaoPergunta}
                  onChangeText={setQuestaoPergunta}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  returnKeyType="next"
                />

                <Text
                  variant="titleSmall"
                  style={{ marginTop: 16, marginBottom: 8 }}
                >
                  Alternativas:
                </Text>
                {alternativas.map((alt, index) => (
                  <View key={alt.id} style={{ marginBottom: 12 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Chip
                        selected={alt.correta}
                        onPress={() =>
                          atualizarAlternativa(index, "correta", true)
                        }
                        style={{ minWidth: 40 }}
                      >
                        {alt.id.toUpperCase()}
                      </Chip>
                      <TextInput
                        value={alt.texto}
                        onChangeText={(text) =>
                          atualizarAlternativa(index, "texto", text)
                        }
                        mode="outlined"
                        dense
                        style={{ flex: 1 }}
                        placeholder={`Alternativa ${alt.id.toUpperCase()}`}
                        ref={(el) => (alternativaRefs.current[index] = el)}
                        returnKeyType="next"
                        onSubmitEditing={() => {
                          if (index < alternativas.length - 1) {
                            alternativaRefs.current[index + 1]?.focus();
                          } else {
                            explicacaoRef.current?.focus();
                          }
                        }}
                        blurOnSubmit={false}
                      />
                    </View>
                  </View>
                ))}

                <TextInput
                  ref={explicacaoRef}
                  label="Explicação (Opcional)"
                  value={questaoExplicacao}
                  onChangeText={setQuestaoExplicacao}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 8,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.outlineVariant,
                }}
              >
                <Button onPress={() => setDialogQuestaoVisivel(false)}>
                  Cancelar
                </Button>
                <Button onPress={salvarQuestao} mode="contained">Salvar Questão</Button>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>

        {/* Dialog Questão de Código */}
        <Portal>
          <Modal
            visible={dialogQuestaoEscritaVisivel}
            onDismiss={() => setDialogQuestaoEscritaVisivel(false)}
            contentContainerStyle={{
              margin: 16,
              height: "92%",
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
              style={{ flex: 1, padding: 20, backgroundColor: theme.colors.surface, borderRadius: 12, overflow: 'hidden' }}
            >
              <Text
                variant="headlineSmall"
                style={{ marginBottom: 16, fontWeight: "bold", color: theme.colors.onSurface }}
              >
                {questaoEscritaEditando ? "Editar Exercício de Código" : "Novo Exercício de Código"}
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Linguagem */}
                <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                  Linguagem *
                </Text>
                <SegmentedButtons
                  value={escritaLinguagem}
                  onValueChange={(value) => {
                    setEscritaLinguagem(value as LinguagemCodigo);
                    if (!questaoEscritaEditando) {
                      setEscritaCodigoBase(getCodigoBasePadrao(value as LinguagemCodigo));
                    }
                  }}
                  buttons={[
                    { value: "python3", label: "Python", icon: "language-python" },
                    { value: "nodejs", label: "JavaScript", icon: "language-javascript" },
                    { value: "c", label: "C", icon: "language-c" },
                  ]}
                  style={{ marginBottom: 16 }}
                />

                {/* Enunciado */}
                <TextInput
                  label="Enunciado do Exercício *"
                  value={escritaEnunciado}
                  onChangeText={setEscritaEnunciado}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  placeholder="Descreva o que o aluno deve fazer. Ex: Complete a função para retornar a soma de dois números."
                  accessibilityLabel="Enunciado do exercício"
                />

                {/* Código Base */}
                <Text variant="labelLarge" style={{ marginTop: 8, marginBottom: 4, color: theme.colors.onSurface }}>
                  Código Base (Template) * — o que o aluno verá
                </Text>
                <Text variant="bodySmall" style={{ marginBottom: 4, color: theme.colors.onSurfaceVariant }}>
                  Escreva o código completo e use __EDITAR__ para marcar as lacunas onde o aluno deve escrever. As partes sem __EDITAR__ ficam bloqueadas (somente leitura).
                </Text>
                <Text variant="bodySmall" style={{ marginBottom: 8, color: theme.colors.tertiary, fontStyle: 'italic' }}>
                  Exemplo: def soma(a, b):{"\n"}    # __EDITAR__{"\n"}    pass{"\n"}{"\n"}print(soma(2, 3))
                </Text>
                <TextInput
                  value={escritaCodigoBase}
                  onChangeText={setEscritaCodigoBase}
                  mode="outlined"
                  multiline
                  numberOfLines={10}
                  style={[styles.input, {
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    fontSize: 13,
                  }]}
                  contentStyle={{
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                  accessibilityLabel="Código base do exercício"
                />

                {/* Gabarito / Solução */}
                <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 4, color: theme.colors.onSurface }}>
                  Gabarito / Solução * — código completo e executável
                </Text>
                <Text variant="bodySmall" style={{ marginBottom: 4, color: theme.colors.onSurfaceVariant }}>
                  O gabarito deve ser o programa COMPLETO, idêntico ao Código Base mas com os __EDITAR__ substituídos pela solução correta. Ele é executado no servidor para validar os casos de teste — por isso precisa ser um programa inteiro (não apenas a função).
                </Text>
                <Text variant="bodySmall" style={{ marginBottom: 4, color: theme.colors.error, fontWeight: 'bold' }}>
                  {"Não pode conter __EDITAR__. Use \"Copiar Base\" abaixo e substitua os marcadores pela solução."}
                </Text>
                <Button
                  mode="contained-tonal"
                  icon="content-copy"
                  compact
                  onPress={() => setEscritaGabarito(escritaCodigoBase.replace(/__EDITAR__/g, ''))}
                  style={{ alignSelf: "flex-start", marginBottom: 4 }}
                  accessibilityLabel="Copiar código base para o gabarito, removendo marcadores __EDITAR__"
                >
                  Copiar Base (sem __EDITAR__) para Gabarito
                </Button>
                <TextInput
                  value={escritaGabarito}
                  onChangeText={setEscritaGabarito}
                  mode="outlined"
                  multiline
                  numberOfLines={10}
                  style={[styles.input, {
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    fontSize: 13,
                  }]}
                  contentStyle={{
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    fontSize: 13,
                    lineHeight: 20,
                  }}
                  placeholder="Cole aqui o programa completo com a solução (sem __EDITAR__). Ex: o Código Base com as lacunas preenchidas."
                  accessibilityLabel="Gabarito do exercício"
                />

                {/* Casos de Teste */}
                <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 4, color: theme.colors.onSurface }}>
                  Casos de Teste * (min. 1)
                </Text>
                <Text variant="bodySmall" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
                  Defina entradas (stdin) e saídas esperadas (stdout) para validar o código do aluno.
                </Text>

                {escritaCasosTeste.map((ct, index) => (
                  <Card
                    key={ct.id}
                    style={{ marginBottom: 12, backgroundColor: theme.colors.surfaceVariant, borderRadius: 10 }}
                  >
                    <Card.Content>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                          {ct.descricao || `Teste ${index + 1}`}
                        </Text>
                        {escritaCasosTeste.length > 1 && (
                          <IconButton
                            icon="delete"
                            size={18}
                            onPress={() => removerCasoTeste(ct.id)}
                            accessibilityLabel={`Remover teste ${index + 1}`}
                          />
                        )}
                      </View>
                      <TextInput
                        label="Descrição (opcional)"
                        value={ct.descricao || ""}
                        onChangeText={(text) => atualizarCasoTeste(ct.id, "descricao", text)}
                        mode="outlined"
                        dense
                        style={{ marginBottom: 8 }}
                      />
                      <TextInput
                        label="Entrada (stdin)"
                        value={ct.entrada}
                        onChangeText={(text) => atualizarCasoTeste(ct.id, "entrada", text)}
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        dense
                        placeholder="Dados de entrada que o programa receberá (pode ser vazio)"
                        style={{ marginBottom: 8, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                        contentStyle={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                      />
                      <TextInput
                        label="Saída Esperada (stdout) *"
                        value={ct.saidaEsperada}
                        onChangeText={(text) => atualizarCasoTeste(ct.id, "saidaEsperada", text)}
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        dense
                        placeholder="O que o stdout deve exibir"
                        style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                        contentStyle={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                      />
                    </Card.Content>
                  </Card>
                ))}

                <Button
                  mode="outlined"
                  icon="plus"
                  onPress={adicionarCasoTeste}
                  style={{ marginBottom: 16 }}
                  accessibilityLabel="Adicionar mais um caso de teste"
                >
                  Adicionar Caso de Teste
                </Button>

                {/* Dica */}
                <TextInput
                  label="Dica (opcional)"
                  value={escritaDica}
                  onChangeText={setEscritaDica}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                  placeholder="Uma dica que o aluno pode revelar se precisar de ajuda"
                />

                {/* Explicação */}
                <TextInput
                  label="Explicação (exibida após responder)"
                  value={escritaExplicacao}
                  onChangeText={setEscritaExplicacao}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  placeholder="Explicação da solução correta"
                />

                {/* Modo Encapsulado */}
                <Divider style={{ marginVertical: 12 }} />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
                    Modo Encapsulado (Wrapper)
                  </Text>
                  <Button
                    mode={escritaModoEncapsulado ? "contained" : "outlined"}
                    compact
                    onPress={() => setEscritaModoEncapsulado(!escritaModoEncapsulado)}
                    accessibilityLabel={escritaModoEncapsulado ? "Desativar modo encapsulado" : "Ativar modo encapsulado"}
                  >
                    {escritaModoEncapsulado ? "Ativo" : "Inativo"}
                  </Button>
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                  No modo encapsulado, o aluno digita apenas a parte central. O wrapper é adicionado automaticamente ao executar.
                </Text>
                {escritaModoEncapsulado && (
                  <>
                    <TextInput
                      label="Código antes (wrapper superior)"
                      value={escritaWrapperAntes}
                      onChangeText={setEscritaWrapperAntes}
                      mode="outlined"
                      multiline
                      numberOfLines={4}
                      style={[styles.input, { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }]}
                      contentStyle={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                      placeholder="Ex: def calcular(n):"
                      accessibilityLabel="Código exibido acima do campo do aluno (read-only)"
                    />
                    <TextInput
                      label="Código depois (wrapper inferior)"
                      value={escritaWrapperDepois}
                      onChangeText={setEscritaWrapperDepois}
                      mode="outlined"
                      multiline
                      numberOfLines={4}
                      style={[styles.input, { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }]}
                      contentStyle={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                      placeholder="Ex: print(calcular(5))"
                      accessibilityLabel="Código exibido abaixo do campo do aluno (read-only)"
                    />
                  </>
                )}

                {/* Teste do Gabarito */}
                <Divider style={{ marginVertical: 12 }} />
                <Button
                  mode="contained-tonal"
                  icon="play-circle"
                  onPress={testarGabarito}
                  loading={testandoGabarito}
                  disabled={testandoGabarito}
                  style={{ marginBottom: 8 }}
                  accessibilityLabel="Testar gabarito contra os casos de teste"
                >
                  Testar Gabarito no Jobe
                </Button>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                  Executa o gabarito no Jobe para verificar se os casos de teste estão corretos.
                </Text>
                {resultadoTesteGabarito && (
                  <Card style={{ marginBottom: 12, backgroundColor: resultadoTesteGabarito.startsWith("[OK]") ? theme.colors.primaryContainer : theme.colors.errorContainer, borderRadius: 8 }}>
                    <Card.Content>
                      <Text variant="bodyMedium" style={{ color: resultadoTesteGabarito.startsWith("[OK]") ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer }}>
                        {resultadoTesteGabarito}
                      </Text>
                    </Card.Content>
                  </Card>
                )}
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 8,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.outlineVariant,
                }}
              >
                <Button onPress={() => setDialogQuestaoEscritaVisivel(false)}>
                  Cancelar
                </Button>
                <Button onPress={salvarQuestaoEscrita} mode="contained">
                  Salvar Exercício
                </Button>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>

        {/* Dialog Exercício de Blocos */}
        <Portal>
          <Modal
            visible={dialogQuestaoBlocosVisivel}
            onDismiss={() => setDialogQuestaoBlocosVisivel(false)}
            contentContainerStyle={{ margin: 16, height: "92%" }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
              style={{ flex: 1, padding: 20, backgroundColor: theme.colors.surface, borderRadius: 12, overflow: "hidden" }}
            >
              <Text variant="headlineSmall" style={{ marginBottom: 16, fontWeight: "bold", color: theme.colors.onSurface }}>
                {questaoBlocosEditando ? "Editar Exercício de Blocos" : "Novo Exercício de Blocos"}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
                {/* Linguagem */}
                <Text variant="labelLarge" style={{ marginBottom: 8, color: theme.colors.onSurface }}>Linguagem *</Text>
                <SegmentedButtons
                  value={blocosLinguagem}
                  onValueChange={(value) => setBlocosLinguagem(value as LinguagemCodigo)}
                  buttons={[
                    { value: "python3", label: "Python", icon: "language-python" },
                    { value: "nodejs", label: "JavaScript", icon: "language-javascript" },
                    { value: "c", label: "C", icon: "language-c" },
                  ]}
                  style={{ marginBottom: 16 }}
                />

                {/* Enunciado */}
                <TextInput
                  label="Enunciado *"
                  value={blocosEnunciado}
                  onChangeText={setBlocosEnunciado}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  placeholder="O que o aluno deve fazer com os blocos?"
                  accessibilityLabel="Enunciado do exercício de blocos"
                />

                {/* Saída esperada */}
                <TextInput
                  label="Saída Esperada (stdout) *"
                  value={blocosSaidaEsperada}
                  onChangeText={setBlocosSaidaEsperada}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  style={[styles.input, { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }]}
                  contentStyle={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                  placeholder="Saída que o programa deve produzir na ordem correta"
                  accessibilityLabel="Saída esperada quando os blocos estão na ordem correta"
                />

                {/* Blocos */}
                <Text variant="labelLarge" style={{ marginTop: 8, marginBottom: 4, color: theme.colors.onSurface }}>
                  Blocos de Código *
                </Text>
                <Text variant="bodySmall" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
                  Defina cada bloco (uma linha ou instrução). O campo {'"'}Ordem{'"'} indica a posição correta. Marque {'"'}Distrator{'"'} para blocos que não fazem parte da solução.
                </Text>

                {blocosLista.map((bloco, index) => (
                  <Card key={bloco.id} style={{ marginBottom: 10, backgroundColor: theme.colors.surfaceVariant, borderRadius: 10 }}>
                    <Card.Content>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                          Bloco {index + 1} {bloco.distrator ? "(Distrator)" : `(Ordem: ${bloco.ordem})`}
                        </Text>
                        {blocosLista.length > 1 && (
                          <IconButton icon="delete" size={18} onPress={() => removerBloco(bloco.id)} accessibilityLabel={`Remover bloco ${index + 1}`} />
                        )}
                      </View>
                      <TextInput
                        label="Código do bloco *"
                        value={bloco.codigo}
                        onChangeText={(text) => atualizarBloco(bloco.id, "codigo", text)}
                        mode="outlined"
                        dense
                        style={{ marginBottom: 8, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                        contentStyle={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 13 }}
                        placeholder='Ex: print("Olá")'
                        accessibilityLabel={`Código do bloco ${index + 1}`}
                      />
                      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                        {!bloco.distrator && (
                          <TextInput
                            label="Ordem"
                            value={String(bloco.ordem)}
                            onChangeText={(text) => atualizarBloco(bloco.id, "ordem", parseInt(text) || 1)}
                            mode="outlined"
                            dense
                            keyboardType="numeric"
                            style={{ width: 80 }}
                            accessibilityLabel={`Posição correta do bloco ${index + 1}`}
                          />
                        )}
                        <Button
                          mode={bloco.distrator ? "contained" : "outlined"}
                          compact
                          onPress={() => atualizarBloco(bloco.id, "distrator", !bloco.distrator)}
                          accessibilityLabel={bloco.distrator ? "Remover marcação de distrator" : "Marcar como distrator"}
                        >
                          {bloco.distrator ? "Distrator ✓" : "Distrator?"}
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                ))}

                <Button mode="outlined" icon="plus" onPress={adicionarBloco} style={{ marginBottom: 16 }} accessibilityLabel="Adicionar novo bloco">
                  Adicionar Bloco
                </Button>

                {/* Dica */}
                <TextInput
                  label="Dica (opcional)"
                  value={blocosDica}
                  onChangeText={setBlocosDica}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                  placeholder="Dica opcional para o aluno"
                  accessibilityLabel="Dica do exercício de blocos"
                />

                {/* Explicação */}
                <TextInput
                  label="Explicação (exibida após responder)"
                  value={blocosExplicacao}
                  onChangeText={setBlocosExplicacao}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  placeholder="Explicação da solução correta"
                  accessibilityLabel="Explicação pós-resposta do exercício de blocos"
                />
              </ScrollView>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
                <Button onPress={() => setDialogQuestaoBlocosVisivel(false)}>Cancelar</Button>
                <Button onPress={salvarQuestaoBlocos} mode="contained">Salvar Exercício</Button>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>

        {/* Dialog Excluir */}
        <Portal>
          <Dialog
            visible={dialogExcluirVisivel}
            onDismiss={() => setDialogExcluirVisivel(false)}
          >
            <Dialog.Icon icon="alert-circle-outline" size={60} />
            <Dialog.Title style={styles.textDialog}>
              Solicitar Exclusão de Curso
            </Dialog.Title>
            <Dialog.Content>
              {cursoExcluir && (
                <>
                  <Text style={styles.textDialog} variant="titleMedium">
                    {cursoExcluir.titulo}
                  </Text>
                  <Text
                    style={[
                      styles.textDialog,
                      { marginTop: 8, marginBottom: 12 },
                    ]}
                    variant="bodySmall"
                  >
                    {(cursoExcluir as any).fonte === "xml"
                      ? "Este é um curso XML estático do sistema"
                      : "Curso criado por colaborador"}
                  </Text>
                </>
              )}
              <Text style={styles.textDialog} variant="bodyMedium">
                A exclusão requer aprovação do administrador. Informe o motivo:
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Ex: Conteúdo desatualizado, informações incorretas..."
                value={motivoExclusao}
                onChangeText={setMotivoExclusao}
                multiline
                numberOfLines={4}
                style={{ marginTop: 12 }}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setDialogExcluirVisivel(false);
                  setMotivoExclusao("");
                  setCursoExcluir(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onPress={() => cursoExcluir && solicitarExclusao(cursoExcluir)}
                loading={carregando}
                disabled={carregando || !motivoExclusao.trim()}
                textColor={theme.colors.error}
              >
                Solicitar Exclusão
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Dialog Mensagem */}
        <Portal>
          <Dialog
            visible={dialogMensagemVisivel}
            onDismiss={() => setDialogMensagemVisivel(false)}
          >
            <Dialog.Icon
              icon={
                mensagem.tipo === "erro"
                  ? "alert-circle-outline"
                  : "check-circle-outline"
              }
              size={60}
            />
            <Dialog.Title style={styles.textDialog}>
              {mensagem.tipo === "erro" ? "Erro" : "Sucesso"}
            </Dialog.Title>
            <Dialog.Content>
              <Text style={styles.textDialog} variant="bodyLarge">
                {mensagem.mensagem}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogMensagemVisivel(false)}>OK</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Painel de Análise de Questões (IRT) */}
        <QuestionAnalyticsPanel
          visible={analyticsVisivel}
          onDismiss={() => setAnalyticsVisivel(false)}
          cursoId={analyticsCursoId}
          cursoTitulo={analyticsCursoTitulo}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  pageTitle: {
    fontWeight: "700",
  },
  input: {
    marginBottom: 12,
  },
  textDialog: {
    textAlign: "center",
  },
});
