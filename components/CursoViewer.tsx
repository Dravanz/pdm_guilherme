import { borderRadius, containerPadding, spacing } from "@/constants/Layout";
import { ImageService } from "@/services/image/ImageService";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, RadioButton, Text, useTheme } from "react-native-paper";
import { PaginaCurso, Questao } from "../model/Curso";
import { ResponsiveImage } from "./ResponsiveImage";

interface CursoViewerProps {
  pagina: PaginaCurso;
  onProximaPagina: () => void;
  questoesRespondidas: string[];
  onResponderQuestao: (
    questaoId: string,
    alternativaId: string,
    correta: boolean,
    explicacao: string,
    linkDocumentacao?: string
  ) => Promise<any>;
  isLastPage?: boolean;
  modo?: string;
}

export function CursoViewer({
  pagina,
  onProximaPagina,
  questoesRespondidas,
  onResponderQuestao,
  isLastPage,
  modo,
}: CursoViewerProps) {
  const [respostasQuestoes, setRespostasQuestoes] = useState<{
    [key: string]: string;
  }>({});
  const [processando, setProcessando] = useState(false);
  const theme = useTheme();

  const handleResposta = (questaoId: string, alternativaId: string) => {
    if (questoesRespondidas.includes(questaoId)) return;

    setRespostasQuestoes((prev) => ({
      ...prev,
      [questaoId]: alternativaId,
    }));
  };

  const enviarResposta = async (questao: Questao) => {
    const alternativaSelecionada = respostasQuestoes[questao.id];
    if (!alternativaSelecionada) {
      Alert.alert("Atenção", "Selecione uma alternativa antes de enviar.");
      return;
    }

    setProcessando(true);

    try {
      const alternativa = questao.alternativas.find(
        (alt) => alt.id === alternativaSelecionada
      );
      const correta = alternativa?.correta || false;

      const resultado = await onResponderQuestao(
        questao.id,
        alternativaSelecionada,
        correta,
        questao.explicacao,
        questao.linkDocumentacao
      );

      if (resultado.sucesso) {
        Alert.alert(
          "Sucesso!",
          `${resultado.explicacao}\n\nCoeficiente atual: ${resultado.novoCoeficiente}%`
        );
      } else {
        const botoes: any[] = [{ text: "OK" }];
        
        if (questao.linkDocumentacao) {
          botoes.push({
            text: "Ver Documentação",
            onPress: () => {
              // Aqui idealmente abriríamos o link. 
              // Como é um link externo ou interno, precisaríamos de um handler.
              // Por enquanto, vamos assumir que é um link web e usar Linking,
              // ou se for interno, usar router.
              // Vamos tentar abrir como link externo se começar com http,
              // senão assumir que é uma rota interna ou apenas mostrar o link.
              Alert.alert("Link", questao.linkDocumentacao);
            }
          });
        }

        Alert.alert(
          "Incorreto",
          `${resultado.explicacao}\n\nCoeficiente atual: ${resultado.novoCoeficiente}%`,
          botoes
        );
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível processar a resposta."
      );
    } finally {
      setProcessando(false);
    }
  };

  if (pagina.tipo === "conteudo") {
    return (
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Title title={pagina.titulo || "Título não encontrado"} />
          <Card.Content>
            {pagina.imagem && (
              <ResponsiveImage
                source={{
                  uri: pagina.imagem.startsWith("http")
                    ? pagina.imagem
                    : ImageService.getImageUrl(pagina.imagem),
                }}
                placeholder="https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Carregando..."
              />
            )}
            <View
              style={[
                styles.conteudoContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              <Text
                variant="bodyMedium"
                style={[styles.conteudo, { color: theme.colors.onSurface }]}
              >
                {pagina.conteudo || "Conteúdo não encontrado"}
              </Text>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={onProximaPagina}>
              {isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir") : "Próxima"}
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
              <View
                key={questao.id}
                style={[
                  styles.questaoContainer,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Text
                  variant="titleMedium"
                  style={[
                    styles.pergunta,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {questao.pergunta}
                </Text>

                <RadioButton.Group
                  onValueChange={(value) => handleResposta(questao.id, value)}
                  value={respostasQuestoes[questao.id] || ""}
                >
                  {questao.alternativas.map((alternativa) => (
                    <View
                      key={alternativa.id}
                      style={[
                        styles.alternativaContainer,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.outline,
                          borderWidth: 1,
                          borderRadius: 8,
                        },
                      ]}
                    >
                      <RadioButton.Item
                        label={alternativa.texto}
                        value={alternativa.id}
                        disabled={jaRespondida}
                        labelStyle={{ color: theme.colors.onSurface }}
                        status={
                          respostasQuestoes[questao.id] === alternativa.id
                            ? "checked"
                            : "unchecked"
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
                  <Text
                    style={[
                      styles.jaRespondida,
                      { color: theme.colors.primary },
                    ]}
                  >
                    ✓ Questão já respondida
                  </Text>
                )}
              </View>
            );
          })}
        </Card.Content>

        <Card.Actions>
          <Button mode="outlined" onPress={onProximaPagina}>
            {isLastPage ? (modo === 'preview' ? "Voltar aos Cursos" : "Concluir") : "Próxima Página"}
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: containerPadding.horizontal,
    paddingVertical: containerPadding.vertical,
  },
  card: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
  },
  conteudoContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
  },
  conteudo: {
    lineHeight: 24,
  },
  questaoContainer: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  pergunta: {
    marginBottom: spacing.md,
    fontWeight: "bold",
  },
  alternativaContainer: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: borderRadius.sm,
  },
  botaoEnviar: {
    marginTop: spacing.md,
  },
  jaRespondida: {
    marginTop: spacing.md,
    fontWeight: "bold",
    textAlign: "center",
  },
});
