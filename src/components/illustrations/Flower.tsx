import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

interface Props {
  size?: number;
  petal?: string;
  center?: string;
  /** Draw a short stem with a leaf under the bloom. */
  stem?: boolean;
}

export function Flower({ size = 48, petal = '#F4A7B9', center = '#F2A93B', stem = false }: Props) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <Svg width={size} height={stem ? size * 1.6 : size} viewBox={stem ? '0 0 50 80' : '0 0 50 50'}>
      {stem && (
        <>
          <Path d="M25 30 L25 80" stroke="#5B7F42" strokeWidth={3} strokeLinecap="round" />
          <Ellipse cx="33" cy="58" rx="8" ry="4" transform="rotate(-30 33 58)" fill="#7FA35B" />
        </>
      )}
      <G>
        {petals.map((deg) => (
          <Ellipse key={deg} cx="25" cy="13" rx="8" ry="11" fill={petal} transform={`rotate(${deg} 25 25)`} />
        ))}
        <Circle cx="25" cy="25" r="7" fill={center} />
      </G>
    </Svg>
  );
}
