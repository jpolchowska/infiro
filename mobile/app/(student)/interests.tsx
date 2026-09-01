import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InterestIcon, InterestId } from '../../components/student/InterestIcon';
import { INTERESTS } from '../../lib/interests';
import { getMe, saveInterest } from '../../lib/student';

const CTA_SHADOW = {
  shadowColor: '#ff5f55',
  shadowOpacity: 0.5,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

export default function InterestsScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [picked, setPicked] = useState<InterestId | null>(null);
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
    if (from === 'profile') {
      router.replace('/(student)/profile');
      return;
    }
    router.replace(levelingTestCompleted ? '/(student)/home' : '/(student)/leveling-test');
  };

  const handleDone = async () => {
    if (saving) return;
    // Bez wybranej opcji nie wołamy PATCH -- backend nie przyjmuje jeszcze
    // `null` (patrz uwagi dla backendu). Zachowujemy się jak "Pomiń".
    if (picked === null) {
      goNext();
      return;
    }
    setSaving(true);
    try {
      await saveInterest(picked);
    } catch (error) {
      console.error('Failed to save interest:', error);
    } finally {
      setSaving(false);
      goNext();
    }
  };

  const pickedLabel = picked
    ? 'Wybrane: ' + (INTERESTS.find((i) => i.id === picked)?.label ?? '')
    : 'Możesz wybrać jedną rzecz';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
      <View className="flex-1 px-[22px] pt-4" style={{ paddingBottom: 30 }}>
        <Text
          style={{ color: '#ff5f55', letterSpacing: 1.5 }}
          className="font-bold text-[12px] uppercase mb-3.5"
        >
          Zanim zaczniemy
        </Text>
        <Text className="text-infiro-navy font-extrabold text-[30px] leading-[34px] mb-2">
          Co lubisz najbardziej?
        </Text>
        <Text style={{ color: '#6b74a8' }} className="font-medium text-[15px] leading-[22px] mb-[22px]">
          Wybierz jedną rzecz — zadania będą o tym, co lubisz. Zawsze możesz to zmienić w profilu.
        </Text>

        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {INTERESTS.map((item) => {
            const isOn = picked === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setPicked((prev) => (prev === item.id ? null : item.id))}
                className="justify-between rounded-[17px] border-2 p-4"
                style={{
                  width: '47%',
                  minHeight: 118,
                  gap: 14,
                  borderColor: isOn ? '#142284' : 'transparent',
                  backgroundColor: isOn ? '#eceffa' : '#fefefe',
                }}
              >
                <View
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: item.tile }}
                  className="items-center justify-center"
                >
                  <InterestIcon id={item.id} size={24} />
                </View>
                <Text className="text-infiro-navy font-extrabold text-[15px]">{item.label}</Text>
                {isOn && (
                  <View
                    className="absolute top-3 right-3 items-center justify-center bg-infiro-navy"
                    style={{ width: 22, height: 22, borderRadius: 100 }}
                  >
                    <Ionicons name="checkmark" size={14} color="#fefefe" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="flex-1" style={{ minHeight: 20 }} />

        <Text style={{ color: '#8b93bd' }} className="font-semibold text-[13px] text-center mb-3">
          {pickedLabel}
        </Text>

        <Pressable
          onPress={handleDone}
          disabled={saving || !picked}
          className="rounded-full items-center justify-center"
          style={[{ height: 60, backgroundColor: '#ff5f55', opacity: picked ? 1 : 0.45 }, CTA_SHADOW]}
        >
          <Text className="text-infiro-white font-extrabold text-[17px]">Gotowe</Text>
        </Pressable>
        <Pressable onPress={goNext} className="items-center justify-center mt-1" style={{ height: 44 }}>
          <Text style={{ color: '#8b93bd' }} className="font-semibold text-[13px]">
            Pomiń na razie
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
