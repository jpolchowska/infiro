import type { TextStyle } from 'react-native';
import { View } from 'react-native';
import { Text } from './Text';

type MathTextProps = {
  children: string;
  className?: string;
  color?: string;
  style?: TextStyle;
};

const HAS_MARKUP = /\d+\/\d+|\*\*[^*]+\*\*/;
const BOLD_SPAN = /(\*\*[^*]+\*\*)/;
const FRACTION_WORD = /^(\D*)(\d+)\/(\d+)(\D*)$/;
const TEXT_CLASS = /^(text-|font-|leading-|tracking-|italic$|underline$|uppercase$|lowercase$|capitalize$)/;

function splitClassName(className?: string) {
  const text: string[] = [];
  const layout: string[] = [];
  for (const token of (className ?? '').split(/\s+/).filter(Boolean)) {
    (TEXT_CLASS.test(token) ? text : layout).push(token);
  }
  return { textClass: text.join(' '), layoutClass: layout.join(' ') };
}

function Fraction({
  n,
  d,
  className,
  color,
  style,
}: {
  n: string;
  d: string;
  className?: string;
  color: string;
  style?: TextStyle;
}) {
  return (
    <View style={{ alignItems: 'center', marginHorizontal: 2, flexShrink: 0 }}>
      <Text
        className={className}
        style={{ includeFontPadding: false, margin: 0, marginBottom: 0, marginTop: 0, ...style }}
      >
        {n}
      </Text>
      <View style={{ alignSelf: 'stretch', height: 1.5, marginVertical: 0.5, backgroundColor: color }} />
      <Text
        className={className}
        style={{ includeFontPadding: false, margin: 0, marginBottom: 0, marginTop: 0, ...style }}
      >
        {d}
      </Text>
    </View>
  );
}

function renderWords(
  text: string,
  key: string,
  className: string | undefined,
  color: string,
  style: TextStyle | undefined
) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return /\s/.test(text)
      ? [
          <Text key={`${key}-space`} className={className} style={style}>
            {' '}
          </Text>,
        ]
      : [];
  }

  const leading = /^\s/.test(text) ? ' ' : '';
  const trailing = /\s$/.test(text);

  return words.map((word, i) => {
    const prefix = i === 0 ? leading : '';
    const space = i < words.length - 1 || trailing ? ' ' : '';

    const match = word.match(FRACTION_WORD);
    if (!match) {
      return (
        <Text key={`${key}-${i}`} className={className} style={style}>
          {prefix + word + space}
        </Text>
      );
    }

    const [, pre, n, d, post] = match;
    const before = prefix + pre;
    const after = post + space;
    return (
      <View key={`${key}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
        {before ? (
          <Text className={className} style={style}>
            {before}
          </Text>
        ) : null}
        <Fraction n={n} d={d} className={className} color={color} style={style} />
        {after ? (
          <Text className={className} style={style}>
            {after}
          </Text>
        ) : null}
      </View>
    );
  });
}

export function MathText({ children, className, color = '#142284', style }: MathTextProps) {
  if (!HAS_MARKUP.test(children)) {
    return (
      <Text className={className} style={style}>
        {children}
      </Text>
    );
  }

  const { textClass, layoutClass } = splitClassName(className);
  const boldClassName = textClass ? `${textClass} font-manrope-bold` : 'font-manrope-bold';

  return (
    <View className={layoutClass} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {children.split(BOLD_SPAN).map((segment, i) => {
        const bold = segment.match(/^\*\*([^*]+)\*\*$/);
        return bold
          ? renderWords(bold[1], `b${i}`, boldClassName, color, style)
          : renderWords(segment, `s${i}`, textClass, color, style);
      })}
    </View>
  );
}
