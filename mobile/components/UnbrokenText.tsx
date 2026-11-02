import type { TextStyle } from 'react-native';
import { View } from 'react-native';
import { Text } from './Text';

type UnbrokenTextProps = {
  children: string;
  className?: string;
  style?: TextStyle;
  wordGap?: number;
};

export function UnbrokenText({ children, className, style, wordGap = 4 }: UnbrokenTextProps) {
  const words = children.split(/\s+/).filter(Boolean);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: wordGap }}>
      {words.map((word, index) => (
        <Text
          key={`${word}-${index}`}
          numberOfLines={1}
          adjustsFontSizeToFit
          className={className}
          style={[{ maxWidth: '100%' }, style]}
        >
          {word}
        </Text>
      ))}
    </View>
  );
}
