export type MockGameHighlight = {
  time: string;
  text: string;
};

export type MockGameSnapshot = {
  leftTeam: string;
  rightTeam: string;
  leftScore: number;
  rightScore: number;
  quarterLabel: string;
  clock: string;
  statusLabel: string;
  detail: string | null;
  highlights: MockGameHighlight[];
};

type TeamKey = "warriors" | "lakers";

type TimelineSegment = {
  kind: "quarter" | "halftime" | "final";
  quarter?: 1 | 2 | 3 | 4;
  duration: number;
  clockStart: number;
  clockEnd: number;
  statusLabel: string;
  detail: string | null;
};

type ResolvedSegment = TimelineSegment & {
  startAt: number;
  endAt: number;
};

type ScoreEvent = {
  at: number;
  team: TeamKey;
  points: number;
  text: string;
};

const teams = {
  warriors: "Warriors",
  lakers: "Lakers",
};

const timeline: TimelineSegment[] = [
  {
    kind: "quarter",
    quarter: 1,
    duration: 14,
    clockStart: 45,
    clockEnd: 31,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 1,
    duration: 5,
    clockStart: 31,
    clockEnd: 31,
    statusLabel: "Clock Stopped",
    detail: "Ball not in play.",
  },
  {
    kind: "quarter",
    quarter: 1,
    duration: 11,
    clockStart: 31,
    clockEnd: 20,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 1,
    duration: 4,
    clockStart: 20,
    clockEnd: 20,
    statusLabel: "Clock Stopped",
    detail: "Loose ball foul under review.",
  },
  {
    kind: "quarter",
    quarter: 1,
    duration: 20,
    clockStart: 20,
    clockEnd: 0,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 2,
    duration: 15,
    clockStart: 45,
    clockEnd: 30,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 2,
    duration: 4,
    clockStart: 30,
    clockEnd: 30,
    statusLabel: "Clock Stopped",
    detail: "Timeout on the floor.",
  },
  {
    kind: "quarter",
    quarter: 2,
    duration: 12,
    clockStart: 30,
    clockEnd: 18,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 2,
    duration: 3,
    clockStart: 18,
    clockEnd: 18,
    statusLabel: "Clock Stopped",
    detail: "Inbound after the challenge.",
  },
  {
    kind: "quarter",
    quarter: 2,
    duration: 18,
    clockStart: 18,
    clockEnd: 0,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "halftime",
    duration: 30,
    clockStart: 30,
    clockEnd: 0,
    statusLabel: "Halftime",
    detail: "30s break before the 3rd quarter.",
  },
  {
    kind: "quarter",
    quarter: 3,
    duration: 16,
    clockStart: 45,
    clockEnd: 29,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 3,
    duration: 5,
    clockStart: 29,
    clockEnd: 29,
    statusLabel: "Clock Stopped",
    detail: "Ball not in play.",
  },
  {
    kind: "quarter",
    quarter: 3,
    duration: 11,
    clockStart: 29,
    clockEnd: 18,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 3,
    duration: 4,
    clockStart: 18,
    clockEnd: 18,
    statusLabel: "Clock Stopped",
    detail: "Substitutions at the scorer's table.",
  },
  {
    kind: "quarter",
    quarter: 3,
    duration: 18,
    clockStart: 18,
    clockEnd: 0,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 4,
    duration: 14,
    clockStart: 45,
    clockEnd: 31,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 4,
    duration: 4,
    clockStart: 31,
    clockEnd: 31,
    statusLabel: "Clock Stopped",
    detail: "Deflection out of bounds.",
  },
  {
    kind: "quarter",
    quarter: 4,
    duration: 12,
    clockStart: 31,
    clockEnd: 19,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 4,
    duration: 4,
    clockStart: 19,
    clockEnd: 19,
    statusLabel: "Clock Stopped",
    detail: "Coaches are drawing up the next play.",
  },
  {
    kind: "quarter",
    quarter: 4,
    duration: 19,
    clockStart: 19,
    clockEnd: 0,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "final",
    duration: 9999,
    clockStart: 0,
    clockEnd: 0,
    statusLabel: "Final",
    detail: "Warriors close it out.",
  },
];

