import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../Text';
import { ProgressBar } from '../leveling-test/ProgressBar';

const NAVY = '#142284';

type TaskHeaderProps = {
  title: string;
  onClose: () => void;
  right?: ReactNode;
  progress?: { current: number; total: number };
  accentClassName?: string;
  accentColor?: string;
  trackColor?: string;
  closeButtonColor?: string;
  closeIconColor?: string;
  titleColor?: string;
};

export function TaskHeader({
  title,
  onClose,
  right,
  progress,
  accentClassName,
  accentColor,
  trackColor,
  closeButtonColor,
  closeIconColor = NAVY,
  titleColor = '#8b93bd',
}: TaskHeaderProps) {
  return (
    <View className="px-5" style={{ paddingTop: 4, paddingBottom: 6 }}>
      <View className="flex-row items-center justify-between" style={{ paddingBottom: 12 }}>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: closeButtonColor ?? 'rgba(20,34,132,0.06)' }}
        >
          <Ionicons name="close" size={18} color={closeIconColor} />
        </Pressable>
        <Text className="font-manrope-semibold text-[13px]" style={{ color: titleColor }}>
          {title}
        </Text>
        <View className="items-end justify-center" style={{ minWidth: 36 }}>
          {right}
        </View>
      </View>
      {progress && progress.total > 0 ? (
        <ProgressBar
          current={progress.current}
          total={progress.total}
          accentClassName={accentClassName}
          accentColor={accentColor}
          trackColor={trackColor}
        />
      ) : null}
    </View>
  );
}
