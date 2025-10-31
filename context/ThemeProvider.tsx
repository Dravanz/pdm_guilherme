// @ts-nocheck
import React, { createContext, useMemo, useState, useEffect } from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const themeLight = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#16a34a",
    onPrimary: "#ffffff",
    secondary: "#0ea5a4",
    onSecondary: "#ffffff",
    tertiary: "#65a30d",
    onTertiary: "#ffffff",
    background: "#ffffff",
    onBackground: "#1f2937",
    surface: "#f9fafb",
    onSurface: "#1f2937",
    surfaceVariant: "#f3f4f6",
    onSurfaceVariant: "#6b7280",
    outline: "#d1d5db",
    error: "#dc2626",
    onError: "#ffffff",
    success: "#16a34a",
    onSuccess: "#ffffff",
    warning: "#f59e0b",
    onWarning: "#ffffff",
    streak: "#ea580c",
    onStreak: "#ffffff",
  },
};

const themeDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#22c55e",
    onPrimary: "#0f172a",
    secondary: "#14b8a6",
    onSecondary: "#0f172a",
    tertiary: "#84cc16",
    onTertiary: "#0f172a",
    background: "#0f172a",
    onBackground: "#f1f5f9",
    surface: "#1e293b",
    onSurface: "#f1f5f9",
    surfaceVariant: "#334155",
    onSurfaceVariant: "#94a3b8",
    outline: "#475569",
    error: "#ef4444",
    onError: "#ffffff",
    success: "#22c55e",
    onSuccess: "#0f172a",
    warning: "#fbbf24",
    onWarning: "#0f172a",
    streak: "#fb923c",
    onStreak: "#0f172a",
  },
};

export const ThemeContext = createContext({ isDark: false, setTheme: (_m: string) => {}, toggleTheme: () => {} });

// Estilos padronizados para todo o app
export const globalStyles = {
  // Containers
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  
  // Cards
  card: {
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  
  // Botões
  button: {
    minHeight: 48,
    borderRadius: 12,
    marginVertical: 8,
  },
  buttonPrimary: {
    minHeight: 48,
    borderRadius: 12,
    marginVertical: 8,
  },
  buttonSecondary: {
    minHeight: 48,
    borderRadius: 12,
    marginVertical: 8,
  },
  buttonOutlined: {
    minHeight: 48,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  
  // Inputs
  textInput: {
    minHeight: 56,
    marginVertical: 8,
    backgroundColor: 'transparent' as const,
  },
  
  // Textos
  text: {
    lineHeight: 24,
  },
  textCenter: {
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  header: {
    marginBottom: 16,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  
  // Espaçamentos
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export function ThemeProvider({ children }: any) {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    try {
      let savedTheme;
      if (Platform.OS === "web") {
        savedTheme = localStorage.getItem("theme");
      } else {
        savedTheme = await SecureStore.getItemAsync("theme");
      }
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (e) {
      console.error("Erro ao carregar tema:", e);
    }
    setIsLoading(false);
  }

  async function saveTheme(mode: 'light' | 'dark') {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem("theme", mode);
      } else {
        await SecureStore.setItemAsync("theme", mode);
      }
      setIsDark(mode === 'dark');
    } catch (e) {
      console.error("Erro ao salvar tema:", e);
    }
  }

  const value = useMemo(() => ({
    isDark,
    isLoading,
    setTheme: saveTheme,
    toggleTheme: () => saveTheme(isDark ? 'light' : 'dark'),
    styles: globalStyles,
  }), [isDark, isLoading]);

  if (isLoading) {
    return null; // ou um componente de loading
  }

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={(isDark ? themeDark : themeLight) as any}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}


