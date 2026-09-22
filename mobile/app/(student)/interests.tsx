import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InterestIcon, InterestId } from '../../components/student/InterestIcon';
import { INTERESTS } from '../../lib/interests';
import { getMe, saveInterest } from '../../lib/student';
import { NEUTRAL_THEME, ThemeTokens, useTheme, useThemeRefresh } from '../../lib/theme';

type Palette = {
  screenBg: string;
  titleColor: string;
  titleFontFamily?: string;
  subtitleColor: string;
  cardBg: string;
  cardBorder: string;
  cardLabelColor: string;
  selectedColor: string;
  neutralIconBg: string;
  neutralIconColor: string;
  accentColor: string;
};

const NAVY_PALETTE: Palette = {
  screenBg: '#142284',
  titleColor: '#fefefe',
  subtitleColor: 'rgba(255,255,255,0.7)',
  cardBg: 'rgba(255,255,255,0.08)',
  cardBorder: 'transparent',
  cardLabelColor: '#fefefe',
  selectedColor: '#ff5f55',
  neutralIconBg: 'rgba(255,255,255,0.15)',
  neutralIconColor: '#fefefe',
  accentColor: '#ff5f55',
};

const LIGHT_PALETTE: Palette = {
  screenBg: '#f4f5fb',
  titleColor: '#142284',
  subtitleColor: '#6b74a8',
  cardBg: '#fefefe',
  cardBorder: '#edeff6',
  cardLabelColor: '#142284',
  selectedColor: '#142284',
  neutralIconBg: 'rgba(20,34,132,0.08)',
  neutralIconColor: '#8b93bd',
  accentColor: '#ff5f55',
};

function paletteFromTheme(theme: ThemeTokens): Palette {
  return {
    screenBg: theme.bg,
    titleColor: theme.textPrimary,
    titleFontFamily: theme.headingFontFamily,
    subtitleColor: theme.textSecondary,
    cardBg: theme.surface,
    cardBorder: theme.surfaceBorder,
    cardLabelColor: theme.textPrimary,
    selectedColor: theme.accent,
    neutralIconBg: theme.surfaceMuted,
    neutralIconColor: theme.textSecondary,
    accentColor: theme.accent,
  };
}

export default function InterestsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isChangeFlow = from === 'profile';
  const activeTheme = useTheme();
  const palette: Palette = isChangeFlow
    ? activeTheme === NEUTRAL_THEME
      ? LIGHT_PALETTE
      : paletteFromTheme(activeTheme)
    : NAVY_PALETTE;

  const [picked, setPicked] = useState<InterestId | null>(null);
  const refreshTheme = useThemeRefresh();
  const [levelingTestCompleted, setLevelingTestCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getMe()
      .then((me) => {
        if (active) {
          setLevelingTestCompleted(me.levelingTestCompleted);
          if (me.interest) setPicked(me.interest as InterestId);
        }
      })
      .catch((error) => console.error('Failed to load /me:', error));
    return () => {
      active = false;
    };
  }, []);

  const goNext = () => {
    if (isChangeFlow) {
      router.replace('/(student)/profile');
      return;
    }
    router.replace(levelingTestCompleted ? '/(student)/home' : '/(student)/leveling-test');
  };

  const handleDone = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveInterest(picked);
      refreshTheme();
    } catch (error) {
      console.error('Failed to save interest:', error);
    } finally {
      setSaving(false);
      goNext();
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: palette.screenBg }} edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{ color: palette.accentColor, letterSpacing: 1.5 }}
          className="font-manrope-bold text-[12px] uppercase mb-3.5"
        >
          Zainteresowania
        </Text>
        <Text
          style={[
            { color: palette.titleColor },
            palette.titleFontFamily ? { fontFamily: palette.titleFontFamily } : null,
          ]}
          className="font-manrope-extrabold text-[30px] leading-[34px] mb-2"
        >
          Jaki motyw wolisz?
        </Text>
        <Text
          style={{ color: palette.subtitleColor }}
          className="font-manrope-medium text-[15px] leading-[22px] mb-[22px]"
        >
          {isChangeFlow
            ? 'Zmienia wygląd aplikacji i tematy zadań.'
            : 'Zmienia wygląd aplikacji i tematy zadań. Możesz to potem zmienić w profilu.'}
        </Text>

        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          <Pressable
            onPress={() => setPicked(null)}
            className="justify-between rounded-[17px] p-4"
            style={{
              width: '47%',
              minHeight: 118,
              gap: 14,
              borderWidth: 2,
              borderColor: picked === null ? palette.selectedColor : palette.cardBorder,
              backgroundColor: palette.cardBg,
            }}
          >
            <View
              style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: palette.neutralIconBg }}
              className="items-center justify-center"
            >
              <Ionicons name="sparkles-outline" size={22} color={palette.neutralIconColor} />
            </View>
            <Text style={{ color: palette.cardLabelColor }} className="font-manrope-extrabold text-[15px]">
              Neutralny
            </Text>
            {picked === null && (
              <View
                className="absolute top-3 right-3 items-center justify-center"
                style={{ width: 22, height: 22, borderRadius: 100, backgroundColor: palette.selectedColor }}
              >
                <Ionicons name="checkmark" size={14} color="#fefefe" />
              </View>
            )}
          </Pressable>

          {INTERESTS.map((item) => {
            const isOn = picked === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setPicked(item.id)}
                className="justify-between rounded-[17px] p-4"
                style={{
                  width: '47%',
                  minHeight: 118,
                  gap: 14,
                  borderWidth: 2,
                  borderColor: isOn ? palette.selectedColor : palette.cardBorder,
                  backgroundColor: palette.cardBg,
                }}
              >
                <View
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: item.tile }}
                  className="items-center justify-center"
                >
                  <InterestIcon id={item.id} size={24} />
                </View>
                <Text style={{ color: palette.cardLabelColor }} className="font-manrope-extrabold text-[15px]">
                  {item.label}
                </Text>
                {isOn && (
                  <View
                    className="absolute top-3 right-3 items-center justify-center"
                    style={{ width: 22, height: 22, borderRadius: 100, backgroundColor: palette.selectedColor }}
                  >
                    <Ionicons name="checkmark" size={14} color="#fefefe" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 30 }}>
        <Pressable
          onPress={handleDone}
          disabled={saving}
          className="rounded-2xl items-center justify-center"
          style={{
            height: 60,
            backgroundColor: palette.accentColor,
            opacity: saving ? 0.6 : 1,
            shadowColor: palette.accentColor,
            shadowOpacity: 0.5,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Text className="text-infiro-white font-manrope-extrabold text-[17px]">Gotowe</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
