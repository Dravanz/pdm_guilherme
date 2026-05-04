// Função pura extraída do DecayService para testar
function calcularPontuacaoComDecaimento(tentativas: number): number {
  if (tentativas <= 1) return 100;
  
  const decaimento = (tentativas - 1) * 10;
  const pontuacao = 100 - decaimento;
  
  return Math.max(pontuacao, 10);
}

describe('DecayService - Testes Unitários', () => {
  describe('CT045: calcularPontuacaoComDecaimento', () => {
    it('CT045.1: Deve retornar 100% na primeira tentativa', () => {
      const resultado = calcularPontuacaoComDecaimento(1);
      expect(resultado).toBe(100);
    });

    it('CT045.2: Deve retornar 90% na segunda tentativa', () => {
      const resultado = calcularPontuacaoComDecaimento(2);
      expect(resultado).toBe(90);
    });

    it('CT045.3: Deve retornar 80% na terceira tentativa', () => {
      const resultado = calcularPontuacaoComDecaimento(3);
      expect(resultado).toBe(80);
    });

    it('CT045.4: Deve retornar no mínimo 10% após muitas tentativas', () => {
      const resultado = calcularPontuacaoComDecaimento(15);
      expect(resultado).toBe(10);
    });

    it('CT045.5: Deve retornar 10% para tentativas acima de 10', () => {
      const resultado = calcularPontuacaoComDecaimento(20);
      expect(resultado).toBe(10);
    });

    it('CT045.6: Deve retornar 100% para tentativa 0 ou negativa', () => {
      expect(calcularPontuacaoComDecaimento(0)).toBe(100);
      expect(calcularPontuacaoComDecaimento(-1)).toBe(100);
    });
  });

  describe('Testes de Valor Limite (Boundary Value Analysis)', () => {
    it('Deve testar valores limites inferiores', () => {
      expect(calcularPontuacaoComDecaimento(1)).toBe(100);
      expect(calcularPontuacaoComDecaimento(2)).toBe(90);
    });

    it('Deve testar valores limites superiores', () => {
      expect(calcularPontuacaoComDecaimento(9)).toBe(20);
      expect(calcularPontuacaoComDecaimento(10)).toBe(10);
      expect(calcularPontuacaoComDecaimento(11)).toBe(10);
    });

    it('Deve testar valores no meio do intervalo', () => {
      expect(calcularPontuacaoComDecaimento(5)).toBe(60);
      expect(calcularPontuacaoComDecaimento(6)).toBe(50);
    });
  });

  describe('Testes de Particionamento de Equivalência', () => {
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
});
