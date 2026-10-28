import Svg, { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';

/** Bee seen from above, facing up (for the dance and the swarm). */
export function TopBee({ size = 28, body = '#E0A53A', band = '#3B2A1E' }: { size?: number; body?: string; band?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <G fill="#FFFFFF" fillOpacity={0.75} stroke="#9FB8C6" strokeWidth={0.8}>
        <Ellipse cx="12" cy="17" rx="7" ry="4.5" transform="rotate(-25 12 17)" />
        <Ellipse cx="28" cy="17" rx="7" ry="4.5" transform="rotate(25 28 17)" />
      </G>
      <Ellipse cx="20" cy="27" rx="6.5" ry="9" fill={body} />
      <Path d="M13.6 24 H26.4 M13.6 28.5 H26.4 M14.5 33 H25.5" stroke={band} strokeWidth={2.4} />
      <Circle cx="20" cy="16" r="5" fill="#6B4A2B" />
      <Circle cx="20" cy="9.5" r="3.6" fill={band} />
      <Path d="M18.5 7 L16 3 M21.5 7 L24 3" stroke={band} strokeWidth={1.2} strokeLinecap="round" />
    </Svg>
  );
}

export function Egg({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Cell />
      <Ellipse cx="20" cy="20" rx="2.6" ry="7" fill="#FFFDF5" stroke="#E6DCC4" strokeWidth={0.8} transform="rotate(-15 20 20)" />
    </Svg>
  );
}

export function Larva({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Cell />
      <Ellipse cx="20" cy="21" rx="11" ry="9.5" fill="#FFF3C8" opacity={0.7} />
      <Path d="M27 15 C 31 22, 25 30, 18 29 C 11 28, 10 20, 15 17 C 18 15.5, 21 18, 19 21" fill="none" stroke="#FFFBF0" strokeWidth={6} strokeLinecap="round" />
      <Path d="M27 15 C 31 22, 25 30, 18 29 C 11 28, 10 20, 15 17" fill="none" stroke="#E9DFC6" strokeWidth={0.8} strokeDasharray="1.5 2.5" />
    </Svg>
  );
}

export function Pupa({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Cell />
      <Ellipse cx="20" cy="25" rx="5" ry="7" fill="#F4EBDD" />
      <Circle cx="20" cy="15.5" r="4.4" fill="#F4EBDD" />
      <Circle cx="18" cy="14.6" r="1.6" fill="#B07A8A" />
      <Circle cx="22" cy="14.6" r="1.6" fill="#B07A8A" />
      <Path d="M16 22 L 12 26 M24 22 L 28 26 M16.5 26 L 13 30 M23.5 26 L 27 30" stroke="#E4D6C0" strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

function Cell() {
  return <Polygon points="20,2 35.6,11 35.6,29 20,38 4.4,29 4.4,11" fill="#F7E2B0" stroke="#D9A94E" strokeWidth={1.6} />;
}

export type CellKind = 'honey' | 'capped' | 'pollen' | 'brood' | 'egg' | 'empty';

/** One comb cell; pollen cells take their own colour. */
export function HexCell({ size = 34, kind, color }: { size?: number; kind: CellKind; color?: string }) {
  const fill =
    kind === 'honey' ? '#E9A23B' : kind === 'capped' ? '#F6D98C' : kind === 'pollen' ? color ?? '#E8742C' : kind === 'brood' ? '#C88A4A' : '#FBEFD2';
  return (
    <Svg width={size} height={size * 1.1547} viewBox="0 0 34 39.26">
      <Polygon points="17,0.8 33.2,10.2 33.2,29.1 17,38.5 0.8,29.1 0.8,10.2" fill={fill} stroke="#D9A94E" strokeWidth={1.6} />
      {kind === 'honey' ? <Ellipse cx="12" cy="13" rx="4" ry="2.5" fill="#FFFFFF" opacity={0.35} /> : null}
      {kind === 'brood' ? <Polygon points="17,6 28,12.3 28,26.9 17,33.2 6,26.9 6,12.3" fill="#B7793C" opacity={0.6} /> : null}
      {kind === 'egg' ? <Ellipse cx="17" cy="19.6" rx="1.6" ry="4.5" fill="#FFFDF5" /> : null}
      {kind === 'pollen' ? <Circle cx="13" cy="15" r="2.4" fill="#FFFFFF" opacity={0.3} /> : null}
    </Svg>
  );
}

export function Flower({ size = 36, petal = '#F4A7B9', center = '#F2B33D' }: { size?: number; petal?: string; center?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <G fill={petal}>
        {[0, 72, 144, 216, 288].map((a) => (
          <Ellipse key={a} cx="20" cy="10" rx="6" ry="9" transform={`rotate(${a} 20 20)`} />
        ))}
      </G>
      <Circle cx="20" cy="20" r="6" fill={center} />
    </Svg>
  );
}
