import React, { useContext, useState, useEffect } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { Card, Text, useTheme, Button } from "react-native-paper";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Curso } from "@/model/Curso";
import { router } from "expo-router";

const cursosDisponiveis: Curso[] = [
  {
    id: "javascript-basico",
    titulo: "JavaScript Básico",
    descricao: "Aprenda os fundamentos do JavaScript",
    categoria: "programacao",
    nivel: "iniciante",
    paginas: [],
    coeficienteMaximo: 100,
    createdAt: null,
    updatedAt: null,
  },
];

export default function Cursos() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { user } = useContext<any>(UserContext);
  
  const iniciarCurso = (curso: Curso) => {
    router.push({
      pathname: "/curso/[id]",
      params: { id: curso.id }
    });
  };
  
  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={cursosDisponiveis}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Title 
              title={item.titulo} 
              subtitle={`Nível: ${item.nivel} • ${item.categoria}`}
              titleStyle={{ color: theme.colors.onSurface }}
              subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
            />
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {item.descricao}
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button 
                mode="contained" 
                onPress={() => iniciarCurso(item)}
                style={{ backgroundColor: "#22c55e" }}
              >
                Iniciar Curso
              </Button>
            </Card.Actions>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: themeStyles.spacing.sm }} />}
        ListHeaderComponent={
          <Text variant="headlineMedium" style={[themeStyles.header, { color: theme.colors.onBackground }]}>
            Cursos Disponíveis
          </Text>
        }
        contentContainerStyle={{ padding: themeStyles.spacing.md }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
