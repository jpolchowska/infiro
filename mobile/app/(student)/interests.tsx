import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '../../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InterestIcon, InterestId } from '../../components/student/InterestIcon';
import { INTERESTS } from '../../lib/interests';
import { getMe, saveInterest } from '../../lib/student';
import { useThemeRefresh } from '../../lib/theme';

const CTA_SHADOW = {
  shadowColor: '#ff5f55',
  shadowOpacity: 0.5,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

const NAVY_PALETTE = {
  screenClassName: 'bg-infiro-navy',
  screenBg: undefined as string | undefined,
  titleClassName: 'text-infiro-white',
  subtitleColor: 'rgba(255,255,255,0.7)',
  cardBg: 'rgba(255,255,255,0.08)',
  cardBorder: 'transparent',
  cardLabelClassName: 'text-infiro-white',
  selectedColor: '#ff5f55',
  neutralIconBg: 'rgba(255,255,255,0.15)',
  neutralIconColor: '#fefefe',
};

const LIGHT_PALETTE = {
  screenClassName: '',
  screenBg: '#f4f5fb',
  titleClassName: 'text-infiro-navy',
  subtitleColor: '#6b74a8',
  cardBg: '#fefefe',
  cardBorder: '#edeff6',
  cardLabelClassName: 'text-infiro-navy',
  selectedColor: '#142284',
  neutralIconBg: 'rgba(20,34,132,0.08)',
  neutralIconColor: '#8b93bd',
};

export default function InterestsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isChangeFlow = from === 'profile';
  const palette = isChangeFlow ? LIGHT_PALETTE : NAVY_PALETTE;

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
    <SafeAreaView
      className={`flex-1 ${palette.screenClassName}`}
      style={palette.screenBg ? { backgroundColor: palette.screenBg } : undefined}
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{ color: '#ff5f55', letterSpacing: 1.5 }}
          className="font-manrope-bold text-[12px] uppercase mb-3.5"
        >
          Zainteresowania
        </Text>
        <Text className={`${palette.titleClassName} font-manrope-extrabold text-[30px] leading-[34px] mb-2`}>
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
            <Text className={`${palette.cardLabelClassName} font-manrope-extrabold text-[15px]`}>Neutralny</Text>
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
                <Text className={`${palette.cardLabelClassName} font-manrope-extrabold text-[15px]`}>
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
          style={[{ height: 60, backgroundColor: '#ff5f55', opacity: saving ? 0.6 : 1 }, CTA_SHADOW]}
        >
          <Text className="text-infiro-white font-manrope-extrabold text-[17px]">Gotowe</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
