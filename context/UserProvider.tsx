/* eslint-disable react-hooks/exhaustive-deps */
import { firestore, storage } from "@/firebase/FirebaseInit";
import { Usuario } from "@/model/Usuario";
import { BadgeService } from "@/services/badge/BadgeService";
import { ImageCacheService } from "@/services/image/ImageCacheService";
import { DecayService } from "@/services/shared/DecayService";
import * as ImageManipulator from "expo-image-manipulator";
import { deleteDoc, doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "./AuthProvider";

export const UserContext = createContext({});

export const UserProvider = ({ children }: any) => {
  const { userAuth, delAccount, updateUserPassword } = useContext(
    AuthContext
  ) as any;
  const [userFirebase, setUserFirebase] = useState<Usuario | null>(null);

  useEffect(() => {
    if (userAuth) {
      getUser();

      // Listener para atualizar automaticamente quando o documento mudar
      const unsubscribe = onSnapshot(
        doc(firestore, "usuarios", userAuth.user.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            let userData = docSnap.data();
            const authUser = userAuth.user;
            const lastSignInTime = authUser.metadata.lastSignInTime;
            const creationTime = authUser.metadata.creationTime;

            // Calcula streak e coeficiente
            const { diasAtivos, coeficiente, diasInatividade } =
              calculateStreakAndCoefficient(lastSignInTime, userData);

            const usuario: Usuario = {
              uid: docSnap.id,
              email: userData.email || authUser.email || "",
              nome: userData.nome || "",
              urlFoto: userData.urlFoto || "",
              perfil: userData.perfil,
              nivelAtual: userData.nivelAtual || "iniciante",
              coeficienteConhecimento: coeficiente,
              diasInatividade,
              dataUltimoAcesso: lastSignInTime,
              createdAt: creationTime,
              diasAtivos,
              diasLogin: userData.diasLogin || [],
            };

            setUserFirebase(usuario);
          }
        },
        (error) => {
          // Silenciar erro de permissão quando usuário desloga
          if (error.code !== "permission-denied") {
            console.error("Erro no listener do Firestore:", error);
          }
        }
      );

      // Cleanup: cancela listener quando componente desmonta ou userAuth muda
      return () => {
        unsubscribe();
      };
    } else {
      // Quando não há userAuth, limpa o estado
      setUserFirebase(null);
    }
  }, [userAuth]);

  // Calcula streak e coeficiente baseado no Firebase Auth
  function calculateStreakAndCoefficient(
    lastSignInTime: string,
    userData: any
  ): { diasAtivos: number; coeficiente: number; diasInatividade: number } {
    const agora = new Date();
    const ultimoAcesso = userData.dataUltimoAcesso
      ? new Date(userData.dataUltimoAcesso)
      : new Date(lastSignInTime);

    // Normaliza datas para meia-noite (00:00:00)
    const inicioHoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate()
    );
    const inicioUltimoAcesso = new Date(
      ultimoAcesso.getFullYear(),
      ultimoAcesso.getMonth(),
      ultimoAcesso.getDate()
    );

    const diffTime = inicioHoje.getTime() - inicioUltimoAcesso.getTime();
    const diasInatividade = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let diasAtivos = userData.diasAtivos || 1;
    let coeficiente = userData.coeficienteConhecimento || 0;

    // Mesmo dia: mantém streak
    if (diasInatividade === 0) {
      return { diasAtivos, coeficiente, diasInatividade };
    }

    // Passou 1 dia (ontem -> hoje após 00:00): incrementa streak
    if (diasInatividade === 1) {
      diasAtivos += 1;
    }
    // Mais de 1 dia sem acesso: reseta streak
    else if (diasInatividade > 1) {
      diasAtivos = 1;

      // Diminui coeficiente 1.5% por dia após 3 dias inativo
      if (diasInatividade > 3) {
        const diasPenalizacao = diasInatividade - 3;
        const reducao = diasPenalizacao * 0.015;
        coeficiente = Math.max(0, coeficiente * (1 - reducao));
      }
    }

    return { diasAtivos, coeficiente, diasInatividade };
  }

  //busca os detalhes do usuário
  async function getUser(): Promise<void> {
    try {
      if (!userAuth?.user) {
        setUserFirebase(null);
        return;
      }

      // Aplicar decay antes de buscar dados
      await DecayService.aplicarDecayCoeficiente(userAuth.user.uid);

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

        // Atualizar array de dias de login
        const hoje = new Date().toISOString().split("T")[0];
        let diasLogin = userData.diasLogin || [];

        // Adicionar hoje se não estiver na lista
        if (!diasLogin.includes(hoje)) {
          diasLogin = [...diasLogin, hoje].sort();
          // Manter apenas os últimos 30 dias
          const trintaDiasAtras = new Date();
          trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
          diasLogin = diasLogin.filter(
            (data: string) => new Date(data) >= trintaDiasAtras
          );

          // Salvar imediatamente no Firestore (sem await para não bloquear)
          setDoc(
            doc(firestore, "usuarios", userAuth.user.uid),
            { diasLogin },
            { merge: true }
          ).catch((error) =>
            console.error("Erro ao salvar dias de login:", error)
          );
        }

        const usuario: Usuario = {
          uid: docSnap.id,
          email: userData.email || authUser.email || "",
          nome: userData.nome || "",
          urlFoto: userData.urlFoto || "",
          perfil: userData.perfil,
          nivelAtual: userData.nivelAtual || "iniciante",
          coeficienteConhecimento: coeficiente,
          diasInatividade,
          dataUltimoAcesso: lastSignInTime,
          createdAt: creationTime,
          diasAtivos,
          diasLogin,
        };

        // Atualiza dados calculados no Firestore
        await setDoc(
          doc(firestore, "usuarios", usuario.uid),
          {
            diasAtivos,
            coeficienteConhecimento: coeficiente,
            diasInatividade,
            dataUltimoAcesso: lastSignInTime,
            diasLogin: usuario.diasLogin,
          },
          { merge: true }
        );

        // Verificar e conceder badge de primeiro login (Execlogger)
        const primeiroLogin = userData.primeiroLoginFeito !== true;
        if (primeiroLogin) {
          // Conceder badge Execlogger (retorna true se foi concedida)
          const badgeConcedida = await BadgeService.concederBadgePrimeiroLogin(
            usuario.uid
          );

          // Marcar que o primeiro login foi feito
          await setDoc(
            doc(firestore, "usuarios", usuario.uid),
            { primeiroLoginFeito: true },
            { merge: true }
          );

          // Mostrar Alert de boas-vindas se badge foi concedida
          if (badgeConcedida) {
            setTimeout(() => {
              Alert.alert(
                "🎉 Bem-vindo ao Execlog!",
                "🎖️ Parabéns! Você recebeu a conquista Execlogger por iniciar sua jornada de aprendizado conosco!\n\n" +
                  "Continue firme nos estudos e pratique bastante para conquistar mais badges e conhecimento. Boa sorte! 📚✨",
                [{ text: "Vamos lá!", style: "default" }]
              );
            }, 500);
          }
        }

        // Verificar e conceder badges baseadas no perfil (Colaborador/Admin)
        await BadgeService.verificarEConcederBadgesPerfil(usuario.uid);

        setUserFirebase(usuario);
      } else {
        setUserFirebase(null);
      }
    } catch (e) {
      console.error("UserProvider, getUser: " + e);
      setUserFirebase(null);
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
        diasAtivos: usuario.diasAtivos ?? userFirebase?.diasAtivos ?? 1,
        diasLogin: usuario.diasLogin ?? userFirebase?.diasLogin ?? [],
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

  async function sendImageToStorage(
    urlDevice: string,
    uid: string
  ): Promise<string | null> {
    try {
      //1. Redimensiona, compacta a imagem, e a transforma em blob
      //ImageManipulator.ImageManipulator.manipulate será o substituto de ImageManipulator.manipulateAsync
      const imageRedimencionada = await ImageManipulator.manipulateAsync(
        urlDevice,
        [{ resize: { width: 150, height: 150 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.PNG }
      );
      const data = await fetch(imageRedimencionada?.uri);
      const blob = await data.blob();

      //2. e prepara o path onde ela deve ser salva no storage
      const storageReference = ref(storage, `imagens/usuarios/${uid}/foto.png`);

      //3. Envia para o storage
      await uploadBytes(storageReference, blob);

      //4. Retorna a URL da imagem
      const url = await getDownloadURL(
        ref(storage, `imagens/usuarios/${uid}/foto.png`)
      );

      // Limpar cache da imagem anterior
      await ImageCacheService.clearCache(uid);

      return url;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  // Função para forçar atualização dos dados do usuário
  async function refreshUser(): Promise<void> {
    if (userAuth) {
      await getUser();
    }
  }

  return (
    <UserContext.Provider
      value={{ userFirebase, update, del, sendImageToStorage, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
};
