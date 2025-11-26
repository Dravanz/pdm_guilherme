import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: { width, height },
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 768,
  isLargeDevice: width >= 768,
};

// Espaçamento responsivo baseado na largura da tela
export const spacing = {
  xs: width * 0.02,   // ~7px em 360px
  sm: width * 0.03,   // ~11px em 360px
  md: width * 0.04,   // ~14px em 360px
  lg: width * 0.05,   // ~18px em 360px
  xl: width * 0.06,   // ~22px em 360px
  xxl: width * 0.08,  // ~29px em 360px
};

// Padding horizontal padrão para containers
export const containerPadding = {
  horizontal: width * 0.05, // 5% da largura
  vertical: height * 0.02,  // 2% da altura
};

// Tamanhos de fonte responsivos
export const fontSize = {
  xs: width * 0.03,   // ~11px
  sm: width * 0.035,  // ~13px
  md: width * 0.04,   // ~14px
  lg: width * 0.045,  // ~16px
  xl: width * 0.05,   // ~18px
  xxl: width * 0.06,  // ~22px
  xxxl: width * 0.07, // ~25px
};

// Border radius responsivo
export const borderRadius = {
  sm: width * 0.02,   // ~7px
  md: width * 0.03,   // ~11px
  lg: width * 0.04,   // ~14px
  xl: width * 0.05,   // ~18px
};
