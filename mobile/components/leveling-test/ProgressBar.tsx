import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type ProgressBarProps = {
  current: number;
  total: number;
  accentClassName?: string;
  accentColor?: string;
  trackColor?: string;
};

export function ProgressBar({
  current,
  total,
  accentClassName = 'bg-infiro-purple',
  accentColor,
  trackColor,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.round((current / total) * 100));
  const widthAnim = useRef(new Animated.Value(percent)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percent,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [percent, widthAnim]);

  return (
    <View
      className="w-full h-2.5 rounded-full overflow-hidden"
      style={{ backgroundColor: trackColor ?? 'rgba(20,34,132,0.1)' }}
    >
      <Animated.View
        className={accentColor ? 'h-2.5' : `h-2.5 ${accentClassName}`}
        style={{
          width: widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
          ...(accentColor ? { backgroundColor: accentColor } : {}),
        }}
      />
    </View>
  );
}
