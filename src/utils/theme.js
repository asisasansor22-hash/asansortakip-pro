import { Platform } from 'react-native';
import { COLORS } from './constants';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fonts = {
  regular: { fontFamily, fontWeight: '400' },
  medium: { fontFamily, fontWeight: '500' },
  bold: { fontFamily, fontWeight: '700' },
  heavy: { fontFamily, fontWeight: '900' },
};

export function getTheme(mode) {
  const c = mode === 'light' ? COLORS.light : COLORS.dark;
  return {
    dark: mode !== 'light',
    colors: {
      primary: c.accent,
      background: c.bg,
      card: c.bgPanel,
      text: c.text,
      border: c.border,
      notification: c.iosRed,
    },
    fonts,
    custom: c,
  };
}
