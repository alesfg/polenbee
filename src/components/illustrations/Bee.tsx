import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  pollenColor?: string;
  /** Wings flap and the bee bobs gently. */
  animated?: boolean;
  style?: ViewStyle;
}

const INK = '#3A2C1D';

function Wings() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ellipse cx="44" cy="30" rx="15" ry="22" transform="rotate(-24 44 30)" fill="#FFFFFF" fillOpacity={0.85} stroke="#BFDCE6" strokeWidth={2} />
      <Ellipse cx="60" cy="30" rx="13" ry="20" transform="rotate(18 60 30)" fill="#FFFFFF" fillOpacity={0.75} stroke="#BFDCE6" strokeWidth={2} />
    </Svg>
  );
}

function Body({ pollenColor }: { pollenColor: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="beeBody">
          <Ellipse cx="54" cy="58" rx="27" ry="20" />
        </ClipPath>
      </Defs>
      {/* legs */}
      <Path d="M44 74 L40 86 M56 76 L56 88 M66 74 L72 85" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {/* stinger */}
      <Path d="M79 56 L90 60 L79 64 Z" fill={INK} />
      <Ellipse cx="54" cy="58" rx="27" ry="20" fill="#F6C343" />
      <G clipPath="url(#beeBody)">
        <Rect x="48" y="30" width="8" height="60" fill={INK} />
        <Rect x="63" y="30" width="8" height="60" fill={INK} />
        <Rect x="76" y="30" width="8" height="60" fill={INK} />
      </G>
      {/* pollen baskets on the hind legs */}
      <Circle cx="56" cy="86" r="6.5" fill={pollenColor} stroke="#00000022" strokeWidth={1.5} />
      <Circle cx="72" cy="84" r="5.5" fill={pollenColor} stroke="#00000022" strokeWidth={1.5} />
      {/* head */}
      <Circle cx="27" cy="56" r="14" fill={INK} />
      <Circle cx="22" cy="52" r="4" fill="#FFFFFF" />
      <Circle cx="21" cy="52" r="2" fill={INK} />
      <Path d="M18 62 Q22 66 27 63" stroke="#F6C343" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M24 43 Q20 32 13 30 M31 43 Q32 32 38 28" stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Circle cx="13" cy="30" r="2.5" fill={INK} />
      <Circle cx="38" cy="28" r="2.5" fill={INK} />
    </Svg>
  );
}

export function Bee({ size = 120, pollenColor = '#F2A93B', animated = true, style }: Props) {
  const flap = useSharedValue(1);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    flap.value = withRepeat(withSequence(withTiming(0.35, { duration: 70 }), withTiming(1, { duration: 70 })), -1);
    bob.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(flap);
      cancelAnimation(bob);
    };
  }, [animated]);

  // Wings hinge where they meet the body, so they fold down onto the back instead of shrinking to their centre.
  const wingStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: flap.value }] }));
  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (bob.value - 0.5) * size * 0.08 }, { rotate: `${(bob.value - 0.5) * 6}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, bobStyle, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 46%' }, wingStyle]}>
        <Wings />
      </Animated.View>
      <View style={StyleSheet.absoluteFill}>
        <Body pollenColor={pollenColor} />
      </View>
    </Animated.View>
  );
}
