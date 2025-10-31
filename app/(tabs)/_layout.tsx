import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Icon, useTheme } from "react-native-paper";

export default function TabLayout() {
	const theme = useTheme();
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
                        <Icon source="view-dashboard" color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cursos"
                options={{
                    title: "Cursos",
                    tabBarIcon: ({ focused }) => (
                        <Icon source="book-outline" color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="ranking"
                options={{
                    title: "Ranking",
                    tabBarIcon: ({ focused }) => (
                        <Icon source="trophy-outline" color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ focused }) => (
                        <Icon source="account-circle" color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} size={20} />
                    ),
                }}
            />
            <Tabs.Screen
                name="configuracoes"
                options={{
                    title: "Configurações",
                    tabBarIcon: ({ focused }) => (
                        <Icon source="cog-outline" color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} size={20} />
                    ),
                }}
            />
		</Tabs>
	);
}
