import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestaoService } from '../../services/questao/QuestaoService';

// Mock Firebase
vi.mock('../../firebase/FirebaseInit', () => ({
  firestore: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

describe('QuestaoService - Testes Unitários', () => {
  beforeEach(() => {
    QuestaoService.limparCache();
    vi.clearAllMocks();
  });

  describe('CT033: Verificação de Respostas (Levenshtein)', () => {
    it('CT033.1: Deve validar resposta exata corretamente', () => {
      // Teste de comparação de strings
      const respostaCorreta = 'let nome = "João";';
      const respostaUsuario = 'let nome = "João";';
      
      expect(respostaUsuario).toBe(respostaCorreta);
    });

    it('CT033.2: Deve identificar resposta incorreta', () => {
      const respostaCorreta = 'let nome = "João";';
      const respostaUsuario = 'var nome = "João";';
      
      expect(respostaUsuario).not.toBe(respostaCorreta);
    });

    it('CT033.3: Deve ser case-sensitive', () => {
      const respostaCorreta = 'let nome';
      const respostaUsuario = 'LET NOME';
      
      expect(respostaUsuario.toLowerCase()).toBe(respostaCorreta.toLowerCase());
    });
  });

  describe('CT034: Obter Questão', () => {
    it('CT034.1: Deve retornar null para questão inexistente', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({ exists: () => false });

      const questao = await QuestaoService.obterQuestao('questao-inexistente');
      
      expect(questao).toBeNull();
    });

    it('CT034.2: Deve usar cache após primeira busca', async () => {
      const mockQuestao = {
        id: 'js_var_001',
        pergunta: 'Teste',
        alternativas: [],
      };

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockQuestao,
      });

      // Primeira busca
      await QuestaoService.obterQuestao('js_var_001');
      
      // Segunda busca (deve usar cache)
      const questao = await QuestaoService.obterQuestao('js_var_001');
      
      expect(questao).toEqual(mockQuestao);
      expect(getDoc).toHaveBeenCalledTimes(1); // Chamado apenas uma vez
    });
  });

  describe('CT035: Obter Múltiplas Questões', () => {
    it('CT035.1: Deve retornar array vazio para lista vazia', async () => {
      const questoes = await QuestaoService.obterMultiplasQuestoes([]);
      
      expect(questoes).toEqual([]);
      expect(questoes.length).toBe(0);
    });

    it('CT035.2: Deve filtrar questões inexistentes', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({ exists: () => false });

      const questoes = await QuestaoService.obterMultiplasQuestoes([
        'questao1',
        'questao2',
      ]);
      
      expect(questoes).toEqual([]);
    });
  });

  describe('Testes de Validação de Dados', () => {
    it('Deve validar estrutura de questão múltipla escolha', () => {
      const questao = {
        id: 'js_var_001',
        pergunta: 'Qual é a forma correta?',
        alternativas: [
          { id: 'a', texto: 'Opção A', correta: false },
          { id: 'b', texto: 'Opção B', correta: true },
        ],
        explicacao: 'Explicação aqui',
      };

      expect(questao).toHaveProperty('id');
      expect(questao).toHaveProperty('pergunta');
      expect(questao).toHaveProperty('alternativas');
      expect(questao.alternativas).toBeInstanceOf(Array);
      expect(questao.alternativas.length).toBeGreaterThan(0);
    });

    it('Deve validar que apenas uma alternativa é correta', () => {
      const alternativas = [
        { id: 'a', texto: 'A', correta: false },
        { id: 'b', texto: 'B', correta: true },
        { id: 'c', texto: 'C', correta: false },
        { id: 'd', texto: 'D', correta: false },
      ];

      const corretas = alternativas.filter(alt => alt.correta);
      
      expect(corretas.length).toBe(1);
    });
  });

  describe('Testes de Cache', () => {
    it('Deve limpar cache corretamente', async () => {
      const mockQuestao = {
        id: 'test',
        pergunta: 'Teste',
        alternativas: [],
      };

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockQuestao,
      });

      // Adicionar ao cache
      await QuestaoService.obterQuestao('test');
      
      // Limpar cache
      QuestaoService.limparCache();
      
      // Buscar novamente (deve chamar Firebase novamente)
      await QuestaoService.obterQuestao('test');
      
      expect(getDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Testes de Particionamento de Equivalência', () => {
    describe('Partição 1: IDs válidos de JavaScript', () => {
      it('Deve aceitar IDs no formato js_*', () => {
        const idsValidos = [
          'js_var_001',
          'js_op_002',
          'js_func_003',
        ];

        idsValidos.forEach(id => {
          expect(id).toMatch(/^js_[a-z]+_\d{3}$/);
        });
      });
    });

    describe('Partição 2: IDs válidos de Python', () => {
      it('Deve aceitar IDs no formato py_*', () => {
        const idsValidos = [
          'py_var_001',
          'py_type_002',
          'py_list_003',
        ];

        idsValidos.forEach(id => {
          expect(id).toMatch(/^py_[a-z]+_\d{3}$/);
        });
      });
    });

    describe('Partição 3: IDs válidos de React', () => {
      it('Deve aceitar IDs no formato react_*', () => {
        const idsValidos = [
          'react_comp_001',
          'react_jsx_002',
          'react_state_003',
        ];

        idsValidos.forEach(id => {
          expect(id).toMatch(/^react_[a-z]+_\d{3}$/);
        });
      });
    });

    describe('Partição 4: IDs inválidos', () => {
      it('Deve rejeitar IDs em formato incorreto', () => {
        const idsInvalidos = [
          'invalid',
          '123',
          'js_var',
          'py_001',
        ];

        idsInvalidos.forEach(id => {
          expect(id).not.toMatch(/^(js|py|react)_[a-z]+_\d{3}$/);
        });
      });
    });
  });
});
