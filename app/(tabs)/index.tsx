import React, { useContext } from "react";
import { SafeAreaView, StyleSheet, View, ScrollView } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";

export default function Dashboard() {
  const theme = useTheme();
  const { userFirebase } = useContext<any>(UserContext);
  
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineLarge" style={[styles.mainTitle, { color: theme.colors.onBackground }]}>Bem-vindo, {userFirebase?.nome || "Usuário"}</Text>
        
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Resumo</Text>
          <View style={styles.statsRow}>
            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.primary }]}>2</Text>
                <Text variant="bodyLarge" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Cursos Ativos</Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.statContent}>
                <Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.primary }]}>45%</Text>
                <Text variant="bodyLarge" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Progresso Médio</Text>
              </Card.Content>
            </Card>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Recomendados</Text>
          <Card style={[styles.courseCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.courseContent}>
              <Text variant="titleLarge" style={[styles.courseTitle, { color: theme.colors.onSurface }]}>TypeScript Essencial</Text>
              <Text variant="bodyLarge" style={[styles.courseLevel, { color: theme.colors.onSurfaceVariant }]}>Intermediário</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.courseCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.courseContent}>
              <Text variant="titleLarge" style={[styles.courseTitle, { color: theme.colors.onSurface }]}>Fundamentos de UX</Text>
              <Text variant="bodyLarge" style={[styles.courseLevel, { color: theme.colors.onSurfaceVariant }]}>Iniciante</Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  mainTitle: {
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 3,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statNumber: {
    fontWeight: '700',
    marginBottom: 8,
  },
  statLabel: {
    textAlign: 'center',
    fontWeight: '500',
  },
  courseCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
  },
  courseContent: {
    paddingVertical: 20,
  },
  courseTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  courseLevel: {
    fontWeight: '500',
  },
});
