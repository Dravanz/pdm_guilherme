import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import { UserProvider } from "@/context/UserProvider";
import { DashboardService } from "@/services/shared/DashboardService";
import * as Notifications from 'expo-notifications';
import React from "react";
import { useColorScheme } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const colorScheme = useColorScheme();
  React.useState(colorScheme === "dark");

  React.useEffect(() => {
    // Inicializar atualização automática do ranking
    DashboardService.iniciarAtualizacaoRanking();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="signIn" />
            <Stack.Screen name="signUp" />
            <Stack.Screen name="recuperarSenha" />
            <Stack.Screen name="gerenciar-cursos" options={{ headerShown: true, title: "Gerenciar Cursos" }} />
            <Stack.Screen name="gerenciar-documentacao" options={{ headerShown: true, title: "Gerenciar Documentação" }} />
          </Stack>
          <StatusBar style="auto" />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
