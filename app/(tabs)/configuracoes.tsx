// @ts-nocheck
import { AuthContext } from "@/context/AuthProvider";
import { globalStyles, ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Badge } from "@/model/Badge";
import { Curso } from "@/model/Curso";
import { Perfil } from "@/model/Perfil";
import { BadgeAdminService } from "@/services/BadgeAdminService";
import { CursoService } from "@/services/CursoService";
import { SolicitacaoService } from "@/services/SolicitacaoService";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useContext, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  Dialog,
  Icon,
  IconButton,
  Menu,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function Configuracoes() {
  const theme = useTheme();
  const {
    isDark,
    setTheme,
    styles: themeStyles,
  } = useContext<any>(ThemeContext);
  const { sair } = useContext<any>(AuthContext);
  const { userFirebase, update, del, sendImageToStorage } =
    useContext<any>(UserContext);
  const [themeChoice, setThemeChoice] = useState(isDark ? "dark" : "light");
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState("");
  const [dialogVisivel, setDialogVisivel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requisitando, setRequisitando] = useState(false);
  const [alterandoFoto, setAlterandoFoto] = useState(false);
  const [dialogFotoVisivel, setDialogFotoVisivel] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });
  const [dialogMensagemVisivel, setDialogMensagemVisivel] = useState(false);
  const [dialogColaborarVisivel, setDialogColaborarVisivel] = useState(false);
  const [conhecimentos, setConhecimentos] = useState("");
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

  // Estados para CRUD de Badges (Admin)
  const [badges, setBadges] = useState<Badge[]>([]);
  const [carregandoBadges, setCarregandoBadges] = useState(false);
  const [dialogBadgeVisivel, setDialogBadgeVisivel] = useState(false);
  const [badgeEditando, setBadgeEditando] = useState<Badge | null>(null);

  // Campos do formulário de badge
  const [badgeId, setBadgeId] = useState("");
  const [badgeNome, setBadgeNome] = useState("");
  const [badgeIcone, setBadgeIcone] = useState("");
  const [badgeDescricao, setBadgeDescricao] = useState("");
  const [badgeTipo, setBadgeTipo] = useState<
    "curso" | "conquista" | "especial" | "ranking"
  >("conquista");
  const [badgeRequisitoTipo, setBadgeRequisitoTipo] = useState<
    | "curso_concluido"
    | "primeiro_curso"
    | "multiplos_cursos"
    | "coeficiente_alto"
    | "sequencia_dias"
    | "ranking_posicao"
    | "perfil_especifico"
    | "primeiro_login"
  >("primeiro_curso");
  const [badgeRequisitoValor, setBadgeRequisitoValor] = useState("");
  const [badgeRequisitoCursoId, setBadgeRequisitoCursoId] = useState("");
  const [badgeRequisitoPerfil, setBadgeRequisitoPerfil] = useState<
    "Colaborador" | "Admin" | ""
  >("");

  // Estados para Menus
  const [menuTipoVisivel, setMenuTipoVisivel] = useState(false);
  const [menuRequisitoVisivel, setMenuRequisitoVisivel] = useState(false);
  const [menuCursoVisivel, setMenuCursoVisivel] = useState(false);
  const [menuPerfilVisivel, setMenuPerfilVisivel] = useState(false);
  const [cursosDisponiveis, setCursosDisponiveis] = useState<Curso[]>([]);

  React.useEffect(() => {
    if (userFirebase) {
      setNome(userFirebase.nome || "");

      // Carregar badges e cursos se for admin
      if (userFirebase.perfil === Perfil.Admin) {
        carregarCursos();
        carregarBadges();
      }
    }
  }, [userFirebase]);

  async function handleLogout() {
    const res = await sair();
    if (res === "ok") {
      router.replace("/signIn");
    }
  }

  async function salvarPerfil() {
    if (!userFirebase) return;
    setRequisitando(true);
    try {
      const usuarioAtualizado = {
        ...userFirebase,
        nome,
      };
      const msg = await update(usuarioAtualizado);
      if (msg === "ok") {
        setEditMode(false);
      }
    } catch (e) {
      console.error("Erro ao atualizar perfil:", e);
    }
    setRequisitando(false);
  }

  async function excluirConta() {
    if (!userFirebase) return;
    setRequisitando(true);
    try {
      const msg = await del(userFirebase.uid);
      if (msg === "ok") {
        await sair();
        router.replace("/signIn");
      }
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
    }
    setRequisitando(false);
    setConfirmDelete(false);
  }

  async function enviarSolicitacaoColaboracao() {
    if (!userFirebase || !conhecimentos.trim()) {
      setMensagem({
        tipo: "erro",
        mensagem: "Por favor, informe seus conhecimentos e experiências.",
      });
      setDialogMensagemVisivel(true);
      return;
    }

    setEnviandoSolicitacao(true);
    try {
      await SolicitacaoService.criarSolicitacaoColaboracao(
        userFirebase.uid,
        userFirebase.nome,
        userFirebase.email,
        userFirebase.urlFoto,
        conhecimentos
      );

      setDialogColaborarVisivel(false);
      setConhecimentos("");
      setMensagem({
        tipo: "sucesso",
        mensagem:
          "Solicitação enviada com sucesso! Aguarde a aprovação de um administrador.",
      });
      setDialogMensagemVisivel(true);
    } catch (error: any) {
      setMensagem({
        tipo: "erro",
        mensagem:
          error.message || "Erro ao enviar solicitação. Tente novamente.",
      });
      setDialogMensagemVisivel(true);
    }
    setEnviandoSolicitacao(false);
  }

  // ============= FUNÇÕES DE GERENCIAMENTO DE BADGES (ADMIN) =============

  async function carregarCursos() {
    try {
      const cursos = await CursoService.listarCursos();
      setCursosDisponiveis(cursos);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    }
  }

  async function carregarBadges() {
    setCarregandoBadges(true);
    try {
      const badgesFirestore = await BadgeAdminService.listarBadges();
      setBadges(badgesFirestore);
    } catch (error) {
      console.error("Erro ao carregar badges:", error);
      setMensagem({
        tipo: "erro",
        mensagem: "Erro ao carregar badges",
      });
      setDialogMensagemVisivel(true);
    } finally {
      setCarregandoBadges(false);
    }
  }

  function abrirDialogNovaBadge() {
    limparFormularioBadge();
    setDialogBadgeVisivel(true);
  }

  function abrirDialogEditarBadge(badge: Badge) {
    setBadgeEditando(badge);
    setBadgeId(badge.id);
    setBadgeNome(badge.nome);
    setBadgeIcone(badge.icone);
    setBadgeDescricao(badge.descricao);
    setBadgeTipo(badge.tipo);
    setBadgeRequisitoTipo(badge.requisitos.tipo);
    setBadgeRequisitoValor(badge.requisitos.valor?.toString() || "");
    setBadgeRequisitoCursoId(badge.requisitos.cursoId || "");
    setBadgeRequisitoPerfil(badge.requisitos.perfil || "");
    setDialogBadgeVisivel(true);
  }

  function limparFormularioBadge() {
    setBadgeEditando(null);
    setBadgeId("");
    setBadgeNome("");
    setBadgeIcone("");
    setBadgeDescricao("");
    setBadgeTipo("conquista");
    setBadgeRequisitoTipo("primeiro_curso");
    setBadgeRequisitoValor("");
    setBadgeRequisitoCursoId("");
    setBadgeRequisitoPerfil("");
  }

  async function salvarBadge() {
    // Validações
    if (!badgeNome.trim()) {
      setMensagem({ tipo: "erro", mensagem: "Nome da badge é obrigatório" });
      setDialogMensagemVisivel(true);
      return;
    }

    if (!badgeIcone.trim()) {
      setMensagem({ tipo: "erro", mensagem: "Ícone da badge é obrigatório" });
      setDialogMensagemVisivel(true);
      return;
    }

    if (!badgeDescricao.trim()) {
      setMensagem({
        tipo: "erro",
        mensagem: "Descrição da badge é obrigatória",
      });
      setDialogMensagemVisivel(true);
      return;
    }

    // Gerar ID se for nova badge
    let finalBadgeId = badgeId;
    if (!badgeEditando) {
      finalBadgeId =
        badgeId.trim() || BadgeAdminService.gerarIdSugerido(badgeNome);

      if (!BadgeAdminService.validarIdBadge(finalBadgeId)) {
        setMensagem({
          tipo: "erro",
          mensagem: "ID inválido. Use apenas letras minúsculas, números, _ e -",
        });
        setDialogMensagemVisivel(true);
        return;
      }
    }

    try {
      const badge: any = {
        id: finalBadgeId,
        nome: badgeNome.trim(),
        icone: badgeIcone.trim(),
        descricao: badgeDescricao.trim(),
        tipo: badgeTipo,
        requisitos: {
          tipo: badgeRequisitoTipo,
        },
      };

      // Validar e adicionar valor, cursoId ou perfil conforme o tipo de requisito
      if (badgeRequisitoTipo === "curso_concluido") {
        if (!badgeRequisitoCursoId.trim()) {
          setMensagem({
            tipo: "erro",
            mensagem: "Selecione um curso para o requisito 'Curso Concluído'",
          });
          setDialogMensagemVisivel(true);
          return;
        }
        badge.requisitos.cursoId = badgeRequisitoCursoId.trim();
      } else if (badgeRequisitoTipo === "perfil_especifico") {
        if (!badgeRequisitoPerfil) {
          setMensagem({
            tipo: "erro",
            mensagem:
              "Selecione um perfil para o requisito 'Perfil Específico'",
          });
          setDialogMensagemVisivel(true);
          return;
        }
        badge.requisitos.perfil = badgeRequisitoPerfil;
      } else if (
        [
          "multiplos_cursos",
          "coeficiente_alto",
          "sequencia_dias",
          "ranking_posicao",
        ].includes(badgeRequisitoTipo)
      ) {
        const valor = parseInt(badgeRequisitoValor);
        if (isNaN(valor) || valor <= 0) {
          setMensagem({
            tipo: "erro",
            mensagem: "Valor do requisito deve ser um número positivo",
          });
          setDialogMensagemVisivel(true);
          return;
        }
        badge.requisitos.valor = valor;
      }

      // Salvar no Firestore
      if (badgeEditando) {
        await BadgeAdminService.atualizarBadge(finalBadgeId, badge);
        setMensagem({
          tipo: "sucesso",
          mensagem: "Badge atualizada com sucesso!",
        });
      } else {
        await BadgeAdminService.criarBadge(badge);
        setMensagem({
          tipo: "sucesso",
          mensagem: "Badge criada com sucesso!",
        });
      }

      setDialogBadgeVisivel(false);
      limparFormularioBadge();
      await carregarBadges(); // Recarregar lista

      setTimeout(() => {
        setDialogMensagemVisivel(true);
      }, 100);
    } catch (error: any) {
      console.error("Erro ao salvar badge:", error);
      setMensagem({
        tipo: "erro",
        mensagem: error.message || "Erro ao salvar badge",
      });
      setDialogMensagemVisivel(true);
    }
  }

  async function excluirBadge(badgeId: string) {
    try {
      await BadgeAdminService.excluirBadge(badgeId);
      setMensagem({
        tipo: "sucesso",
        mensagem: "Badge excluída com sucesso!",
      });
      await carregarBadges();
      setDialogMensagemVisivel(true);
    } catch (error: any) {
      setMensagem({
        tipo: "erro",
        mensagem: error.message || "Erro ao excluir badge",
      });
      setDialogMensagemVisivel(true);
    }
  }

  // ============= FIM DAS FUNÇÕES DE BADGES =============

  function getBadgeTipoLabel(tipo: string): string {
    const tipos = {
      curso: "📚 Curso",
      conquista: "🏆 Conquista",
      especial: "⭐ Especial",
      ranking: "🥇 Ranking",
    };
    return tipos[tipo] || tipo;
  }

  function getRequisitoTipoLabel(tipo: string): string {
    const tipos = {
      primeiro_curso: "🎁 Primeiro Curso",
      curso_concluido: "📚 Curso Específico",
      multiplos_cursos: "📖 Múltiplos Cursos",
      coeficiente_alto: "📊 Coeficiente",
      sequencia_dias: "🔥 Sequência Dias",
      ranking_posicao: "🏆 Ranking",
      perfil_especifico: "👤 Perfil",
      primeiro_login: "🎉 Primeiro Login",
    };
    return tipos[tipo] || tipo;
  }

  function getRequisitoLabel(requisito: any): string {
    switch (requisito.tipo) {
      case "primeiro_curso":
        return "Primeiro curso concluído";
      case "primeiro_login":
        return "Primeiro login no app";
      case "perfil_especifico":
        return `Perfil: ${requisito.perfil || "?"}`;
      case "curso_concluido":
        return `Concluir curso: ${requisito.cursoId || "?"}`;
      case "multiplos_cursos":
        return `Concluir ${requisito.valor} cursos`;
      case "coeficiente_alto":
        return `Coeficiente ≥ ${requisito.valor}%`;
      case "sequencia_dias":
        return `${requisito.valor} dias consecutivos`;
      case "ranking_posicao":
        return `Top ${requisito.valor} no ranking`;
      default:
        return requisito.tipo;
    }
  }

  // ============= FIM DAS FUNÇÕES DE BADGES =============

  async function verificarSolicitacaoPendente() {
    if (!userFirebase) return;
    const temPendente = await SolicitacaoService.verificarSolicitacaoPendente(
      userFirebase.uid
    );
    if (temPendente) {
      setMensagem({
        tipo: "info",
        mensagem: "Você já possui uma solicitação de colaboração pendente.",
      });
      setDialogMensagemVisivel(true);
    } else {
      setDialogColaborarVisivel(true);
    }
  }

  async function buscaNaGaleria() {
    try {
      setDialogFotoVisivel(false);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setMensagem({
          tipo: "erro",
          mensagem: "Permissão para acessar a galeria é necessária.",
        });
        setDialogMensagemVisivel(true);
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0 &&
        userFirebase
      ) {
        setAlterandoFoto(true);
        const urlStorage = await sendImageToStorage(
          result.assets[0].uri,
          userFirebase.uid
        );
        if (urlStorage) {
          const usuarioAtualizado = {
            ...userFirebase,
            urlFoto: urlStorage,
          };
          await update(usuarioAtualizado);
        }
        setAlterandoFoto(false);
      }
    } catch (error) {
      console.error("Erro ao buscar foto na galeria:", error);
      setAlterandoFoto(false);
    }
  }

  async function tiraFoto() {
    try {
      setDialogFotoVisivel(false);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setMensagem({
          tipo: "erro",
          mensagem: "Permissão para acessar a câmera é necessária.",
        });
        setDialogMensagemVisivel(true);
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0 &&
        userFirebase
      ) {
        setAlterandoFoto(true);
        const urlStorage = await sendImageToStorage(
          result.assets[0].uri,
          userFirebase.uid
        );
        if (urlStorage) {
          const usuarioAtualizado = {
            ...userFirebase,
            urlFoto: urlStorage,
          };
          await update(usuarioAtualizado);
        }
        setAlterandoFoto(false);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      setAlterandoFoto(false);
    }
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
        keyboardShouldPersistTaps="handled"
      >
        <Text
          variant="headlineMedium"
          style={[styles.pageTitle, { color: theme.colors.onBackground }]}
        >
          Configurações
        </Text>

        <Card
          style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}
        >
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Aparência
            </Text>
            <View style={styles.themeContainer}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    borderColor:
                      themeChoice === "light"
                        ? theme.colors.primary
                        : theme.colors.outline,
                  },
                  themeChoice === "light" && {
                    backgroundColor: `${theme.colors.primary}10`,
                  },
                ]}
                onPress={() => {
                  setThemeChoice("light");
                  setTheme("light");
                }}
              >
                <Icon
                  source="white-balance-sunny"
                  size={28}
                  color={
                    themeChoice === "light"
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.themeText,
                    {
                      color:
                        themeChoice === "light"
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Claro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    borderColor:
                      themeChoice === "dark"
                        ? theme.colors.primary
                        : theme.colors.outline,
                  },
                  themeChoice === "dark" && {
                    backgroundColor: `${theme.colors.primary}10`,
                  },
                ]}
                onPress={() => {
                  setThemeChoice("dark");
                  setTheme("dark");
                }}
              >
                <Icon
                  source="weather-night"
                  size={28}
                  color={
                    themeChoice === "dark"
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.themeText,
                    {
                      color:
                        themeChoice === "dark"
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Escuro
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        <Card
          style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}
        >
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Perfil
            </Text>

            {editMode ? (
              <View>
                <TextInput
                  label="Nome"
                  placeholder={userFirebase?.nome || "Digite seu nome"}
                  mode="outlined"
                  value={nome}
                  onChangeText={setNome}
                  style={styles.textInput}
                />
                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    onPress={salvarPerfil}
                    loading={requisitando}
                    disabled={requisitando}
                    style={[styles.button, { flex: 1, marginRight: 8 }]}
                  >
                    {!requisitando ? "Salvar" : "Salvando"}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setEditMode(false)}
                    style={[styles.button, { flex: 1, marginLeft: 8 }]}
                  >
                    Cancelar
                  </Button>
                </View>
              </View>
            ) : (
              <View>
                <Button
                  mode="outlined"
                  onPress={() => setEditMode(true)}
                  icon="account-edit"
                  style={styles.button}
                >
                  Editar Perfil
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setDialogFotoVisivel(true)}
                  icon="camera"
                  style={styles.button}
                  loading={alterandoFoto}
                  disabled={alterandoFoto}
                >
                  Alterar Foto
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {userFirebase?.perfil === Perfil.Aluno && (
          <Card
            style={[
              themeStyles.card,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Text
                variant="titleMedium"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                Colaboração
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  marginBottom: 12,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Deseja contribuir com o projeto? Torne-se um colaborador!
              </Text>
              <Button
                mode="contained"
                onPress={verificarSolicitacaoPendente}
                icon="account-plus"
                style={styles.button}
              >
                Colaborar com o Projeto
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* CRUD de Badges - apenas para Admin */}
        {userFirebase?.perfil === Perfil.Admin && (
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
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  variant="titleMedium"
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  🏅 Gerenciar Badges
                </Text>
                <Button
                  mode="contained"
                  onPress={abrirDialogNovaBadge}
                  icon="plus"
                  compact
                >
                  Nova
                </Button>
              </View>

              <Text
                variant="bodyMedium"
                style={{
                  marginBottom: 16,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Crie e gerencie as badges/conquistas do sistema
              </Text>

              {carregandoBadges ? (
                <Text style={{ textAlign: "center", padding: 20 }}>
                  Carregando badges...
                </Text>
              ) : badges.length === 0 ? (
                <Text
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  Nenhuma badge cadastrada ainda
                </Text>
              ) : (
                <FlatList
                  data={badges}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <Card
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
                            alignItems: "flex-start",
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 4,
                              }}
                            >
                              <Text
                                variant="headlineMedium"
                                style={{ marginRight: 8 }}
                              >
                                {item.icone}
                              </Text>
                              <View>
                                <Text
                                  variant="titleMedium"
                                  style={{ fontWeight: "bold" }}
                                >
                                  {item.nome}
                                </Text>
                                <Chip
                                  mode="flat"
                                  compact
                                  style={{
                                    alignSelf: "flex-start",
                                    marginTop: 4,
                                  }}
                                >
                                  {getBadgeTipoLabel(item.tipo)}
                                </Chip>
                              </View>
                            </View>
                            <Text
                              variant="bodyMedium"
                              style={{
                                color: theme.colors.onSurfaceVariant,
                                marginBottom: 8,
                              }}
                            >
                              {item.descricao}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={{ color: theme.colors.primary }}
                            >
                              📋 {getRequisitoLabel(item.requisitos)}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={{
                                color: theme.colors.onSurfaceVariant,
                                marginTop: 4,
                                fontFamily: "monospace",
                              }}
                            >
                              ID: {item.id}
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <IconButton
                              icon="pencil"
                              size={20}
                              onPress={() => abrirDialogEditarBadge(item)}
                            />
                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor={theme.colors.error}
                              onPress={() => excluirBadge(item.id)}
                            />
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  )}
                />
              )}
            </Card.Content>
          </Card>
        )}

        <Card
          style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}
        >
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Conta
            </Text>
            <Button
              mode="outlined"
              onPress={() => setDialogVisivel(true)}
              icon="delete"
              textColor={theme.colors.error}
              style={[styles.button, { borderColor: theme.colors.error }]}
            >
              Excluir Conta
            </Button>
            <Button
              mode="outlined"
              onPress={handleLogout}
              icon="logout"
              textColor={theme.colors.error}
              style={[styles.button, { borderColor: theme.colors.error }]}
            >
              Sair da Conta
            </Button>
          </Card.Content>
        </Card>

        <Dialog
          visible={dialogVisivel}
          onDismiss={() => setDialogVisivel(false)}
        >
          <Dialog.Icon icon="alert-circle-outline" size={60} />
          <Dialog.Title style={styles.textDialog}>Excluir Conta</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.textDialog} variant="bodyLarge">
              Tem certeza que deseja excluir sua conta? Esta ação não pode ser
              desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisivel(false)}>Cancelar</Button>
            <Button
              onPress={() => {
                setDialogVisivel(false);
                setConfirmDelete(true);
              }}
              textColor="#ff0000"
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={confirmDelete}
          onDismiss={() => setConfirmDelete(false)}
        >
          <Dialog.Icon icon="alert-octagon-outline" size={60} />
          <Dialog.Title style={styles.textDialog}>
            Você tem certeza?
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.textDialog} variant="bodyLarge">
              Esta é sua última chance. Sua conta será permanentemente excluída.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button
              onPress={() => {
                excluirConta();
              }}
              loading={requisitando}
              disabled={requisitando}
              textColor="#ff0000"
            >
              {!requisitando ? "Sim, excluir" : "Excluindo..."}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={dialogFotoVisivel}
          onDismiss={() => setDialogFotoVisivel(false)}
        >
          <Dialog.Icon icon="camera" size={60} />
          <Dialog.Title style={styles.textDialog}>Alterar Foto</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.textDialog} variant="bodyLarge">
              Escolha como deseja alterar sua foto de perfil
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={tiraFoto} icon="camera" disabled={alterandoFoto}>
              Tirar Foto
            </Button>
            <Button
              onPress={buscaNaGaleria}
              icon="image"
              disabled={alterandoFoto}
            >
              Galeria
            </Button>
            <Button onPress={() => setDialogFotoVisivel(false)}>
              Cancelar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={dialogMensagemVisivel}
          onDismiss={() => {
            setDialogMensagemVisivel(false);
            setMensagem({ tipo: "", mensagem: "" });
          }}
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
            {mensagem.tipo === "erro"
              ? "Erro"
              : mensagem.tipo === "sucesso"
              ? "Sucesso"
              : "Informação"}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.textDialog} variant="bodyLarge">
              {mensagem.mensagem}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setDialogMensagemVisivel(false);
                setMensagem({ tipo: "", mensagem: "" });
              }}
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={dialogColaborarVisivel}
          onDismiss={() => {
            setDialogColaborarVisivel(false);
            setConhecimentos("");
          }}
        >
          <Dialog.Icon icon="account-plus" size={60} />
          <Dialog.Title style={styles.textDialog}>
            Colaborar com o Projeto
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.textDialog} variant="bodyMedium">
              Como você deseja colaborar? Informe seus conhecimentos e
              experiências:
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Ex: Tenho experiência em JavaScript, Python e criação de cursos..."
              value={conhecimentos}
              onChangeText={setConhecimentos}
              multiline
              numberOfLines={4}
              style={{ marginTop: 12 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setDialogColaborarVisivel(false);
                setConhecimentos("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onPress={enviarSolicitacaoColaboracao}
              loading={enviandoSolicitacao}
              disabled={enviandoSolicitacao || !conhecimentos.trim()}
            >
              Enviar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </ScrollView>

      {/* Dialog de Criar Badge */}
      <Dialog
        visible={dialogBadgeVisivel}
        onDismiss={() => setDialogBadgeVisivel(false)}
        style={{ maxHeight: "90%" }}
      >
        <Dialog.Title>
          🏅 {badgeEditando ? "Editar Badge" : "Nova Badge"}
        </Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <Dialog.Content>
              <TextInput
                label="ID da Badge"
                value={badgeId}
                onChangeText={setBadgeId}
                placeholder="Ex: javascript_master"
                mode="outlined"
                style={styles.textInput}
                autoCapitalize="none"
                disabled={!!badgeEditando}
              />
              <Text
                variant="bodySmall"
                style={{
                  marginTop: -12,
                  marginBottom: 12,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                Deixe vazio para gerar automaticamente. Use apenas letras
                minúsculas, números, _ e -
              </Text>

              <TextInput
                label="Nome da Badge *"
                value={badgeNome}
                onChangeText={setBadgeNome}
                placeholder="Ex: Mestre em JavaScript"
                mode="outlined"
                style={styles.textInput}
              />

              <TextInput
                label="Ícone (Emoji) *"
                value={badgeIcone}
                onChangeText={setBadgeIcone}
                placeholder="Ex: 🏆"
                mode="outlined"
                style={styles.textInput}
                maxLength={4}
              />

              <TextInput
                label="Descrição *"
                value={badgeDescricao}
                onChangeText={setBadgeDescricao}
                placeholder="Ex: Concluiu o curso de JavaScript avançado"
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.textInput}
              />

              <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                Tipo da Badge
              </Text>
              <Menu
                visible={menuTipoVisivel}
                onDismiss={() => setMenuTipoVisivel(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setMenuTipoVisivel(true)}
                    style={{ marginBottom: 16 }}
                    contentStyle={{ justifyContent: "flex-start" }}
                  >
                    {getBadgeTipoLabel(badgeTipo)}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setBadgeTipo("curso");
                    setMenuTipoVisivel(false);
                  }}
                  title="📚 Curso"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeTipo("conquista");
                    setMenuTipoVisivel(false);
                  }}
                  title="🏆 Conquista"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeTipo("especial");
                    setMenuTipoVisivel(false);
                  }}
                  title="⭐ Especial"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeTipo("ranking");
                    setMenuTipoVisivel(false);
                  }}
                  title="🥇 Ranking"
                />
              </Menu>

              <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                Tipo de Requisito
              </Text>
              <Menu
                visible={menuRequisitoVisivel}
                onDismiss={() => setMenuRequisitoVisivel(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setMenuRequisitoVisivel(true)}
                    style={{ marginBottom: 16 }}
                    contentStyle={{ justifyContent: "flex-start" }}
                  >
                    {getRequisitoTipoLabel(badgeRequisitoTipo)}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setBadgeRequisitoTipo("primeiro_curso");
                    setMenuRequisitoVisivel(false);
                  }}
                  title="🎁 Primeiro Curso"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeRequisitoTipo("curso_concluido");
                    setMenuRequisitoVisivel(false);
                  }}
                  title="📚 Curso Específico"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeRequisitoTipo("multiplos_cursos");
                    setMenuRequisitoVisivel(false);
                  }}
                  title="📖 Múltiplos Cursos"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeRequisitoTipo("coeficiente_alto");
                    setMenuRequisitoVisivel(false);
                  }}
                  title="📊 Coeficiente"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeRequisitoTipo("sequencia_dias");
                    setMenuRequisitoVisivel(false);
                  }}
                  title="🔥 Sequência Dias"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeRequisitoTipo("ranking_posicao");
                    setMenuRequisitoVisivel(false);
                  }}
                  title="🏆 Ranking"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeRequisitoTipo("perfil_especifico");
                    setMenuRequisitoVisivel(false);
                  }}
                  title="👤 Perfil"
                />
                <Menu.Item
                  onPress={() => {
                    setBadgeRequisitoTipo("primeiro_login");
                    setMenuRequisitoVisivel(false);
                  }}
                  title="🎉 Primeiro Login"
                />
              </Menu>

              {badgeRequisitoTipo === "curso_concluido" && (
                <>
                  <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                    Selecione o Curso *
                  </Text>
                  <Menu
                    visible={menuCursoVisivel}
                    onDismiss={() => setMenuCursoVisivel(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setMenuCursoVisivel(true)}
                        style={{ marginBottom: 16 }}
                        contentStyle={{ justifyContent: "flex-start" }}
                      >
                        {badgeRequisitoCursoId
                          ? cursosDisponiveis.find(
                              (c) => c.id === badgeRequisitoCursoId
                            )?.titulo || badgeRequisitoCursoId
                          : "Selecione um curso"}
                      </Button>
                    }
                  >
                    {cursosDisponiveis.map((curso) => (
                      <Menu.Item
                        key={curso.id}
                        onPress={() => {
                          setBadgeRequisitoCursoId(curso.id);
                          setMenuCursoVisivel(false);
                        }}
                        title={curso.titulo}
                      />
                    ))}
                  </Menu>
                </>
              )}

              {badgeRequisitoTipo === "perfil_especifico" && (
                <>
                  <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                    Selecione o Perfil *
                  </Text>
                  <Menu
                    visible={menuPerfilVisivel}
                    onDismiss={() => setMenuPerfilVisivel(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setMenuPerfilVisivel(true)}
                        style={{ marginBottom: 16 }}
                        contentStyle={{ justifyContent: "flex-start" }}
                      >
                        {badgeRequisitoPerfil || "Selecione um perfil"}
                      </Button>
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        setBadgeRequisitoPerfil("Colaborador");
                        setMenuPerfilVisivel(false);
                      }}
                      title="🤝 Colaborador"
                    />
                    <Menu.Item
                      onPress={() => {
                        setBadgeRequisitoPerfil("Admin");
                        setMenuPerfilVisivel(false);
                      }}
                      title="👨‍💼 Admin"
                    />
                  </Menu>
                </>
              )}

              {[
                "multiplos_cursos",
                "coeficiente_alto",
                "sequencia_dias",
                "ranking_posicao",
              ].includes(badgeRequisitoTipo) && (
                <TextInput
                  label={
                    badgeRequisitoTipo === "multiplos_cursos"
                      ? "Quantidade de Cursos *"
                      : badgeRequisitoTipo === "coeficiente_alto"
                      ? "Coeficiente Mínimo (%) *"
                      : badgeRequisitoTipo === "sequencia_dias"
                      ? "Dias Consecutivos *"
                      : "Posição no Ranking *"
                  }
                  value={badgeRequisitoValor}
                  onChangeText={setBadgeRequisitoValor}
                  placeholder="Ex: 3"
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              )}
            </Dialog.Content>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={() => setDialogBadgeVisivel(false)}>Cancelar</Button>
          <Button onPress={salvarBadge} mode="contained">
            {badgeEditando ? "💾 Salvar" : "➕ Criar"}
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
  sectionTitle: {
    marginBottom: globalStyles.spacing.lg,
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 24,
  },
  themeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: globalStyles.spacing.md,
  },
  themeOption: {
    alignItems: "center",
    padding: globalStyles.spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 120,
    minHeight: 100,
    justifyContent: "center",
  },
  themeText: {
    marginTop: 12,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 12,
  },
  textInput: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  textDialog: {
    textAlign: "center",
  },
});
