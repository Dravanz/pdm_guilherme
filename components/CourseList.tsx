import React, { useContext, useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Card, Text, useTheme, Button } from "react-native-paper";
import { Image } from "expo-image";
import { ThemeContext } from "@/context/ThemeProvider";
import { UserContext } from "@/context/UserProvider";
import { Curso } from "@/model/Curso";
import { CursoService } from "@/services/CursoService";
import { CourseConfig } from "@/config/CourseConfig";
import { ImageService } from "@/services/ImageService";
import { router } from "expo-router";

interface CourseListProps {
  showHeader?: boolean;
  limit?: number;
}

export function CourseList({ showHeader = true, limit }: CourseListProps) {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);
  const [cursosStatus, setCursosStatus] = useState<{[key: string]: boolean}>({});
  const [cursosDisponiveis, setCursosDisponiveis] = useState<Curso[]>([]);
  
  useEffect(() => {
    carregarCursos();
  }, []);
  
  useEffect(() => {
    if (user && cursosDisponiveis.length > 0) {
      verificarStatusCursos();
    }
  }, [user, cursosDisponiveis]);
  
  const carregarCursos = () => {
    const courses = CourseConfig.getAllCourses().map(course => ({
      id: course.id,
      titulo: course.titulo,
      descricao: course.description,
      categoria: course.categoria,
      nivel: course.nivel as 'iniciante' | 'intermediario' | 'avancado',
      imageUrl: course.imageUrl,
      paginas: [],
      coeficienteMaximo: 100,
      createdAt: null,
      updatedAt: null,
    }));
    
    const limitedCourses = limit ? courses.slice(0, limit) : courses;
    setCursosDisponiveis(limitedCourses);
  };
  
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
    <FlatList
      data={cursosDisponiveis}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card style={[themeStyles.card, { backgroundColor: theme.colors.surface }]}>
          {item.imageUrl && (
            <Image
              source={{ uri: ImageService.getImageUrl(item.imageUrl) }}
              style={styles.courseImage}
              contentFit="contain"
              placeholder="https://via.placeholder.com/300x120/cccccc/666666?text=Curso"
            />
          )}
          <Card.Title 
            title={item.titulo} 
            subtitle={`Nível: ${item.nivel.charAt(0).toUpperCase() + item.nivel.slice(1)} • ${item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}`}
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
        showHeader ? (
          <Text variant="headlineMedium" style={[themeStyles.header, { color: theme.colors.onBackground }]}>
            Cursos Disponíveis
          </Text>
        ) : null
      }
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  courseImage: {
    width: '100%',
    height: 60,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});