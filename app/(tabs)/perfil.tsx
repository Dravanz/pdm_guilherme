// @ts-nocheck
import { AuthContext } from "@/context/AuthProvider";
import { UserContext } from "@/context/UserProvider";
import { Perfil as PerfilEnum } from "@/model/Perfil";
import { Usuario } from "@/model/Usuario";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View, TouchableOpacity } from "react-native";
import { Button, Card, Dialog, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

export default function Perfil() {
  const theme = useTheme();
  const { sair, userAuth } = useContext<any>(AuthContext);
  const { userFirebase, update, del, sendImageToStorage } = useContext<any>(UserContext);
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [urlFoto, setUrlFoto] = useState<string | undefined>(undefined);
  const [dialogVisivel, setDialogVisivel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requisitando, setRequisitando] = useState(false);
  const [alterandoFoto, setAlterandoFoto] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", mensagem: "" });
  const [dialogFotoVisivel, setDialogFotoVisivel] = useState(false);
  const [dialogMensagemVisivel, setDialogMensagemVisivel] = useState(false);

  useEffect(() => {
	if (userFirebase) {
	  setNome(userFirebase.nome || "");
	  setEmail(userFirebase.email || "");
	  setUrlFoto(userFirebase.urlFoto || undefined);
	}
  }, [userFirebase]);

  async function salvarPerfil() {
	if (!userFirebase) return;
	setRequisitando(true);
	try {
	  const usuarioAtualizado: Usuario = {
		uid: userFirebase.uid,
		nome,
		email,
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
		setEditMode(false);
	  }
	} catch (e) {
	  console.error("Erro ao atualizar perfil:", e);
	}
	setRequisitando(false);
  }

  async function buscaNaGaleria() {
	try {
	  setDialogFotoVisivel(false);
	  // Solicita permissão se necessário
	  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
	  if (status !== "granted") {
		setMensagem({
		  tipo: "erro",
		  mensagem: "Permissão para acessar a galeria é necessária.",
		});
		setDialogMensagemVisivel(true);
		return;
	  }

	  let result = await ImagePicker.launchImageLibraryAsync({
		allowsEditing: true,
		aspect: [4, 3],
		quality: 1,
	  });
	  
	  if (!result.canceled && result.assets && result.assets.length > 0 && userFirebase) {
		setAlterandoFoto(true);
		const urlStorage = await sendImageToStorage(result.assets[0].uri, userFirebase.uid);
		if (urlStorage) {
		  setUrlFoto(urlStorage);
		  const usuarioAtualizado: Usuario = {
			...userFirebase,
			urlFoto: urlStorage,
		  };
		  await update(usuarioAtualizado);
		}
		setAlterandoFoto(false);
	  }
	} catch (error) {
	  console.error("Erro ao buscar foto na galeria:", error);
	  setAlterandoFoto(false);
	}
  }

  async function tiraFoto() {
	try {
	  setDialogFotoVisivel(false);
	  // Solicita permissão se necessário
	  const { status } = await ImagePicker.requestCameraPermissionsAsync();
	  if (status !== "granted") {
		setMensagem({
		  tipo: "erro",
		  mensagem: "Permissão para acessar a câmera é necessária.",
		});
		setDialogMensagemVisivel(true);
		return;
	  }

	  let result = await ImagePicker.launchCameraAsync({
		allowsEditing: true,
		aspect: [4, 3],
		quality: 1,
	  });
	  
	  if (!result.canceled && result.assets && result.assets.length > 0 && userFirebase) {
		setAlterandoFoto(true);
		const urlStorage = await sendImageToStorage(result.assets[0].uri, userFirebase.uid);
		if (urlStorage) {
		  setUrlFoto(urlStorage);
		  const usuarioAtualizado: Usuario = {
			...userFirebase,
			urlFoto: urlStorage,
		  };
		  await update(usuarioAtualizado);
		}
		setAlterandoFoto(false);
	  }
	} catch (error) {
	  console.error("Erro ao tirar foto:", error);
	  setAlterandoFoto(false);
	}
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
	<SafeAreaView style={[{ flex: 1, backgroundColor: theme.colors.background }]}>
	  <ScrollView
		contentContainerStyle={styles.container}
		showsVerticalScrollIndicator={false}
		keyboardShouldPersistTaps="handled"
	  >
		{userFirebase && (
		  <>
			<View style={styles.profileHeader}>
			  <TouchableOpacity 
				onPress={() => setDialogFotoVisivel(true)}
				disabled={alterandoFoto}
			  >
				<Image
				  style={styles.image}
				  source={
					urlFoto && urlFoto !== ""
					  ? { uri: urlFoto }
					  : require("../../assets/images/person.png")
				  }
				/>
				{alterandoFoto && (
				  <View style={styles.imageOverlay}>
					<Text style={styles.overlayText}>Carregando...</Text>
				  </View>
				)}
			  </TouchableOpacity>
			  <Button
				mode="outlined"
				onPress={() => setDialogFotoVisivel(true)}
				icon="camera"
				style={styles.changePhotoButton}
				disabled={alterandoFoto}
				loading={alterandoFoto}
			  >
				Alterar Foto
			  </Button>
			</View>

			{editMode ? (
			  <>
				<View style={styles.section}>
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
					style={[styles.button, { backgroundColor: theme.colors.primary }]}
					mode="contained"
					onPress={salvarPerfil}
					loading={requisitando}
					disabled={requisitando}
				  >
					{!requisitando ? "Salvar" : "Salvando"}
				  </Button>
				  <Button
					style={styles.cancelButton}
					mode="outlined"
					onPress={() => setEditMode(false)}
				  >
					Cancelar
				  </Button>
				</View>
			  </>
			) : (
			  <>
				<View style={styles.section}>
				  <Text variant="headlineLarge" style={[styles.mainTitle, { color: theme.colors.onBackground }]}>
					{userFirebase.nome || "Nome não informado"}
				  </Text>
				  <Text variant="titleMedium" style={[styles.emailText, { color: theme.colors.onSurfaceVariant }]}>
					{userAuth?.user?.email || userFirebase.email}
				  </Text>
				</View>
				
				<View style={styles.section}>
				  <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Estatísticas</Text>
				  <View style={styles.statsRow}>
					<Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
					  <Card.Content style={styles.statContent}>
						<Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.primary }]}>🔥</Text>
						<Text variant="titleMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>{userFirebase.diasAtivos || 1}</Text>
						<Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Dias Streak</Text>
					  </Card.Content>
					</Card>
					<Card style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
					  <Card.Content style={styles.statContent}>
						<Text variant="headlineMedium" style={[styles.statNumber, { color: theme.colors.primary }]}>📊</Text>
						<Text variant="titleMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>{(userFirebase.coeficienteConhecimento || 0).toFixed(1)}%</Text>
						<Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Coeficiente</Text>
					  </Card.Content>
					</Card>
				  </View>
				  
				  <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
					<Card.Content style={styles.infoContent}>
					  <Text variant="bodyLarge" style={[styles.infoItem, { color: theme.colors.onSurface }]}>📅 Membro desde: {userFirebase.createdAt ? new Date(userFirebase.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</Text>
					  <Text variant="bodyLarge" style={[styles.infoItem, { color: theme.colors.onSurface }]}>🕐 Último acesso: {userFirebase.dataUltimoAcesso ? new Date(userFirebase.dataUltimoAcesso).toLocaleDateString('pt-BR') : 'N/A'}</Text>
					</Card.Content>
				  </Card>
				</View>

				<View style={styles.section}>
				  <Button
					style={[styles.button, { backgroundColor: theme.colors.primary }]}
					mode="contained"
					onPress={() => setEditMode(true)}
				  >
					Editar Perfil
				  </Button>
				  <Button
					style={styles.deleteButton}
					mode="outlined"
					textColor={theme.colors.error}
					onPress={() => setDialogVisivel(true)}
				  >
					Excluir Conta
				  </Button>
				</View>
			  </>
			)}
		  </>
		)}
	  </ScrollView>

	  <Dialog visible={dialogVisivel} onDismiss={() => setDialogVisivel(false)}>
		<Dialog.Icon icon="alert-circle-outline" size={60} />
		<Dialog.Title style={styles.textDialog}>Excluir Conta</Dialog.Title>
		<Dialog.Content>
		  <Text style={styles.textDialog} variant="bodyLarge">
			Tem certeza que deseja excluir sua conta? Esta ação não pode ser
			desfeita.
		  </Text>
		</Dialog.Content>
		<Dialog.Actions>
		  <Button onPress={() => setDialogVisivel(false)}>Cancelar</Button>
		  <Button
			onPress={() => {
			  setDialogVisivel(false);
			  setConfirmDelete(true);
			}}
			textColor="#ff0000"
		  >
			Excluir
		  </Button>
		</Dialog.Actions>
	  </Dialog>

	  <Dialog visible={confirmDelete} onDismiss={() => setConfirmDelete(false)}>
		<Dialog.Icon icon="alert-octagon-outline" size={60} />
		<Dialog.Title style={styles.textDialog}>Você tem certeza?</Dialog.Title>
		<Dialog.Content>
		  <Text style={styles.textDialog} variant="bodyLarge">
			Esta é sua última chance. Sua conta será permanentemente excluída.
		  </Text>
		</Dialog.Content>
		<Dialog.Actions>
		  <Button onPress={() => setConfirmDelete(false)}>Cancelar</Button>
		  <Button
			onPress={() => {
			  excluirConta();
			}}
			loading={requisitando}
			disabled={requisitando}
			textColor="#ff0000"
		  >
			{!requisitando ? "Sim, excluir" : "Excluindo..."}
		  </Button>
		</Dialog.Actions>
	  </Dialog>

	  <Dialog visible={dialogFotoVisivel} onDismiss={() => setDialogFotoVisivel(false)}>
		<Dialog.Icon icon="camera" size={60} />
		<Dialog.Title style={styles.textDialog}>Alterar Foto</Dialog.Title>
		<Dialog.Content>
		  <Text style={styles.textDialog} variant="bodyLarge">
			Escolha como deseja alterar sua foto de perfil
		  </Text>
		</Dialog.Content>
		<Dialog.Actions>
		  <Button 
			onPress={tiraFoto}
			icon="camera"
			disabled={alterandoFoto}
		  >
			Tirar Foto
		  </Button>
		  <Button 
			onPress={buscaNaGaleria}
			icon="image"
			disabled={alterandoFoto}
		  >
			Galeria
		  </Button>
		  <Button onPress={() => setDialogFotoVisivel(false)}>Cancelar</Button>
		</Dialog.Actions>
	  </Dialog>

	  <Dialog visible={dialogMensagemVisivel} onDismiss={() => {
		setDialogMensagemVisivel(false);
		setMensagem({ tipo: "", mensagem: "" });
	  }}>
		<Dialog.Icon 
		  icon={mensagem.tipo === "erro" ? "alert-circle-outline" : "information-outline"} 
		  size={60} 
		/>
		<Dialog.Title style={styles.textDialog}>
		  {mensagem.tipo === "erro" ? "Erro" : "Informação"}
		</Dialog.Title>
		<Dialog.Content>
		  <Text style={styles.textDialog} variant="bodyLarge">
			{mensagem.mensagem}
		  </Text>
		</Dialog.Content>
		<Dialog.Actions>
		  <Button onPress={() => {
			setDialogMensagemVisivel(false);
			setMensagem({ tipo: "", mensagem: "" });
		  }}>OK</Button>
		</Dialog.Actions>
	  </Dialog>
	</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
	padding: 24,
	paddingBottom: 40,
  },
  profileHeader: {
	alignItems: 'center',
	marginBottom: 32,
  },
  image: {
	width: 120,
	height: 120,
	borderRadius: 60,
	borderWidth: 4,
	borderColor: '#22c55e',
  },
  imageOverlay: {
	position: 'absolute',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
	borderRadius: 60,
	justifyContent: 'center',
	alignItems: 'center',
  },
  overlayText: {
	color: '#fff',
	fontWeight: 'bold',
  },
  changePhotoButton: {
	marginTop: 12,
  },
  section: {
	marginBottom: 32,
  },
  mainTitle: {
	fontWeight: '700',
	textAlign: 'center',
	marginBottom: 8,
  },
  emailText: {
	fontWeight: '500',
	textAlign: 'center',
  },
  sectionTitle: {
	fontWeight: '600',
	marginBottom: 20,
  },
  statsRow: {
	flexDirection: 'row',
	gap: 16,
	marginBottom: 16,
  },
  statCard: {
	flex: 1,
	borderRadius: 16,
	elevation: 3,
  },
  statContent: {
	alignItems: 'center',
	paddingVertical: 20,
  },
  statNumber: {
	marginBottom: 4,
  },
  statValue: {
	fontWeight: '700',
	marginBottom: 4,
  },
  statLabel: {
	textAlign: 'center',
	fontWeight: '500',
  },
  infoCard: {
	borderRadius: 16,
	elevation: 3,
  },
  infoContent: {
	paddingVertical: 16,
  },
  infoItem: {
	marginBottom: 8,
	fontWeight: '500',
  },
  textinput: {
	marginBottom: 16,
	backgroundColor: 'transparent',
  },
  button: {
	marginBottom: 12,
	borderRadius: 12,
  },
  cancelButton: {
	marginBottom: 12,
	borderRadius: 12,
  },
  deleteButton: {
	borderRadius: 12,
  },
  textDialog: {
	textAlign: 'center',
  },
});
