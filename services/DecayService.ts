import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/FirebaseInit';

export class DecayService {
  
  static async aplicarDecayCoeficiente(usuarioId: string): Promise<void> {
    try {
      const usuarioRef = doc(firestore, 'usuarios', usuarioId);
      const usuarioSnap = await getDoc(usuarioRef);
      
      if (!usuarioSnap.exists()) return;
      
      const userData = usuarioSnap.data();
      const ultimoLogin = userData.ultimoLogin?.toDate() || new Date();
      const agora = new Date();
      
      // Calcular dias sem login
      const diferencaMs = agora.getTime() - ultimoLogin.getTime();
      const diasSemLogin = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
      
      if (diasSemLogin > 0) {
        const coeficienteAtual = userData.coeficienteConhecimento || 0;
        
        // Aplicar decay de 5% por dia (máximo 50% de redução)
        const percentualDecay = Math.min(diasSemLogin * 5, 50);
        const novoCoeficiente = Math.max(0, Math.round(coeficienteAtual * (1 - percentualDecay / 100)));
        

        
        await updateDoc(usuarioRef, {
          coeficienteConhecimento: novoCoeficiente,
          ultimoLogin: serverTimestamp()
        });
      } else {
        // Apenas atualizar último login
        await updateDoc(usuarioRef, {
          ultimoLogin: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Erro ao aplicar decay:', error);
    }
  }
}