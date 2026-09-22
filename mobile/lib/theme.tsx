import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe } from './student';
import type { InterestId } from '../components/student/InterestIcon';

export type ThemeTokens = {
  bg: string;
  textPrimary: string;
  textSecondary: string;
  surface: string;
  surfaceBorder: string;
  surfaceMuted: string;
  heroFrom: string;
  heroTo: string;
  accent: string;
  accentInk: string;
  topicColors: [string, string, string, string];
  headingFontFamily: string;
};

export const NEUTRAL_THEME: ThemeTokens = {
  bg: '#f4f5fb',
  textPrimary: '#142284',
  textSecondary: '#8b93bd',
  surface: '#ffffff',
  surfaceBorder: 'rgba(20,34,132,0.12)',
  surfaceMuted: 'rgba(20,34,132,0.06)',
  heroFrom: '#142284',
  heroTo: '#142284',
  accent: '#ff5f55',
  accentInk: '#ffffff',
  topicColors: ['#ff5f55', '#c873d9', '#f0b67e', '#142284'],
  headingFontFamily: 'Manrope_800ExtraBold',
};

export const THEMES: Record<InterestId, ThemeTokens> = {
  sport: {
    bg: '#F2F7FC',
    textPrimary: '#0B2545',
    textSecondary: '#5A7290',
    surface: '#FFFFFF',
    surfaceBorder: '#DCEAF7',
    surfaceMuted: '#E4EEF9',
    heroFrom: '#0B4F9E',
    heroTo: '#08325E',
    accent: '#FF7A1A',
    accentInk: '#FFFFFF',
    topicColors: ['#0B84E0', '#FF7A1A', '#2FA84F', '#E63946'],
    headingFontFamily: 'Oswald_700Bold',
  },
  gry: {
    bg: '#0E0E1A',
    textPrimary: '#F1F2FF',
    textSecondary: '#8B90C9',
    surface: '#17182B',
    surfaceBorder: '#2A2C4A',
    surfaceMuted: '#23264A',
    heroFrom: '#241852',
    heroTo: '#120B26',
    accent: '#7C4FE0',
    accentInk: '#FFFFFF',
    topicColors: ['#29E0C8', '#7C4FE0', '#FF4FA3', '#F5D949'],
    headingFontFamily: 'Rajdhani_700Bold',
  },
  lego: {
    bg: '#FFF7E8',
    textPrimary: '#1C2B6B',
    textSecondary: '#6B7290',
    surface: '#FFFFFF',
    surfaceBorder: '#FFE29A',
    surfaceMuted: '#FFF0C4',
    heroFrom: '#D8232A',
    heroTo: '#A81920',
    accent: '#FFC400',
    accentInk: '#1C2B6B',
    topicColors: ['#D8232A', '#0055BF', '#FFC400', '#237841'],
    headingFontFamily: 'TitanOne_400Regular',
  },
  zwierzeta: {
    bg: '#F5EFDD',
    textPrimary: '#3B2A1A',
    textSecondary: '#8A7859',
    surface: '#FFFDF6',
    surfaceBorder: '#E8DCC0',
    surfaceMuted: '#EFE6CE',
    heroFrom: '#3D5C3A',
    heroTo: '#4A3423',
    accent: '#E08A2E',
    accentInk: '#FFFFFF',
    topicColors: ['#2F8F5B', '#E08A2E', '#C9622B', '#8B5E34'],
    headingFontFamily: 'Baloo2_700Bold',
  },
  rysowanie: {
    bg: '#FFFBF2',
    textPrimary: '#2B2440',
    textSecondary: '#8C84A8',
    surface: '#FFFFFF',
    surfaceBorder: '#EFE6FF',
    surfaceMuted: '#F2ECFF',
    heroFrom: '#7C3AED',
    heroTo: '#5B2BC7',
    accent: '#E4457A',
    accentInk: '#FFFFFF',
    topicColors: ['#E4457A', '#FFC24B', '#22B8CF', '#7C3AED'],
    headingFontFamily: 'BodoniModa_700Bold',
  },
  muzyka: {
    bg: '#F7F3FF',
    textPrimary: '#2D1B4E',
    textSecondary: '#8A7AAE',
    surface: '#FFFFFF',
    surfaceBorder: '#EAE0FF',
    surfaceMuted: '#EFE7FB',
    heroFrom: '#2D1B4E',
    heroTo: '#1D1035',
    accent: '#FF4FA0',
    accentInk: '#FFFFFF',
    topicColors: ['#FF4FA0', '#0FA89A', '#FFC24B', '#7C4FE0'],
    headingFontFamily: 'PlayfairDisplay_700Bold_Italic',
  },
  jedzenie: {
    bg: '#FFF6EC',
    textPrimary: '#5C2E1A',
    textSecondary: '#9C7A63',
    surface: '#FFFFFF',
    surfaceBorder: '#FBE4C8',
    surfaceMuted: '#FCE7CE',
    heroFrom: '#D94F2B',
    heroTo: '#B83C1E',
    accent: '#F2A93B',
    accentInk: '#5C2E1A',
    topicColors: ['#D94F2B', '#6BBF59', '#F2C14E', '#8E5B3F'],
    headingFontFamily: 'Fraunces_700Bold',
  },
};

export function themeFor(interest: string | null | undefined): ThemeTokens {
  if (interest && interest in THEMES) return THEMES[interest as InterestId];
  return NEUTRAL_THEME;
}

export function topicColor(theme: ThemeTokens, index: number): string {
  return theme.topicColors[((index % 4) + 4) % 4];
}

export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type ThemeContextValue = { theme: ThemeTokens; refresh: () => void };

const ThemeContext = createContext<ThemeContextValue>({
  theme: NEUTRAL_THEME,
  refresh: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [interest, setInterest] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getMe()
      .then((me) => setInterest(me.interest))
      .catch((error) => console.warn('Failed to load interest for theme:', error));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: ThemeContextValue = { theme: themeFor(interest), refresh };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeRefresh(): () => void {
  return useContext(ThemeContext).refresh;
}

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext).theme;
}
