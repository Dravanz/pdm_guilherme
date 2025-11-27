import { collection, getDocs, query, where } from "firebase/firestore";
import { CourseConfig } from "../../config/CourseConfig";
import { firestore } from "../../firebase/FirebaseInit";
import { UsuarioCurso } from "../../model/Curso";

export interface DashboardData {
  estatisticas: {
    cursosAtivos: number;
    cursosCompletos: number;
    totalQuestoes: number;
    questoesCorretas: number;
    questoesErradas: number;
    coeficienteGeral: number;
  };
  noticias: {
    id: string;
    titulo: string;
    descricao: string;
    imagem: string;
    data: Date;
  }[];
  cursosDestaque: {
    id: string;
    titulo: string;
    categoria: string;
    nivel: string;
    imagem: string;
    descricao: string;
  }[];
}

export class DashboardService {
  static async obterDadosDashboard(usuarioId: string): Promise<DashboardData> {
    try {
      const [estatisticas, noticias, cursosDestaque] = await Promise.all([
        this.obterEstatisticasUsuario(usuarioId),
        this.obterNoticias(),
        this.obterCursosDestaque(),
      ]);

      return {
        estatisticas,
        noticias,
        cursosDestaque,
      };
    } catch (error) {
      console.error("Erro ao obter dados da dashboard:", error);
      return this.obterDadosOffline();
    }
  }

  static async obterEstatisticasUsuario(usuarioId: string) {
    try {
      const usuariosCursosRef = collection(firestore, "usuariosCursos");
      const q = query(usuariosCursosRef, where("usuarioId", "==", usuarioId));
      const querySnapshot = await getDocs(q);

      let cursosAtivos = 0;
      let cursosCompletos = 0;
      let totalQuestoes = 0;
      let questoesCorretas = 0;
      let questoesErradas = 0;

      querySnapshot.forEach((doc) => {
        const usuarioCurso = doc.data() as UsuarioCurso;

        if (usuarioCurso.concluido) {
          cursosCompletos++;
        } else {
          cursosAtivos++;
        }

        totalQuestoes += usuarioCurso.questoesRespondidas.length;
        questoesCorretas += usuarioCurso.questoesCorretas.length;
        questoesErradas += usuarioCurso.questoesErradas?.length || 0;
      });

      const coeficienteGeral =
        totalQuestoes > 0
          ? Math.round((questoesCorretas / totalQuestoes) * 100)
          : 0;

      return {
        cursosAtivos,
        cursosCompletos,
        totalQuestoes,
        questoesCorretas,
        questoesErradas,
        coeficienteGeral,
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      return {
        cursosAtivos: 0,
        cursosCompletos: 0,
        totalQuestoes: 0,
        questoesCorretas: 0,
        questoesErradas: 0,
        coeficienteGeral: 0,
      };
    }
  }

  static async obterNoticias() {
    // Dados mockados para noticias
    return [
      {
        id: "1",
        titulo: "Novo Curso de TypeScript Disponível!",
        descricao:
          "Aprenda TypeScript do básico ao avançado com nosso novo curso.",
        imagem:
          "https://via.placeholder.com/300x150/007acc/ffffff?text=TypeScript",
        data: new Date(),
      },
      {
        id: "2",
        titulo: "Atualização da Plataforma",
        descricao: "Melhorias na interface e novos recursos foram adicionados.",
        imagem: "https://via.placeholder.com/300x150/28a745/ffffff?text=Update",
        data: new Date(Date.now() - 86400000), // 1 dia atrás
      },
    ];
  }

  static async obterCursosDestaque() {
    const courses = CourseConfig.getAllCourses();
    return courses.map((course) => ({
      id: course.id,
      titulo: course.titulo,
      categoria:
        course.categoria.charAt(0).toUpperCase() + course.categoria.slice(1),
      nivel: course.nivel.charAt(0).toUpperCase() + course.nivel.slice(1),
      imagem: `https://via.placeholder.com/200x120/${course.color.replace(
        "#",
        ""
      )}/ffffff?text=${course.icon}`,
      descricao: course.description,
    }));
  }

  static obterDadosOffline(): DashboardData {
    return {
      estatisticas: {
        cursosAtivos: 0,
        cursosCompletos: 0,
        totalQuestoes: 0,
        questoesCorretas: 0,
        questoesErradas: 0,
        coeficienteGeral: 0,
      },
      noticias: [],
      cursosDestaque: [],
    };
  }

  static iniciarAtualizacaoRanking() {
    // Atualiza ranking a cada 1 minuto e meio
    setInterval(async () => {
      try {
        const { RankingService } = await import("./RankingService");
        await RankingService.forcarAtualizacaoRanking();
      } catch (error) {
        console.error("Erro na atualização automática do ranking:", error);
      }
    }, 1.5 * 60 * 1000); // 1 minuto e meio
  }
}
