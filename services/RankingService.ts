import { collection, query, orderBy, limit, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/FirebaseInit';
import { BadgeService } from './BadgeService';

export interface RankingUsuario {
  uid: string;
  nome: string;
  coeficienteConhecimento: number;
  posicao: number;
  urlFoto?: string;
}

export interface RankingData {
  usuarios: RankingUsuario[];
  ultimaAtualizacao: Date;
}

export class RankingService {
  
  static async obterRanking(): Promise<RankingData> {
    try {
      // Primeiro tenta buscar ranking cached
      const rankingCached = await this.obterRankingCached();
      if (rankingCached && this.rankingEstaAtualizado(rankingCached.ultimaAtualizacao)) {
        return rankingCached;
      }

      // Se não tem cache ou está desatualizado, gera novo ranking
      const novoRanking = await this.gerarNovoRanking();
      await this.salvarRankingCache(novoRanking);
      
      return novoRanking;
    } catch (error) {
      console.error('Erro ao obter ranking:', error);
      return { usuarios: [], ultimaAtualizacao: new Date() };
    }
  }

  static async gerarNovoRanking(): Promise<RankingData> {
    try {
      const usuariosRef = collection(firestore, 'usuarios');
      const q = query(
        usuariosRef, 
        orderBy('coeficienteConhecimento', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const usuarios: RankingUsuario[] = [];
      
      let posicao = 1;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const coeficiente = userData.coeficienteConhecimento;
        
          usuarios.push({
          uid: doc.id,
          nome: userData.nome || 'Usuário Anônimo',
          coeficienteConhecimento: typeof coeficiente === 'number' && !isNaN(coeficiente) ? coeficiente : 0,
          posicao: posicao,
          urlFoto: userData.urlFoto
        });
        
        posicao++;
      });

      // Verificar e conceder badges de ranking
      await this.verificarBadgesRanking(usuarios);

      return {
        usuarios,
        ultimaAtualizacao: new Date()
      };
    } catch (error) {
      console.error('Erro ao gerar ranking:', error);
      return {
        usuarios: [],
        ultimaAtualizacao: new Date()
      };
    }
  }

  static async obterRankingCached(): Promise<RankingData | null> {
    try {
      const rankingRef = doc(firestore, 'sistema', 'ranking');
      const rankingSnap = await getDoc(rankingRef);
      
      if (rankingSnap.exists()) {
        const data = rankingSnap.data();
        const usuarios = (data.usuarios || []).map((usuario: any, index: number) => ({
          ...usuario,
          posicao: index + 1 // Garantir que a posição seja sempre um número válido
        }));
        
        return {
          usuarios,
          ultimaAtualizacao: data.ultimaAtualizacao?.toDate() || new Date()
        };
      }
    } catch (error) {
      console.error('Erro ao buscar ranking cached:', error);
    }
    
    return null;
  }

  static async salvarRankingCache(ranking: RankingData): Promise<void> {
    try {
      const rankingRef = doc(firestore, 'sistema', 'ranking');
      const usuariosLimpos = ranking.usuarios.map(usuario => ({
        uid: usuario.uid || '',
        nome: usuario.nome || 'Usuário Anônimo',
        coeficienteConhecimento: usuario.coeficienteConhecimento || 0,
        posicao: usuario.posicao || 0,
        ...(usuario.urlFoto && { urlFoto: usuario.urlFoto })
      }));
      
      await setDoc(rankingRef, {
        usuarios: usuariosLimpos,
        ultimaAtualizacao: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao salvar ranking cache:', error);
    }
  }

  static rankingEstaAtualizado(ultimaAtualizacao: Date): boolean {
    const agora = new Date();
    const diferencaMinutos = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60);
    return diferencaMinutos < 1.5; // Atualiza a cada 1 minuto e meio
  }

  static async verificarBadgesRanking(usuarios: RankingUsuario[]): Promise<void> {
    try {
      // Obter todas as badges de ranking existentes de uma vez
      const { BadgeService } = await import('./BadgeService');
      const badgesExistentes = await BadgeService.obterTodasBadgesRanking();
      
      for (const usuario of usuarios) {
        // Verificar se já tem as badges antes de conceder
        const badgesUsuario = badgesExistentes.filter(b => b.usuarioId === usuario.uid);
        
        // Badges específicas de posição
        if (usuario.posicao === 1 && !badgesUsuario.find(b => b.badgeId === 'ranking_1')) {
          await BadgeService.concederBadgeRanking(usuario.uid, 'ranking_1');
        }
        if (usuario.posicao === 2 && !badgesUsuario.find(b => b.badgeId === 'ranking_2')) {
          await BadgeService.concederBadgeRanking(usuario.uid, 'ranking_2');
        }
        if (usuario.posicao === 3 && !badgesUsuario.find(b => b.badgeId === 'ranking_3')) {
          await BadgeService.concederBadgeRanking(usuario.uid, 'ranking_3');
        }

        // Badges por faixas
        if (usuario.posicao <= 5 && !badgesUsuario.find(b => b.badgeId === 'ranking_top5')) {
          await BadgeService.concederBadgeRanking(usuario.uid, 'ranking_top5');
        }
        if (usuario.posicao <= 10 && !badgesUsuario.find(b => b.badgeId === 'ranking_top10')) {
          await BadgeService.concederBadgeRanking(usuario.uid, 'ranking_top10');
        }
        if (usuario.posicao <= 20 && !badgesUsuario.find(b => b.badgeId === 'ranking_top20')) {
          await BadgeService.concederBadgeRanking(usuario.uid, 'ranking_top20');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar badges de ranking:', error);
    }
  }

  static obterIconePosicao(posicao: number): string {
    switch (posicao) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${posicao}º`;
    }
  }

  static obterCorPosicao(posicao: number): string {
    switch (posicao) {
      case 1: return '#FFD700'; // Dourado
      case 2: return '#C0C0C0'; // Prata
      case 3: return '#CD7F32'; // Bronze
      default: return '#666666'; // Cinza
    }
  }

  static async forcarAtualizacaoRanking(): Promise<RankingData> {
    const novoRanking = await this.gerarNovoRanking();
    await this.salvarRankingCache(novoRanking);
    return novoRanking;
  }
}