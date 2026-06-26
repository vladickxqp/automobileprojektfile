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

export function UserIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M5 21a7 7 0 0 1 14 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CarIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M5 13l1.6-4.6A2 2 0 0 1 8.5 7h7a2 2 0 0 1 1.9 1.4L19 13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x={3} y={13} width={18} height={5} rx={1.5} stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={7.5} cy={18.5} r={1.4} fill={color} />
      <Circle cx={16.5} cy={18.5} r={1.4} fill={color} />
    </Svg>
  );
}

export function SettingsIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M12 2.5l1.5 2.3 2.7-.6.5 2.7 2.4 1.3-1 2.6 1 2.6-2.4 1.3-.5 2.7-2.7-.6L12 21.5l-1.5-2.3-2.7.6-.5-2.7-2.4-1.3 1-2.6-1-2.6 2.4-1.3.5-2.7 2.7.6L12 2.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GlobeIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function ShieldIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function CrownIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M3 7l4 4 5-6 5 6 4-4-1.5 12h-15L3 7Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function ChartIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={4} y1={20} x2={20} y2={20} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Rect x={6} y={11} width={3} height={6} rx={1} stroke={color} strokeWidth={strokeWidth} />
      <Rect x={11} y={7} width={3} height={10} rx={1} stroke={color} strokeWidth={strokeWidth} />
      <Rect x={16} y={13} width={3} height={4} rx={1} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function CalculatorIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Rect x={5} y={2.5} width={14} height={19} rx={2.5} stroke={color} strokeWidth={strokeWidth} />
      <Line x1={8} y1={6.5} x2={16} y2={6.5} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={8.5} y1={11} x2={8.5} y2={11} stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
      <Line x1={12} y1={11} x2={12} y2={11} stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
      <Line x1={15.5} y1={11} x2={15.5} y2={11} stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
      <Line x1={8.5} y1={15} x2={8.5} y2={15} stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
      <Line x1={12} y1={15} x2={12} y2={15} stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
      <Line x1={15.5} y1={15} x2={15.5} y2={18} stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
    </Svg>
  );
}

export function SlidersIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Line x1={4} y1={8} x2={20} y2={8} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={4} y1={16} x2={20} y2={16} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={9} cy={8} r={2.6} fill={color} />
      <Circle cx={15} cy={16} r={2.6} fill={color} />
    </Svg>
  );
}

export function SearchIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={strokeWidth} />
      <Line x1={16} y1={16} x2={21} y2={21} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function MapPinIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Circle cx={12} cy={10} r={2.5} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function LayersIcon({ size = 22, color = "#fff", strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 3l9 5-9 5-9-5 9-5Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M3 13l9 5 9-5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function StarIcon({ size = 16, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" fill={color} />
    </Svg>
  );
}

export function GoogleIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21.8 12.2c0-.7-.06-1.4-.18-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.7 3-4.3 3-7.5Z" fill="#4285F4" />
      <Path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.6c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.7A10 10 0 0 0 12 22Z" fill="#34A853" />
      <Path d="M6.2 13.7a6 6 0 0 1 0-3.8V7.2H2.9a10 10 0 0 0 0 9l3.3-2.5Z" fill="#FBBC05" />
      <Path d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A10 10 0 0 0 2.9 7.2l3.3 2.6C7 7.7 9.3 5.9 12 5.9Z" fill="#EA4335" />
    </Svg>
  );
}

export function AppleIcon({ size = 20, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 13c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85-.7 0-1.85-.83-3-.8-1.55.02-3 .9-3.8 2.3-1.6 2.8-.4 7 1.15 9.3.76 1.12 1.66 2.38 2.85 2.33 1.14-.05 1.57-.74 2.95-.74 1.37 0 1.76.74 2.96.72 1.22-.02 2-1.13 2.75-2.26.86-1.3 1.22-2.56 1.24-2.62-.03-.01-2.38-.91-2.4-3.6Z"
        fill={color}
      />
      <Path d="M13.7 6.3c.63-.77 1.06-1.83.94-2.9-.91.04-2.01.61-2.66 1.37-.58.68-1.1 1.77-.96 2.81 1.02.08 2.05-.52 2.68-1.28Z" fill={color} />
    </Svg>
  );
}
