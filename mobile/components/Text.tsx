import { Text as RNText, TextProps } from 'react-native';

export function Text({ className, ...props }: TextProps) {
  return <RNText className={`font-manrope ${className ?? ''}`} {...props} />;
}
