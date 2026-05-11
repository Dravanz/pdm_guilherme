/**
 * CodeBlocksEditor - Exercício de ordenação de blocos de código
 *
 * O aluno recebe blocos embaralhados (+ possíveis distradores) e deve
 * ordená-los para produzir a saída esperada. Interação por toque:
 *  - Toque num bloco disponível → adiciona ao final da sequência montada
 *  - Toque num bloco montado → remove da sequência
 *  - Botão ↑/↓ numa posição montada → troca com vizinho (reordenação)
 *  - "Executar" → envia o código montado ao Jobe para verificação real
 *  - "Resetar" → limpa a sequência montada
 */

import { BlocoCodigoCodigo, QuestaoBlocos } from "@/model/Curso";
import { JobeService, ResultadoExecucao } from "@/services/codigo/JobeService";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Divider,
  Icon,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";

const LINGUAGEM_LABELS: Record<string, { nome: string; icone: string }> = {
  python3: { nome: "Python 3", icone: "language-python" },
  nodejs: { nome: "JavaScript", icone: "language-javascript" },
  c: { nome: "C", icone: "language-c" },
  sqlite3: { nome: "SQL (SQLite)", icone: "database" },
};

interface CodeBlocksEditorProps {
  questao: QuestaoBlocos;
  onResultado?: (resultado: ResultadoExecucao, correta: boolean) => void;
  desabilitado?: boolean;
  jaRespondida?: boolean;
}

