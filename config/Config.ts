import Constants from 'expo-constants';

/**
 * Configurações centralizadas do aplicativo
 * Valores lidos de app.json (extra) com fallbacks
 */

// Configurações dos servidores Jobe
const JOBE_SERVERS = {
  primary: {
    name: '🔒 Servidor Privado',
    baseUrl: 'http://167.234.251.218/jobe/',
    apiKey: '2AAA7A5415B4A9B394B54BF1DFFFF',
    timeout: 10000,
  },
  fallback: {
    name: '🌐 Servidor Público (Canterbury)',
    baseUrl: 'http://jobe2.cosc.canterbury.ac.nz',
    apiKey: '2AAA7A5415B4A9B394B54BF1D2E9D',
    timeout: 15000,
  },
};

export const Config = {
  // Jobe API Configuration
  jobe: {
    primary: JOBE_SERVERS.primary,
    fallback: JOBE_SERVERS.fallback,
    // Configuração ativa (será definida dinamicamente)
    active: JOBE_SERVERS.primary,
  },

  // App Configuration
  app: {
    name: Constants.expoConfig?.name || 'PDM Guilherme',
    version: Constants.expoConfig?.version || '1.0.0',
    isDev: __DEV__,
  },

  // Métodos para gerenciar servidores
  setActiveJobeServer(serverType: 'primary' | 'fallback') {
    this.jobe.active = JOBE_SERVERS[serverType];
    console.log(`[Config] Servidor Jobe ativo alterado para: ${this.jobe.active.name}`);
  },

  resetToPrimary() {
    this.jobe.active = JOBE_SERVERS.primary;
  },

  // Debug helper
  logConfig() {
    console.log('[Config] Configurações atuais:', {
      jobe: {
        active: {
          name: this.jobe.active.name,
          baseUrl: this.jobe.active.baseUrl,
          apiKey: this.jobe.active.apiKey ? `${this.jobe.active.apiKey.substring(0, 8)}...` : 'não definida',
        },
        primary: {
          name: this.jobe.primary.name,
          baseUrl: this.jobe.primary.baseUrl,
        },
        fallback: {
          name: this.jobe.fallback.name,
          baseUrl: this.jobe.fallback.baseUrl,
        },
      },
      app: this.app,
    });
  },
};