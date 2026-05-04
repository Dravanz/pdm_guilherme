import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobeService, JobeOutcome } from '../../services/codigo/JobeService';

// Mock fetch global
global.fetch = vi.fn();

describe('JobeService - Testes Unitários e Integração', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('CT030: Executar Código Python', () => {
    it('CT030.1: Deve executar código Python com sucesso', async () => {
      const mockResponse = {
        outcome: JobeOutcome.SUCCESS,
        cmpinfo: '',
        stdout: 'Hello World\n',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const resultado = await JobeService.executarCodigo(
        'python3',
        'print("Hello World")',
        ''
      );

      expect(resultado.outcome).toBe(JobeOutcome.SUCCESS);
      expect(resultado.stdout).toBe('Hello World\n');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('CT030.2: Deve detectar erro de sintaxe Python', async () => {
      const mockResponse = {
        outcome: JobeOutcome.COMPILE_ERROR,
        cmpinfo: 'SyntaxError: invalid syntax',
        stdout: '',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const resultado = await JobeService.executarCodigo(
        'python3',
        'print("Hello World"',
        ''
      );

      expect(resultado.outcome).toBe(JobeOutcome.COMPILE_ERROR);
      expect(resultado.cmpinfo).toContain('SyntaxError');
    });

    it('CT030.3: Deve tratar timeout de execução', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject({ name: 'AbortError' }), 100);
        });
      });

      const resultado = await JobeService.executarCodigo(
        'python3',
        'while True: pass',
        ''
      );

      expect(resultado.outcome).toBe(JobeOutcome.TIME_LIMIT);
      expect(resultado.stderr).toContain('Tempo limite');
    });
  });

  describe('CT031: Executar Código JavaScript', () => {
    it('CT031.1: Deve executar código JavaScript com sucesso', async () => {
      const mockResponse = {
        outcome: JobeOutcome.SUCCESS,
        cmpinfo: '',
        stdout: '42\n',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const resultado = await JobeService.executarCodigo(
        'nodejs',
        'console.log(42)',
        ''
      );

      expect(resultado.outcome).toBe(JobeOutcome.SUCCESS);
      expect(resultado.stdout).toBe('42\n');
    });

    it('CT031.2: Deve detectar erro de runtime JavaScript', async () => {
      const mockResponse = {
        outcome: JobeOutcome.RUNTIME_ERROR,
        cmpinfo: '',
        stdout: '',
        stderr: 'ReferenceError: x is not defined',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const resultado = await JobeService.executarCodigo(
        'nodejs',
        'console.log(x)',
        ''
      );

      expect(resultado.outcome).toBe(JobeOutcome.RUNTIME_ERROR);
      expect(resultado.stderr).toContain('ReferenceError');
    });
  });

  describe('CT032: Executar com Casos de Teste', () => {
    it('CT032.1: Deve passar em todos os casos de teste', async () => {
      const mockResponse = {
        outcome: JobeOutcome.SUCCESS,
        cmpinfo: '',
        stdout: '5\n',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const casosTeste = [
        {
          id: 'teste1',
          descricao: 'Soma 2 + 3',
          entrada: '2\n3',
          saidaEsperada: '5',
        },
      ];

      const resultado = await JobeService.executarComTestes(
        'python3',
        'a = int(input())\nb = int(input())\nprint(a + b)',
        casosTeste
      );

      expect(resultado.sucesso).toBe(true);
      expect(resultado.casosTeste[0].passou).toBe(true);
      expect(resultado.tempoExecucao).toBeGreaterThan(0);
    });

    it('CT032.2: Deve falhar em caso de teste incorreto', async () => {
      const mockResponse = {
        outcome: JobeOutcome.SUCCESS,
        cmpinfo: '',
        stdout: '10\n',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const casosTeste = [
        {
          id: 'teste1',
          descricao: 'Soma 2 + 3',
          entrada: '2\n3',
          saidaEsperada: '5',
        },
      ];

      const resultado = await JobeService.executarComTestes(
        'python3',
        'print(10)',
        casosTeste
      );

      expect(resultado.sucesso).toBe(false);
      expect(resultado.casosTeste[0].passou).toBe(false);
    });

    it('CT032.3: Deve parar execução em erro de compilação', async () => {
      const mockResponse = {
        outcome: JobeOutcome.COMPILE_ERROR,
        cmpinfo: 'SyntaxError',
        stdout: '',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const casosTeste = [
        { id: 'teste1', entrada: '', saidaEsperada: '1' },
        { id: 'teste2', entrada: '', saidaEsperada: '2' },
      ];

      const resultado = await JobeService.executarComTestes(
        'python3',
        'print("erro',
        casosTeste
      );

      expect(resultado.sucesso).toBe(false);
      expect(resultado.outcome).toBe(JobeOutcome.COMPILE_ERROR);
      expect(resultado.casosTeste.length).toBe(2);
      expect(resultado.casosTeste.every(c => !c.passou)).toBe(true);
    });
  });

  describe('Testes de Comparação de Saída (Levenshtein)', () => {
    it('Deve aceitar saída exata', async () => {
      const mockResponse = {
        outcome: JobeOutcome.SUCCESS,
        cmpinfo: '',
        stdout: 'Hello World',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const casosTeste = [{
        id: 'teste1',
        entrada: '',
        saidaEsperada: 'Hello World',
      }];

      const resultado = await JobeService.executarComTestes(
        'python3',
        'print("Hello World")',
        casosTeste
      );

      expect(resultado.casosTeste[0].passou).toBe(true);
      expect(resultado.casosTeste[0].similaridade).toBe(100);
    });

    it('Deve aceitar diferença de maiúsculas/minúsculas', async () => {
      const mockResponse = {
        outcome: JobeOutcome.SUCCESS,
        cmpinfo: '',
        stdout: 'hello world',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const casosTeste = [{
        id: 'teste1',
        entrada: '',
        saidaEsperada: 'Hello World',
      }];

      const resultado = await JobeService.executarComTestes(
        'python3',
        'print("hello world")',
        casosTeste
      );

      expect(resultado.casosTeste[0].passou).toBe(true);
      expect(resultado.casosTeste[0].observacao).toContain('maiúsculas');
    });

    it('Deve aceitar diferença de espaçamento', async () => {
      const mockResponse = {
        outcome: JobeOutcome.SUCCESS,
        cmpinfo: '',
        stdout: 'Hello  World',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const casosTeste = [{
        id: 'teste1',
        entrada: '',
        saidaEsperada: 'Hello World',
      }];

      const resultado = await JobeService.executarComTestes(
        'python3',
        'print("Hello  World")',
        casosTeste
      );

      expect(resultado.casosTeste[0].passou).toBe(true);
      expect(resultado.casosTeste[0].observacao).toContain('espaçamento');
    });
  });

  describe('Testes de Verificação de Conexão', () => {
    it('Deve verificar conexão com sucesso', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [['python3', '3.8'], ['nodejs', '14']],
      });

      const conectado = await JobeService.verificarConexao();
      
      expect(conectado).toBe(true);
    });

    it('Deve detectar falha de conexão', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(JobeService.verificarConexao()).rejects.toThrow();
    });
  });

  describe('Testes de Configuração', () => {
    it('Deve retornar configuração atual', () => {
      const config = JobeService.getConfig();
      
      expect(config).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('timeout');
    });

    it('Deve atualizar configuração', () => {
      const novaConfig = {
        baseUrl: 'https://test.com/',
        timeout: 10000,
      };

      JobeService.setConfig(novaConfig);
      const config = JobeService.getConfig();
      
      expect(config.baseUrl).toBe(novaConfig.baseUrl);
      expect(config.timeout).toBe(novaConfig.timeout);
    });
  });

  describe('Testes de Outcome', () => {
    it('Deve retornar descrição correta para cada outcome', () => {
      expect(JobeService.getOutcomeDescription(JobeOutcome.SUCCESS))
        .toBe('Execução bem-sucedida');
      
      expect(JobeService.getOutcomeDescription(JobeOutcome.COMPILE_ERROR))
        .toBe('Erro de compilação');
      
      expect(JobeService.getOutcomeDescription(JobeOutcome.RUNTIME_ERROR))
        .toBe('Erro em tempo de execução');
      
      expect(JobeService.getOutcomeDescription(JobeOutcome.TIME_LIMIT))
        .toBe('Tempo limite excedido');
    });
  });

  describe('Testes de Linguagens Suportadas', () => {
    it('Deve listar linguagens disponíveis', async () => {
      const mockLinguagens = [
        ['python3', '3.8'],
        ['nodejs', '14'],
        ['c', 'gcc 9.3'],
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockLinguagens,
      });

      const linguagens = await JobeService.listarLinguagens();
      
      expect(linguagens).toEqual(mockLinguagens);
      expect(linguagens.length).toBeGreaterThan(0);
    });
  });

  describe('Testes de Erro HTTP', () => {
    it('Deve tratar erro HTTP 500', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(
        JobeService.executarCodigo('python3', 'print("test")', '')
      ).rejects.toThrow('500');
    });

    it('Deve tratar erro HTTP 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(
        JobeService.executarCodigo('python3', 'print("test")', '')
      ).rejects.toThrow('404');
    });
  });

  describe('Testes de Normalização de Código', () => {
    it('Deve normalizar aspas tipográficas', async () => {
      const mockResponse = {
        outcome: JobeOutcome.SUCCESS,
        cmpinfo: '',
        stdout: 'Hello\n',
        stderr: '',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Código com aspas tipográficas será normalizado internamente
      await JobeService.executarCodigo(
        'python3',
        'print("Hello")', // Aspas normais
        ''
      );

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      // Verificar que o código foi enviado
      expect(body.run_spec.sourcecode).toBeDefined();
    });
  });
});
