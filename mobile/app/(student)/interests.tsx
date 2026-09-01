import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
    setSaving(true);
    try {
      // picked === null czyści wybór (backend przyjmuje null).
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f4f5fb' }} edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 10,
          paddingBottom: 30,
          borderTopWidth: 1,
          borderTopColor: '#e8eaf4',
          backgroundColor: '#f4f5fb',
        }}
      >
        <Text style={{ color: '#8b93bd' }} className="font-semibold text-[13px] text-center mb-3">
          {pickedLabel}
        </Text>

        <Pressable
          onPress={handleDone}
          disabled={saving}
          className="rounded-full items-center justify-center"
          style={[{ height: 60, backgroundColor: '#ff5f55', opacity: saving ? 0.6 : 1 }, CTA_SHADOW]}
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