const scoreEvents: ScoreEvent[] = [
  { at: 4, team: "warriors", points: 5, text: "Warriors open with a quick 5-0 burst." },
  { at: 10, team: "lakers", points: 4, text: "Lakers answer right back with four straight." },
  { at: 18, team: "warriors", points: 7, text: "Curry ignites a 7-point run." },
  { at: 29, team: "lakers", points: 6, text: "Lakers settle in and cut the lead." },
  { at: 45, team: "warriors", points: 8, text: "Warriors finish the quarter strong." },
  { at: 59, team: "lakers", points: 9, text: "Lakers attack the paint and score nine." },
  { at: 73, team: "warriors", points: 6, text: "Warriors move the ball and cash in six." },
  { at: 84, team: "lakers", points: 8, text: "A hot stretch keeps the Lakers close." },
  { at: 103, team: "warriors", points: 10, text: "Warriors close the half on a 10-2 push." },
  { at: 135, team: "lakers", points: 8, text: "Lakers come out of halftime aggressive." },
  { at: 149, team: "warriors", points: 9, text: "Back-to-back threes swing momentum." },
  { at: 163, team: "lakers", points: 6, text: "Lakers keep pace with six more." },
  { at: 179, team: "warriors", points: 7, text: "Warriors build breathing room late in the 3rd." },
  { at: 195, team: "lakers", points: 7, text: "The Lakers make one more push." },
  { at: 208, team: "warriors", points: 8, text: "A calm 8-point answer keeps control." },
  { at: 224, team: "lakers", points: 6, text: "Lakers stay alive with a fast response." },
  { at: 238, team: "warriors", points: 8, text: "Warriors close the game and secure the win." },
];

const resolvedTimeline = timeline.reduce<ResolvedSegment[]>(
  (segments, segment) => {
    const previousEnd = segments.length === 0 ? 0 : segments[segments.length - 1].endAt;

    segments.push({
      ...segment,
      startAt: previousEnd,
      endAt: previousEnd + segment.duration,
    });

    return segments;
  },
  []
);

const finalPlayableSecond =
  resolvedTimeline.find((segment) => segment.kind === "final")?.startAt ?? 0;
const finalStateHoldSeconds = 45;
const matchCycleSeconds = finalPlayableSecond + finalStateHoldSeconds;
const sharedMatchEpochMs = Date.UTC(2026, 0, 1, 0, 0, 0);

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatQuarterLabel(segment: ResolvedSegment) {
  if (segment.kind === "halftime") return "Half";
  if (segment.kind === "final") return "Final";

  if (segment.quarter === 1) return "1st";
  if (segment.quarter === 2) return "2nd";
  if (segment.quarter === 3) return "3rd";
  return "4th";
}

function resolveSegment(second: number) {
  return (
    resolvedTimeline.find(
      (segment) => second >= segment.startAt && second < segment.endAt
    ) ?? resolvedTimeline[resolvedTimeline.length - 1]
  );
}

function resolveClock(segment: ResolvedSegment, second: number) {
  if (segment.kind === "final") return "0:00";

  const offset = Math.max(0, second - segment.startAt);
  const remaining = Math.max(segment.clockEnd, segment.clockStart - offset);
  return formatClock(remaining);
}

function resolveScore(second: number) {
  return scoreEvents.reduce(
    (score, event) => {
      if (event.at > second) return score;

      return {
        warriors:
          event.team === "warriors"
            ? score.warriors + event.points
            : score.warriors,
        lakers:
          event.team === "lakers" ? score.lakers + event.points : score.lakers,
      };
    },
    { warriors: 0, lakers: 0 }
  );
}

function buildMomentLabel(at: number) {
  const segment = resolveSegment(at);
  const quarterLabel = formatQuarterLabel(segment);

  if (segment.kind === "final") return "Final";
  return `${quarterLabel} ${resolveClock(segment, at)}`;
}

function resolveHighlights(second: number): MockGameHighlight[] {
  return scoreEvents
    .filter((event) => event.at <= second)
    .slice(-5)
    .reverse()
    .map((event) => ({
      time: buildMomentLabel(event.at),
      text: event.text,
    }));
}

export function getMockGameSnapshot(second: number): MockGameSnapshot {
  const clampedSecond = Math.min(second, finalPlayableSecond);
  const segment = resolveSegment(clampedSecond);
  const score = resolveScore(clampedSecond);

  return {
    leftTeam: teams.warriors,
    rightTeam: teams.lakers,
    leftScore: score.warriors,
    rightScore: score.lakers,
    quarterLabel: formatQuarterLabel(segment),
    clock: resolveClock(segment, clampedSecond),
    statusLabel: segment.statusLabel,
    detail: segment.detail,
    highlights: resolveHighlights(clampedSecond),
  };
}

function getSharedMatchSecond(nowMs = Date.now()) {
  const elapsedSeconds = Math.floor((nowMs - sharedMatchEpochMs) / 1000);
  const normalizedSeconds =
    ((elapsedSeconds % matchCycleSeconds) + matchCycleSeconds) %
    matchCycleSeconds;

  return Math.min(normalizedSeconds, finalPlayableSecond);
}

export function getCurrentMockGameSnapshot() {
  return getMockGameSnapshot(getSharedMatchSecond());
}

export function subscribeToMockGameFeed(
  onUpdate: (snapshot: MockGameSnapshot) => void
) {
  onUpdate(getCurrentMockGameSnapshot());

  const intervalId = window.setInterval(() => {
    onUpdate(getCurrentMockGameSnapshot());
  }, 1000);

  return () => {
    window.clearInterval(intervalId);
  };
}
