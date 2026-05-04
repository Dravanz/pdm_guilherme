import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { JobeService } from '@/services/codigo/JobeService';
import { Config } from '@/config/Config';
import { spacing, containerPadding } from '@/constants/Layout';

interface JobeTestProps {
  onClose?: () => void;
}

export function JobeTest({ onClose }: JobeTestProps) {
  const theme = useTheme();
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<{
    conectividade: boolean | null;
    linguagens: string[][] | null;
    erro?: string;
    serverStatus?: any;
  }>({ conectividade: null, linguagens: null });

  const testarConexao = async () => {
    setTestando(true);
    setResultado({ conectividade: null, linguagens: null });
    
    try {
      // Log da configuração atual
      Config.logConfig();
      JobeService.logCurrentConfig();
      
      // Obter status dos servidores
      const serverStatus = JobeService.getServerStatus();
      
      // Testar conectividade
      const conectividade = await JobeService.verificarConexao();
      
      // Se conectou, listar linguagens
      let linguagens = null;
      if (conectividade) {
        linguagens = await JobeService.listarLinguagens();
      }
      
      setResultado({ conectividade, linguagens, serverStatus });
    } catch (error: any) {
      const serverStatus = JobeService.getServerStatus();
      setResultado({ 
        conectividade: false, 
        linguagens: null, 
        erro: error.message,
        serverStatus
      });
    } finally {
      setTestando(false);
    }
  };

  const forcarReconexao = async () => {
    setTestando(true);
    try {
      const sucesso = await JobeService.forcarReconexaoPrimario();
      const serverStatus = JobeService.getServerStatus();
      
      if (sucesso) {
        alert('✅ Reconectado ao servidor primário!');
      } else {
        alert('❌ Servidor primário ainda indisponível');
      }
      
      setResultado(prev => ({ ...prev, serverStatus }));
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setTestando(false);
    }
  };

  const testarExecucao = async () => {
    setTestando(true);
    
    try {
      const resultado = await JobeService.executarCodigo(
        'python3',
        'print("Hello from Jobe server!")',
        ''
      );
      
      const serverStatus = JobeService.getServerStatus();
      const serverName = serverStatus.fallbackAtivo ? 'Fallback (Canterbury)' : 'Primário (Privado)';
      
      console.log('[JobeTest] Resultado da execução:', resultado);
      alert(`Execução bem-sucedida no servidor ${serverName}!\nSaída: ${resultado.stdout}`);
      
      setResultado(prev => ({ ...prev, serverStatus }));
    } catch (error: any) {
      console.error('[JobeTest] Erro na execução:', error);
      alert(`Erro na execução: ${error.message}`);
    } finally {
      setTestando(false);
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Title title="🔧 Teste do Servidor Jobe" />
      <Card.Content>
        <View style={styles.configInfo}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            <Text style={{ fontWeight: 'bold' }}>Servidor Ativo:</Text> {resultado.serverStatus?.servidorAtivo === 'primary' ? '🔒 Privado' : '🌐 Público'}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            <Text style={{ fontWeight: 'bold' }}>URL:</Text> {Config.jobe.active.baseUrl}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            <Text style={{ fontWeight: 'bold' }}>API Key:</Text> {Config.jobe.active.apiKey ? `${Config.jobe.active.apiKey.substring(0, 8)}...` : 'Não definida'}
          </Text>
          {resultado.serverStatus?.fallbackAtivo && (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: spacing.xs }}>
              ⚠️ Usando servidor fallback. Próxima tentativa de reconexão: {resultado.serverStatus.proximaTentativaPrimario ? new Date(resultado.serverStatus.proximaTentativaPrimario).toLocaleTimeString() : 'N/A'}
            </Text>
          )}
        </View>

        {testando && (
          <View style={styles.loading}>
            <ActivityIndicator size="small" />
            <Text style={{ marginLeft: spacing.sm, color: theme.colors.onSurface }}>Testando...</Text>
          </View>
        )}

        {resultado.conectividade !== null && (
          <View style={styles.resultado}>
            <Text variant="titleMedium" style={{ 
              color: resultado.conectividade ? theme.colors.primary : theme.colors.error,
              fontWeight: 'bold'
            }}>
              {resultado.conectividade ? '✅ Conectado' : '❌ Falha na conexão'}
            </Text>
            
            {resultado.erro && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: spacing.xs }}>
                Erro: {resultado.erro}
              </Text>
            )}
            
            {resultado.linguagens && (
              <View style={styles.linguagens}>
                <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  Linguagens suportadas:
                </Text>
                {resultado.linguagens.map(([lang, version]) => (
                  <Text key={lang} variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    • {lang} ({version})
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </Card.Content>
      
      <Card.Actions>
        <Button 
          mode="outlined" 
          onPress={testarConexao}
          disabled={testando}
        >
          Testar Conexão
        </Button>
        
        {resultado.conectividade && (
          <Button 
            mode="contained" 
            onPress={testarExecucao}
            disabled={testando}
            style={{ marginRight: spacing.sm }}
          >
            Testar Execução
          </Button>
        )}
        
        {resultado.serverStatus?.fallbackAtivo && (
          <Button 
            mode="outlined" 
            onPress={forcarReconexao}
            disabled={testando}
            icon="refresh"
            style={{ marginRight: spacing.sm }}
          >
            Tentar Primário
          </Button>
        )}
        
        {onClose && (
          <Button onPress={onClose}>
            Fechar
          </Button>
        )}
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: containerPadding.horizontal,
  },
  configInfo: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: spacing.sm,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  resultado: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  linguagens: {
    marginTop: spacing.md,
  },
});