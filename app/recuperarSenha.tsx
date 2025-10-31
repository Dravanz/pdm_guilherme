// @ts-nocheck
import { AuthContext } from "@/context/AuthProvider";
import { router } from "expo-router";
import React, { useContext, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import {
  Button,
  Dialog,
  Divider,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

export default function RecuperarSenha() {
  const theme = useTheme();
  const { resetPassword } = useContext<any>(AuthContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    message: string;
    ok?: boolean;
  }>({ visible: false, message: "" });

  async function enviar() {
    if (!email) {
      setDialog({ visible: true, message: "Informe o email da sua conta." });
      return;
    }
    setLoading(true);
    const res = await resetPassword(email);
    setLoading(false);
    if (res === "ok") {
      setDialog({
        visible: true,
        message: `Enviamos um email para ${email}.`,
        ok: true,
      });
    } else {
      setDialog({ visible: true, message: res });
    }
  }

  return (
    <SafeAreaView
      style={{ ...styles.container, backgroundColor: theme.colors.background }}
    >
      <TextInput
        style={styles.textinput}
        label="Email"
        placeholder="Digite seu email"
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        right={<TextInput.Icon icon="email" />}
      />
      <Button
        style={styles.button}
        mode="contained"
        onPress={enviar}
        loading={loading}
        disabled={loading}
      >
        {loading ? "Enviando" : "Enviar email de recuperação"}
      </Button>
      <Divider />
      <Button style={styles.button} mode="contained" onPress={() => router.push("/signIn")}>
        Voltar
      </Button>
      <Dialog
        visible={dialog.visible}
        onDismiss={() => {
          const shouldGoBack = dialog.ok;
          setDialog({ visible: false, message: "" });
          if (shouldGoBack) {
            router.replace("/signIn");
          }
        }}
      >
        <Dialog.Icon
          icon={
            dialog.ok
              ? "checkbox-marked-circle-outline"
              : "alert-circle-outline"
          }
          size={60}
        />
        <Dialog.Title style={styles.textDialog}>
          {dialog.ok ? "Sucesso" : "Atenção"}
        </Dialog.Title>
        <Dialog.Content>
          <Text style={styles.textDialog} variant="bodyLarge">
            {dialog.message}
          </Text>
        </Dialog.Content>
      </Dialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 40 },
  textinput: {
    width: 350,
    height: 50,
    marginTop: 20,
    backgroundColor: "transparent",
  },
  button: { marginTop: 24, backgroundColor: "#00ff55" },
  textDialog: { textAlign: "center" },
});
