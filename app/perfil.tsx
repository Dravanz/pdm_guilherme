import { UserContext } from "@/context/UserProvider";
import { yupResolver } from "@hookform/resolvers/yup";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";
import { Usuario } from "../model/Usuario";

const requiredMessage = "Campo obrigatório";

const schema = yup
	.object()
	.shape({
		nome: yup
			.string()
			.required(requiredMessage)
			.min(2, "O nome deve ter ao menos 2 caracteres"),
		email: yup
			.string()
			.required(requiredMessage)
			.matches(/\S+@\S+\.\S+/, "Email inválido"),
		senha: yup
			.string()
			.matches(
				/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[$*&@#])[0-9a-zA-Z$*&@#]{8,}$/,
				"A senha deve conter ao menos uma letra maiúscula, uma letra minúscula, um númeral, um caractere especial e um total de 8 caracteres"
			),
		confirmar_senha: yup
			.string()
			.test('passwords-match', 'As senhas não conferem', function(value) {
				return !this.parent.senha || this.parent.senha === value;
			}),
	})
	.required();

export default function Perfil({ navigation }: any) {
	const theme = useTheme();
	const { userFirebase, update, del } = useContext(UserContext) as any;
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<any>({
		defaultValues: {
			nome: userFirebase?.nome || "",
			email: userFirebase?.email || "",
			senha: "",
			confirmar_senha: "",
		},
		mode: "onSubmit",
		resolver: yupResolver(schema),
	});
	const [requisitando, setRequisitando] = useState(false);
	const [atualizando, setAtualizando] = useState(false);
	const [excluindo, setExcluindo] = useState(false);
	const [dialogErroVisivel, setDialogErroVisivel] = useState(false);
	const [dialogExcluirVisivel, setDialogExcluirVisivel] = useState(false);
	const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });
	const [exibirSenha, setExibirSenha] = useState(true);

	useEffect(() => {}, []);

	async function atualizaPerfil(data: any) {
		setRequisitando(true);
		setAtualizando(true);
		
		const usuario: Usuario = {
			uid: userFirebase.uid,
			nome: data.nome,
			email: data.email,
			urlFoto: userFirebase.urlFoto || "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50",
			perfil: userFirebase.perfil,
		};
		
		const msg = await update(usuario, data.senha || undefined);
		if (msg === "ok") {
			setMensagem({
				tipo: "ok",
				mensagem: "Show! Seu perfil foi atualizado com sucesso.",
			});
			setDialogErroVisivel(true);
			setRequisitando(false);
			setAtualizando(false);
		} else {
			setMensagem({ tipo: "erro", mensagem: msg });
			setDialogErroVisivel(true);
			setRequisitando(false);
			setAtualizando(false);
		}
	}

	function avisarDaExclusaoPermanenteDaConta() {
		setDialogExcluirVisivel(true);
	}

	async function excluirConta() {
		setDialogExcluirVisivel(false);
		setRequisitando(true);
		setExcluindo(true);
		const msg = await del(userFirebase.uid);
		if (msg === "ok") {
			router.replace("/signIn");
		} else {
			setMensagem({ tipo: "erro", mensagem: "ops! algo deu errado" });
			setDialogErroVisivel(true);
			setRequisitando(false);
			setExcluindo(false);
		}
	}

	return (
		<SafeAreaView
			style={{ ...styles.container, backgroundColor: theme.colors.background }}
		>
			<ScrollView>
				<>
					<Image
						style={styles.image}
						source={require("../assets/images/person.png")}
						loadingIndicatorSource={require("../assets/images/person.png")}
					/>
					<View style={styles.divButtonsImage}>
						<Button
							style={styles.buttonImage}
							mode="outlined"
							icon="image"
							onPress={() =>
								alert(
									"Isso será desenvolvido na branch modulo2_upload_imagen))"
								)
							}
						>
							Galeria
						</Button>
						<Button
							style={styles.buttonImage}
							mode="outlined"
							icon="camera"
							onPress={() =>
								alert(
									"Isso será desenvolvido na branch modulo2_upload_imagen))"
								)
							}
						>
							Foto
						</Button>
					</View>

					<Controller
						control={control}
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								style={styles.textinput}
								label="Nome"
								placeholder="Digite seu nome completo"
								mode="outlined"
								autoCapitalize="words"
								returnKeyType="next"
								onBlur={onBlur}
								onChangeText={onChange}
								value={value}
								right={<TextInput.Icon icon="smart-card" />}
							/>
						)}
						name="nome"
					/>
					{errors.nome && (
						<Text style={{ ...styles.textError, color: theme.colors.error }}>
							{errors.nome?.message?.toString()}
						</Text>
					)}

					<Controller
						control={control}
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								style={styles.textinput}
								label="Email"
								placeholder="Digite seu email"
								mode="outlined"
								autoCapitalize="none"
								returnKeyType="next"
								keyboardType="email-address"
								onBlur={onBlur}
								onChangeText={onChange}
								value={value}
								right={<TextInput.Icon icon="email" />}
							/>
						)}
						name="email"
					/>
					{errors.email && (
						<Text style={{ ...styles.textError, color: theme.colors.error }}>
							{errors.email?.message?.toString()}
						</Text>
					)}

					<Controller
						control={control}
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								style={styles.textinput}
								label="Nova Senha (opcional)"
								placeholder="Digite uma nova senha"
								mode="outlined"
								autoCapitalize="none"
								returnKeyType="next"
								secureTextEntry={exibirSenha}
								onBlur={onBlur}
								onChangeText={onChange}
								value={value}
								right={
									<TextInput.Icon
										icon="eye"
										onPress={() => setExibirSenha((previus) => !previus)}
									/>
								}
							/>
						)}
						name="senha"
					/>
					{errors.senha && (
						<Text style={{ ...styles.textError, color: theme.colors.error }}>
							{errors.senha?.message?.toString()}
						</Text>
					)}
					<Controller
						control={control}
						render={({ field: { onChange, onBlur, value } }) => (
							<TextInput
								style={styles.textinput}
								label="Confirmar Nova Senha"
								placeholder="Confirme a nova senha"
								mode="outlined"
								autoCapitalize="none"
								returnKeyType="go"
								secureTextEntry={exibirSenha}
								onBlur={onBlur}
								onChangeText={onChange}
								value={value}
								right={
									<TextInput.Icon
										icon="eye"
										onPress={() => setExibirSenha((previus) => !previus)}
									/>
								}
							/>
						)}
						name="confirmar_senha"
					/>
					{errors.confirmar_senha && (
						<Text style={{ ...styles.textError, color: theme.colors.error }}>
							{errors.confirmar_senha?.message?.toString()}
						</Text>
					)}
					<Button
						style={styles.button}
						mode="contained"
						onPress={handleSubmit(atualizaPerfil)}
						loading={requisitando}
						disabled={requisitando}
					>
						{!atualizando ? "Atualizar" : "Atualizando"}
					</Button>
					<Button
						style={styles.buttonOthers}
						mode="outlined"
						onPress={handleSubmit(avisarDaExclusaoPermanenteDaConta)}
						loading={requisitando}
						disabled={requisitando}
					>
						{!excluindo ? "Excluir" : "Excluindo"}
					</Button>
				</>
			</ScrollView>
			<Dialog
				visible={dialogExcluirVisivel}
				onDismiss={() => {
					setDialogErroVisivel(false);
				}}
			>
				<Dialog.Icon icon={"alert-circle-outline"} size={60} />
				<Dialog.Title style={styles.textDialog}>{"Ops!"}</Dialog.Title>
				<Dialog.Content>
					<Text style={styles.textDialog} variant="bodyLarge">
						{
							"Você tem certeza que deseja excluir sua conta?\nEsta operação será irreversível."
						}
					</Text>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={() => setDialogExcluirVisivel(false)}>
						Cancelar
					</Button>
					<Button onPress={excluirConta}>Excluir</Button>
				</Dialog.Actions>
			</Dialog>
			<Dialog
				visible={dialogErroVisivel}
				onDismiss={() => {
					setDialogErroVisivel(false);
					if (mensagem.tipo === "ok") {
						router.back();
					}
				}}
			>
				<Dialog.Icon
					icon={
						mensagem.tipo === "ok"
							? "checkbox-marked-circle-outline"
							: "alert-circle-outline"
					}
					size={60}
				/>
				<Dialog.Title style={styles.textDialog}>
					{mensagem.tipo === "ok" ? "Informação" : "Erro"}
				</Dialog.Title>
				<Dialog.Content>
					<Text style={styles.textDialog} variant="bodyLarge">
						{mensagem.mensagem}
					</Text>
				</Dialog.Content>
			</Dialog>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
	},
	image: {
		width: 200,
		height: 200,
		alignSelf: "center",
		borderRadius: 200 / 2,
		marginTop: 50,
	},
	textinput: {
		width: 350,
		height: 50,
		marginTop: 20,
		backgroundColor: "transparent",
	},
	textEsqueceuSenha: {
		alignSelf: "flex-end",
	},
	textError: {
		width: 350,
	},
	button: {
		marginTop: 50,
		marginBottom: 30,
	},
	buttonOthers: {
		marginTop: 20,
		marginBottom: 30,
	},
	divButtonsImage: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 15,
		marginBottom: 20,
	},
	buttonImage: {
		width: 180,
	},
	textDialog: {
		textAlign: "center",
	},
});