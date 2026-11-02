import { Text as RNText, TextProps } from 'react-native';

const MAX_FONT_SCALE = 1.3;

export function Text({ className, ...props }: TextProps) {
  return <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} className={`font-manrope ${className ?? ''}`} {...props} />;
}
