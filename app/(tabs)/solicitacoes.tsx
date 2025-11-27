// @ts-nocheck
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import {
  Solicitacao,
  StatusSolicitacao,
  TipoSolicitacao,
} from "@/model/Solicitacao";
import { SolicitacaoService } from "@/services/SolicitacaoService";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { firestore } from "@/firebase/FirebaseInit";
import React, { useContext, useEffect, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function Solicitacoes() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase } = useContext<any>(UserContext);

  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dialogVisivel, setDialogVisivel] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] =
    useState<Solicitacao | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [processando, setProcessando] = useState(false);
  const [filtro, setFiltro] = useState<
    "todas" | "pendentes" | "aprovadas" | "rejeitadas"
  >("pendentes");

  useEffect(() => {
    // Listener em tempo real para solicitações
    const solicitacoesRef = collection(firestore, "solicitacoes");
    const q = query(solicitacoesRef, orderBy("dataEnvio", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const solicitacoesAtualizadas = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          dataEnvio: doc.data().dataEnvio?.toDate?.() || doc.data().dataEnvio,
          dataProcessamento: doc.data().dataProcessamento?.toDate?.() || doc.data().dataProcessamento,
        })) as Solicitacao[];
        
        setSolicitacoes(solicitacoesAtualizadas);
        setCarregando(false);
      },
      (error) => {
        console.error("Erro ao escutar solicitações:", error);
        setCarregando(false);
      }
    );

    // Cleanup: remover listener quando componente desmontar
    return () => unsubscribe();
  }, []);

  async function carregarSolicitacoes() {
    setCarregando(true);
    try {
      const todas = await SolicitacaoService.buscarTodasSolicitacoes();
      setSolicitacoes(todas);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    }
    setCarregando(false);
  }

  async function aprovarSolicitacao(solicitacao: Solicitacao) {
    if (!userFirebase) return;

    setProcessando(true);
    try {
      if (solicitacao.tipo === TipoSolicitacao.Colaboracao) {
        await SolicitacaoService.aprovarSolicitacaoColaboracao(
          solicitacao.id,
          solicitacao.usuarioId,
          userFirebase.uid,
          userFirebase.nome
        );
      } else if (solicitacao.tipo === TipoSolicitacao.ExclusaoCurso) {
        await SolicitacaoService.aprovarExclusaoCurso(
          solicitacao.id,
          solicitacao.cursoId,
          userFirebase.uid,
          userFirebase.nome
        );
      }
      // Listener onSnapshot atualiza automaticamente
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error);
    }
    setProcessando(false);
  }

  async function rejeitarSolicitacao() {
    if (!userFirebase || !solicitacaoSelecionada) return;

    setProcessando(true);
    try {
      if (solicitacaoSelecionada.tipo === TipoSolicitacao.Colaboracao) {
        await SolicitacaoService.rejeitarSolicitacaoColaboracao(
          solicitacaoSelecionada.id,
          userFirebase.uid,
          userFirebase.nome,
          motivoRejeicao
        );
      } else if (
        solicitacaoSelecionada.tipo === TipoSolicitacao.ExclusaoCurso
      ) {
        await SolicitacaoService.rejeitarExclusaoCurso(
          solicitacaoSelecionada.id,
          userFirebase.uid,
          userFirebase.nome,
          motivoRejeicao
        );
      }
      // Listener onSnapshot atualiza automaticamente
      setDialogVisivel(false);
      setSolicitacaoSelecionada(null);
      setMotivoRejeicao("");
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
    }
    setProcessando(false);
  }

  function abrirDialogRejeicao(solicitacao: Solicitacao) {
    setSolicitacaoSelecionada(solicitacao);
    setDialogVisivel(true);
  }

  const solicitacoesFiltradas = solicitacoes.filter((s) => {
    if (filtro === "todas") return true;
    if (filtro === "pendentes") return s.status === StatusSolicitacao.Pendente;
    if (filtro === "aprovadas") return s.status === StatusSolicitacao.Aprovada;
    if (filtro === "rejeitadas")
      return s.status === StatusSolicitacao.Rejeitada;
    return true;
  });

  function getStatusColor(status: StatusSolicitacao) {
    switch (status) {
      case StatusSolicitacao.Pendente:
        return theme.colors.secondary;
      case StatusSolicitacao.Aprovada:
        return "#4caf50";
      case StatusSolicitacao.Rejeitada:
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  }

  function formatarData(timestamp: any) {
    if (!timestamp || !timestamp.toDate) return "Data indisponível";
    return timestamp.toDate().toLocaleDateString("pt-BR");
  }

  return (
    <SafeAreaView
      style={[
        themeStyles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={carregando}
            onRefresh={carregarSolicitacoes}
          />
        }
      >
        <Text
          variant="headlineMedium"
          style={[styles.pageTitle, { color: theme.colors.onBackground }]}
        >
          Solicitações
        </Text>

        <View style={styles.chipContainer}>
          <Chip
            selected={filtro === "pendentes"}
            onPress={() => setFiltro("pendentes")}
            style={styles.chip}
          >
            Pendentes
          </Chip>
          <Chip
            selected={filtro === "todas"}
            onPress={() => setFiltro("todas")}
            style={styles.chip}
          >
            Todas
          </Chip>
          <Chip
            selected={filtro === "aprovadas"}
            onPress={() => setFiltro("aprovadas")}
            style={styles.chip}
          >
            Aprovadas
          </Chip>
          <Chip
            selected={filtro === "rejeitadas"}
            onPress={() => setFiltro("rejeitadas")}
            style={styles.chip}
          >
            Rejeitadas
          </Chip>
        </View>

        {solicitacoesFiltradas.length === 0 ? (
          <Card
            style={[
              themeStyles.card,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Nenhuma solicitação encontrada
              </Text>
            </Card.Content>
          </Card>
        ) : (
          solicitacoesFiltradas.map((solicitacao) => (
            <Card
              key={solicitacao.id}
              style={[
                themeStyles.card,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  {solicitacao.tipo === TipoSolicitacao.Colaboracao && (
                    <Avatar.Image
                      size={50}
                      source={{
                        uri:
                          solicitacao.usuarioFoto ||
                          "https://via.placeholder.com/50",
                      }}
                    />
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      variant="titleMedium"
                      style={{ color: theme.colors.onSurface }}
                    >
                      {solicitacao.tipo === TipoSolicitacao.Colaboracao
                        ? `${solicitacao.usuarioNome} - Colaboração`
                        : `Exclusão: ${solicitacao.cursoTitulo}`}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {formatarData(solicitacao.dataSolicitacao)}
                    </Text>
                  </View>
                  <Chip
                    style={{
                      backgroundColor: getStatusColor(solicitacao.status),
                    }}
                    textStyle={{ color: "#fff" }}
                  >
                    {solicitacao.status}
                  </Chip>
                </View>

                <View style={styles.divider} />

                {solicitacao.tipo === TipoSolicitacao.Colaboracao && (
                  <>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurface, marginBottom: 4 }}
                    >
                      <Text style={{ fontWeight: "bold" }}>Email:</Text>{" "}
                      {solicitacao.usuarioEmail}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurface, marginBottom: 8 }}
                    >
                      <Text style={{ fontWeight: "bold" }}>Conhecimentos:</Text>
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {solicitacao.conhecimentos}
                    </Text>
                  </>
                )}

                {solicitacao.tipo === TipoSolicitacao.ExclusaoCurso && (
                  <>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurface, marginBottom: 4 }}
                    >
                      <Text style={{ fontWeight: "bold" }}>Colaborador:</Text>{" "}
                      {solicitacao.colaboradorNome}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurface, marginBottom: 8 }}
                    >
                      <Text style={{ fontWeight: "bold" }}>Motivo:</Text>
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {solicitacao.motivo}
                    </Text>
                  </>
                )}

                {solicitacao.status !== StatusSolicitacao.Pendente && (
                  <>
                    <View style={styles.divider} />
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {solicitacao.status === StatusSolicitacao.Aprovada
                        ? "Aprovado"
                        : "Rejeitado"}{" "}
                      por{" "}
                      <Text style={{ fontWeight: "bold" }}>
                        {solicitacao.aprovadoPorNome}
                      </Text>{" "}
                      em {formatarData(solicitacao.dataResposta)}
                    </Text>
                    {solicitacao.motivoRejeicao && (
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.error, marginTop: 4 }}
                      >
                        Motivo: {solicitacao.motivoRejeicao}
                      </Text>
                    )}
                  </>
                )}

                {solicitacao.status === StatusSolicitacao.Pendente && (
                  <View style={styles.buttonRow}>
                    <Button
                      mode="contained"
                      onPress={() => aprovarSolicitacao(solicitacao)}
                      disabled={processando}
                      style={{ flex: 1, marginRight: 8 }}
                      buttonColor="#4caf50"
                    >
                      Aprovar
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => abrirDialogRejeicao(solicitacao)}
                      disabled={processando}
                      style={{ flex: 1, marginLeft: 8 }}
                      textColor={theme.colors.error}
                    >
                      Rejeitar
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Dialog visible={dialogVisivel} onDismiss={() => setDialogVisivel(false)}>
        <Dialog.Icon icon="close-circle-outline" size={60} />
        <Dialog.Title style={styles.textDialog}>
          Rejeitar Solicitação
        </Dialog.Title>
        <Dialog.Content>
          <Text style={styles.textDialog} variant="bodyMedium">
            Informe o motivo da rejeição (opcional):
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Ex: Necessário mais experiência..."
            value={motivoRejeicao}
            onChangeText={setMotivoRejeicao}
            multiline
            numberOfLines={3}
            style={{ marginTop: 12 }}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={() => {
              setDialogVisivel(false);
              setMotivoRejeicao("");
              setSolicitacaoSelecionada(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onPress={rejeitarSolicitacao}
            loading={processando}
            disabled={processando}
            textColor={theme.colors.error}
          >
            Rejeitar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  pageTitle: {
    marginBottom: 16,
    fontWeight: "700",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginRight: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  textDialog: {
    textAlign: "center",
  },
});
