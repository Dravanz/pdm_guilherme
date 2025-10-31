import React, { useContext } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { ThemeContext } from "@/context/ThemeProvider";

const mockCourses = [
  { id: "1", titulo: "Introdução a JavaScript", nivel: "Iniciante" },
  { id: "2", titulo: "React Native na prática", nivel: "Intermediário" },
  { id: "3", titulo: "Algoritmos e Estruturas de Dados", nivel: "Intermediário" },
];

export default function Cursos() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  
  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={mockCourses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title 
              title={item.titulo} 
              subtitle={`Nível: ${item.nivel}`}
              titleStyle={{ color: theme.colors.onSurface }}
              subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
            />
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: themeStyles.spacing.sm }} />}
        ListHeaderComponent={
          <Text variant="headlineMedium" style={[themeStyles.header, { color: theme.colors.onBackground }]}>
            Cursos
          </Text>
        }
        contentContainerStyle={{ padding: themeStyles.spacing.md }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
