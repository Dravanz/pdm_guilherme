// @ts-nocheck
import React, { useContext, useState } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { Text, useTheme, Card, Icon, Button, Dialog, TextInput } from "react-native-paper";
import { ThemeContext, globalStyles } from "@/context/ThemeProvider";
import { AuthContext } from "@/context/AuthProvider";
import { UserContext } from "@/context/UserProvider";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ImageUploadManager } from "@/components/ImageUploadManager";

export default function Configuracoes() {
  const theme = useTheme();
  const { isDark, setTheme, styles: themeStyles } = useContext<any>(ThemeContext);
  const { sair } = useContext<any>(AuthContext);
  const { userFirebase, update, del, sendImageToStorage } = useContext<any>(UserContext);
  const [themeChoice, setThemeChoice] = useState(isDark ? 'dark' : 'light');
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState("");
  const [dialogVisivel, setDialogVisivel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requisitando, setRequisitando] = useState(false);
  const [alterandoFoto, setAlterandoFoto] = useState(false);
  const [dialogFotoVisivel, setDialogFotoVisivel] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });
  const [dialogMensagemVisivel, setDialogMensagemVisivel] = useState(false);

  React.useEffect(() => {
    if (userFirebase) {
      setNome(userFirebase.nome || "");
    }
  }, [userFirebase]);

  async function handleLogout() {
    const res = await sair();
    if (res === 'ok') {
      router.replace('/signIn');
    }
  }

  async function salvarPerfil() {
    if (!userFirebase) return;
    setRequisitando(true);
    try {
      const usuarioAtualizado = {
        ...userFirebase,
        nome
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

  async function buscaNaGaleria() {
    try {
      setDialogFotoVisivel(false);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      
      if (!result.canceled && result.assets && result.assets.length > 0 && userFirebase) {
        setAlterandoFoto(true);
        const urlStorage = await sendImageToStorage(result.assets[0].uri, userFirebase.uid);
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
      
      if (!result.canceled && result.assets && result.assets.length > 0 && userFirebase) {
        setAlterandoFoto(true);
        const urlStorage = await sendImageToStorage(result.assets[0].uri, userFirebase.uid);
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
    <SafeAreaView style={[themeStyles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={[styles.pageTitle, { color: theme.colors.onBackground }]}>Configurações</Text>
        
        <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Aparência</Text>
          <View style={styles.themeContainer}>
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { borderColor: themeChoice === 'light' ? theme.colors.primary : theme.colors.outline },
                themeChoice === 'light' && { backgroundColor: `${theme.colors.primary}10` }
              ]}
              onPress={() => { setThemeChoice('light'); setTheme('light'); }}
            >
              <Icon source="white-balance-sunny" size={28} color={themeChoice === 'light' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <Text style={[styles.themeText, { color: themeChoice === 'light' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>Claro</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { borderColor: themeChoice === 'dark' ? theme.colors.primary : theme.colors.outline },
                themeChoice === 'dark' && { backgroundColor: `${theme.colors.primary}10` }
              ]}
              onPress={() => { setThemeChoice('dark'); setTheme('dark'); }}
            >
              <Icon source="weather-night" size={28} color={themeChoice === 'dark' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <Text style={[styles.themeText, { color: themeChoice === 'dark' ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>Escuro</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Perfil</Text>
          
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

      {userFirebase?.perfil === "Admin" && (
        <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Gerenciamento</Text>
            <ImageUploadManager />
          </Card.Content>
        </Card>
      )}

      <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Conta</Text>
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
            textColor="#ff0000"
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
            textColor="#ff0000"
          >
            {!requisitando ? "Sim, excluir" : "Excluindo..."}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={dialogFotoVisivel} onDismiss={() => setDialogFotoVisivel(false)}>
        <Dialog.Icon icon="camera" size={60} />
        <Dialog.Title style={styles.textDialog}>Alterar Foto</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.textDialog} variant="bodyLarge">
            Escolha como deseja alterar sua foto de perfil
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button 
            onPress={tiraFoto}
            icon="camera"
            disabled={alterandoFoto}
          >
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

      <Dialog visible={dialogMensagemVisivel} onDismiss={() => {
        setDialogMensagemVisivel(false);
        setMensagem({ tipo: "", mensagem: "" });
      }}>
        <Dialog.Icon 
          icon={mensagem.tipo === "erro" ? "alert-circle-outline" : "information-outline"} 
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
          <Button onPress={() => {
            setDialogMensagemVisivel(false);
            setMensagem({ tipo: "", mensagem: "" });
          }}>OK</Button>
        </Dialog.Actions>
      </Dialog>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  pageTitle: {
    marginBottom: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    marginBottom: globalStyles.spacing.lg,
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: globalStyles.spacing.md,
  },
  themeOption: {
    alignItems: 'center',
    padding: globalStyles.spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 120,
    minHeight: 100,
    justifyContent: 'center',
  },
  themeText: {
    marginTop: 12,
    fontWeight: '600',
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
    flexDirection: 'row',
    marginTop: 8,
  },
  textDialog: {
    textAlign: 'center',
  },
});


