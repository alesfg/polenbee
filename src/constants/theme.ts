import { Platform } from 'react-native';

export const Colors = {
  bg: '#FBF3E3',
  bgSheet: '#EFE6D3',
  card: '#FFFFFF',
  textPrimary: '#3A2C1D',
  textMuted: '#9A8A70',
  textMuted2: '#8A7660',
  honeyPrimary: '#E3963E',
  honeyDark: '#B9691F',
  honeyLight: '#F7D9A0',
  honeySoft: '#FCEBC9',
  honeyFaint: '#F1E8D3',
  greenPrimary: '#5B7F42',
  greenDark: '#3F5C2E',
  greenLight: '#EAF1DE',
  statusFuerteFg: '#3F5C2E',
  statusFuerteBg: '#EAF1DE',
  statusMediaFg: '#A97A0B',
  statusMediaBg: '#FCEEC9',
  statusDebilFg: '#C0392B',
  statusDebilBg: '#FBE4E1',
  tabInactive: '#C4B896',
  border: '#EFE2C9',
  border2: '#E7DAB9',
} as const;

export const Fonts = Platform.select({
  ios: {
    heading: 'Nunito',
    body: 'NunitoSans',
  },
  android: {
    heading: 'Nunito',
    body: 'NunitoSans',
  },
  default: {
    heading: 'Nunito',
    body: 'NunitoSans',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const TAB_BAR_HEIGHT = 84;
