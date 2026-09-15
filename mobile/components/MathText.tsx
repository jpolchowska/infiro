import { View } from 'react-native';
import { Text } from './Text';

type MathTextProps = {
  children: string;
  className?: string;
  color?: string;
};

const HAS_MARKUP = /\d+\/\d+|\*\*[^*]+\*\*/;
const BOLD_SPAN = /(\*\*[^*]+\*\*)/;
const FRACTION_WORD = /^(\D*)(\d+)\/(\d+)(\D*)$/;

function Fraction({ n, d, className, color }: { n: string; d: string; className?: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', marginHorizontal: 2 }}>
      <Text className={className}>{n}</Text>
      <View style={{ alignSelf: 'stretch', height: 1.5, marginVertical: 1, backgroundColor: color }} />
      <Text className={className}>{d}</Text>
    </View>
  );
}

function renderWords(text: string, key: string, className: string | undefined, color: string) {
  return text.split(/(\s+)/).map((word, i) => {
    if (word === '' || /^\s+$/.test(word)) {
      return (
        <Text key={`${key}-${i}`} className={className}>
          {' '}
        </Text>
      );
    }

    const match = word.match(FRACTION_WORD);
    if (!match) {
      return (
        <Text key={`${key}-${i}`} className={className}>
          {word}
        </Text>
      );
    }

    const [, pre, n, d, post] = match;
    return (
      <View key={`${key}-${i}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
        {pre ? <Text className={className}>{pre}</Text> : null}
        <Fraction n={n} d={d} className={className} color={color} />
        {post ? <Text className={className}>{post}</Text> : null}
      </View>
    );
  });
}

export function MathText({ children, className, color = '#142284' }: MathTextProps) {
  if (!HAS_MARKUP.test(children)) {
    return <Text className={className}>{children}</Text>;
  }

  const boldClassName = className ? `${className} font-manrope-bold` : 'font-manrope-bold';

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {children.split(BOLD_SPAN).map((segment, i) => {
        const bold = segment.match(/^\*\*([^*]+)\*\*$/);
        return bold
          ? renderWords(bold[1], `b${i}`, boldClassName, color)
          : renderWords(segment, `s${i}`, className, color);
      })}
    </View>
  );
}
