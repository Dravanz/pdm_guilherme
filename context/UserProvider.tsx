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

  // Calcula streak e coeficiente baseado no Firebase Auth
  function calculateStreakAndCoefficient(lastSignInTime: string, userData: any) {
    const hoje = new Date();
    const ultimoLogin = new Date(lastSignInTime);
    const diffTime = hoje.getTime() - ultimoLogin.getTime();
    const diasInatividade = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let diasAtivos = userData.diasAtivos || 1;
    let coeficiente = userData.coeficienteConhecimento || 0;
    
    // Se logou hoje (menos de 24h), mantém streak
    if (diasInatividade === 0) {
      return { diasAtivos, coeficiente, diasInatividade };
    }
    
    // Se logou ontem (24-48h), incrementa streak
    if (diasInatividade === 1) {
      diasAtivos += 1;
    }
    // Se passou mais de 1 dia, reseta streak
    else if (diasInatividade > 1) {
      diasAtivos = 1;
      
      // Diminui coeficiente 1.5% por dia após 3 dias inativo
      if (diasInatividade > 3) {
        const diasPenalizacao = diasInatividade - 3;
        const reducao = diasPenalizacao * 0.015; // 1.5% por dia
        coeficiente = Math.max(0, coeficiente * (1 - reducao));
      }
    }
    
    return { diasAtivos, coeficiente, diasInatividade };
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
        
        // Usa dados nativos do Firebase Auth
        const authUser = userAuth.user;
        const lastSignInTime = authUser.metadata.lastSignInTime;
        const creationTime = authUser.metadata.creationTime;
        
        // Calcula streak e coeficiente
        const { diasAtivos, coeficiente, diasInatividade } = 
          calculateStreakAndCoefficient(lastSignInTime, userData);
        
        const usuario: Usuario = {
          uid: docSnap.id,
          email: userData.email,
          nome: userData.nome,
          urlFoto: userData.urlFoto,
          perfil: userData.perfil,
          nivelAtual: userData.nivelAtual,
          coeficienteConhecimento: coeficiente,
          diasInatividade,
          dataUltimoAcesso: lastSignInTime,
          createdAt: creationTime,
          diasAtivos,
        };
        
        // Atualiza dados calculados no Firestore
        await setDoc(doc(firestore, "usuarios", usuario.uid), {
          diasAtivos,
          coeficienteConhecimento: coeficiente,
          diasInatividade,
        }, { merge: true });
        
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
