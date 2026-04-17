import { COLORS } from './constants';

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
    custom: c,
  };
}
