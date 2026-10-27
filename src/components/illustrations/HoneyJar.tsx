import { useId } from 'react';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Glass jar filled with honey of the given colour. */
export function HoneyJar({ size = 120, color = '#E0A53A' }: { size?: number; color?: string }) {
  const id = `jar${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 100 115">
      <Defs>
        <ClipPath id={`${id}clip`}>
          <Rect x="14" y="30" width="72" height="80" rx="18" />
        </ClipPath>
        <LinearGradient id={`${id}shade`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#000" stopOpacity="0" />
          <Stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </LinearGradient>
      </Defs>

      {/* Glass */}
      <Rect x="14" y="30" width="72" height="80" rx="18" fill="#FFFFFF" fillOpacity="0.55" />
      <G clipPath={`url(#${id}clip)`}>
        {/* Honey with a gentle wave on top */}
        <Path d="M10 46 C 28 40, 44 52, 60 46 S 84 40, 92 46 L 92 115 L 10 115 Z" fill={color} />
        <Rect x="14" y="30" width="72" height="80" fill={`url(#${id}shade)`} />
        {/* Hexagon label */}
        <Path d="M50 66 l11 6.5 v13 l-11 6.5 l-11 -6.5 v-13 Z" fill="#FFF8EA" fillOpacity="0.9" />
        <Path d="M50 73 l5 3 v6 l-5 3 l-5 -3 v-6 Z" fill={color} />
      </G>
      <Rect x="14" y="30" width="72" height="80" rx="18" fill="none" stroke="#3A2C1D" strokeOpacity="0.18" strokeWidth="2" />
      {/* Shine */}
      <Rect x="22" y="40" width="7" height="52" rx="3.5" fill="#FFFFFF" fillOpacity="0.55" />

      {/* Neck and lid */}
      <Rect x="24" y="24" width="52" height="9" rx="3" fill="#FFFFFF" fillOpacity="0.7" stroke="#3A2C1D" strokeOpacity="0.15" strokeWidth="1.5" />
      <Rect x="18" y="8" width="64" height="18" rx="6" fill="#9C6A3A" />
      <Rect x="18" y="8" width="64" height="6" rx="3" fill="#B98552" />
      <Path d="M30 14 v12 M42 14 v12 M54 14 v12 M66 14 v12" stroke="#7E5229" strokeWidth="1.5" strokeOpacity="0.5" />
      {/* Drip over the lid */}
      <Path d="M58 22 c0 -3 8 -3 8 0 v8 a4 4 0 0 1 -8 0 Z" fill={color} />
    </Svg>
  );
}
