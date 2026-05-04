/**
 * JobeService - Integração com Jobe API para execução de código
 *
 * O Jobe (Job Engine) é um sandbox de execução de código que recebe código-fonte,
 * compila (se necessário), executa em ambiente isolado e retorna stdout/stderr.
 *
 * Endpoint: configurado via .env (prioridade) ou app.json (fallback)
 * Pode ser substituído pelo servidor do professor via setConfig().
 *
 * Fluxo: App → JobeService → Jobe API → Resultado → Compara com gabarito
 */

import { Config } from "../../config/Config";
import { CasoTeste, LinguagemCodigo } from "../../model/Curso";

// ============ CONFIG ============

interface JobeConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number; // ms
}

let jobeConfig: JobeConfig = {
  baseUrl: Config.jobe.active.baseUrl,
  apiKey: Config.jobe.active.apiKey,
  timeout: Config.jobe.active.timeout,
};

// Estado do fallback
let fallbackAtivo = false;
let ultimaTentativaPrimario = 0;
const INTERVALO_RETRY_PRIMARIO = 5 * 60 * 1000; // 5 minutos

// ============ TIPOS DO JOBE API ============

/**
 * Outcome codes retornados pelo Jobe
 * @see https://github.com/trampgeek/jobe
 */
export enum JobeOutcome {
  SUCCESS = 15,
  COMPILE_ERROR = 11,
  RUNTIME_ERROR = 12,
  TIME_LIMIT = 13,
  MEMORY_LIMIT = 17,
  ILLEGAL_SYSCALL = 19,
  INTERNAL_ERROR = 20,
  SERVER_OVERLOAD = 21,
}

interface JobeRunSpec {
  language_id: string;
  sourcecode: string;
  sourcefilename?: string;
  input?: string;
  parameters?: {
    cputime?: number;
    memorylimit?: number;
    disklimit?: number;
    streamsize?: number;
    numprocs?: number;
  };
}

interface JobeRequest {
  run_spec: JobeRunSpec;
}

interface JobeResponse {
  outcome: number;
  cmpinfo: string; // info de compilação (erros)
  stdout: string; // saída padrão do programa
  stderr: string; // saída de erro
}

// ============ RESULTADO PARA O APP ============

export interface ResultadoCasoTeste {
  casoTesteId: string;
  descricao?: string;
  passou: boolean;
  saidaEsperada: string;
  saidaObtida: string;
  entrada: string;
  similaridade?: number; // 0-100 percentual de similaridade
  observacao?: string; // nota sobre matching (ex: "diferença de maiúsculas")
}

export interface ResultadoExecucao {
  sucesso: boolean; // todos os testes passaram?
  outcome: number; // código de outcome do Jobe
  outcomeTexto: string; // descrição legível
  stdout: string; // saída do último teste
  stderr: string; // erro do último teste
  cmpinfo: string; // info de compilação
  casosTeste: ResultadoCasoTeste[];
  tempoExecucao?: number; // ms
}

// ============ MAPEAMENTOS ============

/**
 * Mapeia nossas linguagens para os IDs do Jobe e extensões de arquivo
 */
const LINGUAGEM_MAP: Record<
  LinguagemCodigo,
  { jobeId: string; extensao: string }
> = {
  python3: { jobeId: "python3", extensao: "py" },
  nodejs: { jobeId: "nodejs", extensao: "js" },
  c: { jobeId: "c", extensao: "c" },
};

/**
 * Limites de recursos por linguagem
 */
const LIMITES_LINGUAGEM: Record<LinguagemCodigo, JobeRunSpec["parameters"]> = {
  python3: { cputime: 10, memorylimit: 400, disklimit: 20, numprocs: 20 },
  nodejs: { cputime: 10, memorylimit: 300, disklimit: 20, numprocs: 20 },
  c: { cputime: 5, memorylimit: 200, disklimit: 20, numprocs: 10 },
};

// ============ SERVICE ============

