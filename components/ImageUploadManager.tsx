import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ImageUploadService } from '@/services/ImageUploadService';

export const ImageUploadManager: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const theme = useTheme();

  const handleUploadImages = async () => {
    try {
      setUploading(true);
      setUploadStatus('Iniciando upload das imagens...');
      
      const uploadedImages = await ImageUploadService.uploadCourseImages();
      
      setUploadStatus(`Upload concluído! ${Object.keys(uploadedImages).length} imagens enviadas.`);
      
      Alert.alert(
        'Upload Concluído',
        `${Object.keys(uploadedImages).length} imagens foram enviadas para o Firebase Storage com sucesso!`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadStatus('Erro no upload das imagens.');
      Alert.alert('Erro', 'Falha ao fazer upload das imagens.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: theme.colors.background }}>
      <Text variant="titleMedium" style={{ 
        marginBottom: 10,
        color: theme.colors.onBackground 
      }}>
        Gerenciador de Imagens dos Cursos
      </Text>
      
      <Text variant="bodyMedium" style={{ 
        marginBottom: 20,
        color: theme.colors.onSurfaceVariant 
      }}>
        Faça upload das imagens do placeholder para o Firebase Storage
      </Text>
      
      <TouchableOpacity
        onPress={handleUploadImages}
        disabled={uploading}
        style={{
          backgroundColor: uploading ? theme.colors.surfaceVariant : theme.colors.primary,
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 10
        }}
      >
        {uploading ? (
          <ActivityIndicator color={theme.colors.onSurface} />
        ) : (
          <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
            Fazer Upload das Imagens
          </Text>
        )}
      </TouchableOpacity>
      
      {uploadStatus ? (
        <Text variant="bodySmall" style={{ 
          textAlign: 'center',
          color: theme.colors.onSurfaceVariant,
          fontStyle: 'italic'
        }}>
          {uploadStatus}
        </Text>
      ) : null}
    </View>
  );
};