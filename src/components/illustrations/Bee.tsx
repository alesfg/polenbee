import { useEffect, useId } from 'react';
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

// Same character as the app icon: chubby front-facing bee, brown cap with a heart-shaped yellow face.
const BROWN = '#3B2416';
const YELLOW = '#F7BE2E';
const YELLOW_LIGHT = '#FFD95A';

function Wings() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <G fill="#FFFFFF" fillOpacity={0.92} stroke="#C9DCE6" strokeWidth={1.5}>
        <Ellipse cx="17" cy="42" rx="14" ry="19" transform="rotate(-28 17 42)" />
        <Ellipse cx="18" cy="60" rx="8" ry="11" transform="rotate(-50 18 60)" />
        <Ellipse cx="83" cy="42" rx="14" ry="19" transform="rotate(28 83 42)" />
        <Ellipse cx="82" cy="60" rx="8" ry="11" transform="rotate(50 82 60)" />
      </G>
    </Svg>
  );
}

function Body({ pollenColor, clipId }: { pollenColor: string; clipId: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={clipId}>
          <Ellipse cx="50" cy="57" rx="33" ry="35" />
        </ClipPath>
      </Defs>

      {/* antennae */}
      <Path d="M43 25 Q39 13 31 10 M57 25 Q61 13 69 10" stroke={BROWN} strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <Circle cx="30" cy="9.5" r="4.2" fill={BROWN} />
      <Circle cx="70" cy="9.5" r="4.2" fill={BROWN} />

      {/* feet */}
      <Ellipse cx="39" cy="92" rx="7" ry="4.5" fill={BROWN} />
      <Ellipse cx="61" cy="92" rx="7" ry="4.5" fill={BROWN} />

      {/* body: brown base, yellow heart-shaped face and stripes */}
      <Ellipse cx="50" cy="57" rx="33" ry="35" fill={BROWN} />
      <G clipPath={`url(#${clipId})`}>
        <Path d="M50 33 C45 24 24 24 21 44 C18 62 33 70 50 70 C67 70 82 62 79 44 C76 24 55 24 50 33 Z" fill={YELLOW} />
        <Rect x="10" y="74" width="80" height="6.5" fill={YELLOW} />
        <Rect x="10" y="85.5" width="80" height="6.5" fill={YELLOW} />
        <Ellipse cx="38" cy="38" rx="9" ry="5" fill={YELLOW_LIGHT} opacity={0.7} />
      </G>

      {/* eyes */}
      <Circle cx="39" cy="49" r="7.5" fill="#FFFFFF" />
      <Circle cx="61" cy="49" r="7.5" fill="#FFFFFF" />
      <Circle cx="39.5" cy="49.5" r="6" fill="#5A3217" />
      <Circle cx="60.5" cy="49.5" r="6" fill="#5A3217" />
      <Circle cx="39.5" cy="50" r="3.6" fill="#1E120A" />
      <Circle cx="60.5" cy="50" r="3.6" fill="#1E120A" />
      <Circle cx="41.5" cy="47" r="2" fill="#FFFFFF" />
      <Circle cx="62.5" cy="47" r="2" fill="#FFFFFF" />
      <Circle cx="37.6" cy="52" r="0.9" fill="#FFFFFF" />
      <Circle cx="58.6" cy="52" r="0.9" fill="#FFFFFF" />

      {/* cheeks and smile */}
      <Ellipse cx="30" cy="59" rx="5" ry="3.2" fill="#F2875F" opacity={0.6} />
      <Ellipse cx="70" cy="59" rx="5" ry="3.2" fill="#F2875F" opacity={0.6} />
      <Path d="M44.5 59.5 Q50 67 55.5 59.5 Q50 61.5 44.5 59.5 Z" fill="#6E2A14" />
      <Path d="M47 62.6 Q50 65.6 53 62.6 Q50 61.8 47 62.6 Z" fill="#F07B7B" />

      {/* little arms */}
      <Ellipse cx="30" cy="77" rx="6" ry="5" fill={BROWN} transform="rotate(-25 30 77)" />
      <Ellipse cx="70" cy="77" rx="6" ry="5" fill={BROWN} transform="rotate(25 70 77)" />

      {/* pollen loads (corbiculae) */}
      <Circle cx="21" cy="83" r="7" fill={pollenColor} stroke="#00000026" strokeWidth={1.2} />
      <Circle cx="79" cy="83" r="7" fill={pollenColor} stroke="#00000026" strokeWidth={1.2} />
      <Circle cx="18.8" cy="80.6" r="2" fill="#FFFFFF" opacity={0.55} />
      <Circle cx="76.8" cy="80.6" r="2" fill="#FFFFFF" opacity={0.55} />
    </Svg>
  );
}

export function Bee({ size = 120, pollenColor = '#F2A93B', animated = true, style }: Props) {
  // Unique per instance: several bees can be on screen at once (web shares one SVG id namespace).
  const clipId = `bee${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const flap = useSharedValue(1);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    flap.value = withRepeat(withSequence(withTiming(0.55, { duration: 75 }), withTiming(1, { duration: 75 })), -1);
    bob.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(flap);
      cancelAnimation(bob);
    };
  }, [animated]);

  // Both wings fold in towards the body together.
  const wingStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: flap.value }] }));
  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (bob.value - 0.5) * size * 0.08 }, { rotate: `${(bob.value - 0.5) * 6}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, bobStyle, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 50%' }, wingStyle]}>
        <Wings />
      </Animated.View>
      <View style={StyleSheet.absoluteFill}>
        <Body pollenColor={pollenColor} clipId={clipId} />
      </View>
    </Animated.View>
  );
}
