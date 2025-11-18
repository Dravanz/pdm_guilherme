import React, { useContext, useState, useEffect } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { Card, Text, useTheme, Button } from "react-native-paper";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Curso } from "@/model/Curso";
import { CursoService } from "@/services/CursoService";
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
  {
    id: "python-basico",
    titulo: "Python Básico",
    descricao: "Aprenda os fundamentos do Python",
    categoria: "programacao",
    nivel: "iniciante",
    paginas: [],
    coeficienteMaximo: 100,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "react-basico",
    titulo: "React Básico",
    descricao: "Aprenda os fundamentos do React",
    categoria: "frontend",
    nivel: "intermediario",
    paginas: [],
    coeficienteMaximo: 100,
    createdAt: null,
    updatedAt: null,
  },
];

export default function Cursos() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);
  const [cursosStatus, setCursosStatus] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    if (user) {
      verificarStatusCursos();
    }
  }, [user]);
  
  const verificarStatusCursos = async () => {
    const status: {[key: string]: boolean} = {};
    
    for (const curso of cursosDisponiveis) {
      const concluido = await CursoService.verificarCursoConcluido(user.uid, curso.id);
      status[curso.id] = concluido;
    }
    
    setCursosStatus(status);
  };
  
  const iniciarCurso = (curso: Curso) => {
    router.push({
      pathname: "/curso/[id]",
      params: { id: curso.id }
    });
  };
  
  const revisarCurso = (curso: Curso) => {
    router.push({
      pathname: "/curso/[id]",
      params: { id: curso.id, modo: "revisao" }
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
              {cursosStatus[item.id] ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Text style={{ color: '#22c55e', fontWeight: 'bold', fontSize: 16 }}>
                    ✅ Curso concluído
                  </Text>
                  <Button 
                    mode="outlined" 
                    onPress={() => revisarCurso(item)}
                    icon="refresh"
                  >
                    Revisar
                  </Button>
                </View>
              ) : (
                <Button 
                  mode="contained" 
                  onPress={() => iniciarCurso(item)}
                  style={{ backgroundColor: "#22c55e" }}
                >
                  Iniciar Curso
                </Button>
              )}
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
