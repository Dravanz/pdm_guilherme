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
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { styles: themeStyles } = useContext<any>(ThemeContext);
  const { userFirebase: user } = useContext<any>(UserContext);
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [progressoCurso, setProgressoCurso] = useState<UsuarioCurso | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);

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
      
      const cursoCarregado = await CursoService.carregarCursoXML(id);
      setCurso(cursoCarregado);

      let progresso = await CursoService.obterProgressoCurso(user.uid, id);
      
      if (!progresso) {
        progresso = await CursoService.iniciarCurso(user.uid, id);
      }
      
      setProgressoCurso(progresso);
      setPaginaAtual(0);

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

  const proximaPagina = () => {
    if (!curso || !progressoCurso) return;

    if (paginaAtual < curso.paginas.length - 1) {
      setPaginaAtual(paginaAtual + 1);
    } else {
      const resultado = CursoService.verificarConclusaoCurso(progressoCurso, curso);
      
      if (resultado.podeCompletar) {
        Alert.alert(
          'Curso Concluído!',
          `Parabéns! Você concluiu o curso com ${resultado.percentualAcerto}% de acerto.`,
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
        {curso.titulo} - Página {paginaAtual + 1}/{curso.paginas.length}
      </Text>
      
      <CursoViewer
        pagina={curso.paginas[paginaAtual]}
        onProximaPagina={proximaPagina}
        questoesRespondidas={progressoCurso.questoesRespondidas}
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