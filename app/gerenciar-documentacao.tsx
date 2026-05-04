import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Documentacao, TipoDocumentacao } from "@/model/Documentacao";
import { Perfil } from "@/model/Perfil";
import { DocumentacaoService } from "@/services/shared/DocumentacaoService";
import { SolicitacaoService } from "@/services/shared/SolicitacaoService";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
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
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function GerenciarDocumentacao() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase } = useContext<any>(UserContext);

  const [documentacoes, setDocumentacoes] = useState<Documentacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Dialog de criação/edição
  const [dialogDocVisivel, setDialogDocVisivel] = useState(false);
  const [docEditando, setDocEditando] = useState<Documentacao | null>(null);
  const [docTitulo, setDocTitulo] = useState("");
  const [docConteudo, setDocConteudo] = useState("");
  const [docLink, setDocLink] = useState("");
  const [docVersao, setDocVersao] = useState("");
  const [docDataRef, setDocDataRef] = useState("");
  const [docTipo, setDocTipo] = useState<TipoDocumentacao>(TipoDocumentacao.Documentacao);

  // Dialog de mensagem
  const [dialogMensagemVisivel, setDialogMensagemVisivel] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });

  // Refs
  const docConteudoRef = React.useRef<any>(null);
  const docLinkRef = React.useRef<any>(null);
  const docVersaoRef = React.useRef<any>(null);

  useEffect(() => {
    if (userFirebase) {
      carregarDocumentacoes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFirebase]);

  async function carregarDocumentacoes() {
    if (!userFirebase) return;
    try {
      setCarregando(true);
      const isAdmin = userFirebase.perfil === Perfil.Moderador;
      let docs: Documentacao[] = [];
      if (isAdmin) {
        docs = await DocumentacaoService.buscarTodasDocumentacoes();
      } else {
        docs = await DocumentacaoService.buscarDocumentacoesPorAutor(userFirebase.uid);
      }
      setDocumentacoes(docs);
    } catch (error) {
      console.error("Erro ao carregar documentações:", error);
      mostrarMensagem("erro", "Erro ao carregar documentações");
    } finally {
      setCarregando(false);
    }
  }

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

  function abrirEdicaoDocumentacao(doc: Documentacao) {
    setDocEditando(doc);
    setDocTitulo(doc.titulo);
    setDocConteudo(doc.conteudo);
    setDocLink(doc.link || "");
    setDocVersao(doc.versao || "");
    setDocDataRef(doc.dataReferencia || "");
    setDocTipo(doc.tipo);
    setDialogDocVisivel(true);
  }

  async function salvarDocumentacao() {
    if (!docTitulo.trim() || !docConteudo.trim()) {
      mostrarMensagem("erro", "Preencha os campos obrigatórios");
      return;
    }

    try {
      setCarregando(true);
      const isAdmin = userFirebase.perfil === Perfil.Moderador;

      if (docEditando) {
        const dadosAtualizados: Partial<Documentacao> = {
          titulo: docTitulo,
          conteudo: docConteudo,
          link: docLink,
          versao: docVersao,
          dataReferencia: docDataRef,
          tipo: docTipo,
        };

        if (isAdmin || docEditando.autorId === userFirebase.uid) {
          await DocumentacaoService.atualizarDocumentacao(docEditando.id, dadosAtualizados);
          mostrarMensagem("sucesso", "Documentação atualizada com sucesso!");
        } else {
          mostrarMensagem("erro", "Você não tem permissão para editar esta documentação.");
          return;
        }
      } else {
        if (isAdmin) {
          await DocumentacaoService.criarDocumentacao(
            docTitulo, docConteudo, docLink, docVersao, docDataRef,
            docTipo, userFirebase.uid, userFirebase.nome, true
          );
          mostrarMensagem("sucesso", "Documentação publicada com sucesso!");
        } else {
          const docId = await DocumentacaoService.criarDocumentacao(
            docTitulo, docConteudo, docLink, docVersao, docDataRef,
            docTipo, userFirebase.uid, userFirebase.nome, false
          );
          await SolicitacaoService.criarSolicitacaoDocumentacao(
            docId, docTitulo, docLink, docConteudo,
            userFirebase.uid, userFirebase.nome
          );
          mostrarMensagem("sucesso", "Solicitação enviada para aprovação!");
        }
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

  function mostrarMensagem(tipo: string, texto: string) {
    setMensagem({ tipo, mensagem: texto });
    setDialogMensagemVisivel(true);
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView
        style={[themeStyles.container, { backgroundColor: theme.colors.background, flex: 1 }]}
      >
        <IconButton
          icon="arrow-left"
          size={24}
          style={{ alignSelf: 'flex-start', marginTop: 4, marginBottom: -4 }}
          onPress={() => router.back()}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text variant="headlineMedium" style={[styles.pageTitle, { color: theme.colors.onBackground }]}>
                  Documentação
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                  Crie e gerencie documentações para a plataforma
                </Text>
              </View>
              <Button mode="contained" icon="plus" onPress={abrirCriacaoDocumentacao}>
                Nova Doc
              </Button>
            </View>
          </View>

          {documentacoes.length === 0 && !carregando ? (
            <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.outline }]}>
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
                <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
                  <Card.Content>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                          {item.titulo}
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }} numberOfLines={2}>
                          {item.conteudo}
                        </Text>
                        {item.link ? (
                          <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 4 }}>
                            {item.link}
                          </Text>
                        ) : null}
                      </View>
                      <Chip
                        compact
                        style={{ marginLeft: 8 }}
                        icon={item.status === "Aprovada" ? "check" : item.status === "Rejeitada" ? "close" : "clock"}
                      >
                        {item.status}
                      </Chip>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {item.versao ? <Chip compact>{item.versao}</Chip> : null}
                      {item.dataReferencia ? <Chip compact icon="calendar">{item.dataReferencia}</Chip> : null}
                      <Chip compact>{item.tipo}</Chip>
                    </View>
                  </Card.Content>
                  <Card.Actions>
                    {(item.autorId === userFirebase?.uid || userFirebase?.perfil === Perfil.Moderador) && (
                      <Button icon="pencil" onPress={() => abrirEdicaoDocumentacao(item)} disabled={carregando}>
                        Editar
                      </Button>
                    )}
                  </Card.Actions>
                </Card>
              )}
            />
          )}
        </ScrollView>

        {/* Dialog Criar/Editar Documentação */}
        <Portal>
          <Modal
            visible={dialogDocVisivel}
            onDismiss={() => setDialogDocVisivel(false)}
            contentContainerStyle={{ margin: 20, height: "90%" }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1, padding: 20, backgroundColor: theme.colors.surface, borderRadius: 12, overflow: "hidden" }}
            >
              <Text variant="headlineSmall" style={{ marginBottom: 16, fontWeight: "bold" }}>
                {docEditando ? "Editar Documentação" : "Nova Documentação"}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <TextInput
                  label="Título *"
                  value={docTitulo}
                  onChangeText={setDocTitulo}
                  mode="outlined"
                  style={styles.input}
                  returnKeyType="next"
                  onSubmitEditing={() => docConteudoRef.current?.focus()}
                />
                <TextInput
                  ref={docConteudoRef}
                  label="Conteúdo *"
                  value={docConteudo}
                  onChangeText={setDocConteudo}
                  mode="outlined"
                  multiline
                  numberOfLines={8}
                  style={styles.input}
                />
                <TextInput
                  ref={docLinkRef}
                  label="Link (Opcional)"
                  value={docLink}
                  onChangeText={setDocLink}
                  mode="outlined"
                  placeholder="https://..."
                  style={styles.input}
                  returnKeyType="next"
                  onSubmitEditing={() => docVersaoRef.current?.focus()}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TextInput
                    ref={docVersaoRef}
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
              </ScrollView>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
                <Button onPress={() => setDialogDocVisivel(false)}>Cancelar</Button>
                <Button mode="contained" onPress={salvarDocumentacao} loading={carregando} disabled={carregando}>
                  {docEditando ? "Salvar" : "Criar"}
                </Button>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>

        {/* Dialog Mensagem */}
        <Portal>
          <Dialog visible={dialogMensagemVisivel} onDismiss={() => setDialogMensagemVisivel(false)}>
            <Dialog.Icon
              icon={mensagem.tipo === "erro" ? "alert-circle-outline" : "check-circle-outline"}
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
