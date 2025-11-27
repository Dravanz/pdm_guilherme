import { UsuarioCurso } from "@/model/Curso";
import { CursoService } from "@/services/curso/CursoService";
import React, { createContext, useContext, useState } from "react";
import { UserContext } from "./UserProvider";

interface CursoContextType {
  progressoCurso: UsuarioCurso | null;
  setProgressoCurso: (progresso: UsuarioCurso) => void;
  responderQuestao: (
    questaoId: string,
    alternativaId: string,
    correta: boolean,
    explicacao: string
  ) => Promise<any>;
  salvarProgresso: () => Promise<void>;
}

export const CursoContext = createContext<CursoContextType>(
  {} as CursoContextType
);

export const CursoProvider = ({ children }: any) => {
  const [progressoCurso, setProgressoCurso] = useState<UsuarioCurso | null>(
    null
  );
  const { userFirebase } = useContext<any>(UserContext);

  const responderQuestao = async (
    questaoId: string,
    alternativaId: string,
    correta: boolean,
    explicacao: string
  ) => {
    if (!progressoCurso || !userFirebase) {
      throw new Error("Progresso ou usuário não encontrado");
    }

    // Verificar se já foi respondida
    if (progressoCurso.questoesRespondidas.includes(questaoId)) {
      throw new Error("Questão já foi respondida");
    }

    // Atualizar progresso local
    const novoProgresso = {
      ...progressoCurso,
      questoesRespondidas: [...progressoCurso.questoesRespondidas, questaoId],
      questoesCorretas: correta
        ? [...progressoCurso.questoesCorretas, questaoId]
        : progressoCurso.questoesCorretas,
      questoesErradas: !correta
        ? [...(progressoCurso.questoesErradas || []), questaoId]
        : progressoCurso.questoesErradas || [],
    };

    // Calcular coeficiente
    const totalRespondidas = novoProgresso.questoesRespondidas.length;
    const totalCorretas = novoProgresso.questoesCorretas.length;
    novoProgresso.coeficiente = Math.round(
      (totalCorretas / totalRespondidas) * 100
    );

    setProgressoCurso(novoProgresso);

    // Salvar no Firebase
    await CursoService.salvarProgresso(novoProgresso);

    return {
      sucesso: correta,
      explicacao,
      novoCoeficiente: novoProgresso.coeficiente,
    };
  };

  const salvarProgresso = async () => {
    if (progressoCurso) {
      await CursoService.salvarProgresso(progressoCurso);
    }
  };

  return (
    <CursoContext.Provider
      value={{
        progressoCurso,
        setProgressoCurso,
        responderQuestao,
        salvarProgresso,
      }}
    >
      {children}
    </CursoContext.Provider>
  );
};
