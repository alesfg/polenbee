import { Image } from 'expo-image';
import { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const BEE = require('../../../assets/images/bee-transparent.png');

interface Props {
  size?: number;
  /** Floats up and down and tilts gently, as if hovering. */
  animated?: boolean;
  /** Mirror so the bee faces left. */
  flip?: boolean;
  style?: ViewStyle;
}

/** The app's bee (same artwork as the icon). */
export function BrandBee({ size = 120, animated = true, flip, style }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    t.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [animated]);

  const hover = useAnimatedStyle(() => ({
    transform: [{ translateY: (t.value - 0.5) * size * 0.08 }, { rotate: `${(t.value - 0.5) * 6}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, hover, style]}>
      <Image source={BEE} style={{ width: size, height: size, transform: flip ? [{ scaleX: -1 }] : undefined }} contentFit="contain" />
    </Animated.View>
  );
}
