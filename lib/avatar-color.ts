const COLORS = [
  "#8B5CF6", // violet
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F97316", // orange
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F43F5E", // rose
  "#F59E0B", // amber
  "#6366F1", // indigo
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#EF4444", // red
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}
