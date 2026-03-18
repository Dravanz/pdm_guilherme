/**
 * CodeEditor - Componente de editor de código para exercícios de escrita
 * 
 * Usa WebView com CodeMirror 6 para syntax highlighting e edição confortável.
 * Áreas editáveis são marcadas com __EDITAR__ no codigoBase.
 * O aluno preenche apenas as lacunas, o restante fica read-only visualmente.
 * 
 * Props:
 * - questao: QuestaoEscrita com enunciado, código base, casos de teste
 * - onResultado: callback com resultado da execução
 * - desabilitado: bloqueia edição (já respondeu)
 * - modo: "resolver" (aluno) | "preview" (colaborador/moderador)
 */

import { QuestaoEscrita } from "@/model/Curso";
import { JobeService, ResultadoExecucao } from "@/services/codigo/JobeService";
import React, { useCallback, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  Icon,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const LINGUAGEM_LABELS: Record<string, { nome: string; icone: string }> = {
  python3: { nome: "Python 3", icone: "language-python" },
  nodejs: { nome: "JavaScript", icone: "language-javascript" },
  c: { nome: "C", icone: "language-c" },
};

interface CodeEditorProps {
  questao: QuestaoEscrita;
  onResultado?: (resultado: ResultadoExecucao, correta: boolean) => void;
  desabilitado?: boolean;
  modo?: "resolver" | "preview";
  jaRespondida?: boolean;
}

export function CodeEditor({
  questao,
  onResultado,
  desabilitado = false,
  modo = "resolver",
  jaRespondida = false,
}: CodeEditorProps) {
  const theme = useTheme();
  const [codigoUsuario, setCodigoUsuario] = useState(questao.modoEncapsulado ? "" : questao.codigoBase);
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExecucao | null>(null);
  const [mostrarDica, setMostrarDica] = useState(false);

  const langInfo = LINGUAGEM_LABELS[questao.linguagem] || { nome: questao.linguagem, icone: "code-tags" };

  const executarCodigo = useCallback(async () => {
    if (executando || desabilitado) return;
    
    setExecutando(true);
    setResultado(null);

    try {
      // No modo encapsulado, o código completo é: wrapperAntes + entrada do aluno + wrapperDepois
      const codigoCompleto = questao.modoEncapsulado
        ? [(questao.wrapperAntes ?? ""), codigoUsuario, (questao.wrapperDepois ?? "")]
            .filter(Boolean)
            .join("\n")
        : codigoUsuario;

      const res = await JobeService.executarComTestes(
        questao.linguagem,
        codigoCompleto,
        questao.casosTeste
      );

      setResultado(res);
      onResultado?.(res, res.sucesso);
    } catch (error: any) {
      const erroResult: ResultadoExecucao = {
        sucesso: false,
        outcome: 20,
        outcomeTexto: "Erro de conexão",
        stdout: "",
        stderr: error.message || "Não foi possível conectar ao servidor de execução",
        cmpinfo: "",
        casosTeste: [],
      };
      setResultado(erroResult);
    } finally {
      setExecutando(false);
    }
  }, [codigoUsuario, questao, executando, desabilitado, onResultado]);

  const resetarCodigo = useCallback(() => {
    setCodigoUsuario(questao.modoEncapsulado ? "" : questao.codigoBase);
    setResultado(null);
  }, [questao.codigoBase, questao.modoEncapsulado]);

  return (
    <View style={styles.container}>
      {/* Enunciado */}
      <Card 
        style={[styles.enunciadoCard, { backgroundColor: theme.colors.surfaceVariant }]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Enunciado do exercício: ${questao.enunciado}`}
      >
        <Card.Content>
          <View style={styles.enunciadoHeader}>
            <Icon source="code-braces" size={20} color={theme.colors.primary} />
            <Text 
              variant="titleMedium" 
              style={[styles.enunciadoTitle, { color: theme.colors.onSurface }]}
            >
              Exercício de Código
            </Text>
            <Chip
              compact
              icon={langInfo.icone}
              style={[styles.langChip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 12 }}
              accessibilityLabel={`Linguagem: ${langInfo.nome}`}
            >
              {langInfo.nome}
            </Chip>
          </View>
          <Text 
            variant="bodyMedium" 
            style={[styles.enunciadoText, { color: theme.colors.onSurface }]}
          >
            {questao.enunciado}
          </Text>
        </Card.Content>
      </Card>

      {/* Dica */}
      {questao.dica && (
        <Button
          mode="text"
          icon={mostrarDica ? "lightbulb" : "lightbulb-outline"}
          onPress={() => setMostrarDica(!mostrarDica)}
          compact
          style={styles.dicaButton}
          textColor={theme.colors.tertiary || theme.colors.secondary}
          accessibilityLabel={mostrarDica ? "Esconder dica" : "Mostrar dica"}
          accessibilityRole="button"
        >
          {mostrarDica ? "Esconder Dica" : "Ver Dica"}
        </Button>
      )}
      {mostrarDica && questao.dica && (
        <Card style={[styles.dicaCard, { backgroundColor: theme.colors.tertiaryContainer || theme.colors.surfaceVariant }]}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon source="lightbulb-on" size={18} color={theme.colors.onTertiaryContainer || theme.colors.onSurface} />
              <Text variant="bodyMedium" style={{ color: theme.colors.onTertiaryContainer || theme.colors.onSurface, flex: 1 }}>
                {questao.dica}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Editor de Código */}
      <Card 
        style={[styles.editorCard, { backgroundColor: theme.colors.surface }]}
        accessibilityLabel="Editor de código"
      >
        <Card.Content style={styles.editorContent}>
          <View style={styles.editorHeader}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
              {questao.modoEncapsulado ? "Seu código" : "Código"}
            </Text>
            {!desabilitado && !jaRespondida && (
              <Button
                mode="text"
                icon="refresh"
                compact
                onPress={resetarCodigo}
                textColor={theme.colors.onSurfaceVariant}
                accessibilityLabel="Resetar código ao original"
                accessibilityRole="button"
              >
                Resetar
              </Button>
            )}
          </View>

          {/* Wrapper antes (modo encapsulado) — código de contexto read-only */}
          {questao.modoEncapsulado && questao.wrapperAntes && (
            <View
              style={[styles.wrapperBlock, { backgroundColor: theme.dark ? "#12121c" : "#f0f0f0", borderColor: theme.colors.outlineVariant ?? theme.colors.outline }]}
              accessible
              accessibilityLabel="Contexto do código — leitura apenas"
            >
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12 }}>
                {questao.wrapperAntes}
              </Text>
            </View>
          )}
          
          <TextInput
            value={codigoUsuario}
            onChangeText={setCodigoUsuario}
            mode="outlined"
            multiline
            numberOfLines={Math.max(8, codigoUsuario.split("\n").length + 2)}
            disabled={desabilitado || jaRespondida}
            style={[
              styles.codeInput,
              { 
                backgroundColor: theme.dark ? "#1e1e2e" : "#fafafa",
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              },
            ]}
            outlineStyle={{ borderColor: theme.colors.outline, borderRadius: 8 }}
            contentStyle={[
              styles.codeInputContent,
              { 
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                color: theme.dark ? "#cdd6f4" : "#1e1e1e",
              },
            ]}
            accessibilityLabel="Campo de edição de código. Escreva seu código aqui."
            accessibilityHint="Edite o código para completar o exercício"
          />
          
          {/* Indicador de linhas */}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {codigoUsuario.split("\n").length} linhas
          </Text>

          {/* Wrapper depois (modo encapsulado) — código de contexto read-only */}
          {questao.modoEncapsulado && questao.wrapperDepois && (
            <View
              style={[styles.wrapperBlock, { backgroundColor: theme.dark ? "#12121c" : "#f0f0f0", borderColor: theme.colors.outlineVariant ?? theme.colors.outline }]}
              accessible
              accessibilityLabel="Contexto final do código — leitura apenas"
            >
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12 }}>
                {questao.wrapperDepois}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Botão Executar */}
      {!jaRespondida && (
        <Button
          mode="contained"
          icon={executando ? undefined : "play"}
          onPress={executarCodigo}
          loading={executando}
          disabled={executando || desabilitado || !codigoUsuario.trim()}
          style={[styles.executeButton, { backgroundColor: theme.colors.primary }]}
          contentStyle={styles.executeButtonContent}
          labelStyle={{ fontSize: 16, fontWeight: "bold" }}
          accessibilityLabel={executando ? "Executando código..." : "Executar código"}
          accessibilityRole="button"
        >
          {executando ? "Executando..." : "Executar Código"}
        </Button>
      )}

      {/* Resultado */}
      {resultado && (
        <ResultadoPanel resultado={resultado} theme={theme} explicacao={questao.explicacao} />
      )}

      {/* Já respondida */}
      {jaRespondida && (
        <View style={[styles.jaRespondidaContainer, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon source="check-circle" size={20} color={theme.colors.primary} />
          <Text style={[styles.jaRespondidaText, { color: theme.colors.onPrimaryContainer }]}>
            Exercício já respondido
          </Text>
        </View>
      )}
    </View>
  );
}

// ============ Sub-componente: Painel de Resultado ============

function ResultadoPanel({ 
  resultado, 
  theme, 
  explicacao 
}: { 
  resultado: ResultadoExecucao; 
  theme: any; 
  explicacao: string;
}) {
  const isSuccess = resultado.sucesso;
  const bgColor = isSuccess ? theme.colors.primaryContainer : theme.colors.errorContainer;
  const textColor = isSuccess ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer;
  const iconName = isSuccess ? "check-circle" : "close-circle";

  return (
    <Card 
      style={[styles.resultadoCard, { backgroundColor: bgColor }]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={isSuccess 
        ? `Sucesso! Todos os ${resultado.casosTeste.length} testes passaram.` 
        : `Resultado: ${resultado.casosTeste.filter(c => c.passou).length} de ${resultado.casosTeste.length} testes passaram.`}
    >
      <Card.Content>
        {/* Status geral */}
        <View style={styles.resultadoHeader}>
          <Icon source={iconName} size={24} color={textColor} />
          <Text variant="titleMedium" style={[styles.resultadoTitle, { color: textColor }]}>
            {isSuccess ? "Todos os testes passaram!" : "Alguns testes falharam"}
          </Text>
        </View>

        {/* Outcome do Jobe (se não for sucesso) */}
        {resultado.outcome !== 15 && (
          <View style={[styles.outcomeBox, { backgroundColor: theme.colors.errorContainer }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, fontWeight: "bold" }}>
              {resultado.outcomeTexto}
            </Text>
            {resultado.cmpinfo ? (
              <Text 
                variant="bodySmall" 
                style={{ 
                  color: theme.colors.onErrorContainer, 
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  marginTop: 4,
                  fontSize: 11,
                }}
              >
                {resultado.cmpinfo}
              </Text>
            ) : null}
            {resultado.stderr ? (
              <Text 
                variant="bodySmall" 
                style={{ 
                  color: theme.colors.onErrorContainer, 
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  marginTop: 4,
                  fontSize: 11,
                }}
              >
                {resultado.stderr}
              </Text>
            ) : null}
          </View>
        )}

        {/* Casos de teste individuais */}
        {resultado.casosTeste.length > 0 && (
          <View style={styles.testesContainer}>
            <Divider style={{ marginVertical: 8 }} />
            <Text variant="labelLarge" style={{ color: textColor, marginBottom: 8 }}>
              Casos de Teste ({resultado.casosTeste.filter(c => c.passou).length}/{resultado.casosTeste.length})
            </Text>
            {resultado.casosTeste.map((caso, index) => (
              <View
                key={caso.casoTesteId}
                style={[
                  styles.casoTesteItem,
                  {
                    backgroundColor: caso.passou
                      ? (theme.colors.primaryContainer || "#e8f5e9")
                      : (theme.colors.errorContainer || "#ffebee"),
                    borderLeftColor: caso.passou ? theme.colors.primary : theme.colors.error,
                  },
                ]}
                accessible
                accessibilityLabel={`Teste ${index + 1}: ${caso.passou ? "passou" : "falhou"}. ${caso.descricao || ""}`}
              >
                <View style={styles.casoTesteHeader}>
                  <Icon
                    source={caso.passou ? "check" : "close"}
                    size={16}
                    color={caso.passou ? theme.colors.primary : theme.colors.error}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: caso.passou ? theme.colors.primary : theme.colors.error,
                      fontWeight: "bold",
                      marginLeft: 6,
                    }}
                  >
                    Teste {index + 1} {caso.descricao ? `— ${caso.descricao}` : ""}
                  </Text>
                </View>
                {!caso.passou && (
                  <View style={styles.casoTesteDetalhe}>
                    {caso.entrada ? (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                        <Text style={{ fontWeight: "bold" }}>Entrada: </Text>
                        {caso.entrada}
                      </Text>
                    ) : null}
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                      <Text style={{ fontWeight: "bold" }}>Esperado: </Text>
                      {caso.saidaEsperada}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                      <Text style={{ fontWeight: "bold" }}>Obtido: </Text>
                      {caso.saidaObtida || "(vazio)"}
                    </Text>
                    {caso.similaridade !== undefined && caso.similaridade > 0 && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic", marginTop: 2 }}>
                        Similaridade: {caso.similaridade}%
                      </Text>
                    )}
                  </View>
                )}
                {caso.passou && caso.observacao && (
                  <View style={styles.casoTesteDetalhe}>
                    <Text variant="bodySmall" style={{ color: theme.colors.primary, fontStyle: "italic" }}>
                      {caso.observacao}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Tempo de execução */}
        {resultado.tempoExecucao && (
          <Text variant="bodySmall" style={{ color: textColor, marginTop: 8, textAlign: "right" }}>
            ⏱ {(resultado.tempoExecucao / 1000).toFixed(1)}s
          </Text>
        )}

        {/* Explicação (mostrar sempre que houver resultado) */}
        {explicacao && (
          <>
            <Divider style={{ marginVertical: 12 }} />
            <Text variant="bodyMedium" style={{ color: textColor }}>
              <Text style={{ fontWeight: "bold" }}>Explicação: </Text>
              {explicacao}
            </Text>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

// ============ ESTILOS ============

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  enunciadoCard: {
    borderRadius: 12,
    elevation: 1,
  },
  enunciadoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  enunciadoTitle: {
    fontWeight: "bold",
    flex: 1,
  },
  enunciadoText: {
    lineHeight: 22,
  },
  langChip: {
    height: 28,
  },
  dicaButton: {
    alignSelf: "flex-start",
  },
  dicaCard: {
    borderRadius: 8,
    elevation: 0,
  },
  editorCard: {
    borderRadius: 12,
    elevation: 2,
  },
  editorContent: {
    paddingVertical: 12,
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  codeInput: {
    fontSize: 13,
    minHeight: 200,
  },
  wrapperBlock: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  codeInputContent: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  executeButton: {
    borderRadius: 12,
    elevation: 2,
  },
  executeButtonContent: {
    minHeight: 48,
  },
  resultadoCard: {
    borderRadius: 12,
    elevation: 1,
  },
  resultadoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  resultadoTitle: {
    fontWeight: "bold",
  },
  outcomeBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  testesContainer: {
    marginTop: 4,
  },
  casoTesteItem: {
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 6,
  },
  casoTesteHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  casoTesteDetalhe: {
    marginTop: 8,
    gap: 2,
  },
  jaRespondidaContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  jaRespondidaText: {
    fontWeight: "bold",
  },
});
