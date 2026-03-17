import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
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

      // Iterar e validar cada curso
      for (const docSnapshot of querySnapshot.docs) {
        const usuarioCurso = docSnapshot.data() as UsuarioCurso;
        const cursoId = usuarioCurso.cursoId;
        let isValid = false;

        const isHardcoded = ["javascript-basico", "python-basico", "react-basico"].includes(cursoId);

        if (isHardcoded) {
            isValid = true;
        } else {
             try {
                const cursoRef = doc(firestore, "cursos", cursoId);
                const cursoSnap = await getDoc(cursoRef);
                if (cursoSnap.exists()) {
                    // Opcional: filtrar apenas aprovados? O dashboard deve mostrar cursos em progresso mesmo que não aprovados?
                    // Geralmente Dashboard pessoal mostra tudo que o usuário está fazendo.
                    // MAS se o problema é "ghost records" de cursos deletados, o check de .exists() já resolve.
                    // Se o usuário quer que cursos não aprovados não contem pro progresso GERAL, ok.
                    // Mas listar "Em Progresso: 3" faz sentido se ele está fazendo 3.
                    // Vou assumir que se o curso EXISTE, ele conta para o dashboard PESSOAL.
                    isValid = true;
                } else {
                    // Curso deletado!
                    // console.warn(`Found orphan progress for course ${cursoId}, ignoring.`);
                    // Opcional: auto-delete
                    // await deleteDoc(docSnapshot.ref); 
                }
             } catch (e) {
                 console.warn("Error checking course existence", e);
             }
        }

        if (isValid) {
            if (usuarioCurso.concluido) {
                cursosCompletos++;
            } else {
                cursosAtivos++;
            }

            totalQuestoes += usuarioCurso.questoesRespondidas.length;
            questoesCorretas += usuarioCurso.questoesCorretas.length;
            questoesErradas += usuarioCurso.questoesErradas?.length || 0;
        }
      }

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
