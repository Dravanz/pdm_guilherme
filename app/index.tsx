/* eslint-disable react-hooks/exhaustive-deps */
import { AuthContext } from "@/context/AuthProvider";
import { router } from "expo-router";
import { useContext, useEffect } from "react";
import { Image, SafeAreaView, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";

export default function Preload() {
	const theme = useTheme();
	const { userAuth, isLoading } = useContext<any>(AuthContext);

	useEffect(() => {
		if (!isLoading) {
			if (userAuth) {
				router.replace("/(tabs)");
			} else {
				router.replace("/signIn");
			}
		}
	}, [userAuth, isLoading]);

	return (
		<SafeAreaView
			style={{ ...styles.container, backgroundColor: theme.colors.background }}
		>
			<Image
				style={styles.imagem}
				source={require("../assets/images/logo512.png")}
				accessibilityLabel="logo do app"
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	imagem: {
		width: 250,
		height: 250,
	},
});