export class JobeService {
  /**
   * Atualiza configuração para usar servidor específico
   */
  private static atualizarConfig(serverType: 'primary' | 'fallback') {
    const server = Config.jobe[serverType];
    jobeConfig = {
      baseUrl: server.baseUrl,
      apiKey: server.apiKey,
      timeout: server.timeout,
    };
    Config.setActiveJobeServer(serverType);
  }

  /**
   * Tenta usar servidor primário se passou tempo suficiente desde última falha
   */
  private static async tentarVoltarParaPrimario(): Promise<boolean> {
    if (!fallbackAtivo) return true;
    
    const agora = Date.now();
    if (agora - ultimaTentativaPrimario < INTERVALO_RETRY_PRIMARIO) {
      return false; // Ainda não é hora de tentar
    }
    
    console.log('[JobeService] Tentando reconectar ao servidor primário...');
    this.atualizarConfig('primary');
    
    const conectou = await this.verificarConexao();
    if (conectou) {
      console.log('[JobeService] ✅ Reconectado ao servidor primário!');
      fallbackAtivo = false;
      return true;
    } else {
      console.log('[JobeService] ❌ Servidor primário ainda indisponível');
      ultimaTentativaPrimario = agora;
      this.atualizarConfig('fallback');
      return false;
    }
  }

  /**
   * Executa operação com fallback automático
   */
  private static async executarComFallback<T>(
    operacao: () => Promise<T>,
    nomeOperacao: string
  ): Promise<T> {
    // Tentar voltar ao primário se possível
    await this.tentarVoltarParaPrimario();
    
    try {
      const resultado = await operacao();
      return resultado;
    } catch (error: any) {
      // Se já estamos no fallback, não tenta novamente
      if (fallbackAtivo) {
        console.error(`[JobeService] Erro no servidor fallback (${nomeOperacao}):`, error.message);
        throw error;
      }
      
      console.warn(`[JobeService] Falha no servidor primário (${nomeOperacao}):`, error.message);
      console.log('[JobeService] 🔄 Tentando servidor fallback...');
      
      // Ativar fallback
      fallbackAtivo = true;
      ultimaTentativaPrimario = Date.now();
      this.atualizarConfig('fallback');
      
      try {
        const resultado = await operacao();
        console.log(`[JobeService] ✅ Sucesso no servidor fallback (${nomeOperacao})`);
        return resultado;
      } catch (fallbackError: any) {
        console.error(`[JobeService] ❌ Falha também no servidor fallback (${nomeOperacao}):`, fallbackError.message);
        throw new Error(`Ambos servidores falharam. Primário: ${error.message}. Fallback: ${fallbackError.message}`);
      }
    }
  }
  /**
   * Retorna status dos servidores
   */
  static getServerStatus() {
    return {
      fallbackAtivo,
      servidorAtivo: fallbackAtivo ? 'fallback' : 'primary',
      proximaTentativaPrimario: fallbackAtivo ? new Date(ultimaTentativaPrimario + INTERVALO_RETRY_PRIMARIO) : null,
      servidores: {
        primary: Config.jobe.primary,
        fallback: Config.jobe.fallback,
      },
    };
  }

  /**
   * Força tentativa de reconexão ao servidor primário
   */
  static async forcarReconexaoPrimario(): Promise<boolean> {
    ultimaTentativaPrimario = 0; // Reset timer
    return await this.tentarVoltarParaPrimario();
  }

  /**
   * Configura URL e API key do servidor Jobe (método legado)
   */
  static setConfig(config: Partial<JobeConfig>) {
    jobeConfig = { ...jobeConfig, ...config };
    console.log("[JobeService] Configuração manual atualizada:", {
      baseUrl: jobeConfig.baseUrl,
      hasApiKey: !!jobeConfig.apiKey,
      timeout: jobeConfig.timeout,
    });
  }

  static getConfig(): JobeConfig {
    return { ...jobeConfig };
  }

