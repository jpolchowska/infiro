import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Image, View } from 'react-native';
import { MathText } from '../MathText';
import { Text } from '../Text';
import { CalloutStyle, EbookBlock } from '../../lib/ebook';
import { ThemeTokens, useTheme, withAlpha } from '../../lib/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function calloutConfig(
  style: CalloutStyle,
  theme: ThemeTokens
): { label: string; bg: string; border: string; icon: IoniconName; accent: string } {
  const CONFIG: Record<Exclude<CalloutStyle, 'definicja'>, { label: string; bg: string; border: string; icon: IoniconName; accent: string }> = {
    zapamietaj: { label: 'Zapamiętaj', bg: 'rgba(240,182,126,0.2)', border: '#f0b67e', icon: 'bookmark', accent: '#b9772e' },
    wskazowka: { label: 'Wskazówka', bg: 'rgba(200,115,217,0.15)', border: '#c873d9', icon: 'bulb', accent: '#8a3fa3' },
    uwaga: { label: 'Uwaga', bg: 'rgba(255,95,85,0.1)', border: '#ff5f55', icon: 'alert-circle', accent: '#d6483f' },
  };
  if (style === 'definicja') {
    return {
      label: 'Definicja',
      bg: withAlpha(theme.textPrimary, 0.06),
      border: theme.textPrimary,
      icon: 'information-circle',
      accent: theme.textPrimary,
    };
  }
  return CONFIG[style];
}

export function EbookRenderer({ blocks }: { blocks: EbookBlock[] }) {
  return (
    <View>
      {blocks.map((block, i) => (
        <EbookBlockView key={i} block={block} />
      ))}
    </View>
  );
}

function EbookBlockView({ block }: { block: EbookBlock }) {
  const theme = useTheme();
  const textClass = theme.isDark ? 'text-infiro-white' : 'text-infiro-navy';

  switch (block.type) {
    case 'heading':
      return (
        <View className="flex-row items-center" style={{ gap: 9, marginTop: 26, marginBottom: 8 }}>
          <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: theme.accent }} />
          <MathText
            className={`${textClass} text-[19px] flex-1`}
            color={theme.textPrimary}
            style={{ fontFamily: theme.headingFontFamily }}
          >
            {block.text}
          </MathText>
        </View>
      );

    case 'subheading':
      return (
        <View style={{ marginTop: 18, marginBottom: 4 }}>
          <MathText
            className={`${textClass} text-[16px]`}
            color={theme.textPrimary}
            style={{ fontFamily: theme.headingFontFamily }}
          >
            {block.text}
          </MathText>
        </View>
      );

    case 'paragraph':
      return (
        <View style={{ marginBottom: 8 }}>
          <MathText
            className={`${textClass} font-manrope-medium text-[16px] leading-[24px]`}
            color={theme.textPrimary}
          >
            {block.text}
          </MathText>
        </View>
      );

    case 'list':
      return (
        <View style={{ marginBottom: 8, gap: 8 }}>
          {block.items.map((item, i) => (
            <View key={i} className="flex-row items-start" style={{ gap: 10 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3, backgroundColor: theme.accent, marginTop: 8 }} />
              <MathText
                className={`${textClass} font-manrope-medium text-[16px] leading-[24px] flex-1`}
                color={theme.textPrimary}
              >
                {item}
              </MathText>
            </View>
          ))}
        </View>
      );

    case 'image':
      return (
        <View style={{ marginVertical: 12 }}>
          <Image
            source={{ uri: block.src }}
            style={{
              width: '100%',
              aspectRatio: block.width / block.height,
              borderRadius: 18,
              backgroundColor: withAlpha(theme.textPrimary, 0.05),
            }}
            resizeMode="cover"
          />
          {block.alt ? (
            <Text style={{ color: theme.textSecondary }} className="font-manrope-semibold text-xs text-center mt-2">
              {block.alt}
            </Text>
          ) : null}
        </View>
      );

    case 'callout': {
      const config = calloutConfig(block.style, theme);
      return (
        <View
          style={{
            marginVertical: 10,
            padding: 15,
            borderRadius: 16,
            backgroundColor: config.bg,
            borderLeftWidth: 4,
            borderLeftColor: config.border,
          }}
        >
          <View className="flex-row items-center" style={{ gap: 6, marginBottom: 4 }}>
            <Ionicons name={config.icon} size={14} color={config.accent} />
            <Text
              className="font-manrope-bold text-[11px] uppercase"
              style={{ color: config.accent, letterSpacing: 1 }}
            >
              {config.label}
            </Text>
          </View>
          <MathText className={`${textClass} font-manrope-semibold text-[15px]`} color={theme.textPrimary}>
            {block.text}
          </MathText>
        </View>
      );
    }

    default:
      return null;
  }
}
