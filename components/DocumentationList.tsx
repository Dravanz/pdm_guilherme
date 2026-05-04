import { Documentacao, TipoDocumentacao } from "@/model/Documentacao";
import { DocumentacaoService } from "@/services/shared/DocumentacaoService";
import React, { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Text,
    useTheme,
} from "react-native-paper";

interface DocumentationListProps {
  showHeader?: boolean;
  limit?: number;
  horizontal?: boolean;
}

export function DocumentationList({
  showHeader = true,
  limit = 5,
  horizontal = false,
}: DocumentationListProps) {
  const theme = useTheme();
  const [documentacoes, setDocumentacoes] = useState<Documentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    setErro(null);

    const unsubscribe = DocumentacaoService.observarDocumentacoesAprovadas(
      (docs) => {
        setDocumentacoes(docs);
        setCarregando(false);
      },
      limit
    );

    return () => unsubscribe();
  }, [limit]);

  const getTipoIcon = (tipo: TipoDocumentacao) => {
    switch (tipo) {
      case TipoDocumentacao.Documentacao:
        return "book-open-variant";
      case TipoDocumentacao.Atualizacao:
        return "update";
      default:
        return "file-document";
    }
  };

  const getTipoLabel = (tipo: TipoDocumentacao) => {
    switch (tipo) {
      case TipoDocumentacao.Documentacao:
        return "Documentação";
      case TipoDocumentacao.Atualizacao:
        return "Atualização";
      default:
        return "Documentação";
    }
  };

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 8, color: theme.colors.onSurface }}>
          Carregando documentações...
        </Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: theme.colors.error, marginBottom: 8 }}>
          {erro}
        </Text>
        <Button mode="outlined" onPress={() => setCarregando(true)}>
          Tentar Novamente
        </Button>
      </View>
    );
  }

  if (documentacoes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          Nenhuma documentação disponível no momento
        </Text>
      </View>
    );
  }

  const renderCard = (doc: Documentacao) => (
    <Card
      key={doc.id}
      style={[
        horizontal ? styles.horizontalCard : styles.card,
        { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
      ]}
    >
      <Card.Content style={horizontal ? styles.horizontalContent : undefined}>
        <View style={styles.cardHeader}>
          <Chip
            icon={getTipoIcon(doc.tipo)}
            style={[
              styles.chip,
              { backgroundColor: theme.colors.primaryContainer, flexShrink: 1, marginRight: 8 },
            ]}
            textStyle={{ fontSize: 12 }}
            compact
          >
            {getTipoLabel(doc.tipo)}
          </Chip>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, flexShrink: 0 }}
          >
            {doc.dataPublicacao
              ? new Date(doc.dataPublicacao).toLocaleDateString("pt-BR")
              : "Data N/A"}
          </Text>
        </View>

        <Text
          variant="titleMedium"
          style={[styles.titulo, { color: theme.colors.onSurface }]}
        >
          {doc.titulo}
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.resumo, { color: theme.colors.onSurface }]}
          numberOfLines={3}
        >
          {doc.conteudo}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
            >
            Por: {doc.autorNome}
            </Text>
            {doc.versao && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    v{doc.versao}
                </Text>
            )}
        </View>
      </Card.Content>
      <Card.Actions>
        {doc.link && (
            <Button
            mode="contained"
            onPress={() => Linking.openURL(doc.link)}
            icon="open-in-new"
            >
            Acessar
            </Button>
        )}
      </Card.Actions>
    </Card>
  );

  if (horizontal) {
    return (
      <View>
        {showHeader && (
          <Text
            variant="headlineMedium"
            style={[styles.header, { color: theme.colors.onBackground }]}
          >
            Documentação Recente
          </Text>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContainer}
        >
          {documentacoes.map(renderCard)}
        </ScrollView>
      </View>
    );
  }

  return (
    <View>
      {showHeader && (
        <Text
          variant="headlineMedium"
          style={[styles.header, { color: theme.colors.onBackground }]}
        >
          Documentação Recente
        </Text>
      )}
      {documentacoes.map(renderCard)}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  header: {
    textAlign: "center",
    marginVertical: 16,
    fontWeight: "bold",
  },
  card: {
    marginBottom: 12,
    marginHorizontal: 4,
  },
  horizontalCard: {
    width: 300,
    marginRight: 12,
    marginBottom: 8,
  },
  horizontalContainer: {
    paddingHorizontal: 4,
  },
  horizontalContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chip: {
    alignSelf: "flex-start",
  },
  titulo: {
    marginBottom: 8,
    fontWeight: "600",
  },
  resumo: {
    marginBottom: 12,
    lineHeight: 20,
  },
  linkButton: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
});
