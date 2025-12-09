import { CachedImage } from "@/components/CachedImage";
import { Badge } from "@/model/Badge";
import { BadgeService } from "@/services/badge/BadgeService";
import { RankingUsuario } from "@/services/shared/RankingService";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Avatar,
    Button,
    Chip,
    Modal,
    Portal,
    Text,
    useTheme
} from "react-native-paper";

interface PublicProfileModalProps {
  visible: boolean;
  onDismiss: () => void;
  user: RankingUsuario | null;
}

export function PublicProfileModal({
  visible,
  onDismiss,
  user,
}: PublicProfileModalProps) {
  const theme = useTheme();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && user) {
      loadUserBadges();
    }
  }, [visible, user]);

  const loadUserBadges = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userBadges = await BadgeService.obterBadgesUsuario(user.uid);
      setBadges(userBadges);
    } catch (error) {
      console.error("Erro ao carregar badges do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={[styles.contentWrapper, { backgroundColor: theme.colors.surface }]}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              {user.urlFoto && user.urlFoto.startsWith("https://") ? (
                <CachedImage
                  userId={user.uid}
                  firebaseUrl={user.urlFoto}
                  style={styles.avatar}
                  placeholder={
                    <Avatar.Image
                      size={100}
                      source={require("../assets/images/person.png")}
                      style={{ backgroundColor: "transparent" }}
                    />
                  }
                />
              ) : (
                <Avatar.Image
                  size={100}
                  source={require("../assets/images/person.png")}
                  style={[styles.avatar, { backgroundColor: "transparent" }]}
                />
              )}

              <Text variant="headlineMedium" style={styles.userName}>
                {user.nome}
              </Text>
              
              <Chip 
                icon="star" 
                style={styles.scoreChip}
                textStyle={{ fontWeight: "bold" }}
              >
                Coeficiente: {user.coeficienteConhecimento}%
              </Chip>
            </View>

            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Conquistas ({badges.length})
              </Text>
              
              {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
              ) : badges.length > 0 ? (
                <View style={styles.badgesGrid}>
                  {badges.map((badge, index) => (
                    <View key={`${badge.id}-${index}`} style={styles.badgeItem}>
                      <Text style={{ fontSize: 32, marginBottom: 4 }}>
                        {badge.icone}
                      </Text>
                      <Text 
                        variant="bodySmall" 
                        style={{ textAlign: "center" }}
                        numberOfLines={2}
                      >
                        {badge.nome}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text 
                  style={{ 
                    textAlign: "center", 
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 20 
                  }}
                >
                  Nenhuma conquista ainda.
                </Text>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.footer}>
            <Button mode="contained" onPress={onDismiss}>
              Fechar
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    maxHeight: "80%",
    width: "90%",
    alignSelf: "center",
  },
  contentWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    flexShrink: 1,
    width: "100%",
  },
  scrollView: {
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  scoreChip: {
    marginTop: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  badgeItem: {
    width: 80,
    alignItems: "center",
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
});
