import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type FadeInProps = {
  children: React.ReactNode;
};

export function FadeIn({ children }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
