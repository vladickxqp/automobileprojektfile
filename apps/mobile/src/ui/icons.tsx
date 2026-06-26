import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Minimal line-icon set (lucide-style geometry) so we don't pull a full icon package for the
// handful of glyphs the UI needs. Stroke-based, inherits color from props.
function base(size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none" } as const;
}

export function SunIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={strokeWidth} />
      {[
        [12, 2, 12, 4],
        [12, 20, 12, 22],
        [2, 12, 4, 12],
        [20, 12, 22, 12],
        [4.9, 4.9, 6.3, 6.3],
        [17.7, 17.7, 19.1, 19.1],
        [4.9, 19.1, 6.3, 17.7],
        [17.7, 6.3, 19.1, 4.9],
      ].map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

export function MoonIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={12} y1={5} x2={12} y2={19} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Polyline points="9 6 15 12 9 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={19} y1={12} x2={5} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Polyline points="12 19 5 12 12 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GaugeIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M3.5 18a9 9 0 1 1 17 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={12} y1={15} x2={16} y2={9} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={12} cy={15} r={1.6} fill={color} />
    </Svg>
  );
}

export function WrenchIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FileIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Polyline points="14 3 14 8 19 8" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ActivityIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Polyline points="3 12 7 12 10 4 14 20 17 12 21 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SparkleIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={21} y1={12} x2={9} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function FuelIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x={3} y={3} width={9} height={18} rx={1.5} stroke={color} strokeWidth={strokeWidth} />
      <Line x1={3} y1={10} x2={12} y2={10} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 7h3a2 2 0 0 1 2 2v7a1.5 1.5 0 0 0 3 0V9l-2.5-2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x={3} y={5} width={18} height={16} rx={2} stroke={color} strokeWidth={strokeWidth} />
      <Line x1={3} y1={9} x2={21} y2={9} stroke={color} strokeWidth={strokeWidth} />
      <Line x1={8} y1={3} x2={8} y2={6} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={6} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
