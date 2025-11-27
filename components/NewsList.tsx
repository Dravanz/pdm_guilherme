import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Card, Text, useTheme, Chip, Button } from 'react-native-paper';

interface NewsItem {
  id: string;
  titulo: string;
  resumo: string;
  categoria: string;
  data: string;
  link: string;
}

interface NewsListProps {
  showHeader?: boolean;
  limit?: number;
  horizontal?: boolean;
}

export function NewsList({ showHeader = true, limit = 5, horizontal = false }: NewsListProps) {
  const theme = useTheme();

  const noticias: NewsItem[] = [
    {
      id: '1',
      titulo: '🚀 Nova versão do JavaScript ES2024',
      resumo: 'Conheça as principais novidades e recursos que chegaram na mais nova versão do JavaScript.',
      categoria: 'JavaScript',
      data: '2024-01-15',
      link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
    },
    {
      id: '2', 
      titulo: '🐍 Python 3.12 lançado oficialmente',
      resumo: 'A nova versão do Python traz melhorias significativas de performance e novos recursos.',
      categoria: 'Python',
      data: '2024-01-10',
      link: 'https://www.python.org/downloads/release/python-3120/'
    },
    {
      id: '3',
      titulo: '⚛️ React 19 em desenvolvimento',
      resumo: 'Saiba quais são as principais funcionalidades que estão sendo desenvolvidas para o React 19.',
      categoria: 'React',
      data: '2024-01-08',
      link: 'https://react.dev/blog'
    },
    {
      id: '4',
      titulo: '📱 Expo SDK 50 disponível',
      resumo: 'Nova versão do Expo traz suporte aprimorado para desenvolvimento mobile multiplataforma.',
      categoria: 'Mobile',
      data: '2024-01-05',
      link: 'https://expo.dev/changelog/2024/01-05-sdk-50'
    },
    {
      id: '5',
      titulo: '🔥 Firebase atualiza seus serviços',
      resumo: 'Google anuncia melhorias no Firebase com foco em performance e segurança.',
      categoria: 'Backend',
      data: '2024-01-03',
      link: 'https://firebase.google.com/support/release-notes'
    }
  ];

  const noticiasLimitadas = limit ? noticias.slice(0, limit) : noticias;

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Erro ao abrir link:', err));
  };

  const renderCard = (noticia: NewsItem) => (
    <Card 
      key={noticia.id} 
      style={[
        horizontal ? styles.horizontalCard : styles.card, 
        { backgroundColor: theme.colors.surface }
      ]}
    >
      <Card.Content style={horizontal ? styles.horizontalContent : undefined}>
        <View style={styles.cardHeader}>
          <Chip 
            icon="newspaper" 
            style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
          >
            {noticia.categoria}
          </Chip>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {new Date(noticia.data).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        
        <Text variant="titleMedium" style={[styles.titulo, { color: theme.colors.onSurface }]}>
          {noticia.titulo}
        </Text>
        
        <Text variant="bodyMedium" style={[styles.resumo, { color: theme.colors.onSurface }]}>
          {noticia.resumo}
        </Text>
        
        <Button 
          mode="outlined" 
          onPress={() => handleLinkPress(noticia.link)}
          style={styles.linkButton}
          icon="open-in-new"
        >
          Ler mais
        </Button>
      </Card.Content>
    </Card>
  );

  if (horizontal) {
    return (
      <View>
        {showHeader && (
          <Text variant="headlineMedium" style={[styles.header, { color: theme.colors.onBackground }]}>
            📰 Últimas Notícias
          </Text>
        )}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContainer}
        >
          {noticiasLimitadas.map(renderCard)}
        </ScrollView>
      </View>
    );
  }

  return (
    <View>
      {showHeader && (
        <Text variant="headlineMedium" style={[styles.header, { color: theme.colors.onBackground }]}>
          📰 Últimas Notícias
        </Text>
      )}
      {noticiasLimitadas.map(renderCard)}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 12,
    marginHorizontal: 4,
  },
  horizontalCard: {
    width: 280,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  titulo: {
    marginBottom: 8,
    fontWeight: '600',
  },
  resumo: {
    marginBottom: 12,
    lineHeight: 20,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});