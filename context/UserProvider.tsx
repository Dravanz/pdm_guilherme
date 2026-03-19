/* eslint-disable react-hooks/exhaustive-deps */
import { firestore, storage } from "@/firebase/FirebaseInit";
import { Usuario } from "@/model/Usuario";
import { BadgeService } from "@/services/badge/BadgeService";
import { ImageCacheService } from "@/services/image/ImageCacheService";
import { DecayService } from "@/services/shared/DecayService";
import * as ImageManipulator from "expo-image-manipulator";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { AuthContext } from "./AuthProvider";

export interface UserStats {
  cursosAtivos: number;
  cursosCompletos: number;
  totalQuestoes: number;
  questoesCorretas: number;
  questoesErradas: number;
  coeficienteGeral: number;
}

export const UserContext = createContext({});

export const UserProvider = ({ children }: any) => {
  const { userAuth, delAccount, updateUserPassword } = useContext(
    AuthContext
  ) as any;
  const [userFirebase, setUserFirebase] = useState<Usuario | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (userAuth) {
      getUser();

      // Listener para atualizar automaticamente quando o documento mudar
      const unsubscribe = onSnapshot(
        doc(firestore, "usuarios", userAuth.user.uid),
        async (docSnap) => {
          if (docSnap.exists()) {
            let userData = docSnap.data();
            const authUser = userAuth.user;
            const lastSignInTime = authUser.metadata.lastSignInTime;
            const creationTime = authUser.metadata.creationTime;

            // MIGRATION: Fix Course IDs (underscore -> dash)
            // Migration logic moved to checkAndMigrateCourses function

            // Verificar e registrar login diário
            checkAndAddLoginDay(userAuth.user.uid, userData);

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

  // Listener em tempo real para estatísticas de cursos do usuário (cache para dashboard)
  useEffect(() => {
    if (!userAuth) {
      setUserStats(null);
      return;
    }

    const q = query(
      collection(firestore, "usuariosCursos"),
      where("usuarioId", "==", userAuth.user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let cursosAtivos = 0;
        let cursosCompletos = 0;
        let totalQuestoes = 0;
        let questoesCorretas = 0;
        let questoesErradas = 0;

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.concluido) {
            cursosCompletos++;
          } else {
            cursosAtivos++;
          }
          totalQuestoes += data.questoesRespondidas?.length ?? 0;
          questoesCorretas += data.questoesCorretas?.length ?? 0;
          questoesErradas += data.questoesErradas?.length ?? 0;
        });

        const coeficienteGeral =
          totalQuestoes > 0
            ? Math.round((questoesCorretas / totalQuestoes) * 100)
            : 0;

        setUserStats({
          cursosAtivos,
          cursosCompletos,
          totalQuestoes,
          questoesCorretas,
          questoesErradas,
          coeficienteGeral,
        });
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error("Erro no listener de usuariosCursos:", error);
        }
      }
    );

    return () => unsubscribe();
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

  async function checkAndAddLoginDay(userId: string, userData: any) {
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

      // Salvar imediatamente no Firestore
      try {
        await setDoc(
          doc(firestore, "usuarios", userId),
          { diasLogin },
          { merge: true }
        );
        console.log("Login diário registrado:", hoje);

        // Agendar lembrete de ofensiva para 24h depois
        const { NotificationService } = await import("@/services/shared/NotificationService");
        await NotificationService.scheduleStreakReminder();
        
      } catch (error) {
        console.error("Erro ao salvar dias de login:", error);
      }
    }
  }

  async function checkAndMigrateCourses(userId: string) {
    try {
      const usuariosCursosRef = collection(firestore, "usuariosCursos");
      const qCursos = query(usuariosCursosRef, where("usuarioId", "==", userId));
      const snapshotCursos = await getDocs(qCursos);
      
      snapshotCursos.forEach(async (docSnapCurso) => {
        const dataCurso = docSnapCurso.data() as { cursoId: string; [key: string]: any };
        if (dataCurso.cursoId && dataCurso.cursoId.includes("_")) {
          const novoId = dataCurso.cursoId.replace(/_/g, "-");
          console.log(`Migrando curso ${dataCurso.cursoId} para ${novoId}`);
          
          // Criar novo documento com ID corrigido
          const novoDocId = `${userId}_${novoId}`;
          await setDoc(doc(firestore, "usuariosCursos", novoDocId), {
            ...dataCurso,
            id: novoDocId,
            cursoId: novoId
          });
          
          // Deletar antigo
          await deleteDoc(doc(firestore, "usuariosCursos", docSnapCurso.id));
        }
      });
    } catch (error) {
      console.error("Erro na migração de cursos:", error);
    }
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
      
      // Executar migração de IDs de curso
      checkAndMigrateCourses(userAuth.user.uid);

      // Registrar para notificações push
      const { NotificationService } = await import("@/services/shared/NotificationService");
      await NotificationService.registerForPushNotificationsAsync(userAuth.user.uid);

      const docSnap = await getDoc(
        doc(firestore, "usuarios", userAuth.user.uid)
      );

      if (docSnap.exists()) {
        let userData = docSnap.data();

        // MIGRATION: Admin -> Moderador
        if (userData.perfil === "Admin") {
          console.log("Migrando usuário de Admin para Moderador...");
          userData.perfil = "Moderador";
          await setDoc(
            doc(firestore, "usuarios", userAuth.user.uid),
            { perfil: "Moderador" },
            { merge: true }
          );
        }

        // Usa dados nativos do Firebase Auth
        const authUser = userAuth.user;
        const lastSignInTime = authUser.metadata.lastSignInTime;
        const creationTime = authUser.metadata.creationTime;

        // Calcula streak e coeficiente
        const { diasAtivos, coeficiente, diasInatividade } =
          calculateStreakAndCoefficient(lastSignInTime, userData);

        // Verificar e registrar login diário (agora tratado no onSnapshot também, mas mantido aqui para garantia inicial)
        // checkAndAddLoginDay(userAuth.user.uid, userData); // Removido para evitar duplicidade, o onSnapshot cuidará disso assim que o getUser atualizar o documento ou o listener disparar

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

        // Atualiza dados calculados no Firestore
        await setDoc(
          doc(firestore, "usuarios", usuario.uid),
          {
            diasAtivos,
            coeficienteConhecimento: coeficiente,
            diasInatividade,
            dataUltimoAcesso: lastSignInTime,
            diasLogin: userData.diasLogin || [],
          },
          { merge: true }
        );

        // Verificar e conceder badge de primeiro login (Execlogger)
        const primeiroLogin = userData.primeiroLoginFeito !== true;
        // Só executar lógica de primeiro login se o email estiver verificado
        // Isso evita que o modal apareça durante o cadastro (quando o email ainda não foi verificado)
        if (primeiroLogin && authUser.emailVerified) {
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
                "Bem-vindo ao Execlog!",
                "Parabéns! Você recebeu a conquista Execlogger por iniciar sua jornada de aprendizado conosco!\n\n" +
                  "Continue firme nos estudos e pratique bastante para conquistar mais badges e conhecimento. Boa sorte!",
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
      value={{ userFirebase, userStats, update, del, sendImageToStorage, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
};
