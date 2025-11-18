import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { Text, Card, Button, RadioButton, useTheme } from 'react-native-paper';
import { PaginaCurso, Questao } from '../model/Curso';

interface CursoViewerProps {
  pagina: PaginaCurso;
  onProximaPagina: () => void;
  questoesRespondidas: string[];
  onResponderQuestao: (questaoId: string, alternativaId: string, correta: boolean, explicacao: string) => Promise<any>;
}

export function CursoViewer({ 
  pagina, 
  onProximaPagina, 
  questoesRespondidas,
  onResponderQuestao
}: CursoViewerProps) {
  const [respostasQuestoes, setRespostasQuestoes] = useState<{ [key: string]: string }>({});
  const [processando, setProcessando] = useState(false);
  const theme = useTheme();

  const handleResposta = (questaoId: string, alternativaId: string) => {
    if (questoesRespondidas.includes(questaoId)) return;
    
    setRespostasQuestoes(prev => ({
      ...prev,
      [questaoId]: alternativaId
    }));
  };

  const enviarResposta = async (questao: Questao) => {
    const alternativaSelecionada = respostasQuestoes[questao.id];
    if (!alternativaSelecionada) {
      Alert.alert('Atenção', 'Selecione uma alternativa antes de enviar.');
      return;
    }

    setProcessando(true);
    
    try {
      const alternativa = questao.alternativas.find(alt => alt.id === alternativaSelecionada);
      const correta = alternativa?.correta || false;
      
      const resultado = await onResponderQuestao(
        questao.id,
        alternativaSelecionada,
        correta,
        questao.explicacao
      );

      Alert.alert(
        resultado.sucesso ? 'Sucesso!' : 'Incorreto',
        `${resultado.explicacao}\n\nCoeficiente atual: ${resultado.novoCoeficiente}%`
      );

    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível processar a resposta.');
    } finally {
      setProcessando(false);
    }
  };

  if (pagina.tipo === 'conteudo') {
    return (
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title title={pagina.titulo || 'Título não encontrado'} />
          <Card.Content>
            {pagina.imagem && (
              <Image 
                source={{ uri: pagina.imagem }} 
                style={styles.imagem}
                resizeMode="contain"
                onError={(error) => console.error('Erro ao carregar imagem:', error.nativeEvent.error)}
              />
            )}
            <Text variant="bodyMedium" style={[styles.conteudo, { color: theme.colors.onSurface }]}>
              {pagina.conteudo || 'Conteúdo não encontrado'}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={onProximaPagina}>
              Próxima
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title={pagina.titulo} />
        <Card.Content>
          {pagina.questoes?.map((questao) => {
            const jaRespondida = questoesRespondidas.includes(questao.id);
            
            return (
              <View key={questao.id} style={[styles.questaoContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="titleMedium" style={[styles.pergunta, { color: theme.colors.onSurfaceVariant }]}>
                  {questao.pergunta}
                </Text>
                
                <RadioButton.Group
                  onValueChange={(value) => handleResposta(questao.id, value)}
                  value={respostasQuestoes[questao.id] || ''}
                >
                  {questao.alternativas.map((alternativa) => (
                    <View key={alternativa.id} style={styles.alternativaContainer}>
                      <RadioButton.Item
                        label={alternativa.texto}
                        value={alternativa.id}
                        disabled={jaRespondida}
                        labelStyle={{ color: theme.colors.onSurface }}
                        status={
                          respostasQuestoes[questao.id] === alternativa.id 
                            ? 'checked' 
                            : 'unchecked'
                        }
                      />
                    </View>
                  ))}
                </RadioButton.Group>
                
                {!jaRespondida && (
                  <Button
                    mode="contained"
                    onPress={() => enviarResposta(questao)}
                    loading={processando}
                    disabled={processando || !respostasQuestoes[questao.id]}
                    style={styles.botaoEnviar}
                  >
                    Enviar Resposta
                  </Button>
                )}
                
                {jaRespondida && (
                  <Text style={[styles.jaRespondida, { color: theme.colors.primary }]}>
                    ✓ Questão já respondida
                  </Text>
                )}
              </View>
            );
          })}
        </Card.Content>
        
        <Card.Actions>
          <Button mode="outlined" onPress={onProximaPagina}>
            Próxima Página
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  imagem: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
  },
  conteudo: {
    lineHeight: 24,
    marginBottom: 16,
  },
  questaoContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
  },
  pergunta: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  alternativaContainer: {
    marginBottom: 8,
  },
  botaoEnviar: {
    marginTop: 12,
  },
  jaRespondida: {
    marginTop: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});