  /**
   * Exibe a configuração atual (para debug)
   */
  static logCurrentConfig() {
    const status = this.getServerStatus();
    console.log("[JobeService] Status atual:", {
      servidorAtivo: status.servidorAtivo,
      fallbackAtivo: status.fallbackAtivo,
      config: {
        baseUrl: jobeConfig.baseUrl,
        apiKey: jobeConfig.apiKey ? `${jobeConfig.apiKey.substring(0, 8)}...` : "não definida",
        timeout: jobeConfig.timeout,
      },
      proximaTentativa: status.proximaTentativaPrimario,
    });
  }
  /**
   * Verifica se o servidor Jobe está acessível
   */
  static async verificarConexao(): Promise<boolean> {
    return this.executarComFallback(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${jobeConfig.baseUrl}index.php/restapi/languages`,
        {
          method: "GET",
          headers: buildHeaders(),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return true;
    }, 'verificarConexao');
  }

  /**
   * Lista linguagens suportadas pelo servidor Jobe
   */
  /**
   * Lista linguagens suportadas pelo servidor Jobe
   */
  static async listarLinguagens(): Promise<string[][]> {
    return this.executarComFallback(async () => {
      const response = await fetch(
        `${jobeConfig.baseUrl}index.php/restapi/languages`,
        {
          method: "GET",
          headers: buildHeaders(),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    }, 'listarLinguagens');
  }

  /**
   * Executa código no Jobe e retorna o resultado bruto
   */
  /**
   * Executa código no Jobe e retorna o resultado bruto
   */
  static async executarCodigo(
    linguagem: LinguagemCodigo,
    codigoFonte: string,
    stdin: string = "",
  ): Promise<JobeResponse> {
    const langConfig = LINGUAGEM_MAP[linguagem];
    if (!langConfig) {
      throw new Error(`Linguagem não suportada: ${linguagem}`);
    }

    // Normalizar aspas tipográficas do teclado mobile antes de enviar ao Jobe
    const codigoNormalizado = normalizarCodigo(codigoFonte);

    const request: JobeRequest = {
      run_spec: {
        language_id: langConfig.jobeId,
        sourcecode: codigoNormalizado,
        sourcefilename: `programa.${langConfig.extensao}`,
        input: stdin,
        parameters: LIMITES_LINGUAGEM[linguagem],
      },
    };

    return this.executarComFallback(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        jobeConfig.timeout,
      );

      const response = await fetch(
        `${jobeConfig.baseUrl}index.php/restapi/runs`,
        {
          method: "POST",
          headers: {
            ...buildHeaders(),
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`Jobe API HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    }, 'executarCodigo').catch((error: any) => {
      if (error.name === "AbortError") {
        return {
          outcome: JobeOutcome.TIME_LIMIT,
          cmpinfo: "",
          stdout: "",
          stderr: "Tempo limite de conexão excedido",
        };
      }
      throw error;
    });
  }

  /**
   * Executa código contra múltiplos casos de teste e retorna o resultado completo
   * Este é o método principal para exercícios de código
   */
  static async executarComTestes(
    linguagem: LinguagemCodigo,
    codigoFonte: string,
    casosTeste: CasoTeste[],
  ): Promise<ResultadoExecucao> {
    const inicio = Date.now();
    const resultadosCasos: ResultadoCasoTeste[] = [];
    let ultimoStdout = "";
    let ultimoStderr = "";
    let ultimoCmpinfo = "";
    let ultimoOutcome = JobeOutcome.SUCCESS;
    let todosPassed = true;

    for (const caso of casosTeste) {
      try {
        const resultado = await this.executarCodigo(
          linguagem,
          codigoFonte,
          caso.entrada,
        );

        ultimoStdout = resultado.stdout || "";
        ultimoStderr = resultado.stderr || "";
        ultimoCmpinfo = resultado.cmpinfo || "";
        ultimoOutcome = resultado.outcome;

        // Se houve erro de compilação/runtime, todos os testes falham
        if (resultado.outcome !== JobeOutcome.SUCCESS) {
          resultadosCasos.push({
            casoTesteId: caso.id,
            descricao: caso.descricao,
            passou: false,
            saidaEsperada: caso.saidaEsperada,
            saidaObtida: getOutcomeMessage(resultado.outcome, resultado),
            entrada: caso.entrada,
          });
          todosPassed = false;

          // Se é erro de compilação, não faz sentido testar os outros
          if (resultado.outcome === JobeOutcome.COMPILE_ERROR) {
            // Marcar os restantes como falhos
            for (const restante of casosTeste.slice(
              casosTeste.indexOf(caso) + 1,
            )) {
              resultadosCasos.push({
                casoTesteId: restante.id,
                descricao: restante.descricao,
                passou: false,
                saidaEsperada: restante.saidaEsperada,
                saidaObtida: "Erro de compilação — teste não executado",
                entrada: restante.entrada,
              });
            }
            break;
          }
          continue;
        }

        // Comparar saída com matching inteligente (Levenshtein)
        const saidaObtida = resultado.stdout || "";
        const comparacao = compararSaidas(saidaObtida, caso.saidaEsperada);

        if (!comparacao.passou) todosPassed = false;

        resultadosCasos.push({
          casoTesteId: caso.id,
          descricao: caso.descricao,
          passou: comparacao.passou,
          saidaEsperada: caso.saidaEsperada,
          saidaObtida: saidaObtida,
          entrada: caso.entrada,
          similaridade: comparacao.similaridade,
          observacao: comparacao.observacao,
        });
      } catch (error: any) {
        todosPassed = false;
        resultadosCasos.push({
          casoTesteId: caso.id,
          descricao: caso.descricao,
          passou: false,
          saidaEsperada: caso.saidaEsperada,
          saidaObtida: `Erro: ${error.message || "Falha na execução"}`,
          entrada: caso.entrada,
        });
      }
    }

    return {
      sucesso: todosPassed,
      outcome: ultimoOutcome,
      outcomeTexto: getOutcomeText(ultimoOutcome),
      stdout: ultimoStdout,
      stderr: ultimoStderr,
      cmpinfo: ultimoCmpinfo,
      casosTeste: resultadosCasos,
      tempoExecucao: Date.now() - inicio,
    };
  }

  /**
   * Retorna descrição em português do outcome
   */
  static getOutcomeDescription(outcome: number): string {
    return getOutcomeText(outcome);
  }
}

