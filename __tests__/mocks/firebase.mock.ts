// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
};

// Mock Firestore
export const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      onSnapshot: jest.fn(),
    })),
    where: jest.fn(() => ({
      get: jest.fn(),
      onSnapshot: jest.fn(),
    })),
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
    add: jest.fn(),
    get: jest.fn(),
  })),
  runTransaction: jest.fn(),
};

// Mock Storage
export const mockStorage = {
  ref: jest.fn(() => ({
    put: jest.fn(),
    getDownloadURL: jest.fn(),
    delete: jest.fn(),
  })),
};

// Mock User Data
export const mockUserData = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  perfil: 'aluno',
  coeficiente: 50,
  streak: 5,
  lastLogin: new Date().toISOString(),
};

// Mock Course Data
export const mockCourseData = {
  id: 'curso-test-123',
  titulo: 'Python Básico',
  descricao: 'Curso de Python para iniciantes',
  linguagem: 'python',
  nivel: 'iniciante',
  conteudo: '<curso><secao><titulo>Introdução</titulo></secao></curso>',
  ativo: true,
};

// Mock Question Data
export const mockQuestionData = {
  id: 'questao-test-123',
  tipo: 'multipla_escolha',
  enunciado: 'Qual é a saída do código?',
  opcoes: ['A', 'B', 'C', 'D'],
  respostaCorreta: 'A',
  pontos: 10,
};
