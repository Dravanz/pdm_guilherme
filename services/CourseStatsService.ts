import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase/FirebaseInit';
import { CourseConfig } from '@/config/CourseConfig';

export interface CourseStats {
  cursoId: string;
  titulo: string;
  imageUrl: string;
  usuariosAtivos: number;
  usuariosConcluidos: number;
  totalUsuarios: number;
}

export class CourseStatsService {
  static async obterEstatisticasCursos(): Promise<CourseStats[]> {
    try {
      const courses = CourseConfig.getAllCourses();
      const stats: CourseStats[] = [];

      for (const course of courses) {
        const usuariosQuery = query(
          collection(firestore, 'usuariosCursos'),
          where('cursoId', '==', course.id)
        );
        
        const snapshot = await getDocs(usuariosQuery);
        const usuarios = snapshot.docs.map(doc => doc.data());
        
        const usuariosConcluidos = usuarios.filter(u => u.concluido).length;
        const usuariosAtivos = usuarios.filter(u => !u.concluido).length;
        
        stats.push({
          cursoId: course.id,
          titulo: course.titulo,
          imageUrl: course.imageUrl || '',
          usuariosAtivos,
          usuariosConcluidos,
          totalUsuarios: usuarios.length
        });
      }

      // Ordenar por total de usuários (mais populares primeiro)
      return stats.sort((a, b) => b.totalUsuarios - a.totalUsuarios);
    } catch (error) {
      console.error('Erro ao obter estatísticas dos cursos:', error);
      return [];
    }
  }
}