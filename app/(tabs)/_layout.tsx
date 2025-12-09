import { UserContext } from "@/context/UserProvider";
import { Tabs } from "expo-router";
import { useContext } from "react";
import { Platform } from "react-native";
import { Icon, useTheme } from "react-native-paper";

export default function TabLayout() {
  const theme = useTheme();
  const { userFirebase } = useContext<any>(UserContext);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: theme.colors.surface,
          },
          default: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            borderTopWidth: 1,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <Icon
              source="view-dashboard"
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              size={20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cursos"
        options={{
          title: "Cursos",
          tabBarIcon: ({ focused }) => (
            <Icon
              source="book-outline"
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              size={20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: "Ranking",
          tabBarIcon: ({ focused }) => (
            <Icon
              source="trophy-outline"
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              size={20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <Icon
              source="account-circle"
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              size={20}
            />
          ),
        }}
      />

      {/* Tab apenas para Moderadores */}
      <Tabs.Screen
        name="solicitacoes"
        options={{
          title: "Solicitações",
          tabBarIcon: ({ focused }) => (
            <Icon
              source="clipboard-list-outline"
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              size={20}
            />
          ),
          href: null,
        }}
      />

      {/* Tab apenas para Colaboradores */}
      <Tabs.Screen
        name="colaboracao"
        options={{
          title: "Colaboração",
          tabBarIcon: ({ focused }) => (
            <Icon
              source="pencil-box-outline"
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              size={20}
            />
          ),
          href: null,
        }}
      />

      <Tabs.Screen
        name="configuracoes"
        options={{
          title: "Configurações",
          tabBarIcon: ({ focused }) => (
            <Icon
              source="cog-outline"
              color={
                focused ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              size={20}
            />
          ),
        }}
      />
    </Tabs>
  );
}
