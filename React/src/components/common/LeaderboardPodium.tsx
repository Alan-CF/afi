import FramedAvatar from "../ui/FramedAvatar";

export interface PodiumEntry {
  profile_id: string;
  rank: number;
  username: string;
  points: number;
  avatar_url: string | null;
  frameId?: string | null;
}

interface Props {
  top3: PodiumEntry[];
  meId?: string | null;
  size?: "compact" | "full";
}

const ACCENTS: Record<number, { bar: string; ring: string; rankText: string }> = {
  1: {
    bar: "bg-primary",
    ring: "ring-2 ring-primary/70",
    rankText: "text-secondary",
  },
  2: {
    bar: "bg-secondary/30",
    ring: "ring-2 ring-secondary/30",
    rankText: "text-secondary",
  },
  3: {
    bar: "bg-secondary/15",
    ring: "ring-2 ring-secondary/15",
    rankText: "text-secondary",
  },
};

const HEIGHTS_FULL: Record<number, string> = {
  1: "h-24",
  2: "h-16",
  3: "h-12",
};

const HEIGHTS_COMPACT: Record<number, string> = {
  1: "h-16",
  2: "h-10",
  3: "h-8",
};

function Step({
  entry,
  rank,
  size,
  isMe,
}: {
  entry: PodiumEntry | undefined;
  rank: number;
  size: "compact" | "full";
  isMe: boolean;
}) {
  const accent = ACCENTS[rank];
  const heights = size === "full" ? HEIGHTS_FULL : HEIGHTS_COMPACT;
  const avatarPx = size === "full" ? 72 : 52;
  const nameSize = rank === 1 ? "text-base md:text-lg" : "text-sm";
  const pointsSize = rank === 1 ? "text-lg md:text-xl" : "text-base";

  if (!entry) {
    return (
      <div className="flex flex-col items-center gap-2 min-w-0">
        <div
          className="rounded-full bg-secondary/10"
          style={{ width: avatarPx, height: avatarPx }}
        />
        <p className="font-lato text-xs text-text-light">—</p>
        <div className={`${heights[rank]} w-full rounded-t-2xl bg-secondary/10 flex items-end justify-center pb-2`}>
          <span className="font-anton text-xl text-secondary/40 tabular-nums">{rank}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <FramedAvatar
        avatarUrl={entry.avatar_url}
        frameId={entry.frameId}
        size={avatarPx}
        ringClassName={accent.ring}
      />
      <div className="text-center min-w-0 w-full">
        <p className={`font-anton ${nameSize} text-secondary leading-tight truncate`}>
          @{entry.username}
        </p>
        <p className={`font-anton ${pointsSize} text-primary tabular-nums leading-tight`}>
          {entry.points.toLocaleString()}
        </p>
        {isMe && (
          <span className="mt-1 inline-flex rounded-md bg-primary px-1.5 py-0.5 font-lato text-[0.6rem] font-bold uppercase tracking-[0.12em] text-secondary">
            YOU
          </span>
        )}
      </div>
      <div className={`${heights[rank]} w-full rounded-t-2xl ${accent.bar} flex items-end justify-center pb-2`}>
        <span className={`font-anton text-xl ${accent.rankText} tabular-nums`}>{rank}</span>
      </div>
    </div>
  );
}

export default function LeaderboardPodium({ top3, meId = null, size = "full" }: Props) {
  const byRank = new Map<number, PodiumEntry>();
  top3.forEach((e) => byRank.set(e.rank, e));

  return (
    <div className="grid grid-cols-3 items-end gap-3 md:gap-4">
      <Step entry={byRank.get(2)} rank={2} size={size} isMe={byRank.get(2)?.profile_id === meId} />
      <Step entry={byRank.get(1)} rank={1} size={size} isMe={byRank.get(1)?.profile_id === meId} />
      <Step entry={byRank.get(3)} rank={3} size={size} isMe={byRank.get(3)?.profile_id === meId} />
    </div>
  );
}