export function CodeBlocksEditor({
  questao,
  onResultado,
  desabilitado = false,
  jaRespondida = false,
}: CodeBlocksEditorProps) {
  const theme = useTheme();

  // Sequência montada pelo aluno: array de IDs de blocos (sem distradores que ficaram fora)
  const [sequencia, setSequencia] = useState<string[]>([]);
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoExecucao | null>(null);
  const [mostrarDica, setMostrarDica] = useState(false);

  const langInfo =
    LINGUAGEM_LABELS[questao.linguagem] || { nome: questao.linguagem, icone: "code-tags" };

  // Blocos ainda disponíveis (não estão na sequência montada)
  const blocosDisponiveis = useMemo(() => {
    const ids = new Set(sequencia);
    // Embaralhar na primeira renderização (ordem fixa por índice - embaralhada pelo parser ao ler)
    return questao.blocos.filter((b) => !ids.has(b.id));
  }, [questao.blocos, sequencia]);

  // Blocos na sequência montada, na ordem atual
  const blocosMontados = useMemo(
    () =>
      sequencia
        .map((id) => questao.blocos.find((b) => b.id === id))
        .filter(Boolean) as BlocoCodigoCodigo[],
    [sequencia, questao.blocos]
  );

  const adicionarBloco = useCallback(
    (id: string) => {
      if (desabilitado || jaRespondida) return;
      setSequencia((prev) => [...prev, id]);
      setResultado(null);
    },
    [desabilitado, jaRespondida]
  );

  const removerBloco = useCallback(
    (id: string) => {
      if (desabilitado || jaRespondida) return;
      setSequencia((prev) => prev.filter((bid) => bid !== id));
      setResultado(null);
    },
    [desabilitado, jaRespondida]
  );

  const moverBloco = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (desabilitado || jaRespondida) return;
      setSequencia((prev) => {
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
      setResultado(null);
    },
    [desabilitado, jaRespondida]
  );

  const resetar = useCallback(() => {
    setSequencia([]);
    setResultado(null);
  }, []);

  const executarCodigo = useCallback(async () => {
    if (executando || desabilitado || blocosMontados.length === 0) return;

    setExecutando(true);
    setResultado(null);

    // Monta o código concatenando os blocos SEM quebras de linha
    // Exemplo: bloco1="print" bloco2="(\"Hello\")" -> "print(\"Hello\")"
    const codigoMontado = blocosMontados.map((b) => b.codigo).join("");

    // Cria um caso de teste sintético usando a saída esperada da questão
    const casosSinteticos = [
      {
        id: "bloco-unico",
        entrada: "",
        saidaEsperada: questao.saidaEsperada,
      },
    ];

    try {
      const res = await JobeService.executarComTestes(
        questao.linguagem,
        codigoMontado,
        casosSinteticos
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
  }, [executando, desabilitado, blocosMontados, questao, onResultado]);

  const codigoPreview = blocosMontados.map((b) => b.codigo).join("");

  return (
    <View style={styles.container}>
      {/* Enunciado */}
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Exercício de blocos: ${questao.enunciado}`}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon source="drag" size={20} color={theme.colors.primary} />
            <Text
              variant="titleMedium"
              style={[styles.cardTitle, { color: theme.colors.onSurface }]}
            >
              Exercício de Blocos
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
        <Card
          style={[
            styles.card,
            { backgroundColor: theme.colors.tertiaryContainer || theme.colors.surfaceVariant, borderLeftWidth: 4, borderLeftColor: theme.colors.tertiary },
          ]}
        >
          <Card.Content>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon
                source="lightbulb-on"
                size={18}
                color={theme.colors.onTertiaryContainer || theme.colors.onSurface}
              />
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onTertiaryContainer || theme.colors.onSurface,
                  flex: 1,
                }}
              >
                {questao.dica}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Blocos disponíveis */}
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.secondary }]}
        accessibilityLabel={`Blocos disponíveis: ${blocosDisponiveis.length} restantes`}
        accessibilityLiveRegion="polite"
      >
        <Card.Content>
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.onSurface, marginBottom: 8 }}
          >
            Blocos disponíveis ({blocosDisponiveis.length})
          </Text>
          {blocosDisponiveis.length === 0 ? (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}
            >
              Todos os blocos foram adicionados
            </Text>
          ) : (
            <View style={styles.blocosGrid}>
              {blocosDisponiveis.map((bloco) => (
                <BlocoDisponivelItem
                  key={bloco.id}
                  bloco={bloco}
                  onPress={() => adicionarBloco(bloco.id)}
                  theme={theme}
                  desabilitado={desabilitado || jaRespondida}
                />
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Sequência montada */}
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}
        accessible
        accessibilityLabel={
          blocosMontados.length === 0
            ? "Seu código: vazio. Toque nos blocos acima para montar."
            : `Seu código: ${blocosMontados.length} bloco${blocosMontados.length > 1 ? "s" : ""} montados`
        }
        accessibilityLiveRegion="polite"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface, flex: 1 }}>
              Seu código ({blocosMontados.length} blocos)
            </Text>
            {!desabilitado && !jaRespondida && blocosMontados.length > 0 && (
              <Button
                mode="text"
                icon="refresh"
                compact
                onPress={resetar}
                textColor={theme.colors.onSurfaceVariant}
                accessibilityLabel="Limpar sequência montada"
                accessibilityRole="button"
              >
                Limpar
              </Button>
            )}
          </View>

          {blocosMontados.length === 0 ? (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic", marginTop: 4 }}
            >
              Toque nos blocos acima para adicioná-los aqui
            </Text>
          ) : (
            <>
              {blocosMontados.map((bloco, index) => (
                <BlocoMontadoItem
                  key={bloco.id}
                  bloco={bloco}
                  index={index}
                  total={blocosMontados.length}
                  onRemover={() => removerBloco(bloco.id)}
                  onMoverCima={() => moverBloco(index, index - 1)}
                  onMoverBaixo={() => moverBloco(index, index + 1)}
                  theme={theme}
                  desabilitado={desabilitado || jaRespondida}
                />
              ))}

              {/* Preview do código completo */}
              <Divider style={{ marginVertical: 10 }} />
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
              >
                Preview
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <Text
                  style={{
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    fontSize: 12,
                    color: theme.dark ? "#cdd6f4" : "#1e1e1e",
                  }}
                  accessibilityLabel={`Preview do código montado: ${codigoPreview}`}
                >
                  {codigoPreview}
                </Text>
              </ScrollView>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Botão executar */}
      {!jaRespondida && (
        <Button
          mode="contained"
          icon={executando ? undefined : "play"}
          onPress={executarCodigo}
          loading={executando}
          disabled={executando || desabilitado || blocosMontados.length === 0}
          style={[styles.executeButton, { backgroundColor: theme.colors.primary }]}
          contentStyle={styles.executeButtonContent}
          labelStyle={{ fontSize: 16, fontWeight: "bold" }}
          accessibilityLabel={
            executando
              ? "Executando código..."
              : blocosMontados.length === 0
              ? "Adicione blocos para executar"
              : "Executar código montado"
          }
          accessibilityRole="button"
        >
          {executando ? "Executando..." : "Executar"}
        </Button>
      )}

      {/* Resultado */}
      {resultado && (
        <ResultadoBlocosPanel resultado={resultado} theme={theme} explicacao={questao.explicacao} />
      )}

      {/* Já respondida */}
      {jaRespondida && (
        <View
          style={[
            styles.jaRespondidaContainer,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Icon source="check-circle" size={20} color={theme.colors.primary} />
          <Text style={[styles.jaRespondidaText, { color: theme.colors.onPrimaryContainer }]}>
            Exercício já respondido
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Sub-componente: bloco disponível ──────────────────────────

function BlocoDisponivelItem({
  bloco,
  onPress,
  theme,
  desabilitado,
}: {
  bloco: BlocoCodigoCodigo;
  onPress: () => void;
  theme: any;
  desabilitado: boolean;
}) {
  return (
    <Button
      mode="outlined"
      onPress={onPress}
      disabled={desabilitado}
      style={[
        styles.blocoDisponivel,
        { borderColor: theme.colors.outline },
      ]}
      contentStyle={{ justifyContent: "flex-start", paddingHorizontal: 8, minHeight: 40 }}
      labelStyle={{
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: 12,
        textAlign: "left",
        color: theme.colors.onSurface,
      }}
      accessibilityLabel={`Adicionar bloco: ${bloco.codigo}`}
      accessibilityRole="button"
    >
      {bloco.codigo}
    </Button>
  );
}

// ── Sub-componente: bloco montado (com botões de reordenação) ──

function BlocoMontadoItem({
  bloco,
  index,
  total,
  onRemover,
  onMoverCima,
  onMoverBaixo,
  theme,
  desabilitado,
}: {
  bloco: BlocoCodigoCodigo;
  index: number;
  total: number;
  onRemover: () => void;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
  theme: any;
  desabilitado: boolean;
}) {
  return (
    <View
      style={[
        styles.blocoMontadoRow,
        { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary },
      ]}
      accessible
      accessibilityLabel={`Bloco ${index + 1} de ${total}: ${bloco.codigo}`}
    >
      {/* Número de posição */}
      <Text
        variant="labelSmall"
        style={[styles.blocoLinha, { color: theme.colors.onPrimaryContainer }]}
      >
        {index + 1}
      </Text>

      {/* Código */}
      <Text
        style={[
          styles.blocoText,
          {
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            color: theme.colors.onPrimaryContainer,
          },
        ]}
        numberOfLines={2}
      >
        {bloco.codigo}
      </Text>

      {/* Controles */}
      {!desabilitado && (
        <View style={styles.blocoControles}>
          <IconButton
            icon="chevron-up"
            size={18}
            onPress={onMoverCima}
            disabled={index === 0}
            iconColor={theme.colors.primary}
            style={styles.iconBtnSmall}
            accessibilityLabel={`Mover bloco ${index + 1} para cima`}
            accessibilityRole="button"
          />
          <IconButton
            icon="chevron-down"
            size={18}
            onPress={onMoverBaixo}
            disabled={index === total - 1}
            iconColor={theme.colors.primary}
            style={styles.iconBtnSmall}
            accessibilityLabel={`Mover bloco ${index + 1} para baixo`}
            accessibilityRole="button"
          />
          <IconButton
            icon="close"
            size={18}
            onPress={onRemover}
            iconColor={theme.colors.error}
            style={styles.iconBtnSmall}
            accessibilityLabel={`Remover bloco ${index + 1}`}
            accessibilityRole="button"
          />
        </View>
      )}
    </View>
  );
}

// ── Sub-componente: painel de resultado ───────────────────────

function ResultadoBlocosPanel({
  resultado,
  theme,
  explicacao,
}: {
  resultado: ResultadoExecucao;
  theme: any;
  explicacao: string;
}) {
  const isSuccess = resultado.sucesso;
  const bgColor = isSuccess ? theme.colors.primaryContainer : theme.colors.errorContainer;
  const textColor = isSuccess ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer;

  return (
    <Card
      style={[styles.card, { backgroundColor: bgColor }]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={
        isSuccess ? "Parabéns! Sequência correta." : "Sequência incorreta. Tente novamente."
      }
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Icon
            source={isSuccess ? "check-circle" : "close-circle"}
            size={24}
            color={textColor}
          />
          <Text variant="titleMedium" style={[styles.cardTitle, { color: textColor }]}>
            {isSuccess ? "Sequência correta!" : "Sequência incorreta"}
          </Text>
        </View>

        {resultado.outcome !== 15 && (
          <View style={[styles.errBox, { backgroundColor: theme.colors.errorContainer }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, fontWeight: "bold" }}>
              {resultado.outcomeTexto}
            </Text>
            {!!resultado.cmpinfo && (
              <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginTop: 4, fontSize: 11 }}>
                {resultado.cmpinfo}
              </Text>
            )}
            {!!resultado.stderr && (
              <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginTop: 4, fontSize: 11 }}>
                {resultado.stderr}
              </Text>
            )}
          </View>
        )}

        {!!resultado.stdout && (
          <>
            <Text variant="labelSmall" style={{ color: textColor, marginTop: 8 }}>
              Saída obtida:
            </Text>
            <Text
              style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", color: textColor, fontSize: 12 }}
            >
              {resultado.stdout}
            </Text>
          </>
        )}

        {resultado.tempoExecucao && (
          <Text variant="bodySmall" style={{ color: textColor, marginTop: 8, textAlign: "right" }}>
            ⏱ {(resultado.tempoExecucao / 1000).toFixed(1)}s
          </Text>
        )}

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

// ── Estilos ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "bold",
    flex: 1,
  },
  enunciadoText: {
    lineHeight: 22,
  },
  langChip: { height: 28 },
  dicaButton: { alignSelf: "flex-start" },
  blocosGrid: {
    gap: 6,
  },
  blocoDisponivel: {
    borderRadius: 8,
    alignSelf: "stretch",
  },
  blocoMontadoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
    gap: 6,
  },
  blocoLinha: {
    fontWeight: "bold",
    minWidth: 22,
    textAlign: "center",
  },
  blocoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  blocoControles: {
    flexDirection: "row",
    gap: 0,
  },
  iconBtnSmall: {
    margin: 0,
    width: 30,
    height: 30,
  },
  executeButton: {
    borderRadius: 12,
  },
  executeButtonContent: {
    height: 52,
  },
  jaRespondidaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  jaRespondidaText: {
    fontWeight: "bold",
  },
  errBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
});
