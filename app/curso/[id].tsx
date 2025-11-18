import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemeContext } from '@/context/ThemeProvider';
import { UserContext } from '@/context/UserProvider';
import { CursoViewer } from '@/components/CursoViewer';
import { Curso, UsuarioCurso } from '@/model/Curso';
import { CursoService } from '@/services/CursoService';

export default function CursoDetalhes() {
  const { id, modo } = useLocalSearchParams<{ id: string; modo?: string }>();
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [progressoCurso, setProgressoCurso] = useState<UsuarioCurso | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [modoRevisao, setModoRevisao] = useState(false);
  const [respostasRevisao, setRespostasRevisao] = useState<string[]>([]);

  useEffect(() => {
    carregarCurso();
  }, [id]);

  const carregarCurso = async () => {
    if (!id) {
      setCarregando(false);
      return;
    }
    
    if (!user) {
      setTimeout(() => carregarCurso(), 1000);
      return;
    }

    try {
      setCarregando(true);
      
      const cursoCarregado = await CursoService.carregarCursoXML(id, user?.urlFoto);
      setCurso(cursoCarregado);

      const isRevisao = modo === 'revisao';
      setModoRevisao(isRevisao);
      
      let progresso = await CursoService.obterProgressoCurso(user.uid, id);
      
      if (!progresso && !isRevisao) {
        progresso = await CursoService.iniciarCurso(user.uid, id);
      } else if (isRevisao && !progresso) {
        // Criar progresso temporário para revisão
        progresso = {
          id: `${user.uid}_${id}_revisao`,
          usuarioId: user.uid,
          cursoId: id,
          coeficiente: 0,
          paginaAtual: 1,
          questoesRespondidas: [],
          questoesCorretas: [],
          questoesErradas: [],
          dataInicio: new Date(),
          dataUltimaAtualizacao: new Date(),
          concluido: false,
        };
      }
      
      setProgressoCurso(progresso);
      setPaginaAtual(0);
      setRespostasRevisao([]);

    } catch (error) {
      console.error('Erro detalhado:', error);
      Alert.alert('Erro', `Não foi possível carregar o curso: ${error}`);
      router.back();
    } finally {
      setCarregando(false);
    }
  };

  const responderQuestao = async (questaoId: string, alternativaId: string, correta: boolean, explicacao: string) => {
    if (!progressoCurso) return;
    
    if (modoRevisao) {
      // Modo revisão: não salvar dados, apenas dar feedback
      if (respostasRevisao.includes(questaoId)) {
        throw new Error('Questão já foi respondida nesta sessão de revisão');
      }
      
      setRespostasRevisao(prev => [...prev, questaoId]);
      
      return {
        sucesso: correta,
        explicacao: `${explicacao}\n\n(Modo Revisão - Dados não salvos)`,
        novoCoeficiente: 0,
      };
    }
    
    // Modo normal
    if (progressoCurso.questoesRespondidas.includes(questaoId)) {
      throw new Error('Questão já foi respondida');
    }

    const novoProgresso = {
      ...progressoCurso,
      questoesRespondidas: [...progressoCurso.questoesRespondidas, questaoId],
      questoesCorretas: correta 
        ? [...progressoCurso.questoesCorretas, questaoId]
        : progressoCurso.questoesCorretas,
      questoesErradas: !correta
        ? [...(progressoCurso.questoesErradas || []), questaoId]
        : progressoCurso.questoesErradas || [],
    };

    const totalRespondidas = novoProgresso.questoesRespondidas.length;
    const totalCorretas = novoProgresso.questoesCorretas.length;
    novoProgresso.coeficiente = Math.round((totalCorretas / totalRespondidas) * 100);

    setProgressoCurso(novoProgresso);
    await CursoService.salvarProgresso(novoProgresso);

    return {
      sucesso: correta,
      explicacao,
      novoCoeficiente: novoProgresso.coeficiente,
    };
  };

  const proximaPagina = async () => {
    if (!curso || !progressoCurso) return;

    if (paginaAtual < curso.paginas.length - 1) {
      setPaginaAtual(paginaAtual + 1);
    } else {
      if (modoRevisao) {
        Alert.alert(
          'Revisão Concluída!',
          'Você terminou de revisar o curso. Esperamos que tenha refrescado sua memória!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      const resultado = await CursoService.verificarConclusaoCurso(progressoCurso, curso);
      
      if (resultado.podeCompletar) {
        let mensagem = `Parabéns! Você concluiu o curso com ${resultado.percentualAcerto}% de acerto.`;
        
        if (resultado.novasBadges && resultado.novasBadges.length > 0) {
          const badgesTexto = resultado.novasBadges.map(b => `${b.icone} ${b.nome}`).join('\n');
          mensagem += `\n\nNovas badges conquistadas:\n${badgesTexto}`;
        }
        
        Alert.alert(
          'Curso Concluído!',
          mensagem,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          'Curso Não Concluído',
          `Você precisa de pelo menos 70% de acerto. Atual: ${resultado.percentualAcerto}%.\n\nRefazer questões erradas?`,
          [
            { text: 'Não', onPress: () => router.back() },
            { 
              text: 'Sim', 
              onPress: () => {
                const novoProgresso = CursoService.reiniciarQuestoes(progressoCurso, resultado.questoesErradas);
                setProgressoCurso(novoProgresso);
                setPaginaAtual(0);
              }
            }
          ]
        );
      }
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" style={styles.loading} />
        <Text style={{ textAlign: 'center', color: theme.colors.onBackground }}>
          Carregando curso... {id}
        </Text>
        <Text style={{ textAlign: 'center', color: theme.colors.onBackground, marginTop: 10 }}>
          Usuário: {user?.nome || 'Carregando...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (!curso || !progressoCurso) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ textAlign: 'center', color: theme.colors.onBackground }}>
          Curso não encontrado
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleLarge" style={[styles.titulo, { color: theme.colors.onBackground }]}>
        {curso.titulo} {modoRevisao ? '(Revisão)' : ''} - Página {paginaAtual + 1}/{curso.paginas.length}
      </Text>
      
      <CursoViewer
        pagina={curso.paginas[paginaAtual]}
        onProximaPagina={proximaPagina}
        questoesRespondidas={modoRevisao ? respostasRevisao : progressoCurso.questoesRespondidas}
        onResponderQuestao={responderQuestao}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  titulo: {
    textAlign: 'center',
    padding: 16,
    fontWeight: 'bold',
  },
});