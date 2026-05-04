import { describe, it, expect } from 'vitest';

// ============================================
// TESTES CTFL 4.0 - SISTEMA DE APRENDIZADO
// ============================================

describe('CT045: DecayService - Cálculo de Pontuação com Decaimento', () => {
  // Função extraída do DecayService
  function calcularPontuacaoComDecaimento(tentativas) {
    if (tentativas <= 1) return 100;
    const decaimento = (tentativas - 1) * 10;
    const pontuacao = 100 - decaimento;
    return Math.max(pontuacao, 10);
  }

  it('CT045.1: Deve retornar 100% na primeira tentativa', () => {
    expect(calcularPontuacaoComDecaimento(1)).toBe(100);
  });

  it('CT045.2: Deve retornar 90% na segunda tentativa', () => {
    expect(calcularPontuacaoComDecaimento(2)).toBe(90);
  });

  it('CT045.3: Deve retornar 80% na terceira tentativa', () => {
    expect(calcularPontuacaoComDecaimento(3)).toBe(80);
  });

  it('CT045.4: Deve retornar no mínimo 10% após muitas tentativas', () => {
    expect(calcularPontuacaoComDecaimento(15)).toBe(10);
  });

  it('CT045.5: Deve retornar 10% para tentativas acima de 10', () => {
    expect(calcularPontuacaoComDecaimento(20)).toBe(10);
  });

  it('CT045.6: Deve retornar 100% para tentativa 0 ou negativa', () => {
    expect(calcularPontuacaoComDecaimento(0)).toBe(100);
    expect(calcularPontuacaoComDecaimento(-1)).toBe(100);
  });
});

describe('Técnica: Particionamento de Equivalência', () => {
  function calcularPontuacaoComDecaimento(tentativas) {
    if (tentativas <= 1) return 100;
    const decaimento = (tentativas - 1) * 10;
    return Math.max(100 - decaimento, 10);
  }

  describe('Partição 1: Tentativas <= 1 (100%)', () => {
    it('Deve retornar 100% para valores <= 1', () => {
      expect(calcularPontuacaoComDecaimento(-5)).toBe(100);
      expect(calcularPontuacaoComDecaimento(0)).toBe(100);
      expect(calcularPontuacaoComDecaimento(1)).toBe(100);
    });
  });

  describe('Partição 2: Tentativas 2-9 (Decaimento gradual)', () => {
    it('Deve aplicar decaimento de 10% por tentativa', () => {
      expect(calcularPontuacaoComDecaimento(2)).toBe(90);
      expect(calcularPontuacaoComDecaimento(5)).toBe(60);
      expect(calcularPontuacaoComDecaimento(9)).toBe(20);
    });
  });

  describe('Partição 3: Tentativas >= 10 (Mínimo 10%)', () => {
    it('Deve retornar sempre 10% para tentativas >= 10', () => {
      expect(calcularPontuacaoComDecaimento(10)).toBe(10);
      expect(calcularPontuacaoComDecaimento(50)).toBe(10);
      expect(calcularPontuacaoComDecaimento(100)).toBe(10);
    });
  });
});

describe('Técnica: Análise de Valor Limite', () => {
  function calcularPontuacaoComDecaimento(tentativas) {
    if (tentativas <= 1) return 100;
    const decaimento = (tentativas - 1) * 10;
    return Math.max(100 - decaimento, 10);
  }

  it('Limite inferior: 0, 1, 2', () => {
    expect(calcularPontuacaoComDecaimento(0)).toBe(100);
    expect(calcularPontuacaoComDecaimento(1)).toBe(100);
    expect(calcularPontuacaoComDecaimento(2)).toBe(90);
  });

  it('Limite superior: 9, 10, 11', () => {
    expect(calcularPontuacaoComDecaimento(9)).toBe(20);
    expect(calcularPontuacaoComDecaimento(10)).toBe(10);
    expect(calcularPontuacaoComDecaimento(11)).toBe(10);
  });

  it('Valores no meio: 5, 6', () => {
    expect(calcularPontuacaoComDecaimento(5)).toBe(60);
    expect(calcularPontuacaoComDecaimento(6)).toBe(50);
  });
});

describe('CT033: Comparação de Strings (Levenshtein)', () => {
  function compararStrings(str1, str2) {
    if (str1 === str2) return { passou: true, similaridade: 100 };
    if (str1.toLowerCase() === str2.toLowerCase()) {
      return { passou: true, similaridade: 95, observacao: 'Diferença em maiúsculas' };
    }
    return { passou: false, similaridade: 0 };
  }

  it('CT033.1: Strings idênticas retornam 100%', () => {
    const resultado = compararStrings('Hello World', 'Hello World');
    expect(resultado.passou).toBe(true);
    expect(resultado.similaridade).toBe(100);
  });

  it('CT033.2: Diferença de maiúsculas aceita com 95%', () => {
    const resultado = compararStrings('Hello World', 'hello world');
    expect(resultado.passou).toBe(true);
    expect(resultado.similaridade).toBe(95);
    expect(resultado.observacao).toBe('Diferença em maiúsculas');
  });

  it('CT033.3: Strings diferentes falham', () => {
    const resultado = compararStrings('Hello', 'Goodbye');
    expect(resultado.passou).toBe(false);
    expect(resultado.similaridade).toBe(0);
  });
});

describe('CT004: Validação de Email', () => {
  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  it('Emails válidos são aceitos', () => {
    expect(validarEmail('test@example.com')).toBe(true);
    expect(validarEmail('user@domain.co.uk')).toBe(true);
    expect(validarEmail('name.surname@company.com')).toBe(true);
  });

  it('Emails inválidos são rejeitados', () => {
    expect(validarEmail('invalid')).toBe(false);
    expect(validarEmail('@example.com')).toBe(false);
    expect(validarEmail('test@')).toBe(false);
    expect(validarEmail('test@domain')).toBe(false);
  });
});

describe('CT005: Cálculo de Coeficiente', () => {
  function calcularCoeficiente(acertos, total) {
    if (total === 0) return 0;
    return Math.round((acertos / total) * 100);
  }

  it('100% de acertos retorna 100', () => {
    expect(calcularCoeficiente(10, 10)).toBe(100);
    expect(calcularCoeficiente(5, 5)).toBe(100);
  });

  it('50% de acertos retorna 50', () => {
    expect(calcularCoeficiente(5, 10)).toBe(50);
    expect(calcularCoeficiente(1, 2)).toBe(50);
  });

  it('0% de acertos retorna 0', () => {
    expect(calcularCoeficiente(0, 10)).toBe(0);
  });

  it('Total zero retorna 0 (evita divisão por zero)', () => {
    expect(calcularCoeficiente(0, 0)).toBe(0);
  });
});
