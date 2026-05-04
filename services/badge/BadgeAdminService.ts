import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../../firebase/FirebaseInit";
import { Badge } from "../../model/Badge";

export class BadgeAdminService {
  /**
   * Listar todas as badges do sistema
   */
  static async listarBadges(): Promise<Badge[]> {
    try {
      const badgesRef = collection(firestore, "badges");
      const snapshot = await getDocs(badgesRef);

      const badges = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Badge[];

      // Ordenar localmente
      return badges.sort((a, b) => {
        if (a.tipo !== b.tipo) {
          return a.tipo.localeCompare(b.tipo);
        }
        return a.nome.localeCompare(b.nome);
      });
    } catch (error) {
      console.error("Erro ao listar badges:", error);
      throw error;
    }
  }

  /**
   * Buscar uma badge específica
   */
  static async buscarBadge(badgeId: string): Promise<Badge | null> {
    try {
      const badgeRef = doc(firestore, "badges", badgeId);
      const badgeSnap = await getDoc(badgeRef);

      if (badgeSnap.exists()) {
        return {
          id: badgeSnap.id,
          ...badgeSnap.data(),
        } as Badge;
      }

      return null;
    } catch (error) {
      console.error("Erro ao buscar badge:", error);
      throw error;
    }
  }

  /**
   * Criar nova badge
   */
  static async criarBadge(
    badge: Omit<Badge, "dataObtencao" | "usuarioId">
  ): Promise<string> {
    try {
      // Validar dados obrigatórios
      if (
        !badge.id ||
        !badge.nome ||
        !badge.icone ||
        !badge.descricao ||
        !badge.tipo
      ) {
        throw new Error("Todos os campos obrigatórios devem ser preenchidos");
      }

      // Validar tipo
      const tiposValidos = ["curso", "conquista", "especial", "ranking"];
      if (!tiposValidos.includes(badge.tipo)) {
        throw new Error(
          `Tipo de badge inválido. Use: ${tiposValidos.join(", ")}`
        );
      }

      // Verificar se já existe badge com mesmo ID
      const badgeExistente = await this.buscarBadge(badge.id);
      if (badgeExistente) {
        throw new Error("Já existe uma badge com este ID");
      }

      const badgeRef = doc(firestore, "badges", badge.id);
      await setDoc(badgeRef, {
        nome: badge.nome,
        icone: badge.icone,
        descricao: badge.descricao,
        tipo: badge.tipo,
        requisitos: badge.requisitos,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return badge.id;
    } catch (error) {
      console.error("Erro ao criar badge:", error);
      throw error;
    }
  }

  /**
   * Atualizar badge existente e propagar alterações para perfis de usuários
   */
  static async atualizarBadge(
    badgeId: string,
    dadosAtualizados: Partial<Omit<Badge, "id" | "dataObtencao" | "usuarioId">>
  ): Promise<void> {
    try {
      const badgeRef = doc(firestore, "badges", badgeId);
      const badgeSnap = await getDoc(badgeRef);

      if (!badgeSnap.exists()) {
        throw new Error("Badge não encontrada");
      }

      await updateDoc(badgeRef, {
        ...dadosAtualizados,
        updatedAt: serverTimestamp(),
      });

      // Propagar alterações para todos os usuários que possuem esta badge
      const usuariosBadgesRef = collection(firestore, "usuariosBadges");
      const snapshot = await getDocs(query(usuariosBadgesRef));
      const docsUsuario = snapshot.docs.filter((d) => d.id.endsWith(`_${badgeId}`));

      const camposPropagaveis: Partial<Record<string, any>> = {};
      if (dadosAtualizados.nome !== undefined) camposPropagaveis.nome = dadosAtualizados.nome;
      if (dadosAtualizados.icone !== undefined) camposPropagaveis.icone = dadosAtualizados.icone;
      if (dadosAtualizados.descricao !== undefined) camposPropagaveis.descricao = dadosAtualizados.descricao;
      if (dadosAtualizados.tipo !== undefined) camposPropagaveis.tipo = dadosAtualizados.tipo;

      if (Object.keys(camposPropagaveis).length > 0) {
        await Promise.all(
          docsUsuario.map((d) => updateDoc(d.ref, camposPropagaveis))
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar badge:", error);
      throw error;
    }
  }

  /**
   * Excluir badge e remover dos perfis de todos os usuários que a possuem
   */
  static async excluirBadge(badgeId: string): Promise<void> {
    try {
      const badgeRef = doc(firestore, "badges", badgeId);
      const badgeSnap = await getDoc(badgeRef);

      if (!badgeSnap.exists()) {
        throw new Error("Badge não encontrada");
      }

      // Remover badge de todos os usuários que a possuem
      const usuariosBadgesRef = collection(firestore, "usuariosBadges");
      const snapshot = await getDocs(query(usuariosBadgesRef));
      const docsUsuario = snapshot.docs.filter((d) => d.id.endsWith(`_${badgeId}`));

      await Promise.all(docsUsuario.map((d) => deleteDoc(d.ref)));

      await deleteDoc(badgeRef);
    } catch (error) {
      console.error("Erro ao excluir badge:", error);
      throw error;
    }
  }

  /**
   * Validar ID da badge (apenas letras, números, underscore e hífen)
   */
  static validarIdBadge(id: string): boolean {
    const regex = /^[a-z0-9_-]+$/;
    return regex.test(id);
  }

  /**
   * Gerar ID sugerido baseado no nome
   */
  static gerarIdSugerido(nome: string): string {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, "_") // Substitui espaços por underscore
      .replace(/-+/g, "_") // Substitui hífens por underscore
      .replace(/_+/g, "_") // Remove underscores duplicados
      .replace(/^_|_$/g, ""); // Remove underscores do início e fim
  }
}
