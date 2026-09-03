import { router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '../Text';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVE = '#142284';
const INACTIVE = '#b3b9d6';

export function BottomTabBar() {
  const pathname = usePathname();

  const startColor = pathname === '/home' ? ACTIVE : INACTIVE;
  const naukaColor = pathname.startsWith('/sections') || pathname.startsWith('/subsections') ? ACTIVE : INACTIVE;
  const profileColor = pathname === '/profile' ? ACTIVE : INACTIVE;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(254,254,254,0.94)',
        borderTopWidth: 1,
        borderTopColor: '#e8eaf4',
      }}
    >
      <SafeAreaView edges={['bottom']}>
        <View className="flex-row gap-1.5 px-6 pt-2.5 pb-1">
          <Pressable
            onPress={() => router.replace('/(student)/home')}
            className="flex-1 items-center gap-1.5 py-1.5"
          >
            <View style={{ width: 20, height: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
              <View style={{ width: 5, height: 10, borderRadius: 3, backgroundColor: startColor }} />
              <View style={{ width: 5, height: 17, borderRadius: 3, backgroundColor: startColor }} />
              <View style={{ width: 5, height: 13, borderRadius: 3, backgroundColor: startColor }} />
            </View>
            <Text style={{ color: startColor }} className="font-manrope-bold text-[12px]">
              Start
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(student)/sections')}
            className="flex-1 items-center gap-1.5 py-1.5"
          >
            <View style={{ width: 20, height: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
              <View style={{ width: 8.5, height: 8.5, borderRadius: 4, backgroundColor: naukaColor }} />
              <View style={{ width: 8.5, height: 8.5, borderRadius: 4, backgroundColor: naukaColor }} />
              <View style={{ width: 8.5, height: 8.5, borderRadius: 4, backgroundColor: naukaColor }} />
              <View style={{ width: 8.5, height: 8.5, borderRadius: 4, backgroundColor: naukaColor }} />
            </View>
            <Text style={{ color: naukaColor }} className="font-manrope-bold text-[12px]">
              Nauka
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(student)/profile')}
            className="flex-1 items-center gap-1.5 py-1.5"
          >
            <View style={{ width: 20, height: 20, alignItems: 'center', gap: 2 }}>
              <View style={{ width: 9, height: 9, borderRadius: 100, backgroundColor: profileColor }} />
              <View
                style={{
                  width: 17,
                  height: 9,
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  borderBottomLeftRadius: 3,
                  borderBottomRightRadius: 3,
                  backgroundColor: profileColor,
                }}
              />
            </View>
            <Text style={{ color: profileColor }} className="font-manrope-bold text-[12px]">
              Profil
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
