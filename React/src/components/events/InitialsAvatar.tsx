interface Props {
  username: string;
  size?: number;
  rounded?: string;
  className?: string;
}

const PALETTE: Array<{ bg: string; fg: string }> = [
  { bg: "#1D428A", fg: "#FFC72C" },
  { bg: "#FFC72C", fg: "#1D428A" },
  { bg: "#5780AE", fg: "#FFFFFF" },
  { bg: "#172B5B", fg: "#FFC72C" },
  { bg: "#0E2540", fg: "#FFFFFF" },
  { bg: "#BE3A34", fg: "#FFFFFF" },
];

function hashFor(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initialsFor(value: string): string {
  const clean = value.replace(/[^A-Za-z0-9]/g, "");
  if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
  if (clean.length === 1) return clean.toUpperCase();
  return "?";
}

export default function InitialsAvatar({
  username,
  size = 40,
  rounded = "rounded-full",
  className = "",
}: Props) {
  const colors = PALETTE[hashFor(username) % PALETTE.length];
  const initials = initialsFor(username);
  const fontSize = Math.max(11, Math.round(size * 0.38));

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        color: colors.fg,
        fontSize,
      }}
      className={`flex shrink-0 select-none items-center justify-center font-anton tracking-wider ${rounded} ${className}`}
    >
      {initials}
    </div>
  );
}
