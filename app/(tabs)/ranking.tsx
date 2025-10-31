import React, { useContext } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { Avatar, List, Text, useTheme } from "react-native-paper";
import { ThemeContext } from "@/context/ThemeProvider";

const mockRanking = [
  { id: "1", nome: "Ana", pontos: 1200 },
  { id: "2", nome: "Bruno", pontos: 950 },
  { id: "3", nome: "Carla", pontos: 880 },
];

export default function Ranking() {
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  
  return (
    <SafeAreaView style={[themeStyles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={mockRanking}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <List.Item
            title={`${index + 1}. ${item.nome}`}
            description={`Pontos: ${item.pontos}`}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            left={() => (
              <Avatar.Text 
                size={40} 
                label={item.nome[0]} 
                style={{ backgroundColor: theme.colors.primary }}
                labelStyle={{ color: theme.colors.onPrimary }}
              />
            )}
          />
        )}
        ListHeaderComponent={
          <Text variant="headlineMedium" style={[themeStyles.header, { color: theme.colors.onBackground }]}>
            Ranking
          </Text>
        }
        ItemSeparatorComponent={() => <View style={{ height: themeStyles.spacing.xs }} />}
        contentContainerStyle={{ padding: themeStyles.spacing.md }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
