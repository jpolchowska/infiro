import { Text as RNText, TextProps } from 'react-native';

// Domyślny font aplikacji. Goły <Text> bez klasy font-* dostaje Manrope,
// zamiast systemowego kroju (San Francisco na iOS, Roboto na Androidzie).
// Klasy NativeWind (font-manrope-bold itd.) trafiają do `style` i nadpisują
// tę wartość, bo są dalej w tablicy.
export function Text({ style, ...props }: TextProps) {
  return <RNText style={[{ fontFamily: 'Manrope_400Regular' }, style]} {...props} />;
}
