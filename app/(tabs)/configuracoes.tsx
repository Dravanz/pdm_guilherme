// @ts-nocheck
import React, { useContext, useState } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from "react-native";
import { List, RadioButton, Text, useTheme, Card, Icon, Button } from "react-native-paper";
import { ThemeContext, globalStyles } from "@/context/ThemeProvider";
import { AuthContext } from "@/context/AuthProvider";
import { router } from "expo-router";

export default function Configuracoes() {
  const theme = useTheme();
  const { isDark, setTheme, styles: themeStyles } = useContext<any>(ThemeContext);
  const { sair } = useContext<any>(AuthContext);
  const [themeChoice, setThemeChoice] = useState(isDark ? 'dark' : 'light');

  async function handleLogout() {
    const res = await sair();
    if (res === 'ok') {
      router.replace('/signIn');
    }
  }

  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={[themeStyles.header, { color: theme.colors.onBackground }]}>Configurações</Text>
      
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
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Conta</Text>
          <Button 
            mode="contained"
            onPress={handleLogout}
            icon="logout"
            style={[themeStyles.button, styles.logoutButton, { backgroundColor: `${theme.colors.error}15` }]}
            textColor={theme.colors.error}
          >
            Sair da Conta
          </Button>
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});


