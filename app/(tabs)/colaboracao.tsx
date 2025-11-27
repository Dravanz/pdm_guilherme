import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { firestore } from "@/firebase/FirebaseInit";
import { Alternativa, Curso, PaginaCurso, Questao } from "@/model/Curso";
import { Documentacao, TipoDocumentacao } from "@/model/Documentacao";
import { Perfil } from "@/model/Perfil";
import { ColaboradorCursoService } from "@/services/curso/ColaboradorCursoService";
import { ImageUploadService } from "@/services/image/ImageUploadService";
import { BancoQuestoesService } from "@/services/questao/BancoQuestoesService";
import { DocumentacaoService } from "@/services/shared/DocumentacaoService";
import { SolicitacaoService } from "@/services/shared/SolicitacaoService";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";

export default function Colaboracao() {
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
  const [paginaTipo, setPaginaTipo] = useState<"conteudo" | "exercicio">(
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

  // DOCUMENTAÇÃO STATE
  const [abaAtiva, setAbaAtiva] = useState<"cursos" | "documentacao">("cursos");
  const [documentacoes, setDocumentacoes] = useState<Documentacao[]>([]);
  const [dialogDocVisivel, setDialogDocVisivel] = useState(false);
  const [docEditando, setDocEditando] = useState<Documentacao | null>(null);
  const [docTitulo, setDocTitulo] = useState("");
  const [docConteudo, setDocConteudo] = useState("");
  const [docLink, setDocLink] = useState("");
  const [docVersao, setDocVersao] = useState("");
  const [docDataRef, setDocDataRef] = useState("");
  const [docTipo, setDocTipo] = useState<TipoDocumentacao>(TipoDocumentacao.Documentacao);

  // Refs para inputs
  const siglaRef = React.useRef<any>(null);
  const descricaoRef = React.useRef<any>(null);
  const categoriaRef = React.useRef<any>(null);
  const versaoRef = React.useRef<any>(null);

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

        setCursos(cursosAtualizados);
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
      const isAdmin = userFirebase?.perfil === Perfil.Admin;
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

  function abrirCriacaoCurso() {
    limparFormularioCurso();
    setModoEdicao(false);
    setCursoEditando(null);
    setEtapaCriacao("info");
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
    } else {
      setPaginaEditando(null);
      setPaginaTitulo("");
      setPaginaTipo("conteudo");
      setPaginaConteudo("");
      setPaginaImagemUrl("");
      setQuestoesPagina([]);
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

    const novaPagina: PaginaCurso = {
      id: paginaEditando?.id || `${paginas.length + 1}`,
      titulo: paginaTitulo,
      tipo: paginaTipo,
      conteudo: paginaConteudo,
      imagem: paginaImagemUrl,
      questoes: paginaTipo === "exercicio" ? questoesPagina : undefined,
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

  // SALVAR CURSO
  async function salvarCurso() {
    if (!userFirebase) return;

    try {
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
      const dadosCurso: Curso = {
        id: cursoId,
        titulo,
        descricao,
        categoria,
        nivel,
        versaoLinguagem: versaoLinguagem || undefined,
        paginas: [], // Não será salvo no Firestore
        coeficienteMaximo: 100,
        imageUrl: imagemCapaUploadUrl, // URL da imagem de capa
        createdAt: null, // Será gerado pelo servidor
        updatedAt: null, // Será gerado pelo servidor
      };

      // Salvar questões no Firestore primeiro
      for (const pagina of paginas) {
        if (pagina.tipo === "exercicio" && pagina.questoes) {
          for (const questao of pagina.questoes) {
            await BancoQuestoesService.salvarQuestao(questao);
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
          userFirebase.uid
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

      xml += `  </pagina>\n\n`;
    }

    xml += `</curso>`;
    return xml;
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

  // DOCUMENTAÇÃO FUNCTIONS
  async function carregarDocumentacoes() {
    if (!userFirebase) return;
    try {
      setCarregando(true);
      const docs = await DocumentacaoService.buscarDocumentacoesPorAutor(userFirebase.uid);
      setDocumentacoes(docs);
    } catch (error) {
      console.error("Erro ao carregar documentações:", error);
      mostrarMensagem("erro", "Erro ao carregar documentações");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (abaAtiva === "documentacao") {
      carregarDocumentacoes();
    }
  }, [abaAtiva, userFirebase]);

  function abrirCriacaoDocumentacao() {
    setDocEditando(null);
    setDocTitulo("");
    setDocConteudo("");
    setDocLink("");
    setDocVersao("");
    setDocDataRef("");
    setDocTipo(TipoDocumentacao.Documentacao);
    setDialogDocVisivel(true);
  }

  async function salvarDocumentacao() {
    if (!docTitulo.trim() || !docConteudo.trim()) {
      mostrarMensagem("erro", "Preencha os campos obrigatórios");
      return;
    }

    try {
      setCarregando(true);
      const isAdmin = userFirebase.perfil === Perfil.Admin;

      if (isAdmin) {
        // Admin cria diretamente
        await DocumentacaoService.criarDocumentacao(
          docTitulo,
          docConteudo,
          docLink,
          docVersao,
          docDataRef,
          docTipo,
          userFirebase.uid,
          userFirebase.nome,
          true
        );
        mostrarMensagem("sucesso", "Documentação publicada com sucesso!");
      } else {
        // Colaborador cria solicitação
        // Primeiro cria a documentação como pendente
        const docId = await DocumentacaoService.criarDocumentacao(
          docTitulo,
          docConteudo,
          docLink,
          docVersao,
          docDataRef,
          docTipo,
          userFirebase.uid,
          userFirebase.nome,
          false
        );

        // Depois cria a solicitação
        await SolicitacaoService.criarSolicitacaoDocumentacao(
          docId,
          docTitulo,
          docLink,
          docConteudo,
          userFirebase.uid,
          userFirebase.nome
        );
        mostrarMensagem("sucesso", "Solicitação enviada para aprovação!");
      }

      setDialogDocVisivel(false);
      carregarDocumentacoes();
    } catch (error) {
      console.error("Erro ao salvar documentação:", error);
      mostrarMensagem("erro", "Erro ao salvar documentação");
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
                  Colaboração - Cursos
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
                >
                  Crie e gerencie cursos para a plataforma
                </Text>
              </View>
              <Button
                mode="contained"
                icon="plus"
                onPress={abaAtiva === "cursos" ? abrirCriacaoCurso : abrirCriacaoDocumentacao}
                style={{ backgroundColor: theme.colors.primary }}
              >
                {abaAtiva === "cursos" ? "Novo Curso" : "Nova Doc"}
              </Button>
            </View>
            
            <SegmentedButtons
              value={abaAtiva}
              onValueChange={(value) => setAbaAtiva(value as any)}
              buttons={[
                { value: "cursos", label: "Cursos", icon: "school" },
                { value: "documentacao", label: "Documentação", icon: "file-document" },
              ]}
              style={{ marginTop: 16 }}
            />
          </View>

          {abaAtiva === "cursos" && (
            cursos.length === 0 && !carregando ? (
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
                    { backgroundColor: theme.colors.surface },
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
                    <Button
                      icon="delete"
                      onPress={() => {
                        setCursoExcluir(item);
                        setDialogExcluirVisivel(true);
                      }}
                    >
                      Solicitar Exclusão
                    </Button>
                  </Card.Actions>
                </Card>
              )}
            />
          ))}

          {abaAtiva === "documentacao" && (
            documentacoes.length === 0 && !carregando ? (
              <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={{ alignItems: "center", padding: 32 }}>
                  <Text style={{ textAlign: "center", color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
                    Nenhuma documentação encontrada.
                  </Text>
                  <Button mode="contained" onPress={abrirCriacaoDocumentacao} icon="plus">
                    Criar Nova Documentação
                  </Button>
                </Card.Content>
              </Card>
            ) : (
              <FlatList
                data={documentacoes}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1 }}>
                          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                            {item.titulo}
                          </Text>
                          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }} numberOfLines={2}>
                            {item.conteudo}
                          </Text>
                          {item.link && (
                            <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 4 }}>
                              🔗 {item.link}
                            </Text>
                          )}
                        </View>
                        <Chip compact style={{ marginLeft: 8 }} icon={item.status === "Aprovada" ? "check" : item.status === "Rejeitada" ? "close" : "clock"}>
                          {item.status}
                        </Chip>
                      </View>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                        {item.versao && <Chip compact>{item.versao}</Chip>}
                        {item.dataReferencia && <Chip compact icon="calendar">{item.dataReferencia}</Chip>}
                      </View>
                    </Card.Content>

                  </Card>
                )}
              />
            )
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
              backgroundColor: theme.colors.surface,
              margin: 20,
              borderRadius: 12,
              height: "90%",
            }}
          >
            <View style={{ flex: 1, padding: 20 }}>
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
                  <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                  >
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
                        if (
                          titulo.trim() &&
                          descricao.trim() &&
                          categoria.trim()
                        ) {
                          avancarEtapa();
                        }
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
                  </KeyboardAvoidingView>
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
                                  : "📝 Exercício"}
                              </Text>
                              {pagina.tipo === "exercicio" && (
                                <Text variant="bodySmall">
                                  {pagina.questoes?.length || 0} questões
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
            </View>
          </Modal>
        </Portal>

        {/* Dialog Página */}
        <Portal>
          <Dialog
            visible={dialogPaginaVisivel}
            onDismiss={() => setDialogPaginaVisivel(false)}
            style={{ maxHeight: "90%" }}
          >
            <Dialog.Title>
              {paginaEditando ? "Editar Página" : "Nova Página"}
            </Dialog.Title>
            <Dialog.Content>
              <ScrollView
                style={{ maxHeight: 500 }}
                showsVerticalScrollIndicator={false}
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
                      label: "Exercício",
                      icon: "file-question",
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
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogPaginaVisivel(false)}>
                Cancelar
              </Button>
              <Button onPress={salvarPagina}>Salvar Página</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Dialog Questão */}
        <Portal>
          <Dialog
            visible={dialogQuestaoVisivel}
            onDismiss={() => setDialogQuestaoVisivel(false)}
            style={{ maxHeight: "90%" }}
          >
            <Dialog.Title>
              {questaoEditando ? "Editar Questão" : "Nova Questão"}
            </Dialog.Title>
            <Dialog.Content>
              <ScrollView
                style={{ maxHeight: 500 }}
                showsVerticalScrollIndicator={false}
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
                      />
                    </View>
                  </View>
                ))}

                <TextInput
                  label="Explicação (Opcional)"
                  value={questaoExplicacao}
                  onChangeText={setQuestaoExplicacao}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  returnKeyType="done"
                />
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogQuestaoVisivel(false)}>
                Cancelar
              </Button>
              <Button onPress={salvarQuestao}>Salvar Questão</Button>
            </Dialog.Actions>
          </Dialog>
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
                      ? "⚠️ Este é um curso XML estático do sistema"
                      : "📝 Curso criado por colaborador"}
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

        {/* Dialog Criar/Editar Documentação */}
        <Portal>
          <Modal
            visible={dialogDocVisivel}
            onDismiss={() => setDialogDocVisivel(false)}
            contentContainerStyle={{
              backgroundColor: theme.colors.surface,
              margin: 20,
              borderRadius: 12,
              height: "90%",
            }}
          >
            <View style={{ flex: 1, padding: 20 }}>
              <Text
                variant="headlineSmall"
                style={{ marginBottom: 16, fontWeight: "bold" }}
              >
                {docEditando ? "Editar Documentação" : "Nova Documentação"}
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                  <TextInput
                    label="Título *"
                    value={docTitulo}
                    onChangeText={setDocTitulo}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label="Conteúdo *"
                    value={docConteudo}
                    onChangeText={setDocConteudo}
                    mode="outlined"
                    multiline
                    numberOfLines={10}
                    style={styles.input}
                  />
                  <TextInput
                    label="Link (Opcional)"
                    value={docLink}
                    onChangeText={setDocLink}
                    mode="outlined"
                    placeholder="https://..."
                    style={styles.input}
                  />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TextInput
                      label="Versão"
                      value={docVersao}
                      onChangeText={setDocVersao}
                      mode="outlined"
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TextInput
                      label="Data (DD/MM/AAAA)"
                      value={docDataRef}
                      onChangeText={setDocDataRef}
                      mode="outlined"
                      style={[styles.input, { flex: 1 }]}
                    />
                  </View>
                </KeyboardAvoidingView>
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
                <Button onPress={() => setDialogDocVisivel(false)}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={salvarDocumentacao}
                  loading={carregando}
                  disabled={carregando}
                >
                  {docEditando ? "Salvar" : "Criar"}
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
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
