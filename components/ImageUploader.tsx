import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { ImageService } from '@/services/ImageService';

export function ImageUploader() {
  const theme = useTheme();
  const [pattern, setPattern] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!pattern.trim()) {
      Alert.alert('Erro', 'Digite o padrão da imagem (ex: js1-function)');
      return;
    }

    try {
      const imageUri = await ImageService.pickImage();
      if (!imageUri) return;

      setUploading(true);
      const downloadUrl = await ImageService.uploadImageWithPattern(pattern.trim(), imageUri);
      
      Alert.alert(
        'Sucesso!', 
        `Imagem enviada com sucesso!\nPadrão: ${pattern}\nURL: ${downloadUrl}`,
        [{ text: 'OK', onPress: () => setPattern('') }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          📸 Upload de Imagem
        </Text>
        
        <Text variant="bodySmall" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          Use o padrão: [curso][página]-[conteúdo]
        </Text>
        
        <Text variant="bodySmall" style={[styles.examples, { color: theme.colors.primary }]}>
          Exemplos: js1-function, py2-variables, rx3-components
        </Text>

        <TextInput
          label="Padrão da Imagem"
          value={pattern}
          onChangeText={setPattern}
          mode="outlined"
          placeholder="js1-function"
          style={styles.input}
          autoCapitalize="none"
        />

        <Button
          mode="contained"
          onPress={handleUpload}
          loading={uploading}
          disabled={uploading || !pattern.trim()}
          style={styles.button}
        >
          Selecionar e Enviar Imagem
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: '600',
  },
  description: {
    marginBottom: 4,
  },
  examples: {
    marginBottom: 16,
    fontStyle: 'italic',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});