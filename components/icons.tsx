import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ── Custom inline stroke icons (DESIGN.md §6) ──────────────────────────────
// viewBox 0 0 24 24, fill none, round caps/joins, color + stroke-width as props.
// Ported 1:1 from the Claude Design `Icon` set (home.jsx).

type IconProps = { color: string; size?: number; sw?: number };

export function BellIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.3 19.5a2 2 0 0 0 3.4 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SearchIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={1.8} />
      <Path d="m20 20-3.5-3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function PlayIcon({ color, size = 15 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5Z" />
    </Svg>
  );
}

export function ArrowIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6 6 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function FlashIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function KeyboardIcon({ color, size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6.5} width={18} height={11} rx={2.2} stroke={color} strokeWidth={1.8} />
      <Path d="M7 10h.01M11 10h.01M15 10h.01M9 13h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5 10 17l9-10" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HeartIcon({ color, size = 20, fill = 'none' }: IconProps & { fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path d="M12 20s-7-4.6-7-9.5A3.8 3.8 0 0 1 12 7.5 3.8 3.8 0 0 1 19 10.5C19 15.4 12 20 12 20Z" stroke={color} strokeWidth={1.9} strokeLinejoin="round" />
    </Svg>
  );
}

export function CommentIcon({ color, size = 19 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V6a1 1 0 0 1 1-1Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function ShareIcon({ color, size = 19 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DotsIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={5} cy={12} r={1.7} />
      <Circle cx={12} cy={12} r={1.7} />
      <Circle cx={19} cy={12} r={1.7} />
    </Svg>
  );
}

export function QuoteIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M9 6c-3 1-5 3.5-5 7v5h6v-6H7c0-2 1-3.5 3-4.2L9 6Zm10 0c-3 1-5 3.5-5 7v5h6v-6h-3c0-2 1-3.5 3-4.2L19 6Z" />
    </Svg>
  );
}

export function PhotoIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={5} width={16} height={14} rx={2.5} stroke={color} strokeWidth={1.7} />
      <Circle cx={9} cy={10} r={1.6} stroke={color} strokeWidth={1.5} />
      <Path d="m6 18 4.5-4.5 3 3L17 12l3 3" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    </Svg>
  );
}

export function ListIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 6 6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShareNodesIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={18} cy={5} r={2.6} stroke={color} strokeWidth={1.8} />
      <Circle cx={6} cy={12} r={2.6} stroke={color} strokeWidth={1.8} />
      <Circle cx={18} cy={19} r={2.6} stroke={color} strokeWidth={1.8} />
      <Path d="m8.4 13.4 7.2 4.2M15.6 6.4l-7.2 4.2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function GearIcon({ color, size = 19 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3.1} stroke={color} strokeWidth={1.7} />
      <Path d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ color, size = 10 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={9} rx={2} stroke={color} strokeWidth={2.2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function SparkIcon({ color, size = 13 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l1.8 5.6L19.5 9l-4.6 3.4L16.4 18 12 14.6 7.6 18l1.5-5.6L4.5 9l5.7-1.4z" />
    </Svg>
  );
}

export function PlusIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function HomeIcon({ color, size = 24, sw = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShelfIcon({ color, size = 24, sw = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4h3v16H5zM10.5 4h3v16h-3z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="m16.4 4.8 2.9.8-3.1 14.4-2.9-.8z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    </Svg>
  );
}

export function DiscoverIcon({ color, size = 24, sw = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={sw} />
      <Path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
    </Svg>
  );
}

export function CameraIcon({ color, size = 24, sw = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9a2 2 0 0 1 2-2h1.6l1.1-1.7a1 1 0 0 1 .84-.45h6.9a1 1 0 0 1 .84.45L17.4 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.4} stroke={color} strokeWidth={sw} />
    </Svg>
  );
}

export function CommunityIcon({ color, size = 24, sw = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={9} r={3} stroke={color} strokeWidth={sw} />
      <Path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2.3-4.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileIcon({ color, size = 24, sw = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={sw} />
      <Path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  );
}
