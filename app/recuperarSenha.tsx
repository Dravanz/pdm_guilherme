import { StyleSheet, Text, View } from "react-native";

export default function RecuperarSenhaScreen() {
	return (
		<View style={styles.container}>
			<Text>RecuperarSenha Screen</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});