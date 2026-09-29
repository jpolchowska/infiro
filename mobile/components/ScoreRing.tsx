import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ScoreRingProps = {
  percent: number;
  size?: number;
  strokeWidth?: number;
  colorFrom: string;
  colorTo: string;
  trackColor: string;
  label: string;
  labelColor: string;
  labelFontFamily?: string;
};

export function ScoreRing({
  percent,
  size = 180,
  strokeWidth = Math.round(size * 0.07),
  colorFrom,
  colorTo,
  trackColor,
  label,
  labelColor,
  labelFontFamily,
}: ScoreRingProps) {
  const labelFontSize = Math.round(size * 0.21);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: clamped,
      duration: 900,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const gradientId = 'scoreRingGradient';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colorFrom} />
            <Stop offset="100%" stopColor={colorTo} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text
          style={{ color: labelColor, fontFamily: labelFontFamily, fontSize: labelFontSize }}
          className="font-manrope-extrabold text-center"
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
