// @ts-nocheck
import React, { createContext, useMemo, useState, useEffect } from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const themeLight = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary: Green (mantido)
    primary: "#16a34a",
    onPrimary: "#ffffff",
    primaryContainer: "#d1fae5",
    onPrimaryContainer: "#14532d",
    // Secondary: Slate (neutro, suporte discreto)
    secondary: "#64748b",
    onSecondary: "#ffffff",
    secondaryContainer: "#f1f5f9",
    onSecondaryContainer: "#1e293b",
    // Tertiary: Teal (verde-azulado, harmônico com primary)
    tertiary: "#0d9488",
    onTertiary: "#ffffff",
    tertiaryContainer: "#ccfbf1",
    onTertiaryContainer: "#134e4a",
    // Superfícies
    background: "#f4f6f8",
    onBackground: "#1f2937",
    surface: "#ffffff",
    onSurface: "#1f2937",
    surfaceVariant: "#f3f4f6",
    onSurfaceVariant: "#4b5563",
    outline: "#9ca3af",
    outlineVariant: "#d1d5db",
    // Semânticas
    error: "#dc2626",
    onError: "#ffffff",
    errorContainer: "#fee2e2",
    onErrorContainer: "#7f1d1d",
    success: "#16a34a",
    onSuccess: "#ffffff",
    warning: "#d97706",
    onWarning: "#ffffff",
    info: "#2563eb",
    onInfo: "#ffffff",
    streak: "#ea580c",
    onStreak: "#ffffff",
    // Ranking
    rankGold: "#d97706",
    rankSilver: "#6b7280",
    rankBronze: "#b45309",
  },
};

const themeDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary: Green
    primary: "#22c55e",
    onPrimary: "#0f172a",
    primaryContainer: "#14532d",
    onPrimaryContainer: "#bbf7d0",
    // Secondary: Slate (neutro, suporte discreto)
    secondary: "#94a3b8",
    onSecondary: "#0f172a",
    secondaryContainer: "#334155",
    onSecondaryContainer: "#e2e8f0",
    // Tertiary: Teal (verde-azulado, harmônico com primary)
    tertiary: "#2dd4bf",
    onTertiary: "#0f172a",
    tertiaryContainer: "#134e4a",
    onTertiaryContainer: "#99f6e4",
    // Superfícies
    background: "#0f172a",
    onBackground: "#f1f5f9",
    surface: "#1e293b",
    onSurface: "#f1f5f9",
    surfaceVariant: "#334155",
    onSurfaceVariant: "#cbd5e1",
    outline: "#64748b",
    outlineVariant: "#475569",
    // Semânticas
    error: "#ef4444",
    onError: "#ffffff",
    errorContainer: "#7f1d1d",
    onErrorContainer: "#fecaca",
    success: "#22c55e",
    onSuccess: "#0f172a",
    warning: "#fbbf24",
    onWarning: "#0f172a",
    info: "#60a5fa",
    onInfo: "#0f172a",
    streak: "#fb923c",
    onStreak: "#0f172a",
    // Ranking
    rankGold: "#fbbf24",
    rankSilver: "#94a3b8",
    rankBronze: "#d97706",
  },
};

export const ThemeContext = createContext({ isDark: false, setTheme: (_m: string) => {}, toggleTheme: () => {} });

// Estilos padronizados para todo o app
export const globalStyles = {
  // Containers
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  
  // Cards
  card: {
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginHorizontal: 4,
  },
  
  // Botões
  button: {
    minHeight: 48,
    borderRadius: 24,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  buttonPrimary: {
    minHeight: 48,
    borderRadius: 24,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  buttonSecondary: {
    minHeight: 48,
    borderRadius: 24,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  buttonOutlined: {
    minHeight: 48,
    borderRadius: 24,
    marginVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  
  // Inputs
  textInput: {
    minHeight: 56,
    marginVertical: 8,
    marginHorizontal: 4,
    backgroundColor: 'transparent' as const,
  },
  
  // Textos
  text: {
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  textCenter: {
    textAlign: 'center' as const,
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  header: {
    marginBottom: 16,
    marginHorizontal: 4,
    fontWeight: '600' as const,
    lineHeight: 32,
    textAlign: 'center' as const,
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


