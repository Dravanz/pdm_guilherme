// @ts-nocheck
import { auth, firestore } from "@/firebase/FirebaseInit";
import { Credencial } from "@/model/types";
import { Usuario } from "@/model/Usuario";
import * as SecureStore from "expo-secure-store";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { createContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }: any) => {
  const [userAuth, setUserAuth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserAuth({ user });
      } else {
        // Tenta fazer auto-login se não há usuário autenticado
        await tryAutoLogin();
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  async function tryAutoLogin(): Promise<void> {
    try {
      const credencial = await recuperaCredencialdaCache();
      if (credencial) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          credencial.email,
          credencial.senha
        );
        if (userCredential.user.emailVerified) {
          setUserAuth({ user: userCredential.user });
        }
      }
    } catch (error) {
      console.error("Auto-login falhou:", error);
      // Remove credenciais inválidas do cache
      if (Platform.OS === "web") {
        localStorage.removeItem("credencial");
      } else {
        await SecureStore.deleteItemAsync("credencial");
      }
    }
  }

  async function armazenaCredencialnaCache(
    credencial: Credencial
  ): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem(
          "credencial",
          JSON.stringify({
            email: credencial.email,
            senha: credencial.senha,
          })
        );
      } else {
        await SecureStore.setItemAsync(
          "credencial",
          JSON.stringify({
            email: credencial.email,
            senha: credencial.senha,
          })
        );
      }
    } catch (e) {
      console.error("AuthProvider, armazenaCredencialnaCache: " + e);
    }
  }

  async function recuperaCredencialdaCache(): Promise<Credencial | null> {
    try {
      if (Platform.OS === "web") {
        const credencial = localStorage.getItem("credencial");
        return credencial ? JSON.parse(credencial) : null;
      } else {
        const credencial = await SecureStore.getItemAsync("credencial");
        return credencial ? JSON.parse(credencial) : null;
      }
    } catch (e) {
      console.error("AuthProvider, recuperaCredencialdaCache: " + e);
      return null;
    }
  }

  async function singIn(credencial: Credencial): Promise<string> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credencial.email,
        credencial.senha
      );
      if (userCredential.user.emailVerified === false) {
        return "Você precisa verificar seu email para continuar.";
      }
      armazenaCredencialnaCache(credencial);
      return "ok";
    } catch (error: any) {
      return launchServerMessageErro(error);
    }
  }

  async function signUp(usuario: Usuario): Promise<string> {
    try {
      if (usuario.email && usuario.senha) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          usuario.email,
          usuario.senha
        );
        if (userCredential) {
          await sendEmailVerification(userCredential.user);
          //A senha não deve ser persistida no serviço Firetore, ela é gerida pelo serviço Authentication
          const usuarioFirestore = {
            email: usuario.email,
            nome: usuario.nome,
            urlFoto: usuario.urlFoto,
            perfil: usuario.perfil,
            nivelAtual: usuario?.perfil ? "iniciante" : "iniciante",
            coeficienteConhecimento: 0,
            diasInatividade: 0,
            diasAtivos: 1,
            dataUltimoAcesso: new Date().toISOString(),
            createdAt: serverTimestamp(),
          };
          await setDoc(
            doc(firestore, "usuarios", userCredential.user.uid),
            usuarioFirestore,
            { merge: true }
          );
        }
      } else {
        return "Confira se você digitou o email e a senha.";
      }
      return "ok";
    } catch (e: any) {
      console.error(e.code, e.message);
      return launchServerMessageErro(e);
    }
  }

  async function sair(): Promise<string> {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem("credencial");
      } else {
        await SecureStore.deleteItemAsync("credencial");
      }
      await signOut(auth);
      return "ok";
    } catch (error: any) {
      console.error(error.code, error.message);
      return launchServerMessageErro(error);
    }
  }

  async function delAccount(): Promise<string> {
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        return "ok";
      }
      return "Usuário não autenticado.";
    } catch (e: any) {
      return launchServerMessageErro(e);
    }
  }

  async function updateUserEmail(novoEmail: string): Promise<string> {
    try {
      if (auth.currentUser) {
        await updateEmail(auth.currentUser, novoEmail);
        await sendEmailVerification(auth.currentUser);
        return "ok";
      }
      return "Usuário não autenticado.";
    } catch (e: any) {
      return launchServerMessageErro(e);
    }
  }

  async function updateUserPassword(novaSenha: string): Promise<string> {
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, novaSenha);
        return "ok";
      }
      return "Usuário não autenticado.";
    } catch (e: any) {
      return launchServerMessageErro(e);
    }
  }

  async function resetPassword(email: string): Promise<string> {
    try {
      await sendPasswordResetEmail(auth, email);
      return "ok";
    } catch (e: any) {
      return launchServerMessageErro(e);
    }
  }

  //função utilitária
  function launchServerMessageErro(e: any): string {
    switch (e.code) {
      case "auth/invalid-credential":
        return "Email inexistente ou senha errada.";
      case "auth/user-not-found":
        return "Usuário não cadastrado.";
      case "auth/wrong-password":
        return "Erro na senha.";
      case "auth/invalid-email":
        return "Email inválido.";
      case "auth/user-disabled":
        return "Usuário desabilitado.";
      case "auth/email-already-in-use":
        return "Email em uso. Tente outro email.";
      case "auth/requires-recent-login":
        return "Por segurança, faça login novamente para alterar o email.";
      case "auth/weak-password":
        return "Senha muito fraca. Use pelo menos 6 caracteres.";
      default:
        return "Erro desconhecido. Contate o administrador.";
    }
  }

  return (
    <AuthContext.Provider
      value={{
        singIn,
        signUp,
        sair,
        recuperaCredencialdaCache,
        userAuth,
        isLoading,
        delAccount,
        updateUserEmail,
        updateUserPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