// ============ HELPERS ============

/**
 * Calcula a distância de Levenshtein entre duas strings
 */
function calcularLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Usar apenas duas linhas para economizar memória
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // remoção
        curr[j - 1] + 1, // inserção
        prev[j - 1] + custo, // substituição
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Normaliza aspas tipográficas e caracteres especiais do teclado mobile para
 * seus equivalentes ASCII, evitando erros de sintaxe no Jobe.
 */
function normalizarCodigo(codigo: string): string {
  return (
    codigo
      // Aspas duplas tipográficas ("curly quotes")
      .replace(/\u201C|\u201D|\u201E|\u201F|\u275D|\u275E/g, '"')
      // Aspas simples tipográficas e apóstrofos
      .replace(/\u2018|\u2019|\u201A|\u201B|\u275B|\u275C|\u0060/g, "'")
      // Travessão e meia-risca → hífen
      .replace(/\u2013|\u2014/g, "-")
      // Reticências → três pontos
      .replace(/\u2026/g, "...")
      // Espaço não-quebrável → espaço normal
      .replace(/\u00A0/g, " ")
  );
}

/**
 * Normaliza saída para comparação: trim, colapsar espaços múltiplos, normalizar line endings
 */
function normalizarSaida(texto: string): string {
  return texto
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n");
}

