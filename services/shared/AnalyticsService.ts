import Constants, { ExecutionEnvironment } from 'expo-constants';

// @react-native-firebase não funciona no Expo Go (módulo nativo ausente).
// O require é feito de forma lazy — só executado em builds nativos.
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function firebaseAnalytics() {
  return (require('@react-native-firebase/analytics').default)();
}

export const AnalyticsService = {
  async trackScreen(screenName: string): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      await firebaseAnalytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });
    } catch {}
  },

  async trackLogin(method = 'email'): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      await firebaseAnalytics().logLogin({ method });
    } catch {}
  },

  async trackSignUp(method = 'email'): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      await firebaseAnalytics().logSignUp({ method });
    } catch {}
  },

  async setUser(userId: string, role?: string): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      const a = firebaseAnalytics();
      await a.setUserId(userId);
      if (role) await a.setUserProperty('role', role);
    } catch {}
  },

  async clearUser(): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      await firebaseAnalytics().setUserId(null);
    } catch {}
  },

  async trackCourseStart(cursoId: string, cursoNome: string): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      await firebaseAnalytics().logEvent('course_start', {
        course_id: cursoId,
        course_name: cursoNome,
      });
    } catch {}
  },

  async trackQuestaoRespondida(params: {
    cursoId: string;
    questaoId: string;
    acertou: boolean;
    tempoSegundos?: number;
  }): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      await firebaseAnalytics().logEvent('questao_respondida', {
        course_id: params.cursoId,
        questao_id: params.questaoId,
        acertou: params.acertou ? 1 : 0,
        tempo_segundos: params.tempoSegundos ?? 0,
      });
    } catch {}
  },

  async trackFaseCompleta(cursoId: string, fase: number): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      await firebaseAnalytics().logEvent('fase_completa', {
        course_id: cursoId,
        fase_numero: fase,
      });
    } catch {}
  },

  async trackBadgeConquistado(badgeId: string, badgeNome: string): Promise<void> {
    if (IS_EXPO_GO) return;
    try {
      await firebaseAnalytics().logEvent('badge_conquistado', {
        badge_id: badgeId,
        badge_nome: badgeNome,
      });
    } catch {}
  },
};
