export class DecayService {
  /**
   * Calcula a pontuação com base no número de tentativas.
   * 1ª tentativa: 100%
   * 2ª tentativa: 90%
   * 3ª tentativa: 80%
   * ...
   * Mínimo: 10%
   */
  static calcularPontuacaoComDecaimento(tentativas: number): number {
    if (tentativas <= 1) return 100;
    
    const decaimento = (tentativas - 1) * 10;
    const pontuacao = 100 - decaimento;
    
    return Math.max(pontuacao, 10);
  }

  static async aplicarDecayCoeficiente(uid: string): Promise<void> {
    // Método adicionado para compatibilidade com UserProvider.
    // A lógica de cálculo de decay parece estar duplicada no UserProvider.
    // Mantendo vazio por enquanto para evitar crash.
    return Promise.resolve();
  }
}
