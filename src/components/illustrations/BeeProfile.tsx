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

/** How a bee looks from the side: colours and proportions for each race, caste and kind of bee. */
export interface BeeLook {
  head: string;
  thorax: string;
  /** Hair on the thorax. */
  hair: string;
  abdomen: string;
  band: string;
  /** Band thickness, 0–1. */
  bandWidth: number;
  /** 1 = worker; queens are longer, drones and bumblebees rounder. */
  abdomenLength: number;
  abdomenHeight?: number;
  bigEyes?: boolean;
  /** Bumblebee-style coloured tail. */
  tail?: string;
  /** Extra fluffy outline (bumblebees). */
  fluffy?: boolean;
  wing?: string;
  sting?: boolean;
}

export const WORKER_LOOK: BeeLook = {
  head: '#3B2A1E',
  thorax: '#6B4A2B',
  hair: '#C9A15A',
  abdomen: '#E0A53A',
  band: '#3B2A1E',
  bandWidth: 0.45,
  abdomenLength: 1,
  sting: true,
};

interface Props {
  look?: BeeLook;
  size?: number;
  pollenColor?: string;
  animated?: boolean;
  /** Mirror so the bee faces right. */
  flip?: boolean;
  style?: ViewStyle;
}

function Wings({ tint }: { tint: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 160 100">
      <G fill={tint} fillOpacity={0.55} stroke="#9FB8C6" strokeWidth={1.2}>
        <Path d="M66 38 C 74 8, 108 2, 118 12 C 124 20, 98 34, 66 38 Z" />
        <Path d="M70 40 C 82 24, 108 22, 112 30 C 114 38, 92 42, 70 40 Z" fillOpacity={0.45} />
      </G>
      <G stroke="#9FB8C6" strokeWidth={0.8} fill="none" opacity={0.7}>
        <Path d="M70 36 C 86 22, 100 14, 114 13" />
        <Path d="M76 35 C 88 28, 100 26, 110 27" />
      </G>
    </Svg>
  );
}

function Body({ look, pollenColor, clipId }: { look: BeeLook; pollenColor?: string; clipId: string }) {
  const len = 30 * look.abdomenLength;
  const h = 20 * (look.abdomenHeight ?? 1);
  const cx = 82 + len;
  const bands = [0.28, 0.5, 0.72].map((f) => cx - len + f * 2 * len);
  const bandW = 2 * len * 0.11 * look.bandWidth + 1;
  const eyeRx = look.bigEyes ? 9 : 5.5;
  const eyeRy = look.bigEyes ? 12 : 8.5;

  return (
    <Svg width="100%" height="100%" viewBox="0 0 160 100">
      <Defs>
        <ClipPath id={clipId}>
          <Ellipse cx={cx} cy={56} rx={len} ry={h} />
        </ClipPath>
      </Defs>

      {/* legs */}
      <G stroke={look.head} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M56 58 L 50 72 L 46 82" />
        <Path d="M64 62 L 64 76 L 60 88" />
        <Path d="M72 62 L 80 76 L 84 90" />
      </G>
      {/* pollen load on the hind leg (corbicula) */}
      {pollenColor ? (
        <>
          <Ellipse cx={81} cy={80} rx={6.5} ry={7.5} fill={pollenColor} stroke="#00000030" strokeWidth={1} />
          <Circle cx={79} cy={77} r={1.8} fill="#FFFFFF" opacity={0.5} />
        </>
      ) : null}

      {/* abdomen with bands */}
      {look.fluffy ? <Ellipse cx={cx} cy={56} rx={len + 2.5} ry={h + 2.5} fill={look.hair} opacity={0.5} /> : null}
      <Ellipse cx={cx} cy={56} rx={len} ry={h} fill={look.abdomen} />
      <G clipPath={`url(#${clipId})`}>
        {bands.map((x) => (
          <Rect key={x} x={x - bandW / 2} y={20} width={bandW} height={80} fill={look.band} />
        ))}
        {look.tail ? <Rect x={cx + len * 0.45} y={20} width={len} height={80} fill={look.tail} /> : null}
        <Ellipse cx={cx - 4} cy={46} rx={len * 0.7} ry={h * 0.25} fill="#FFFFFF" opacity={0.18} />
      </G>
      {look.sting ? <Path d={`M${cx + len - 1} 54 L ${cx + len + 6} 57 L ${cx + len - 1} 59 Z`} fill={look.head} /> : null}

      {/* thorax with hair */}
      {look.fluffy ? <Circle cx={66} cy={50} r={20} fill={look.hair} opacity={0.6} /> : null}
      <Circle cx={66} cy={50} r={17} fill={look.thorax} />
      <G stroke={look.hair} strokeWidth={1.6} strokeLinecap="round" opacity={0.9}>
        <Path d="M54 38 l -2 -4 M60 34 l -1 -4 M66 33 l 0 -4 M72 34 l 1 -4 M78 38 l 2 -4 M52 46 l -4 -1 M80 46 l 4 -1" />
      </G>
      <Ellipse cx={62} cy={44} rx={8} ry={4} fill="#FFFFFF" opacity={0.15} />

      {/* head */}
      <Circle cx={42} cy={54} r={13} fill={look.head} />
      <Ellipse cx={look.bigEyes ? 43 : 41} cy={look.bigEyes ? 49 : 51} rx={eyeRx} ry={eyeRy} fill="#1A1410" />
      <Ellipse cx={look.bigEyes ? 41 : 39.5} cy={look.bigEyes ? 44 : 47.5} rx={1.8} ry={2.6} fill="#FFFFFF" opacity={0.55} />
      {/* antennae and mouth */}
      <G stroke={look.head} strokeWidth={2} fill="none" strokeLinecap="round">
        <Path d="M36 44 Q 30 32 22 30" />
        <Path d="M40 43 Q 36 30 30 26" />
        <Path d="M33 63 L 30 68" />
      </G>
    </Svg>
  );
}

/** Side-view bee for field-guide style cards: races, castes (queen/worker/drone) and kinds of bees. */
export function BeeProfile({ look = WORKER_LOOK, size = 120, pollenColor, animated = true, flip, style }: Props) {
  const clipId = `bp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const flap = useSharedValue(1);

  useEffect(() => {
    if (!animated) return;
    flap.value = withRepeat(withSequence(withTiming(0.35, { duration: 70 }), withTiming(1, { duration: 70 })), -1);
    return () => cancelAnimation(flap);
  }, [animated]);

  // Wings fold down towards the thorax, hinged where they meet it.
  const wingStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: flap.value }] }));

  return (
    <View style={[{ width: size, height: size * 0.625 }, flip && { transform: [{ scaleX: -1 }] }, style]}>
      <View style={StyleSheet.absoluteFill}>
        <Body look={look} pollenColor={pollenColor} clipId={clipId} />
      </View>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 40%' }, wingStyle]}>
        <Wings tint={look.wing ?? '#FFFFFF'} />
      </Animated.View>
    </View>
  );
}
