import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthProvider";
import { UserProvider } from "@/context/UserProvider";
import React from "react";
import { useColorScheme } from "react-native";
import { ThemeProvider } from "@/context/ThemeProvider";
import { DashboardService } from "@/services/DashboardService";


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
          </Stack>
          <StatusBar style="auto" />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
