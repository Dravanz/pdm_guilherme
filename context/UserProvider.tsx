/* eslint-disable react-hooks/exhaustive-deps */
import { firestore } from "@/firebase/FirebaseInit";
import { Usuario } from "@/model/Usuario";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthProvider";

export const UserContext = createContext({});

export const UserProvider = ({ children }: any) => {
	const { userAuth, delAccount, updateUserEmail, updateUserPassword } = useContext(AuthContext) as any;
	const [userFirebase, setUserFirebase] = useState<Usuario | null>(null);

	useEffect(() => {
		if (userAuth) {
			getUser();
		}
	}, [userAuth]);

	//busca os detalhes do usuário
	async function getUser(): Promise<void> {
		try {
			if (!userAuth.user) {
				return;
			}
			const docSnap = await getDoc(
				doc(firestore, "usuarios", userAuth.user.uid)
			);
			if (docSnap.exists()) {
				let userData = docSnap.data();
				const usuario: Usuario = {
					uid: docSnap.id,
					email: userData.email,
					nome: userData.nome,
					urlFoto: userData.urlFoto,
					perfil: userData.perfil,
				};
				setUserFirebase(usuario);
			}
		} catch (e) {
			console.error("UserProvider, getUser: " + e);
		}
	}

	async function update(usuario: Usuario, novaSenha?: string): Promise<string> {
		try {
			// Atualiza email no Firebase Auth se mudou
			if (usuario.email !== userFirebase?.email) {
				const emailResult = await updateUserEmail(usuario.email);
				if (emailResult !== "ok") {
					return emailResult;
				}
			}

			// Atualiza senha no Firebase Auth se fornecida
			if (novaSenha) {
				const passwordResult = await updateUserPassword(novaSenha);
				if (passwordResult !== "ok") {
					return passwordResult;
				}
			}

			// Atualiza dados no Firestore
			await setDoc(doc(firestore, "usuarios", usuario.uid), {
				email: usuario.email,
				nome: usuario.nome,
				perfil: usuario.perfil,
				urlFoto: usuario.urlFoto,
			});
			setUserFirebase(usuario);
			return "ok";
		} catch (e) {
			console.error(e);
			return "Erro ao atualizar o usuário. Contate o suporte.";
		}
	}

	async function del(uid: string): Promise<string> {
		try {
			await deleteDoc(doc(firestore, "usuarios", uid));
			await delAccount(); //TODO: garantir que o login seja recente, menor que 5 minutos, segundo especificação do serviço Authentication
			return "ok";
		} catch (e) {
			console.error(e);
			return "Erro ao excluir a conta. Contate o suporte.";
		}
	}

	return (
		<UserContext.Provider value={{ userFirebase, update, del }}>
			{children}
		</UserContext.Provider>
	);
};