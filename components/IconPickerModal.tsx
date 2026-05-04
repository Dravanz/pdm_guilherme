import React, { useState, useMemo } from "react";
import { FlatList, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Modal, Portal, Text, Searchbar, Icon, Button, useTheme } from "react-native-paper";

interface IconOption {
  name: string;
  label: string;
}

const ICONS: IconOption[] = [
  // Conquistas
  { name: "trophy", label: "Troféu" },
  { name: "trophy-award", label: "Troféu Prêmio" },
  { name: "medal", label: "Medalha" },
  { name: "medal-outline", label: "Medalha Outline" },
  { name: "crown", label: "Coroa" },
  { name: "star", label: "Estrela" },
  { name: "star-circle", label: "Estrela Círculo" },
  { name: "star-four-points", label: "Estrela 4 Pontos" },
  { name: "fire", label: "Fogo" },
  { name: "lightning-bolt", label: "Raio" },
  { name: "shield", label: "Escudo" },
  { name: "shield-star", label: "Escudo Estrela" },
  { name: "ribbon", label: "Fita" },
  { name: "podium", label: "Pódio" },
  { name: "podium-gold", label: "Pódio Ouro" },
  { name: "podium-silver", label: "Pódio Prata" },
  { name: "podium-bronze", label: "Pódio Bronze" },
  { name: "gift", label: "Presente" },
  { name: "check-decagram", label: "Verificado" },
  { name: "arm-flex", label: "Força" },
  { name: "brain", label: "Cérebro" },
  { name: "heart", label: "Coração" },
  { name: "rocket", label: "Foguete" },
  { name: "flag-checkered", label: "Bandeira" },
  // Ranking
  { name: "numeric-1-circle", label: "1º Lugar" },
  { name: "numeric-2-circle", label: "2º Lugar" },
  { name: "numeric-3-circle", label: "3º Lugar" },
  // Cursos & Educação
  { name: "school", label: "Escola" },
  { name: "book-open-variant", label: "Livro Aberto" },
  { name: "book-check", label: "Livro OK" },
  { name: "head-question", label: "Questão" },
  { name: "code-braces", label: "Código" },
  { name: "language-python", label: "Python" },
  { name: "language-javascript", label: "JavaScript" },
  { name: "react", label: "React" },
  { name: "language-typescript", label: "TypeScript" },
  { name: "console", label: "Console" },
  { name: "database", label: "Banco de Dados" },
  // Especiais
  { name: "handshake", label: "Colaboração" },
  { name: "account-cog", label: "Admin" },
  { name: "shield-account", label: "Perfil Seguro" },
  { name: "compass", label: "Bússola" },
  { name: "target", label: "Alvo" },
  { name: "account-star", label: "Usuário Destaque" },
  { name: "certificate", label: "Certificado" },
  { name: "bookmark-check", label: "Favorito OK" },
  // Progresso
  { name: "chart-line", label: "Gráfico" },
  { name: "trending-up", label: "Crescimento" },
  { name: "speedometer", label: "Velocímetro" },
  { name: "timer", label: "Temporizador" },
  { name: "calendar-check", label: "Calendário OK" },
  { name: "clock-fast", label: "Relógio Rápido" },
];

const NUM_COLUMNS = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CELL_SIZE = (SCREEN_WIDTH - 64) / NUM_COLUMNS;

interface IconPickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

export function IconPickerModal({ visible, onDismiss, selectedIcon, onSelect }: IconPickerModalProps) {
  const theme = useTheme();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ICONS;
    return ICONS.filter(i => i.name.includes(q) || i.label.toLowerCase().includes(q));
  }, [search]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
          Escolher Ícone
        </Text>

        <Searchbar
          placeholder="Buscar ícone..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
        />

        <FlatList
          data={filtered}
          keyExtractor={item => item.name}
          numColumns={NUM_COLUMNS}
          style={styles.list}
          renderItem={({ item }) => {
            const isSelected = item.name === selectedIcon;
            return (
              <TouchableOpacity
                onPress={() => { onSelect(item.name); onDismiss(); }}
                style={[
                  styles.cell,
                  {
                    backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                    borderColor: isSelected ? theme.colors.primary : "transparent",
                    borderWidth: isSelected ? 2 : 0,
                  },
                ]}
              >
                <Icon source={item.name} size={28} color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                <Text
                  variant="bodySmall"
                  numberOfLines={2}
                  style={[styles.cellLabel, { color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant }]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <Button onPress={onDismiss} style={styles.closeButton}>
          Fechar
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: "85%",
  },
  title: {
    marginBottom: 12,
    fontWeight: "bold",
  },
  searchbar: {
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    padding: 4,
    margin: 2,
  },
  cellLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  closeButton: {
    marginTop: 12,
  },
});
