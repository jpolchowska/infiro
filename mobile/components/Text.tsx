import { Text as RNText, TextProps } from 'react-native';

// Domyślny font aplikacji. Goły <Text> bez klasy font-* dostaje Manrope,
// zamiast systemowego kroju (San Francisco na iOS, Roboto na Androidzie).
// Baza idzie przez className (nie inline style!) -- w NativeWind v4 inline
// style wygrywa z className, więc font-manrope-bold itd. muszą móc ją nadpisać.
// Klucz `manrope` jest w tailwind.config wcześniej niż warianty wagowe, więc
// font-manrope-bold ma pierwszeństwo nad font-manrope.
export function Text({ className, ...props }: TextProps) {
  return <RNText className={`font-manrope ${className ?? ''}`} {...props} />;
}
