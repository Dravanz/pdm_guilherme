import { Timestamp } from "firebase/firestore";

export interface Tentativa {
  id: string;
  usuarioId: string;
  cursoId: string;
  questaoId: string;
  respostaUsuario: string; // ID da alternativa selecionada
  correta: boolean;
  dataTentativa: Timestamp | Date;
  tags: string[];
}
