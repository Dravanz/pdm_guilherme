// @ts-nocheck
import { AuthContext } from "@/context/AuthProvider";
import { ThemeContext } from "@/context/ThemeProvider";
import { Credencial } from "@/model/types";
import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Dimensions, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { spacing, containerPadding } from "@/constants/Layout";
import {
  Button,
  Dialog,
  Divider,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Rect, Svg, Text as SvgText } from "react-native-svg";
import * as yup from "yup";

const requiredMessage = "Campo obrigatório";

/*
  /^
  (?=.*\d)              // deve conter ao menos um dígito
  (?=.*[a-z])           // deve conter ao menos uma letra minúscula
  (?=.*[A-Z])           // deve conter ao menos uma letra maiúscula
  (?=.*[$*&@#])         // deve conter ao menos um caractere especial
  [0-9a-zA-Z$*&@#]{8,}  // deve conter ao menos 8 dos caracteres mencionados
$/
*/
const schema = yup
  .object()
  .shape({
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
  })
  .required();

export default function SignIn() {
  const theme = useTheme();
  const { setTheme } = useContext<any>(ThemeContext);
  const { singIn } = useContext<any>(AuthContext);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      email: "",
      senha: "",
    },
    mode: "onSubmit",
    resolver: yupResolver(schema),
  });
  const [exibirSenha, setExibirSenha] = useState(true);
  const [dialogVisivel, setDialogVisivel] = useState(false);
  const [mensagemDialog, setMensagemDialog] = useState("");
  const senhaRef = useRef<any>(null);

  useEffect(() => {});

  async function entrar(data: Credencial) {
    const result = await singIn(data);
    if (result === "ok") {
      // Navegar para a tela principal
      router.replace("/(tabs)");
    } else {
      setMensagemDialog(result);
      setDialogVisivel(true);
      console.error("Erro ao logar:", result);
    }
  }

  return (
    <SafeAreaView
      style={{ ...styles.container, backgroundColor: theme.colors.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <>
        <View style={styles.themeRow}>
            <Button
              mode="outlined"
              onPress={() => setTheme(theme.dark ? "light" : "dark")}
              icon={theme.dark ? "white-balance-sunny" : "moon-waning-crescent"}
            >
              {theme.dark ? "Claro" : "Escuro"}
            </Button> 
            </View>
    
          <Svg
            width={220}
            height={180}
            viewBox="0 0 230 120"
            style={styles.logoSvg}
          >
            <Rect
              x="4"
              y="4"
              width="200"
              height="120"
              rx="13"
              fill={theme.colors.surface}
              stroke={theme.colors.primary}
              strokeWidth="3"
            />
            <Rect
              x="4"
              y="4"
              width="200"
              height="22"
              rx="13"
              fill={theme.colors.primary}
            />
            <SvgText
              x="20"
              y="78"
              fill={theme.colors.onSurface}
              fontSize="32"
              fontWeight="bold"
            >
              &gt; Execlog_
            </SvgText>
          </Svg>
          <Text style={styles.brand} variant="headlineSmall">
            Entre na sua conta!
          </Text>
          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
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
                right={<TextInput.Icon icon="email" disabled />}
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
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                ref={senhaRef}
                style={styles.textinput}
                label="Senha"
                placeholder="Digite sua senha"
                mode="outlined"
                autoCapitalize="none"
                returnKeyType="go"
                secureTextEntry={exibirSenha}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                onSubmitEditing={handleSubmit(entrar)}
                right={
                  <TextInput.Icon
                    icon="eye"
                    color={
                      exibirSenha
                        ? theme.colors.onBackground
                        : theme.colors.error
                    }
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
          <Button
            style={styles.button}
            mode="contained"
            onPress={handleSubmit(entrar)}
          >
            {"Entrar"}
          </Button>
            <Text
              style={{ ...styles.textSenha, color: theme.colors.tertiary }}
              variant="labelMedium"
              onPress={() => router.push("/recuperarSenha")}
            >
              Esqueci minha senha
            </Text>
          <Divider />

          
          <View style={styles.divCadastro}>
            
            <Text variant="labelMedium">Não tem uma conta?</Text>
            <Text
              style={{ ...styles.textCadastro, color: theme.colors.tertiary }}
              variant="labelMedium"
              onPress={() => router.push("/signUp")}
            >
              {" "}
              Cadastre-se.
            </Text>
          </View>
        </>
        </ScrollView>
      </KeyboardAvoidingView>
      <Dialog visible={dialogVisivel} onDismiss={() => setDialogVisivel(false)}>
        <Dialog.Icon icon="alert-circle-outline" size={60} />
        <Dialog.Title style={styles.textDialog}>Erro</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.textDialog} variant="bodyLarge">
            {mensagemDialog}
          </Text>
        </Dialog.Content>
      </Dialog>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: containerPadding.horizontal,
  },
  texto: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#fff",
  },
  image: {
    width: width * 0.5,
    height: width * 0.5,
    alignSelf: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  logoSvg: {
    alignSelf: "center",
    marginTop: spacing.xxl,
  },
  brand: {
    textAlign: "center",
    marginTop: spacing.sm,
    letterSpacing: 1,
  },
  textinput: {
    width: '100%',
    maxWidth: 400,
    height: 50,
    marginTop: spacing.md,
    backgroundColor: "transparent",
  },
  button: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    backgroundColor: "#22c55e",
  },
  themeRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
  },
  textError: {
    width: '100%',
    maxWidth: 400,
  },
  textDialog: {
    textAlign: "center",
  },
  divCadastro: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "center",
  },
  textSenha: {
    margin: spacing.sm
  },
  textCadastro: {
  },
});
