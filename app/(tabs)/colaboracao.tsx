import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Perfil } from "@/model/Perfil";
import { router } from "expo-router";
import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Icon, Text, useTheme } from "react-native-paper";

export default function Colaboracao() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase } = useContext<any>(UserContext);

  if (!userFirebase || (userFirebase.perfil !== Perfil.Colaborador && userFirebase.perfil !== Perfil.Moderador)) {
    return (
      <SafeAreaView style={[themeStyles.container, { backgroundColor: theme.colors.background, flex: 1 }]}>
        <View style={styles.center}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
            Esta área é exclusiva para colaboradores.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: theme.colors.background, flex: 1 }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Colaboração
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
          Gerencie cursos e documentações da plataforma
        </Text>

        <Card
          style={[themeStyles.card, styles.navCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.push("/gerenciar-cursos" as any)}
        >
          <Card.Content style={styles.cardContent}>
            <Icon source="school" size={32} color={theme.colors.primary} />
            <View style={styles.cardText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Gerenciar Cursos
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Criar, editar e acompanhar cursos
              </Text>
            </View>
            <Icon source="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </Card.Content>
        </Card>

        <Card
          style={[themeStyles.card, styles.navCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.push("/gerenciar-documentacao" as any)}
        >
          <Card.Content style={styles.cardContent}>
            <Icon source="file-document" size={32} color={theme.colors.primary} />
            <View style={styles.cardText}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Gerenciar Documentação
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Criar e editar documentações técnicas
              </Text>
            </View>
            <Icon source="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontWeight: "700",
    marginBottom: 8,
  },
  navCard: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
});
