import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/FirebaseInit';
import { Badge, BADGES_DISPONIVEIS, BadgeRequisito } from '../model/Badge';
import { UsuarioCurso } from '../model/Curso';

export class BadgeService {
  
  static async verificarEConcederBadges(usuarioId: string, cursoId?: string): Promise<Badge[]> {
    const novasBadges: Badge[] = [];
    
    for (const badge of BADGES_DISPONIVEIS) {
      const jaTemBadge = await this.usuarioTemBadge(usuarioId, badge.id);
      
      if (!jaTemBadge) {
        const mereceBadge = await this.verificarRequisitos(usuarioId, badge.requisitos, cursoId);
        
        if (mereceBadge) {
          await this.concederBadge(usuarioId, badge);
          novasBadges.push(badge);
        }
      }
    }
    
    return novasBadges;
  }
  
  static async usuarioTemBadge(usuarioId: string, badgeId: string): Promise<boolean> {
    try {
      const badgeRef = doc(firestore, 'usuariosBadges', `${usuarioId}_${badgeId}`);
      const badgeSnap = await getDoc(badgeRef);
      return badgeSnap.exists();
    } catch (error) {
      console.error('Erro ao verificar badge:', error);
      return false;
    }
  }
  
  static async verificarRequisitos(usuarioId: string, requisitos: BadgeRequisito, cursoId?: string): Promise<boolean> {
    try {
      switch (requisitos.tipo) {
        case 'primeiro_curso':
          return await this.verificarPrimeiroCurso(usuarioId);
          
        case 'curso_concluido':
          return cursoId === requisitos.cursoId;
          
        case 'multiplos_cursos':
          return await this.verificarMultiplosCursos(usuarioId, requisitos.valor as number);
          
        case 'coeficiente_alto':
          return await this.verificarCoeficienteAlto(usuarioId, requisitos.valor as number);
          
        case 'sequencia_dias':
          return await this.verificarSequenciaDias(usuarioId, requisitos.valor as number);
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Erro ao verificar requisitos:', error);
      return false;
    }
  }
  
  static async verificarPrimeiroCurso(usuarioId: string): Promise<boolean> {
    const cursosRef = collection(firestore, 'usuariosCursos');
    const q = query(cursosRef, where('usuarioId', '==', usuarioId), where('concluido', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.size === 1;
  }
  
  static async verificarMultiplosCursos(usuarioId: string, quantidade: number): Promise<boolean> {
    const cursosRef = collection(firestore, 'usuariosCursos');
    const q = query(cursosRef, where('usuarioId', '==', usuarioId), where('concluido', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.size >= quantidade;
  }
  
  static async verificarCoeficienteAlto(usuarioId: string, minimo: number): Promise<boolean> {
    const usuarioRef = doc(firestore, 'usuarios', usuarioId);
    const usuarioSnap = await getDoc(usuarioRef);
    
    if (usuarioSnap.exists()) {
      const coeficiente = usuarioSnap.data().coeficienteConhecimento || 0;
      return coeficiente >= minimo;
    }
    
    return false;
  }
  
  static async verificarSequenciaDias(usuarioId: string, dias: number): Promise<boolean> {
    const usuarioRef = doc(firestore, 'usuarios', usuarioId);
    const usuarioSnap = await getDoc(usuarioRef);
    
    if (usuarioSnap.exists()) {
      const diasAtivos = usuarioSnap.data().diasAtivos || 0;
      return diasAtivos >= dias;
    }
    
    return false;
  }
  
  static async concederBadge(usuarioId: string, badge: Badge): Promise<void> {
    try {
      const badgeRef = doc(firestore, 'usuariosBadges', `${usuarioId}_${badge.id}`);
      await setDoc(badgeRef, {
        usuarioId,
        badgeId: badge.id,
        nome: badge.nome,
        icone: badge.icone,
        descricao: badge.descricao,
        tipo: badge.tipo,
        dataObtencao: serverTimestamp(),
      });
      

    } catch (error) {
      console.error('Erro ao conceder badge:', error);
    }
  }
  
  static async obterTodasBadgesRanking(): Promise<any[]> {
    try {
      const badgesRef = collection(firestore, 'usuariosBadges');
      const q = query(badgesRef, where('tipo', '==', 'ranking'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Erro ao obter badges de ranking:', error);
      return [];
    }
  }
  
  static async obterBadgesUsuario(usuarioId: string): Promise<Badge[]> {
    try {
      const badgesRef = collection(firestore, 'usuariosBadges');
      const q = query(badgesRef, where('usuarioId', '==', usuarioId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          dataObtencao: data.dataObtencao?.toDate() || new Date()
        } as Badge;
      });
    } catch (error) {
      console.error('Erro ao obter badges:', error);
      return [];
    }
  }

  static async concederBadgeRanking(usuarioId: string, badgeId: string): Promise<void> {
    try {
      const jaTemBadge = await this.usuarioTemBadge(usuarioId, badgeId);
      if (!jaTemBadge) {
        const badge = BADGES_DISPONIVEIS.find(b => b.id === badgeId);
        if (badge) {
          await this.concederBadge(usuarioId, badge);
        }
      }
    } catch (error) {
      console.error('Erro ao conceder badge de ranking:', error);
    }
  }
}