/**
 * Compara saída obtida com esperada usando matching em camadas:
 * 1. Match exato (após normalização) → 100% similaridade
 * 2. Match case-insensitive → 100% similaridade + observação
 * 3. Match ignorando espaços extras → 100% similaridade + observação
 * 4. Match case-insensitive + espaços → 100% similaridade + observação
 * 5. Levenshtein dentro do limiar → similaridade calculada + observação
 * 6. Falha → similaridade calculada
 */
function compararSaidas(
  obtida: string,
  esperada: string,
): { passou: boolean; similaridade: number; observacao?: string } {
  const obtidaNorm = normalizarSaida(obtida);
  const esperadaNorm = normalizarSaida(esperada);

  // 1. Match exato após normalização
  if (obtidaNorm === esperadaNorm) {
    return { passou: true, similaridade: 100 };
  }

  // 2. Match case-insensitive
  if (obtidaNorm.toLowerCase() === esperadaNorm.toLowerCase()) {
    return {
      passou: true,
      similaridade: 100,
      observacao: "Aceito (diferença apenas em maiúsculas/minúsculas)",
    };
  }

  // 3. Match ignorando espaços completamente
  const obtidaSemEspacos = obtidaNorm.replace(/\s+/g, "");
  const esperadaSemEspacos = esperadaNorm.replace(/\s+/g, "");
  
  if (obtidaSemEspacos === esperadaSemEspacos) {
    return {
      passou: true,
      similaridade: 100,
      observacao: "Aceito (diferença apenas em espaçamento)",
    };
  }

  // 4. Match case-insensitive + sem espaços
  if (obtidaSemEspacos.toLowerCase() === esperadaSemEspacos.toLowerCase()) {
    return {
      passou: true,
      similaridade: 100,
      observacao: "Aceito (diferença em maiúsculas/minúsculas e espaçamento)",
    };
  }

  // 5. Calcular distância de Levenshtein
  const distancia = calcularLevenshtein(obtidaNorm, esperadaNorm);
  const maxLen = Math.max(obtidaNorm.length, esperadaNorm.length);
  const similaridade =
    maxLen > 0 ? Math.round(((maxLen - distancia) / maxLen) * 100) : 0;

  // Limiar: até 3 caracteres ou 15% do tamanho esperado (o que for maior)
  // Cobre diferenças comuns: espaço extra, acento esquecido, capitalização parcial
  const limiar = Math.max(3, Math.ceil(esperadaNorm.length * 0.15));

  if (distancia <= limiar) {
    return {
      passou: true,
      similaridade,
      observacao: `Quase exato (${distancia} caractere${distancia > 1 ? "s" : ""} de diferença)`,
    };
  }

  return { passou: false, similaridade };
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (jobeConfig.apiKey) {
    headers["X-API-KEY"] = jobeConfig.apiKey;
  }
  return headers;
}

function getOutcomeText(outcome: number): string {
  switch (outcome) {
    case JobeOutcome.SUCCESS:
      return "Execução bem-sucedida";
    case JobeOutcome.COMPILE_ERROR:
      return "Erro de compilação";
    case JobeOutcome.RUNTIME_ERROR:
      return "Erro em tempo de execução";
    case JobeOutcome.TIME_LIMIT:
      return "Tempo limite excedido";
    case JobeOutcome.MEMORY_LIMIT:
      return "Limite de memória excedido";
    case JobeOutcome.ILLEGAL_SYSCALL:
      return "Chamada de sistema não permitida";
    case JobeOutcome.INTERNAL_ERROR:
      return "Erro interno do servidor";
    case JobeOutcome.SERVER_OVERLOAD:
      return "Servidor sobrecarregado";
    default:
      return `Resultado desconhecido (código: ${outcome})`;
  }
}

function getOutcomeMessage(outcome: number, response: JobeResponse): string {
  const text = getOutcomeText(outcome);
  if (outcome === JobeOutcome.COMPILE_ERROR && response.cmpinfo) {
    return `${text}\n${response.cmpinfo}`;
  }
  if (outcome === JobeOutcome.RUNTIME_ERROR && response.stderr) {
    return `${text}\n${response.stderr}`;
  }
  return text;
}
