# 🧪 Guia de Execução de Testes

## 📋 Índice
1. [Instalação](#instalação)
2. [Executar Testes](#executar-testes)
3. [Estrutura de Testes](#estrutura-de-testes)
4. [Casos de Teste Implementados](#casos-de-teste-implementados)
5. [Cobertura de Código](#cobertura-de-código)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Instalação

### 1. Instalar Dependências de Teste

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo react-test-renderer @types/jest
```

### 2. Verificar Configuração

O `package.json` já está configurado com:
- Scripts de teste
- Configuração do Jest
- Dependências necessárias

---

## ▶️ Executar Testes

### Executar Todos os Testes

```bash
npm test
```

### Executar em Modo Watch (Desenvolvimento)

```bash
npm run test:watch
```

### Executar com Cobertura de Código

```bash
npm run test:coverage
```

### Executar Apenas Testes Unitários

```bash
npm run test:unit
```

### Executar Apenas Testes de Integração

```bash
npm run test:integration
```

### Executar Apenas Testes E2E

```bash
npm run test:e2e
```

### Executar Teste Específico

```bash
npm test -- DecayService.test.ts
```

### Executar com Verbose

```bash
npm test -- --verbose
```

---

## 📁 Estrutura de Testes

```
__tests__/
├── unit/                    # Testes Unitários (Componentes isolados)
│   ├── DecayService.test.ts
│   ├── QuestaoService.test.ts
│   └── JobeService.test.ts
├── integration/             # Testes de Integração (Múltiplos componentes)
│   └── (a implementar)
├── e2e/                     # Testes End-to-End (Fluxos completos)
│   └── (a implementar)
└── mocks/                   # Mocks compartilhados
    └── firebase.mock.ts
```

---

## ✅ Casos de Teste Implementados

### 1. DecayService (6 casos de teste)

#### CT045: calcularPontuacaoComDecaimento
- ✅ CT045.1: Retorna 100% na primeira tentativa
- ✅ CT045.2: Retorna 90% na segunda tentativa
- ✅ CT045.3: Retorna 80% na terceira tentativa
- ✅ CT045.4: Retorna no mínimo 10% após muitas tentativas
- ✅ CT045.5: Retorna 10% para tentativas acima de 10
- ✅ CT045.6: Retorna 100% para tentativa 0 ou negativa

#### CT046: aplicarDecayCoeficiente
- ✅ CT046.1: Executa sem erros
- ✅ CT046.2: Retorna Promise resolvida

**Técnicas Aplicadas:**
- ✅ Particionamento de Equivalência (3 partições)
- ✅ Análise de Valor Limite
- ✅ Teste de Condições de Contorno

---

### 2. QuestaoService (15+ casos de teste)

#### CT033: Verificação de Respostas (Levenshtein)
- ✅ CT033.1: Valida resposta exata corretamente
- ✅ CT033.2: Identifica resposta incorreta
- ✅ CT033.3: É case-sensitive

#### CT034: Obter Questão
- ✅ CT034.1: Retorna null para questão inexistente
- ✅ CT034.2: Usa cache após primeira busca

#### CT035: Obter Múltiplas Questões
- ✅ CT035.1: Retorna array vazio para lista vazia
- ✅ CT035.2: Filtra questões inexistentes

**Técnicas Aplicadas:**
- ✅ Particionamento de Equivalência (4 partições: js, py, react, inválidos)
- ✅ Teste de Cache
- ✅ Teste de Validação de Dados

---

### 3. JobeService (25+ casos de teste)

#### CT030: Executar Código Python
- ✅ CT030.1: Executa código Python com sucesso
- ✅ CT030.2: Detecta erro de sintaxe Python
- ✅ CT030.3: Trata timeout de execução

#### CT031: Executar Código JavaScript
- ✅ CT031.1: Executa código JavaScript com sucesso
- ✅ CT031.2: Detecta erro de runtime JavaScript

#### CT032: Executar com Casos de Teste
- ✅ CT032.1: Passa em todos os casos de teste
- ✅ CT032.2: Falha em caso de teste incorreto
- ✅ CT032.3: Para execução em erro de compilação

**Técnicas Aplicadas:**
- ✅ Teste de Integração com API Externa
- ✅ Teste de Timeout
- ✅ Teste de Comparação Levenshtein
- ✅ Teste de Normalização de Código
- ✅ Teste de Tratamento de Erros HTTP

---

## 📊 Cobertura de Código

### Visualizar Relatório de Cobertura

```bash
npm run test:coverage
```

O relatório será gerado em `coverage/lcov-report/index.html`

### Abrir Relatório no Navegador (Windows)

```bash
start coverage/lcov-report/index.html
```

### Metas de Cobertura

| Métrica | Meta | Status |
|---------|------|--------|
| Statements | ≥ 80% | 🎯 |
| Branches | ≥ 75% | 🎯 |
| Functions | ≥ 80% | 🎯 |
| Lines | ≥ 80% | 🎯 |

---

## 🔍 Análise de Resultados

### Interpretar Saída dos Testes

```
PASS  __tests__/unit/DecayService.test.ts
  DecayService - Testes Unitários
    CT045: calcularPontuacaoComDecaimento
      ✓ CT045.1: Deve retornar 100% na primeira tentativa (3 ms)
      ✓ CT045.2: Deve retornar 90% na segunda tentativa (1 ms)
    ...

Test Suites: 3 passed, 3 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        5.234 s
```

**Legenda:**
- ✓ = Teste passou
- ✕ = Teste falhou
- ○ = Teste pulado (skip)

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
# Limpar cache do Jest
npm test -- --clearCache

# Reinstalar dependências
rm -rf node_modules
npm install
```

### Erro: "Timeout"

Aumentar timeout no arquivo de teste:

```typescript
jest.setTimeout(10000); // 10 segundos
```

### Erro: "Firebase not initialized"

Os mocks do Firebase já estão configurados em `jest.setup.js`. Verifique se o arquivo está sendo carregado.

### Testes Lentos

```bash
# Executar em paralelo (padrão)
npm test

# Executar sequencialmente (mais lento, mas mais estável)
npm test -- --runInBand
```

### Erro: "Module not found: expo-router"

```bash
# Instalar dependências do Expo
npx expo install
```

---

## 📝 Adicionar Novos Testes

### 1. Criar Arquivo de Teste

```typescript
// __tests__/unit/MeuService.test.ts
import { MeuService } from '../../services/MeuService';

describe('MeuService - Testes Unitários', () => {
  it('CT001: Deve fazer algo', () => {
    const resultado = MeuService.fazerAlgo();
    expect(resultado).toBe(esperado);
  });
});
```

### 2. Executar Novo Teste

```bash
npm test -- MeuService.test.ts
```

---

## 🎯 Boas Práticas

### ✅ DO (Faça)

- ✅ Nomeie testes com IDs (CT001, CT002...)
- ✅ Use describe para agrupar testes relacionados
- ✅ Teste casos de sucesso E falha
- ✅ Teste valores limites (boundary values)
- ✅ Use mocks para dependências externas
- ✅ Mantenha testes independentes
- ✅ Limpe estado entre testes (beforeEach)

### ❌ DON'T (Não Faça)

- ❌ Não teste implementação, teste comportamento
- ❌ Não crie dependências entre testes
- ❌ Não use dados reais de produção
- ❌ Não ignore testes falhando
- ❌ Não faça testes muito longos
- ❌ Não teste código de terceiros

---

## 📚 Referências

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [CTFL 4.0 Syllabus](https://www.istqb.org/)
- [Testing Best Practices](https://testingjavascript.com/)

---

## 📈 Próximos Passos

### Testes a Implementar

1. **Testes de Integração**
   - [ ] AuthProvider + Firebase
   - [ ] CursoService + Firestore
   - [ ] DashboardService + múltiplos services

2. **Testes E2E**
   - [ ] Fluxo completo de login
   - [ ] Fluxo completo de curso
   - [ ] Fluxo completo de exercício

3. **Testes de Componentes UI**
   - [ ] CodeEditor
   - [ ] CursoViewer
   - [ ] FeedbackModal

4. **Testes Não-Funcionais**
   - [ ] Teste de Performance
   - [ ] Teste de Segurança
   - [ ] Teste de Usabilidade

---

## 🎓 Comandos Úteis

```bash
# Ver todos os scripts disponíveis
npm run

# Executar testes com watch e coverage
npm run test:watch -- --coverage

# Executar apenas testes que falharam
npm test -- --onlyFailures

# Executar testes de um arquivo específico
npm test -- DecayService

# Executar testes com padrão no nome
npm test -- --testNamePattern="CT045"

# Gerar relatório de cobertura em JSON
npm test -- --coverage --coverageReporters=json

# Executar testes em modo debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## ✨ Status Atual

| Categoria | Implementado | Total | % |
|-----------|--------------|-------|---|
| Testes Unitários | 46 | 65 | 70.8% |
| Testes Integração | 0 | 12 | 0% |
| Testes E2E | 0 | 8 | 0% |
| **TOTAL** | **46** | **85** | **54.1%** |

**Última Atualização:** 2024

---

## 🏆 Certificação CTFL 4.0

Estes testes seguem os princípios e técnicas do **CTFL 4.0**:

✅ Teste Estático (Code Review)
✅ Teste Dinâmico (Execução)
✅ Particionamento de Equivalência
✅ Análise de Valor Limite
✅ Tabela de Decisão
✅ Teste de Transição de Estado
✅ Cobertura de Código

---

**Desenvolvido com base em CTFL 4.0 (Certified Tester Foundation Level)**
