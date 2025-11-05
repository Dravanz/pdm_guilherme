/* eslint-disable react-hooks/exhaustive-deps */
import { firestore } from "@/firebase/FirebaseInit";
import { Usuario } from "@/model/Usuario";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthProvider";

export const UserContext = createContext({});

export const UserProvider = ({ children }: any) => {
  const { userAuth, delAccount, updateUserPassword } =
    useContext(AuthContext) as any;
  const [userFirebase, setUserFirebase] = useState<Usuario | null>(null);

  useEffect(() => {
    if (userAuth) {
      getUser();
    }
  }, [userAuth]);

  // Verifica se deve incrementar dias ativos
  async function checkAndUpdateActiveDays(usuario: Usuario): Promise<void> {
    try {
      const hoje = new Date();
      const ultimoAcesso = usuario.dataUltimoAcesso ? new Date(usuario.dataUltimoAcesso) : null;
      
      if (ultimoAcesso) {
        const diffTime = hoje.getTime() - ultimoAcesso.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Se passou pelo menos 1 dia desde o último acesso
        if (diffDays >= 1) {
          const novosDiasAtivos = (usuario.diasAtivos || 1) + 1;
          
          await setDoc(doc(firestore, "usuarios", usuario.uid), {
            diasAtivos: novosDiasAtivos,
            dataUltimoAcesso: hoje.toISOString(),
          }, { merge: true });
          
          usuario.diasAtivos = novosDiasAtivos;
          usuario.dataUltimoAcesso = hoje.toISOString();
        }
      }
    } catch (e) {
      console.error("Erro ao atualizar dias ativos:", e);
    }
  }

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
          nivelAtual: userData.nivelAtual,
          coeficienteConhecimento: userData.coeficienteConhecimento,
          diasInatividade: userData.diasInatividade,
          dataUltimoAcesso: userData.dataUltimoAcesso,
          createdAt: userData.createdAt,
          diasAtivos: userData.diasAtivos || 1,
        };
        // Verifica se deve incrementar dias ativos
        await checkAndUpdateActiveDays(usuario);
        setUserFirebase(usuario);
      }
    } catch (e) {
      console.error("UserProvider, getUser: " + e);
    }
  }

  async function update(usuario: Usuario, novaSenha?: string): Promise<string> {
    try {
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
        nivelAtual:
          usuario.nivelAtual ?? userFirebase?.nivelAtual ?? "iniciante",
        coeficienteConhecimento:
          usuario.coeficienteConhecimento ??
          userFirebase?.coeficienteConhecimento ??
          0,
        diasInatividade:
          usuario.diasInatividade ?? userFirebase?.diasInatividade ?? 0,
        diasAtivos:
          usuario.diasAtivos ?? userFirebase?.diasAtivos ?? 1,
        dataUltimoAcesso: new Date().toISOString(),
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
