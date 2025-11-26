export interface CourseDefinition {
  id: string;
  titulo: string;
  categoria: string;
  nivel: string;
  questionsCount: number;
  icon: string;
  color: string;
  description: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export class CourseConfig {
  private static courses: CourseDefinition[] = [
    {
      id: 'javascript-basico',
      titulo: 'JavaScript Básico',
      categoria: 'programacao',
      nivel: 'iniciante',
      questionsCount: 16,
      icon: '🟨',
      color: '#f7df1e',
      description: 'Aprenda os fundamentos do JavaScript',
      imageUrl: 'js-cover',
      thumbnailUrl: 'https://via.placeholder.com/150x100/f7df1e/000000?text=JS'
    },
    {
      id: 'python-basico',
      titulo: 'Python Básico',
      categoria: 'programacao',
      nivel: 'iniciante',
      questionsCount: 16,
      icon: '🐍',
      color: '#3776ab',
      description: 'Domine os conceitos básicos do Python',
      imageUrl: 'py-cover',
      thumbnailUrl: 'https://via.placeholder.com/150x100/3776ab/ffffff?text=PY'
    },
    {
      id: 'react-basico',
      titulo: 'React Básico',
      categoria: 'frontend',
      nivel: 'intermediario',
      questionsCount: 16,
      icon: '⚛️',
      color: '#61dafb',
      description: 'Construa interfaces com React',
      imageUrl: 'rx-cover',
      thumbnailUrl: 'https://via.placeholder.com/150x100/61dafb/000000?text=RX'
    }
  ];

  static getAllCourses(): CourseDefinition[] {
    return [...this.courses];
  }

  static getCourseById(id: string): CourseDefinition | undefined {
    return this.courses.find(course => course.id === id);
  }

  static getTotalQuestions(): number {
    return this.courses.reduce((total, course) => total + course.questionsCount, 0);
  }

  static getCourseIds(): string[] {
    return this.courses.map(course => course.id);
  }

  static getCoursesByCategory(categoria: string): CourseDefinition[] {
    return this.courses.filter(course => course.categoria === categoria);
  }

  static getCategories(): string[] {
    return [...new Set(this.courses.map(course => course.categoria))];
  }

  static addCourse(course: CourseDefinition): void {
    this.courses.push(course);
  }

  static removeCourse(courseId: string): void {
    this.courses = this.courses.filter(course => course.id !== courseId);
  }
}