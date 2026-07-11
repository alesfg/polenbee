import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number;
}

const strokeProps = {
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
};

export function HouseIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="m3 9.5 9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} {...strokeProps} />
      <Path d="M9.5 22v-8h5v8" stroke={color} {...strokeProps} />
    </Svg>
  );
}

export function HiveIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21 16.05v-8.1a2 2 0 0 0-1-1.73l-7-4.05a2 2 0 0 0-2 0l-7 4.05a2 2 0 0 0-1 1.73v8.1a2 2 0 0 0 1 1.73l7 4.05a2 2 0 0 0 2 0l7-4.05a2 2 0 0 0 1-1.73z"
        stroke={color}
        {...strokeProps}
      />
      <Circle cx={12} cy={12} r={2.2} fill={color} />
    </Svg>
  );
}

export function FlowerIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3} stroke={color} {...strokeProps} />
      <Path
        d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"
        stroke={color}
        {...strokeProps}
      />
    </Svg>
  );
}

export function JarIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={8} y={2.8} width={8} height={3} rx={1.2} stroke={color} {...strokeProps} />
      <Path
        d="M8.4 5.8C7 6.8 6 8.3 6 10v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-8c0-1.7-1-3.2-2.4-4.2"
        stroke={color}
        {...strokeProps}
      />
      <Path d="M6.3 11.5h11.4" stroke={color} {...strokeProps} />
    </Svg>
  );
}

export function CalendarIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3.5} y={5} width={17} height={16} rx={2.5} stroke={color} {...strokeProps} />
      <Path d="M8 3v4M16 3v4M3.5 10.5h17" stroke={color} {...strokeProps} />
      <Circle cx={12} cy={15.5} r={1.5} fill={color} />
    </Svg>
  );
}
