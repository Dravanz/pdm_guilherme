import { CachedImage } from "@/components/CachedImage";
import { PublicProfileModal } from "@/components/PublicProfileModal";
import { UserContext } from "@/context/UserProvider";
import {
    RankingData,
    RankingService,
    RankingUsuario,
} from "@/services/shared/RankingService";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useContext, useState } from "react";
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import {
    ActivityIndicator,
    Avatar,
    Card,
    Chip,
    Icon,
    Text,
    useTheme,
} from "react-native-paper";

export default function Ranking() {
  const theme = useTheme();
  const { userFirebase } = useContext<any>(UserContext);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dadosCarregados = React.useRef(false);

  // Estado para o modal de perfil público
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RankingUsuario | null>(null);

  const carregarRanking = async (forcar = false) => {
    if (dadosCarregados.current && !forcar) {
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      const dados = await RankingService.obterRanking();
      setRankingData(dados);
      dadosCarregados.current = true;
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setCarregando(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarRanking(true);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      carregarRanking();
    }, [])
  );

  const handleUserPress = (usuario: RankingUsuario) => {
    if (userFirebase?.uid === usuario.uid) {
      router.push("/(tabs)/perfil");
      return;
    }
    setSelectedUser(usuario);
    setModalVisible(true);
  };

  const obterCorCard = (posicao: number) => {
    const isDark = theme.dark;
    switch (posicao) {
      case 1:
        return isDark ? "rgba(255, 215, 0, 0.15)" : "rgba(255, 215, 0, 0.1)";
      case 2:
        return isDark
          ? "rgba(192, 192, 192, 0.15)"
          : "rgba(192, 192, 192, 0.1)";
      case 3:
        return isDark ? "rgba(205, 127, 50, 0.15)" : "rgba(205, 127, 50, 0.1)";
      default:
        return theme.colors.surface;
    }
  };

  const obterCorTexto = (posicao: number) => {
    const isDark = theme.dark;
    switch (posicao) {
      case 1:
        return isDark ? "#FFD700" : "#996B00";
      case 2:
        return isDark ? "#E5E5E5" : "#5A5A5A";
      case 3:
        return isDark ? "#DEB887" : "#654321";
      default:
        return theme.colors.onSurface;
    }
  };

  const obterIconePosicao = (posicao: number) => {
    if (!posicao || isNaN(posicao)) return "minus";
    switch (posicao) {
      case 1:
        return "medal";
      case 2:
        return "medal";
      case 3:
        return "medal";
      default:
        return "numeric-" + posicao + "-circle"; // Fallback, though we might just use text for > 3
    }
  };

  const obterCorIcone = (posicao: number) => {
     switch (posicao) {
      case 1:
        return "#FFD700"; // Gold
      case 2:
        return "#C0C0C0"; // Silver
      case 3:
        return "#CD7F32"; // Bronze
      default:
        return theme.colors.onSurface;
    }
  };

  const renderPodio = () => {
    if (!rankingData || rankingData.usuarios.length < 3) return null;

    const top3 = rankingData.usuarios.slice(0, 3);
    const [primeiro, segundo, terceiro] = top3;

    return (
      <View style={styles.podioContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          <Icon source="trophy" size={24} color={theme.colors.onBackground} />
          <Text
            variant="headlineSmall"
            style={[styles.podioTitle, { color: theme.colors.onBackground, marginBottom: 0 }]}
          >
            Pódio
          </Text>
        </View>

        <View style={styles.podioRow}>
          {/* Segundo Lugar */}
          <TouchableOpacity
            onPress={() => handleUserPress(segundo)}
            style={[
              styles.podioItem,
              styles.segundoLugar,
              {
                backgroundColor: theme.dark
                  ? "rgba(192, 192, 192, 0.15)"
                  : "rgba(192, 192, 192, 0.1)",
                borderColor: theme.dark
                  ? "rgba(192, 192, 192, 0.6)"
                  : "rgba(192, 192, 192, 0.8)",
              },
            ]}
          >
            {segundo.urlFoto && segundo.urlFoto.startsWith("https://") ? (
              <CachedImage
                userId={segundo.uid}
                firebaseUrl={segundo.urlFoto}
                style={{ width: 60, height: 60, borderRadius: 30 }}
                placeholder={
                  <Avatar.Image
                    size={60}
                    source={require("../../assets/images/person.png")}
                    style={{ backgroundColor: "transparent" }}
                  />
                }
              />
            ) : (
              <Avatar.Image
                size={60}
                source={require("../../assets/images/person.png")}
                style={{ backgroundColor: "transparent" }}
              />
            )}
            <View style={styles.podioIcon}>
                <Icon source="medal" size={32} color="#C0C0C0" />
            </View>
            <Text
              variant="titleMedium"
              style={[styles.podioNome, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {segundo.nome}
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.podioScore,
                { color: theme.dark ? "#E5E5E5" : "#5A5A5A" },
              ]}
            >
              {segundo.coeficienteConhecimento || 0}%
            </Text>
          </TouchableOpacity>

          {/* Primeiro Lugar */}
          <TouchableOpacity
            onPress={() => handleUserPress(primeiro)}
            style={[
              styles.podioItem,
              styles.primeiroLugar,
              {
                backgroundColor: theme.dark
                  ? "rgba(255, 215, 0, 0.15)"
                  : "rgba(255, 215, 0, 0.1)",
                borderColor: theme.dark
                  ? "rgba(255, 215, 0, 0.6)"
                  : "rgba(255, 215, 0, 0.8)",
              },
            ]}
          >
            {primeiro.urlFoto && primeiro.urlFoto.startsWith("https://") ? (
              <CachedImage
                userId={primeiro.uid}
                firebaseUrl={primeiro.urlFoto}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                placeholder={
                  <Avatar.Image
                    size={80}
                    source={require("../../assets/images/person.png")}
                    style={{ backgroundColor: "transparent" }}
                  />
                }
              />
            ) : (
              <Avatar.Image
                size={80}
                source={require("../../assets/images/person.png")}
                style={{ backgroundColor: "transparent" }}
              />
            )}
            <View style={styles.podioIcon}>
                <Icon source="medal" size={40} color="#FFD700" />
            </View>
            <Text
              variant="titleLarge"
              style={[styles.podioNome, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {primeiro.nome}
            </Text>
            <Text
              variant="headlineSmall"
              style={[
                styles.podioScore,
                { color: theme.dark ? "#FFD700" : "#996B00" },
              ]}
            >
              {primeiro.coeficienteConhecimento || 0}%
            </Text>
          </TouchableOpacity>

          {/* Terceiro Lugar */}
          <TouchableOpacity
            onPress={() => handleUserPress(terceiro)}
            style={[
              styles.podioItem,
              styles.terceiroLugar,
              {
                backgroundColor: theme.dark
                  ? "rgba(205, 127, 50, 0.15)"
                  : "rgba(205, 127, 50, 0.1)",
                borderColor: theme.dark
                  ? "rgba(205, 127, 50, 0.6)"
                  : "rgba(205, 127, 50, 0.8)",
              },
            ]}
          >
            {terceiro.urlFoto && terceiro.urlFoto.startsWith("https://") ? (
              <CachedImage
                userId={terceiro.uid}
                firebaseUrl={terceiro.urlFoto}
                style={{ width: 60, height: 60, borderRadius: 30 }}
                placeholder={
                  <Avatar.Image
                    size={60}
                    source={require("../../assets/images/person.png")}
                    style={{ backgroundColor: "transparent" }}
                  />
                }
              />
            ) : (
              <Avatar.Image
                size={60}
                source={require("../../assets/images/person.png")}
                style={{ backgroundColor: "transparent" }}
              />
            )}
            <View style={styles.podioIcon}>
                <Icon source="medal" size={32} color="#CD7F32" />
            </View>
            <Text
              variant="titleMedium"
              style={[styles.podioNome, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {terceiro.nome}
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.podioScore,
                { color: theme.dark ? "#DEB887" : "#654321" },
              ]}
            >
              {terceiro.coeficienteConhecimento || 0}%
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUsuario = (usuario: RankingUsuario) => {
    const isCurrentUser = userFirebase?.uid === usuario.uid;
    const corCard = obterCorCard(usuario.posicao);
    const isPodio = usuario.posicao <= 3;

    return (
      <Card
        key={usuario.uid}
        style={[
          styles.rankingCard,
          {
            backgroundColor: isPodio ? corCard : theme.colors.surface,
            borderWidth: isCurrentUser ? 2 : 0,
            borderColor: isCurrentUser ? theme.colors.primary : "transparent",
          },
        ]}
        onPress={() => handleUserPress(usuario)}
      >
        <Card.Content style={styles.rankingContent}>
          <View style={styles.posicaoContainer}>
            <Text
              variant="headlineMedium"
              style={[
                styles.posicaoText,
                {
                  color: isPodio
                    ? obterCorTexto(usuario.posicao)
                    : theme.colors.onSurface,
                },
              ]}
            >
              {isPodio ? (
                 <Icon source="medal" size={24} color={obterCorIcone(usuario.posicao)} />
              ) : (
                 <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{usuario.posicao}º</Text>
              )}
            </Text>
          </View>

          {usuario.urlFoto && usuario.urlFoto.startsWith("https://") ? (
            <CachedImage
              userId={usuario.uid}
              firebaseUrl={usuario.urlFoto}
              style={[
                styles.avatar,
                { width: 50, height: 50, borderRadius: 25 },
              ]}
              placeholder={
                <Avatar.Image
                  size={50}
                  source={require("../../assets/images/person.png")}
                  style={styles.avatar}
                />
              }
            />
          ) : (
            <Avatar.Image
              size={50}
              source={require("../../assets/images/person.png")}
              style={[styles.avatar, { backgroundColor: "transparent" }]}
            />
          )}

          <View style={styles.infoContainer}>
            <Text
              variant="titleMedium"
              style={[
                styles.nomeUsuario,
                {
                  color: isPodio
                    ? theme.colors.onSurface
                    : theme.colors.onSurface,
                },
              ]}
              numberOfLines={1}
            >
              {usuario.nome}
              {isCurrentUser && (
                <Text style={{ color: theme.colors.primary }}> (Você)</Text>
              )}
            </Text>
            <Text
              variant="bodyMedium"
              style={[
                styles.coeficiente,
                {
                  color: isPodio
                    ? obterCorTexto(usuario.posicao)
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {usuario.coeficienteConhecimento || 0}% de coeficiente geral
            </Text>
          </View>

          {isPodio && (
            <Chip
              icon="trophy"
              style={[
                styles.podioChip,
                {
                  backgroundColor: theme.dark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                },
              ]}
              textStyle={{ color: theme.dark ? "#fff" : "#000", fontSize: 10 }}
            >
              Pódio
            </Chip>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (carregando) {
    return (
      <SafeAreaView
        style={[{ flex: 1, backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ color: theme.colors.onBackground, marginTop: 16 }}>
            Carregando ranking...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <Icon source="trophy" size={28} color={theme.colors.onBackground} />
            <Text
              variant="headlineLarge"
              style={[styles.title, { color: theme.colors.onBackground, marginBottom: 0 }]}
            >
              Ranking Geral
            </Text>
          </View>

        {rankingData?.ultimaAtualizacao && (
          <Text
            variant="bodySmall"
            style={[
              styles.lastUpdate,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Última atualização:{" "}
            {rankingData.ultimaAtualizacao.toLocaleTimeString("pt-BR")}
          </Text>
        )}

        {renderPodio()}

        <View style={styles.listContainer}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            📊 Classificação Completa
          </Text>

          {rankingData?.usuarios.map(renderUsuario)}
        </View>
      </ScrollView>

      <PublicProfileModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        user={selectedUser}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 8,
  },
  lastUpdate: {
    textAlign: "center",
    marginBottom: 24,
  },
  podioContainer: {
    marginBottom: 32,
  },
  podioTitle: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 20,
  },
  podioRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 10,
  },
  podioItem: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  primeiroLugar: {
    marginBottom: 0,
    borderWidth: 1,
  },
  segundoLugar: {
    marginBottom: 20,
    borderWidth: 1,
  },
  terceiroLugar: {
    marginBottom: 20,
    borderWidth: 1,
  },
  podioIcon: {
    marginVertical: 8,
  },
  podioNome: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  podioScore: {
    fontWeight: "700",
    textAlign: "center",
  },
  listContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  rankingCard: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  rankingContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  posicaoContainer: {
    width: 50,
    alignItems: "center",
  },
  posicaoText: {
    fontWeight: "700",
  },
  avatar: {
    marginRight: 12,
    backgroundColor: "transparent",
  },
  infoContainer: {
    flex: 1,
  },
  nomeUsuario: {
    fontWeight: "600",
    marginBottom: 2,
  },
  coeficiente: {
    fontWeight: "500",
  },
  podioChip: {
    marginLeft: 14,
  },
});
