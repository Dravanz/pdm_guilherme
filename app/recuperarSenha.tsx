import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "react-native-paper";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/FirebaseInit";
import { router } from "expo-router";
import { useState } from "react";

export default function RecuperarSenhaScreen() {
	const [email, setEmail] = useState("");
	const theme = useTheme();

	const handleResetPassword = async () => {
		if (!email) {
			Alert.alert("Erro", "Por favor, insira seu email");
			return;
		}

		try {
			await sendPasswordResetEmail(auth, email);
			Alert.alert(
				"Sucesso",
				"Email de recuperação de senha enviado. Verifique sua caixa de entrada e spam."
			);
			router.push("/signIn");
		} catch (error) {
			Alert.alert(
				"Erro",
				"Não foi possível enviar o email de recuperação. Verifique se o email está correto."
			);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<View style={styles.container}>
				<Text style={[styles.title, { color: theme.colors.primary }]}>Recuperar Senha</Text>
				<TextInput
					style={[styles.input, { 
						backgroundColor: theme.colors.background,
						borderColor: theme.colors.primary,
						color: theme.colors.primary
					}]}
					placeholder="Digite seu email"
					placeholderTextColor={theme.colors.primary}
					value={email}
					onChangeText={setEmail}
					keyboardType="email-address"
					autoCapitalize="none"
				/>
				<TouchableOpacity 
					style={[styles.button, { backgroundColor: theme.colors.primary }]} 
					onPress={handleResetPassword}
				>
					<Text style={[styles.buttonText, { color: theme.colors.background }]}>
						Enviar Email de Recuperação
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
	},
	input: {
		width: "100%",
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 10,
		marginBottom: 20,
	},
	button: {
		width: "100%",
		height: 60,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "bold",
	},
});
