// @ts-nocheck
import { CachedImage } from "@/components/CachedImage";
import { ProgressBar } from "@/components/ProgressBar";
import { WeeklyStreak } from "@/components/WeeklyStreak";
import { AuthContext } from "@/context/AuthProvider";
import { UserContext } from "@/context/UserProvider";
import { Badge } from "@/model/Badge";
import { Perfil as PerfilEnum } from "@/model/Perfil";
import { Usuario } from "@/model/Usuario";
import { BadgeService } from "@/services/badge/BadgeService";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    Image,
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
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Perfil() {
  const theme = useTheme();
  const { sair, userAuth } = useContext<any>(AuthContext);
  const { userFirebase, update, del, sendImageToStorage } =
    useContext<any>(UserContext);
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [urlFoto, setUrlFoto] = useState<string | undefined>(undefined);
  const [dialogVisivel, setDialogVisivel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requisitando, setRequisitando] = useState(false);
  const [alterandoFoto, setAlterandoFoto] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });
  const [dialogFotoVisivel, setDialogFotoVisivel] = useState(false);
  const [dialogMensagemVisivel, setDialogMensagemVisivel] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (userFirebase) {
      setNome(userFirebase.nome || "");
      setEmail(userFirebase.email || "");
      setUrlFoto(userFirebase.urlFoto || undefined);
      carregarBadges();
    }
  }, [userFirebase]);

  useFocusEffect(
    useCallback(() => {
      if (userFirebase) {
        carregarBadges();
      }
    }, [userFirebase])
  );

  const carregarBadges = async () => {
    if (userFirebase) {
      const badgesUsuario = await BadgeService.obterBadgesUsuario(
        userFirebase.uid
      );
      setBadges(badgesUsuario);
    }
  };



  async function salvarPerfil() {
    if (!userFirebase) return;
    setRequisitando(true);
    try {
      const usuarioAtualizado: Usuario = {
        uid: userFirebase.uid,
        nome,
        email,
        perfil: userFirebase.perfil ?? PerfilEnum.Aluno,
        urlFoto: urlFoto ?? userFirebase.urlFoto ?? "",
        nivelAtual: userFirebase.nivelAtual ?? "iniciante",
        coeficienteConhecimento: userFirebase.coeficienteConhecimento ?? 0,
        diasInatividade: userFirebase.diasInatividade ?? 0,
        dataUltimoAcesso: userFirebase.dataUltimoAcesso,
        createdAt: userFirebase.createdAt,
        diasAtivos: userFirebase.diasAtivos ?? 1,
      } as Usuario;
      const msg = await update(usuarioAtualizado);
      if (msg === "ok") {
        setEditMode(false);
      }
    } catch (e) {
      console.error("Erro ao atualizar perfil:", e);
    }
    setRequisitando(false);
  }

  async function buscaNaGaleria() {
    try {
      setDialogFotoVisivel(false);
      // Solicita permissão se necessário
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
          setUrlFoto(urlStorage);
          const usuarioAtualizado: Usuario = {
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
      // Solicita permissão se necessário
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
          setUrlFoto(urlStorage);
          const usuarioAtualizado: Usuario = {
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

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {userFirebase && (
          <>
            {/* Faixa de cor do topo */}
            <View style={{
              height: 110,
              backgroundColor: theme.colors.primary,
              marginHorizontal: -24,
              marginTop: -24,
            }} />
            <View style={[styles.profileHeader, { marginTop: -80 }]}>
              <TouchableOpacity
                onPress={() => setDialogFotoVisivel(true)}
                disabled={alterandoFoto}
              >
                {urlFoto && urlFoto !== "" && urlFoto.startsWith("https://") ? (
                  <CachedImage
                  style={[styles.image, { borderColor: '#fff' }]}
                    userId={userFirebase.uid}
                    firebaseUrl={urlFoto}
                    placeholder={
                      <Image
                        style={[styles.image, { borderColor: theme.colors.primary }]}
                        source={require("../../assets/images/person.png")}
                      />
                    }
                  />
                ) : (
                  <Image
                    style={[styles.image, { borderColor: '#fff' }]}
                    source={require("../../assets/images/person.png")}
                  />
                )}
                {alterandoFoto && (
                  <View style={styles.imageOverlay}>
                    <Text style={styles.overlayText}>Carregando...</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {editMode ? (
              <>
                <View style={styles.section}>
                  <TextInput
                    style={styles.textinput}
                    label="Nome"
                    placeholder={userFirebase.nome || "Digite seu nome"}
                    mode="outlined"
                    value={nome}
                    onChangeText={setNome}
                    right={<TextInput.Icon icon="smart-card" />}
                    returnKeyType="done"
                    onSubmitEditing={salvarPerfil}
                  />
                  <Button
                    style={[
                      styles.button,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    mode="contained"
                    onPress={salvarPerfil}
                    loading={requisitando}
                    disabled={requisitando}
                  >
                    {!requisitando ? "Salvar" : "Salvando"}
                  </Button>
                  <Button
                    style={styles.cancelButton}
                    mode="outlined"
                    onPress={() => setEditMode(false)}
                  >
                    Cancelar
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View style={styles.section}>
                  <Text
                    variant="headlineLarge"
                    style={[
                      styles.mainTitle,
                      { color: theme.colors.onBackground },
                    ]}
                  >
                    {userFirebase.nome || "Nome não informado"}
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.emailText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {userAuth?.user?.email || userFirebase.email}
                  </Text>
                  <View style={{ alignItems: 'center', marginTop: 10 }}>
                    <Chip
                      icon="account-badge"
                      style={{ backgroundColor: theme.colors.primaryContainer }}
                      textStyle={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}
                    >
                      {userFirebase.perfil}
                    </Chip>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text
                    variant="titleLarge"
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.onBackground },
                    ]}
                  >
                    Estatísticas
                  </Text>

                  <ProgressBar
                    percentage={userFirebase.coeficienteConhecimento || 0}
                  />

                  <Card
                    style={[
                      styles.streakCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <Card.Content style={styles.streakContent}>
                      <View style={styles.streakHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Icon source="fire" size={20} color={theme.colors.onSurface} />
                          <Text
                            variant="titleMedium"
                            style={[
                              styles.streakTitle,
                              { color: theme.colors.onSurface, marginBottom: 0 },
                            ]}
                          >
                            Sequência de Login
                          </Text>
                        </View>
                        <Text
                          variant="headlineSmall"
                          style={[
                            styles.streakCount,
                            { color: theme.colors.primary },
                          ]}
                        >
                          {userFirebase.diasAtivos || 1}
                        </Text>
                      </View>
                      <WeeklyStreak loginDays={userFirebase.diasLogin || []} />
                    </Card.Content>
                  </Card>

                  <Card
                    style={[
                      styles.infoCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <Card.Content style={styles.infoContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Icon source="calendar" size={20} color={theme.colors.onSurface} />
                        <Text
                          variant="bodyLarge"
                          style={[
                            styles.infoItem,
                            { color: theme.colors.onSurface, marginBottom: 0 },
                          ]}
                        >
                          Membro desde:{" "}
                          {userFirebase.createdAt
                            ? new Date(userFirebase.createdAt).toLocaleDateString(
                                "pt-BR"
                              )
                            : "N/A"}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon source="clock-outline" size={20} color={theme.colors.onSurface} />
                        <Text
                          variant="bodyLarge"
                          style={[
                            styles.infoItem,
                            { color: theme.colors.onSurface, marginBottom: 0 },
                          ]}
                        >
                          Último acesso:{" "}
                          {userFirebase.dataUltimoAcesso
                            ? new Date(
                                userFirebase.dataUltimoAcesso
                              ).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </Text>
                      </View>
                    </Card.Content>
                  </Card>
                </View>

                <View style={styles.section}>
                  <Text
                    variant="titleLarge"
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.onBackground },
                    ]}
                  >
                    Conquistas
                  </Text>
                  {badges.length > 0 ? (
                    <View style={styles.badgesContainer}>
                      {badges.map((badge, index) => (
                        <Card
                          key={`${badge.id}-${index}`}
                          style={[
                            styles.badgeCard,
                            { backgroundColor: theme.colors.surface },
                          ]}
                        >
                          <Card.Content style={styles.badgeContent}>
                            <Text
                              variant="headlineMedium"
                              style={styles.badgeIcon}
                            >
                              {badge.icone}
                            </Text>
                            <Text
                              variant="labelLarge"
                              style={[
                                styles.badgeName,
                                { color: theme.colors.onSurface },
                              ]}
                              numberOfLines={2}
                            >
                              {badge.nome}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={[
                                styles.badgeDescription,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                              numberOfLines={3}
                            >
                              {badge.descricao}
                            </Text>
                            {badge.dataObtencao && (
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.badgeDate,
                                  { color: theme.colors.primary },
                                ]}
                              >
                                Adquirida em{" "}
                                {new Date(
                                  badge.dataObtencao
                                ).toLocaleDateString("pt-BR")}
                              </Text>
                            )}
                            <View
                              style={[
                                styles.badgeTypeContainer,
                                {
                                  backgroundColor:
                                    theme.colors.primaryContainer,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeTypeText,
                                  { color: theme.colors.onPrimaryContainer },
                                ]}
                              >
                                {badge.tipo}
                              </Text>
                            </View>
                          </Card.Content>
                        </Card>
                      ))}
                    </View>
                  ) : (
                    <Card
                      style={[
                        styles.noBadgesCard,
                        { backgroundColor: theme.colors.surface },
                      ]}
                    >
                      <Card.Content style={styles.noBadgesContent}>
                          <View style={styles.noBadgesIcon}>
                            <Icon source="trophy-outline" size={48} color={theme.colors.onSurfaceVariant} />
                          </View>
                        <Text
                          variant="titleMedium"
                          style={[
                            styles.noBadgesText,
                            { color: theme.colors.onSurface },
                          ]}
                        >
                          Nenhuma conquista ainda
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={[
                            styles.noBadgesSubtext,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          Complete cursos para ganhar badges!
                        </Text>
                      </Card.Content>
                    </Card>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <Dialog visible={dialogVisivel} onDismiss={() => setDialogVisivel(false)}>
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
            textColor={theme.colors.error}
          >
            Excluir
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={confirmDelete} onDismiss={() => setConfirmDelete(false)}>
        <Dialog.Icon icon="alert-octagon-outline" size={60} />
        <Dialog.Title style={styles.textDialog}>Você tem certeza?</Dialog.Title>
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
            textColor={theme.colors.error}
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
          <Button onPress={() => setDialogFotoVisivel(false)}>Cancelar</Button>
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
              : "information-outline"
          }
          size={60}
        />
        <Dialog.Title style={styles.textDialog}>
          {mensagem.tipo === "erro" ? "Erro" : "Informação"}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: undefined, // Set dynamically via theme
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  changePhotoButton: {
    marginTop: 12,
  },
  section: {
    marginBottom: 32,
  },
  mainTitle: {
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emailText: {
    fontWeight: "500",
    textAlign: "center",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 3,
  },
  statContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  statNumber: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    textAlign: "center",
    fontWeight: "500",
  },
  infoCard: {
    borderRadius: 16,
    elevation: 3,
    marginTop: 8,
  },
  infoContent: {
    paddingVertical: 16,
  },
  infoItem: {
    marginBottom: 8,
    fontWeight: "500",
  },
  textinput: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  button: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cancelButton: {
    marginBottom: 12,
    borderRadius: 12,
  },
  deleteButton: {
    borderRadius: 12,
  },
  textDialog: {
    textAlign: "center",
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  badgeCard: {
    width: "48%",
    minHeight: 160,
    borderRadius: 16,
    elevation: 3,
    marginBottom: 8,
  },
  badgeContent: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 8,
    flex: 1,
  },
  badgeIcon: {
    marginBottom: 6,
  },
  badgeName: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    minHeight: 32,
  },
  badgeDescription: {
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 14,
    flex: 1,
  },
  badgeTypeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
  },
  badgeTypeText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "capitalize",
  },
  badgeDate: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 6,
    fontStyle: "italic",
  },
  noBadgesCard: {
    borderRadius: 16,
    elevation: 3,
  },
  noBadgesContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noBadgesIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  noBadgesText: {
    fontWeight: "600",
    marginBottom: 8,
  },
  noBadgesSubtext: {
    textAlign: "center",
  },
  streakCard: {
    borderRadius: 16,
    elevation: 3,
    marginTop: 12,
    marginBottom: 8,
  },
  streakContent: {
    paddingVertical: 16,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  streakTitle: {
    fontWeight: "600",
  },
  streakCount: {
    fontWeight: "700",
  },
});
