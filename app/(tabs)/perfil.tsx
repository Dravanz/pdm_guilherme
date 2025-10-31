// @ts-nocheck
import { AuthContext } from "@/context/AuthProvider";
import { UserContext } from "@/context/UserProvider";
import { ThemeContext, globalStyles } from "@/context/ThemeProvider";
import { Perfil as PerfilEnum } from "@/model/Perfil";
import { Usuario } from "@/model/Usuario";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Perfil() {
	const theme = useTheme();
	const { styles: themeStyles } = useContext<any>(ThemeContext);
	const { sair } = useContext<any>(AuthContext);
	const { userFirebase, update, del } = useContext<any>(UserContext);
	const [editMode, setEditMode] = useState(false);
	const [nome, setNome] = useState("");
	const [urlFoto] = useState<string | undefined>(undefined);
	const [dialogVisivel, setDialogVisivel] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [requisitando, setRequisitando] = useState(false);
	const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

	useEffect(() => {
		if (userFirebase) {
			setNome(userFirebase.nome || "");
		}
	}, [userFirebase]);

	async function salvarPerfil() {
		if (!userFirebase) return;
		setRequisitando(true);
		try {
			const usuarioAtualizado: Usuario = {
				uid: userFirebase.uid,
				nome,
				email: userFirebase.email,
				perfil: userFirebase.perfil ?? PerfilEnum.Aluno,
				urlFoto: urlFoto ?? userFirebase.urlFoto ?? "",
				nivelAtual: userFirebase.nivelAtual ?? "iniciante",
				coeficienteConhecimento: userFirebase.coeficienteConhecimento ?? 0,
				diasInatividade: userFirebase.diasInatividade ?? 0,
				dataUltimoAcesso: userFirebase.dataUltimoAcesso,
				createdAt: userFirebase.createdAt,
				diasAtivos: userFirebase.diasAtivos ?? 1,
			} as Usuario;
			
			const msg = await update(usuarioAtualizado);
			if (msg === "ok") {
				setMensagem({
					tipo: "sucesso",
					texto: "Nome atualizado com sucesso!"
				});
				setEditMode(false);
				setDialogVisivel(true);
			} else {
				setMensagem({ tipo: "erro", texto: msg });
				setDialogVisivel(true);
			}
		} catch (e) {
			console.error("Erro ao atualizar perfil:", e);
			setMensagem({ tipo: "erro", texto: "Erro inesperado ao atualizar perfil." });
			setDialogVisivel(true);
		}
		setRequisitando(false);
	}

	async function excluirConta() {
		if (!userFirebase) return;
		setRequisitando(true);
		try {
			const msg = await del(userFirebase.uid);
			if (msg === "ok") {
				await sair();
				router.replace("/signIn");
			}
		} catch (error) {
			console.error("Erro ao excluir conta:", error);
		}
		setRequisitando(false);
		setConfirmDelete(false);
	}

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<ScrollView
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{userFirebase && (
					<>
						<Image
							style={styles.image}
							source={require("../../assets/images/person.png")}
						/>

						{editMode ? (
							<>
								<TextInput
									style={styles.textinput}
									label="Nome"
									placeholder={userFirebase.nome || "Digite seu nome"}
									mode="outlined"
									value={nome}
									onChangeText={setNome}
									right={<TextInput.Icon icon="smart-card" />}
								/>
								<Button
									style={[themeStyles.buttonPrimary, styles.button, { backgroundColor: theme.colors.success }]}
									mode="contained"
									textColor={theme.colors.onSuccess}
									onPress={salvarPerfil}
									loading={requisitando}
									disabled={requisitando}
								>
									{!requisitando ? "Salvar" : "Salvando"}
								</Button>
								<Button
									style={[themeStyles.buttonOutlined, styles.button, { borderColor: theme.colors.outline }]}
									mode="outlined"
									textColor={theme.colors.onSurface}
									onPress={() => setEditMode(false)}
								>
									Cancelar
								</Button>
							</>
						) : (
							<>
								<View style={styles.infoContainer}>
									<Text variant="headlineSmall" style={[styles.infoText, { color: theme.colors.onBackground }]}>
										{userFirebase.nome || "Nome não informado"}
									</Text>
									<Text variant="bodyLarge" style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
										{userFirebase.email}
									</Text>
									<Text variant="bodyLarge" style={[styles.infoText, { color: theme.colors.onSurface }]}>
										Nível: {userFirebase.nivelAtual || "iniciante"}
									</Text>
									<Text variant="bodyLarge" style={[styles.infoText, { color: theme.colors.onSurface }]}>
										Coeficiente: {userFirebase.coeficienteConhecimento || 0}%
									</Text>
									<Text variant="bodyLarge" style={[styles.infoText, styles.streakText, { color: theme.colors.streak }]}>
										🔥 {userFirebase.diasAtivos || 1} dias ativos
									</Text>
									{userFirebase.createdAt && (
										<Text variant="bodyMedium" style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
											Membro desde: {new Date(userFirebase.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}
										</Text>
									)}
								</View>

								<Button
									style={[themeStyles.buttonPrimary, styles.button, { backgroundColor: theme.colors.primary }]}
									mode="contained"
									textColor={theme.colors.onPrimary}
									onPress={() => setEditMode(true)}
								>
									Editar Perfil
								</Button>
								<Button
									style={[themeStyles.buttonPrimary, styles.button, { backgroundColor: theme.colors.error }]}
									mode="contained"
									textColor={theme.colors.onError}
									onPress={() => setConfirmDelete(true)}
								>
									Excluir Conta
								</Button>
							</>
						)}
					</>
				)}
			</ScrollView>

			<Dialog
				visible={dialogVisivel && !confirmDelete}
				onDismiss={() => setDialogVisivel(false)}
			>
				<Dialog.Icon 
					icon={mensagem.tipo === "sucesso" ? "check-circle-outline" : "alert-circle-outline"} 
					size={60} 
				/>
				<Dialog.Title style={[styles.textDialog, { color: theme.colors.onSurface }]}>
					{mensagem.tipo === "sucesso" ? "Sucesso" : "Erro"}
				</Dialog.Title>
				<Dialog.Content>
					<Text style={[styles.textDialog, { color: theme.colors.onSurface }]} variant="bodyLarge">
						{mensagem.texto}
					</Text>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={() => setDialogVisivel(false)}>OK</Button>
				</Dialog.Actions>
			</Dialog>

			<Dialog
				visible={confirmDelete}
				onDismiss={() => setConfirmDelete(false)}
			>
				<Dialog.Icon icon="alert-circle-outline" size={60} />
				<Dialog.Title style={[styles.textDialog, { color: theme.colors.onSurface }]}>Excluir Conta</Dialog.Title>
				<Dialog.Content>
					<Text style={[styles.textDialog, { color: theme.colors.onSurface }]} variant="bodyLarge">
						Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.
					</Text>
				</Dialog.Content>
				<Dialog.Actions>
					<Button 
						onPress={() => setConfirmDelete(false)}
						labelStyle={{ color: theme.colors.onSurface }}
					>
						Cancelar
					</Button>
					<Button
						onPress={() => {
							setConfirmDelete(false);
							excluirConta();
						}}
						labelStyle={{ color: theme.colors.error }}
					>
						Excluir
					</Button>
				</Dialog.Actions>
			</Dialog>



		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		paddingHorizontal: 16,
	},
	image: {
		width: 160,
		height: 160,
		alignSelf: "center",
		borderRadius: 80,
		marginTop: globalStyles.spacing.xl,
		marginBottom: globalStyles.spacing.lg,
	},
	infoContainer: {
		alignItems: "center",
		marginBottom: globalStyles.spacing.xl,
		paddingHorizontal: globalStyles.spacing.md,
	},
	infoText: {
		marginVertical: 6,
		textAlign: "center",
		lineHeight: 24,
	},
	streakText: {
		fontWeight: "600",
		fontSize: 16,
	},
	input: {
		width: "100%",
		maxWidth: 400,
	},
	button: {
		width: "100%",
		maxWidth: 400,
	},
	textDialog: {
		textAlign: "center",
		lineHeight: 24,
	},
});
