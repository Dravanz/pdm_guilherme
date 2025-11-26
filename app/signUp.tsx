// @ts-nocheck
import { AuthContext } from "@/context/AuthProvider";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Perfil } from "@/model/Perfil";
import { Usuario } from "@/model/Usuario";
import { yupResolver } from "@hookform/resolvers/yup";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useContext, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { spacing, containerPadding } from "@/constants/Layout";
import {
  Button,
  Dialog,
  Divider,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";

const requiredMessage = "Campo obrigatório";

const schema = yup
  .object()
  .shape({
    nome: yup
      .string()
      .required(requiredMessage)
      .min(2, "O nome deve ter ao menos 2 caracteres"),
    email: yup
      .string()
      .required(requiredMessage)
      .matches(/\S+@\S+\.\S+/, "Email inválido"),
    senha: yup
      .string()
      .required(requiredMessage)
      .matches(
        /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[$*&@#])[0-9a-zA-Z$*&@#]{8,}$/,
        "A senha deve conter ao menos uma letra maiúscula, uma letra minúscula, um númeral, um caractere especial e um total de 8 caracteres"
      ),
    confirmar_senha: yup
      .string()
      .required(requiredMessage)
      .equals([yup.ref("senha")], "As senhas não conferem"),
  })
  .required();

export default function SignUp() {
  const theme = useTheme();
  const { setTheme } = useContext<any>(ThemeContext);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmar_senha: "",
    },
    mode: "onSubmit",
    resolver: yupResolver(schema),
  });
  const { signUp } = useContext<any>(AuthContext);
  const userContext = useContext<any>(UserContext);
  const sendImageToStorage = userContext?.sendImageToStorage;

  const [exibirSenha, setExibirSenha] = useState(true);
  const [requisitando, setRequisitando] = useState(false);
  const [dialogVisivel, setDialogVisivel] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });
  const [urlDevice, setUrlDevice] = useState<string | undefined>("");
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const emailRef = useRef<any>(null);
  const senhaRef = useRef<any>(null);
  const confirmarSenhaRef = useRef<any>(null);

  async function cadastrar(data: Usuario) {
    setRequisitando(true);
    try {
      data.perfil = Perfil.Aluno;

      const msg = await signUp(data);
      if (msg !== "ok") {
        setMensagem({ tipo: "erro", mensagem: msg });
        setDialogVisivel(true);
        setRequisitando(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { auth } = await import("@/firebase/FirebaseInit");
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setMensagem({
          tipo: "erro",
          mensagem: "Erro ao obter dados do usuário.",
        });
        setDialogVisivel(true);
        setRequisitando(false);
        return;
      }

      let fotoSalva = false;
      if (urlDevice && urlDevice.trim() !== "") {
        try {
          const urlStorage = await sendImageToStorage(
            urlDevice,
            currentUser.uid
          );

          if (urlStorage) {
            const { firestore } = await import("@/firebase/FirebaseInit");
            const { doc, setDoc } = await import("firebase/firestore");
            await setDoc(
              doc(firestore, "usuarios", currentUser.uid),
              { urlFoto: urlStorage },
              { merge: true }
            );
            fotoSalva = true;
          }
        } catch (error: any) {
          console.error("Erro ao fazer upload da foto:", error);
        }
      }

      setMensagem({
        tipo: "ok",
        mensagem: urlDevice && !fotoSalva
          ? `Cadastro realizado com sucesso, mas houve um problema ao salvar a foto. Você pode adicionar uma foto depois no perfil.\n${data.email}`
          : `Show! Você foi cadastrado com sucesso. Verifique seu email para validar sua conta.\n${data.email}`,
      });
      setDialogVisivel(true);
      setRequisitando(false);
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      setMensagem({
        tipo: "erro",
        mensagem: "Erro ao cadastrar. Tente novamente.",
      });
      setDialogVisivel(true);
      setRequisitando(false);
    }
  }

  async function buscaNaGaleria() {
    try {
      setCarregandoFoto(true);
      // Solicita permissão se necessário
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setMensagem({
          tipo: "erro",
          mensagem: "Permissão para acessar a galeria é necessária.",
        });
        setDialogVisivel(true);
        setCarregandoFoto(false);
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (uri) {
          setUrlDevice(uri);
        }
      }
      setCarregandoFoto(false);
    } catch (error: any) {
      console.error("Erro ao buscar foto na galeria:", error);
      setMensagem({
        tipo: "erro",
        mensagem: "Erro ao acessar a galeria. Tente novamente.",
      });
      setDialogVisivel(true);
      setCarregandoFoto(false);
    }
  }

  async function tiraFoto() {
    try {
      setCarregandoFoto(true);
      // Solicita permissão se necessário
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setMensagem({
          tipo: "erro",
          mensagem: "Permissão para acessar a câmera é necessária.",
        });
        setDialogVisivel(true);
        setCarregandoFoto(false);
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (uri) {
          setUrlDevice(uri);
        }
      }
      setCarregandoFoto(false);
    } catch (error: any) {
      console.error("Erro ao tirar foto:", error);
      setMensagem({
        tipo: "erro",
        mensagem: "Erro ao acessar a câmera. Tente novamente.",
      });
      setDialogVisivel(true);
      setCarregandoFoto(false);
    }
  }

  return (
    <SafeAreaView
      style={{
        ...styles.container,
        backgroundColor: theme.colors.background,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <>
            <View style={styles.themeRow}>
              <Button
                mode="outlined"
                onPress={() => setTheme(theme.dark ? "light" : "dark")}
                icon={
                  theme.dark ? "white-balance-sunny" : "moon-waning-crescent"
                }
              >
                {theme.dark ? "Claro" : "Escuro"}
              </Button>
            </View>
            <View style={styles.imageContainer}>
              <Image
                style={styles.image}
                source={
                  urlDevice && urlDevice.trim() !== ""
                    ? { uri: urlDevice }
                    : require("../assets/images/person.png")
                }
              />
              {carregandoFoto && (
                <View style={styles.imageOverlay}>
                  <Text style={styles.overlayText}>Carregando...</Text>
                </View>
              )}
            </View>

            <View style={styles.divButtonsImage}>
              <Button
                style={styles.buttonImage}
                mode="outlined"
                icon="image"
                onPress={buscaNaGaleria}
                disabled={carregandoFoto}
                loading={carregandoFoto}
              >
                Galeria
              </Button>
              <Button
                style={styles.buttonImage}
                mode="outlined"
                icon="camera"
                onPress={tiraFoto}
                disabled={carregandoFoto}
                loading={carregandoFoto}
              >
                Foto
              </Button>
            </View>

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.textinput}
                  label="Nome"
                  placeholder="Digite seu nome completo"
                  mode="outlined"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  right={<TextInput.Icon icon="smart-card" />}
                />
              )}
              name="nome"
            />
            {errors.email && (
              <Text style={{ ...styles.textError, color: theme.colors.error }}>
                {errors.nome?.message?.toString()}
              </Text>
            )}

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={emailRef}
                  style={styles.textinput}
                  label="Email"
                  placeholder="Digite seu email"
                  mode="outlined"
                  autoCapitalize="none"
                  returnKeyType="next"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  onSubmitEditing={() => senhaRef.current?.focus()}
                  right={<TextInput.Icon icon="email" />}
                />
              )}
              name="email"
            />
            {errors.email && (
              <Text style={{ ...styles.textError, color: theme.colors.error }}>
                {errors.email?.message?.toString()}
              </Text>
            )}

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={senhaRef}
                  style={styles.textinput}
                  label="Senha"
                  placeholder="Digite sua senha"
                  mode="outlined"
                  autoCapitalize="none"
                  returnKeyType="next"
                  secureTextEntry={exibirSenha}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  onSubmitEditing={() => confirmarSenhaRef.current?.focus()}
                  right={
                    <TextInput.Icon
                      icon="eye"
                      onPress={() => setExibirSenha((previus) => !previus)}
                    />
                  }
                />
              )}
              name="senha"
            />
            {errors.senha && (
              <Text style={{ ...styles.textError, color: theme.colors.error }}>
                {errors.senha?.message?.toString()}
              </Text>
            )}
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={confirmarSenhaRef}
                  style={styles.textinput}
                  label="Confirmar senha"
                  placeholder="Confirme sua senha"
                  mode="outlined"
                  autoCapitalize="none"
                  returnKeyType="go"
                  secureTextEntry={exibirSenha}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  onSubmitEditing={handleSubmit(cadastrar)}
                  right={
                    <TextInput.Icon
                      icon="eye"
                      onPress={() => setExibirSenha((previus) => !previus)}
                    />
                  }
                />
              )}
              name="confirmar_senha"
            />
            {errors.confirmar_senha && (
              <Text style={{ ...styles.textError, color: theme.colors.error }}>
                {errors.confirmar_senha?.message?.toString()}
              </Text>
            )}
            <Button
              style={styles.button}
              mode="contained"
              onPress={handleSubmit(cadastrar)}
              loading={requisitando}
              disabled={requisitando}
            >
              {!requisitando ? "Cadastrar" : "Cadastrando"}
            </Button>
            <Divider />
            <View style={styles.divCadastro}>
              <Text variant="labelMedium">Já possui uma conta?</Text>
              <Text
                style={{ ...styles.textCadastro, color: theme.colors.tertiary }}
                variant="labelMedium"
                onPress={() => router.push("/signIn")}
              >
                {" "}
                Entrar
              </Text>
            </View>
          </>
        </ScrollView>
      </KeyboardAvoidingView>
      <Dialog
        visible={dialogVisivel}
        onDismiss={() => {
          setDialogVisivel(false);
          if (mensagem.tipo === "ok") {
            router.back();
          }
        }}
      >
        <Dialog.Icon
          icon={
            mensagem.tipo === "ok"
              ? "checkbox-marked-circle-outline"
              : "alert-circle-outline"
          }
          size={60}
        />
        <Dialog.Title style={styles.textDialog}>
          {mensagem.tipo === "ok" ? "Informação" : "Erro"}
        </Dialog.Title>
        <Dialog.Content>
          <Text style={styles.textDialog} variant="bodyLarge">
            {mensagem.mensagem}
          </Text>
        </Dialog.Content>
      </Dialog>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const imageSize = Math.min(width * 0.5, 200);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: containerPadding.horizontal,
  },
  themeRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
  },
  imageContainer: {
    position: "relative",
    alignSelf: "center",
    marginTop: spacing.md,
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: imageSize / 2,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: imageSize / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  textinput: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    marginTop: spacing.md,
    backgroundColor: "transparent",
  },
  textEsqueceuSenha: {
    alignSelf: "flex-end",
    marginTop: spacing.md,
  },
  textCadastro: {},
  textError: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    backgroundColor: "#22c55e",
  },
  divButtonsImage: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  divCadastro: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonImage: {
    flex: 1,
    maxWidth: 180,
  },
  textDialog: {
    textAlign: "center",
  },
});
