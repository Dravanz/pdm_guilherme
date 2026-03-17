import { UserContext } from '@/context/UserProvider';
import { FeedbackData, FeedbackService } from '@/services/shared/FeedbackService';
import Constants from 'expo-constants';
import React, { useContext, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Modal, Portal, RadioButton, Text, TextInput, useTheme } from 'react-native-paper';

interface FeedbackModalProps {
  visible: boolean;
  onDismiss: () => void;
  courseId?: string;
  courseTitle?: string;
  pageId?: string;
}

export function FeedbackModal({ visible, onDismiss, courseId, courseTitle, pageId }: FeedbackModalProps) {
  const theme = useTheme();
  const { userFirebase } = useContext<any>(UserContext);
  const [type, setType] = useState<'bug' | 'sugestao' | 'conteudo' | 'outro'>('bug');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Por favor, descreva o problema ou sugestão.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const feedbackData: FeedbackData = {
        userId: userFirebase?.uid || 'anonymous',
        userEmail: userFirebase?.email || 'anonymous',
        userName: userFirebase?.nome || 'Anonymous',
        courseId,
        courseTitle,
        pageId,
        type,
        description,
        deviceInfo: FeedbackService.getDeviceInfo(),
        appVersion: Constants.expoConfig?.version || '1.0.0',
      };

      await FeedbackService.sendFeedback(feedbackData);
      setSuccess(true);
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    } catch (e) {
      setError('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setSuccess(false);
    setDescription('');
    setType('bug');
    setError('');
    onDismiss();
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        {success ? (
          <View style={styles.successContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon source="check-circle" size={28} color={theme.colors.primary} />
              <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>Enviado!</Text>
            </View>
            <Text style={{ textAlign: 'center' }}>Obrigado pelo seu feedback.</Text>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView>
              <Text variant="headlineSmall" style={{ marginBottom: 16, fontWeight: 'bold' }}>
                Reportar Problema / Feedback
              </Text>

              <Text variant="titleMedium" style={{ marginBottom: 8 }}>Tipo:</Text>
              <RadioButton.Group onValueChange={value => setType(value as any)} value={type}>
                <View style={styles.radioRow}>
                  <RadioButton value="bug" />
                  <Text>Bug / Erro</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="conteudo" />
                  <Text>Erro no Conteúdo</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="sugestao" />
                  <Text>Sugestão</Text>
                </View>
              </RadioButton.Group>

              <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8 }}>Descrição:</Text>
              <TextInput
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Descreva o que aconteceu..."
                value={description}
                onChangeText={setDescription}
                style={{ backgroundColor: theme.colors.surface }}
              />
              {error ? <HelperText type="error">{error}</HelperText> : null}

              <View style={styles.buttonContainer}>
                <Button onPress={handleDismiss} style={{ marginRight: 8 }}>Cancelar</Button>
                <Button 
                  mode="contained" 
                  onPress={handleSubmit} 
                  loading={loading} 
                  disabled={loading}
                >
                  Enviar
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
});
