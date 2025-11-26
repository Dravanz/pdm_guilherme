import { CourseConfig } from '@/config/CourseConfig';

interface ContentPage {
  id: string;
  titulo: string;
  tipo: 'conteudo' | 'exercicio' | 'curso';
  imagem?: string;
  courseId: string;
  courseName: string;
}

export class CourseContentService {
  static async getAllContentPages(): Promise<ContentPage[]> {
    const courses = CourseConfig.getAllCourses();
    const allPages: ContentPage[] = [];

    // Adicionar capas dos cursos
    for (const course of courses) {
      allPages.push({
        id: 'cover',
        titulo: `Capa do Curso: ${course.titulo}`,
        tipo: 'curso',
        imagem: course.imageUrl,
        courseId: course.id,
        courseName: course.titulo
      });
    }

    // Dados estáticos baseados nos XMLs existentes
    const staticPages = [
      { courseId: 'javascript-basico', id: '1', titulo: '📚 Introdução ao JavaScript', imagem: 'js1-intro' },
      { courseId: 'javascript-basico', id: '2', titulo: '🔧 Variáveis e Operadores', imagem: 'js2-variables' },
      { courseId: 'javascript-basico', id: '4', titulo: '⚡ Funções em JavaScript', imagem: 'js4-functions' },
      { courseId: 'javascript-basico', id: '6', titulo: '🔄 Arrays e Loops', imagem: 'js6-arrays' },
      { courseId: 'javascript-basico', id: '8', titulo: '🎯 Objetos e Métodos', imagem: 'js8-objects' },
      
      { courseId: 'python-basico', id: '1', titulo: '🐍 Introdução ao Python', imagem: 'py1-intro' },
      { courseId: 'python-basico', id: '2', titulo: '📊 Variáveis e Tipos', imagem: 'py2-variables' },
      { courseId: 'python-basico', id: '4', titulo: '🔧 Funções em Python', imagem: 'py4-functions' },
      { courseId: 'python-basico', id: '6', titulo: '📋 Listas e Loops', imagem: 'py6-lists' },
      { courseId: 'python-basico', id: '8', titulo: '📚 Dicionários e Classes', imagem: 'py8-classes' },
      
      { courseId: 'react-basico', id: '1', titulo: '⚛️ Introdução ao React', imagem: 'rx1-intro' },
      { courseId: 'react-basico', id: '2', titulo: '🧩 Componentes', imagem: 'rx2-components' },
      { courseId: 'react-basico', id: '4', titulo: '🔄 Estado e Props', imagem: 'rx4-state' },
      { courseId: 'react-basico', id: '6', titulo: '🎣 Hooks', imagem: 'rx6-hooks' },
      { courseId: 'react-basico', id: '8', titulo: '🌐 Roteamento', imagem: 'rx8-routing' }
    ];

    for (const page of staticPages) {
      const course = courses.find(c => c.id === page.courseId);
      if (course) {
        allPages.push({
          id: page.id,
          titulo: page.titulo,
          tipo: 'conteudo',
          imagem: page.imagem,
          courseId: page.courseId,
          courseName: course.titulo
        });
      }
    }

    return allPages;
  }
}