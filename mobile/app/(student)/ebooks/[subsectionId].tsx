import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EbookRenderer } from '../../../components/ebook/EbookRenderer';
import { Text } from '../../../components/Text';
import { ErrorState } from '../../../components/student/ErrorState';
import { Ebook, getEbook } from '../../../lib/ebook';

const NAVY = '#142284';

export default function EbookScreen() {
  const { subsectionId } = useLocalSearchParams<{ subsectionId: string }>();
  const [ebook, setEbook] = useState<Ebook | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    setEbook(undefined);
    getEbook(Number(subsectionId))
      .then((data) => {
        if (active) setEbook(data);
      })
      .catch((e) => {
        console.warn('Failed to load ebook:', e);
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [subsectionId, reload]);

  if (error) {
    return (
      <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
        <SafeAreaView className="flex-1">
          <ErrorState onRetry={() => setReload((n) => n + 1)} />
        </SafeAreaView>
      </View>
    );
  }

  if (ebook === undefined) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#f4f5fb' }}>
        <ActivityIndicator color={NAVY} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#f4f5fb' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <View
          className="flex-row items-center justify-between px-5"
          style={{ paddingTop: 4, paddingBottom: 8 }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(20,34,132,0.06)' }}
          >
            <Ionicons name="close" size={18} color={NAVY} />
          </Pressable>
          <Text className="font-manrope-semibold text-[13px]" style={{ color: '#8b93bd' }}>
            Teoria
          </Text>
          <View className="w-9" />
        </View>

        {ebook === null ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-infiro-navy font-manrope-extrabold text-lg text-center">
              Teoria jeszcze niedostępna
            </Text>
            <Text style={{ color: '#8b93bd' }} className="font-manrope-medium text-[13px] text-center mt-2">
              Wróć tu później — nauczyciel jeszcze nie dodał treści do tej podsekcji.
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-infiro-navy font-manrope-extrabold text-[26px] leading-[30px]">
              {ebook.title}
            </Text>
            {ebook.intro && (
              <Text
                style={{ color: '#5a6392' }}
                className="font-manrope-medium text-[14px] leading-[20px] mt-2.5"
              >
                {ebook.intro}
              </Text>
            )}

            <View style={{ marginTop: 10 }}>
              <EbookRenderer blocks={ebook.blocks} />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
