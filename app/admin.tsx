import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, useTheme, Chip } from 'react-native-paper';
import { Image } from 'expo-image';
import { CourseContentService } from '@/services/CourseContentService';
import { ImageService } from '@/services/ImageService';

interface AdminContentPage {
  id: string;
  titulo: string;
  tipo: 'conteudo' | 'exercicio';
  imagem?: string;
  courseId: string;
  courseName: string;
}

export default function Admin() {
  const theme = useTheme();
  const [pages, setPages] = useState<AdminContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const contentPages = await CourseContentService.getAllContentPages();
      setPages(contentPages as AdminContentPage[]);
      
      // Verificar existência das imagens
      const statusMap: { [key: string]: boolean } = {};
      for (const page of contentPages) {
        const pattern = page.imagem || `${getCourseShort(page.courseId)}${page.id}-content`;
        statusMap[pattern] = await ImageService.checkImageExists(pattern);
      }
      setImageStatus(statusMap);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar conteúdos');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (page: AdminContentPage) => {
    try {
      const imageUri = await ImageService.pickImage();
      if (!imageUri) return;

      setUploading(page.id);
      
      const pattern = page.imagem || `${getCourseShort(page.courseId)}${page.id}-content`;
      await ImageService.uploadImageWithPattern(pattern, imageUri);
      
      // Atualizar status da imagem
      setImageStatus(prev => ({ ...prev, [pattern]: true }));
      
      Alert.alert('Sucesso!', `Imagem enviada para: ${pattern}`);
    } catch {
      Alert.alert('Erro', 'Falha ao fazer upload da imagem');
    } finally {
      setUploading(null);
    }
  };

  const getCourseShort = (courseId: string): string => {
    const map: { [key: string]: string } = {
      'javascript-basico': 'js',
      'python-basico': 'py',
      'react-basico': 'rx'
    };
    return map[courseId] || courseId.substring(0, 2);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.loading}>Carregando conteúdos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <Text variant="headlineMedium" style={styles.title}>
          🔧 Gerenciar Imagens dos Cursos
        </Text>
        
        {pages.map((page) => {
          const pattern = page.imagem || `${getCourseShort(page.courseId)}${page.id}-content`;
          const imageUrl = ImageService.getImageUrl(pattern);
          const imageExists = imageStatus[pattern];
          
          return (
            <Card key={`${page.courseId}-${page.id}`} style={styles.card}>
              <Card.Content>
                <Chip 
                  icon="book" 
                  style={[styles.courseChip, { backgroundColor: theme.colors.primaryContainer }]}
                >
                  {page.courseName}
                </Chip>
                
                <Text variant="titleMedium" style={styles.pageTitle}>
                  {page.titulo}
                </Text>
                
                <Text variant="bodySmall" style={[styles.pattern, { color: theme.colors.onSurfaceVariant }]}>
                  Padrão: {pattern} {imageExists ? '✅' : '❌'}
                </Text>
                
                <Image
                  source={{ 
                    uri: imageExists 
                      ? imageUrl 
                      : 'https://via.placeholder.com/300x150/f0f0f0/999999?text=Imagem+N%C3%A3o+Encontrada'
                  }}
                  style={styles.preview}
                  contentFit="cover"
                />
                
                <Button
                  mode="contained"
                  onPress={() => handleImageUpload(page)}
                  loading={uploading === page.id}
                  disabled={uploading !== null}
                  style={styles.uploadButton}
                >
                  {imageExists ? 'Alterar Imagem' : 'Adicionar Imagem'}
                </Button>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    margin: 20,
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  courseChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pageTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  pattern: {
    marginBottom: 12,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  preview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadButton: {
    marginTop: 8,
  },
});