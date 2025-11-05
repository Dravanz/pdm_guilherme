// @ts-nocheck
import { AuthContext } from "@/context/AuthProvider";
import { UserContext } from "@/context/UserProvider";
import { Perfil as PerfilEnum } from "@/model/Perfil";
import { Usuario } from "@/model/Usuario";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Perfil() {
  const theme = useTheme();
  const { sair } = useContext<any>(AuthContext);
  const { userFirebase, update, del } = useContext<any>(UserContext);
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [urlFoto] = useState<string | undefined>(undefined);
  const [dialogVisivel, setDialogVisivel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requisitando, setRequisitando] = useState(false);

  useEffect(() => {
    if (userFirebase) {
      setNome(userFirebase.nome || "");
      setEmail(userFirebase.email || "");
    }
  }, [userFirebase]);

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
      style={{ ...styles.container, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {userFirebase && (
          <>
            <Image
              style={styles.image}
              source={require("../assets/images/person.png")}
            />

            {editMode ? (
              <>
                <TextInput
                  style={styles.textinput}
                  label="Nome"
                  placeholder={userFirebase.nome || "Digite seu nome"}
                  mode="outlined"
                  value={nome}
                  onChangeText={setNome}
                  right={<TextInput.Icon icon="smart-card" />}
                />
                <TextInput
                  style={styles.textinput}
                  label="Email"
                  value={email}
                  mode="outlined"
                  onChangeText={setEmail}
                  right={<TextInput.Icon icon="email" />}
                />
                <Button
                  style={styles.button}
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
              </>
            ) : (
              <>
                <View style={styles.infoContainer}>
                  <Text variant="headlineSmall" style={styles.infoText}>
                    {userFirebase.nome || "Nome não informado"}
                  </Text>
                  <Text variant="bodyLarge" style={styles.infoText}>
                    {userFirebase.email}
                  </Text>
                </View>

                <Button
                  style={styles.button}
                  mode="contained"
                  onPress={() => setEditMode(true)}
                >
                  Editar Perfil
                </Button>
                <Button
                  style={styles.deleteButton}
                  mode="contained"
                  onPress={() => setDialogVisivel(true)}
                >
                  Excluir Conta
                </Button>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: "center",
    border: "20px solid #00ff55",
    borderRadius: 100,
    marginTop: 50,
    marginBottom: 30,
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  infoText: {
    marginVertical: 5,
    textAlign: "center",
  },
  textinput: {
    width: 350,
    height: 50,
    marginTop: 20,
    backgroundColor: "transparent",
  },
  button: {
    marginTop: 30,
    marginBottom: 10,
    backgroundColor: "#00ff55",
  },
  cancelButton: {
    marginBottom: 20,
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: "#ff4444",
  },
  textDialog: {
    textAlign: "center",
  },
});
