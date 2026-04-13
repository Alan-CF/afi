export type MockGameHighlight = {
  time: string;
  text: string;
};

export type PredictionOption = "Triple" | "Double" | "Foul";

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
  elapsedSecond: number;
  cycleStartMs: number;
};

type MockGameControlState = {
  anchorMs: number;
  offsetSeconds: number;
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
  shotType: PredictionOption;
  text: string;
};

export type MockResolvedPredictionRound = {
  round: number;
  result: PredictionOption;
  scorer: string;
  points: number;
  resolvedAtSecond: number;
  resolvedAtMs: number;
};

export type MockPredictionState = {
  activeRound: number | null;
  closesInSeconds: number | null;
  resolvedRounds: MockResolvedPredictionRound[];
};

const teams = {
  warriors: "Warriors",
  lakers: "Lakers",
};

export const predictionOptions: PredictionOption[] = [
  "Triple",
  "Double",
  "Foul",
];

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
    detail: null,
  },
];

const scoreEvents: ScoreEvent[] = [
  {
    at: 7,
    team: "warriors",
    points: 3,
    shotType: "Triple",
    text: "Curry opens with a quick triple from the wing.",
  },
  {
    at: 14,
    team: "lakers",
    points: 2,
    shotType: "Double",
    text: "Davis answers with a strong finish inside.",
  },
  {
    at: 21,
    team: "warriors",
    points: 2,
    shotType: "Double",
    text: "Warriors cut through the lane for two.",
  },
  {
    at: 31,
    team: "lakers",
    points: 3,
    shotType: "Triple",
    text: "Reaves drills a catch-and-shoot three.",
  },
  {
    at: 39,
    team: "warriors",
    points: 1,
    shotType: "Foul",
    text: "Warriors get one at the line after the foul.",
  },
  {
    at: 47,
    team: "warriors",
    points: 2,
    shotType: "Double",
    text: "A quick cut gives the Warriors two more.",
  },
  {
    at: 57,
    team: "lakers",
    points: 2,
    shotType: "Double",
    text: "Lakers respond with a baseline jumper.",
  },
  {
    at: 66,
    team: "warriors",
    points: 3,
    shotType: "Triple",
    text: "Warriors hit a transition three.",
  },
  {
    at: 76,
    team: "lakers",
    points: 1,
    shotType: "Foul",
    text: "One free throw drops for the Lakers.",
  },
  {
    at: 86,
    team: "warriors",
    points: 2,
    shotType: "Double",
    text: "Warriors get to the rim for two.",
  },
  {
    at: 97,
    team: "lakers",
    points: 3,
    shotType: "Triple",
    text: "Lakers stay close with a deep triple.",
  },
  {
    at: 108,
    team: "warriors",
    points: 2,
    shotType: "Double",
    text: "A soft floater puts two on the board.",
  },
  {
    at: 118,
    team: "lakers",
    points: 1,
    shotType: "Foul",
    text: "Lakers split the trip and take one point.",
  },
  {
    at: 129,
    team: "warriors",
    points: 3,
    shotType: "Triple",
    text: "Warriors bury another triple from up top.",
  },
  {
    at: 140,
    team: "lakers",
    points: 2,
    shotType: "Double",
    text: "A quick backdoor cut brings the Lakers two.",
  },
  {
    at: 151,
    team: "warriors",
    points: 2,
    shotType: "Double",
    text: "Warriors keep the pace with a fast two.",
  },
  {
    at: 162,
    team: "warriors",
    points: 1,
    shotType: "Foul",
    text: "Warriors add one more from the stripe.",
  },
  {
    at: 174,
    team: "lakers",
    points: 3,
    shotType: "Triple",
    text: "Lakers heat up again from three.",
  },
  {
    at: 185,
    team: "warriors",
    points: 2,
    shotType: "Double",
    text: "Warriors answer with a composed midrange two.",
  },
  {
    at: 196,
    team: "lakers",
    points: 2,
    shotType: "Double",
    text: "The Lakers finish through contact for two.",
  },
  {
    at: 207,
    team: "warriors",
    points: 3,
    shotType: "Triple",
    text: "Big Warriors triple in the fourth quarter.",
  },
  {
    at: 218,
    team: "lakers",
    points: 1,
    shotType: "Foul",
    text: "Lakers keep inching closer with one free throw.",
  },
  {
    at: 228,
    team: "warriors",
    points: 2,
    shotType: "Double",
    text: "Warriors find a clean look for two.",
  },
  {
    at: 236,
    team: "lakers",
    points: 3,
    shotType: "Triple",
    text: "Late Lakers triple trims the final margin.",
  },
  {
    at: 241,
    team: "warriors",
    points: 2,
    shotType: "Double",
    text: "Warriors seal it with the last bucket inside.",
  },
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
const fourthQuarterStartSecond =
  resolvedTimeline.find(
    (segment) => segment.kind === "quarter" && segment.quarter === 4
  )?.startAt ?? 0;
const finalStateHoldSeconds = 45;
const matchCycleSeconds = finalPlayableSecond + finalStateHoldSeconds;
const sharedMatchEpochMs = Date.UTC(2026, 0, 1, 0, 0, 0);
const mockGameControlStorageKey = "afi.mock-game-control";
const mockGameControlEvent = "afi:mock-game-control";

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
  const cycleStartMs = getCurrentCycleStartMs();

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
    elapsedSecond: clampedSecond,
    cycleStartMs,
  };
}

function getCurrentCycleContext(nowMs = Date.now()) {
  const controlState = getMockGameControlState();
  const anchorMs = controlState?.anchorMs ?? sharedMatchEpochMs;
  const offsetSeconds = controlState?.offsetSeconds ?? 0;
  const elapsedMs = nowMs - anchorMs + offsetSeconds * 1000;
  const cycleDurationMs = matchCycleSeconds * 1000;
  const normalizedMs =
    ((elapsedMs % cycleDurationMs) + cycleDurationMs) % cycleDurationMs;

  return {
    cycleStartMs: nowMs - normalizedMs,
    second: Math.min(Math.floor(normalizedMs / 1000), finalPlayableSecond),
  };
}

function getSharedMatchSecond(nowMs = Date.now()) {
  return getCurrentCycleContext(nowMs).second;
}

function getCurrentCycleStartMs(nowMs = Date.now()) {
  return getCurrentCycleContext(nowMs).cycleStartMs;
}

function getMockGameControlState(): MockGameControlState | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(mockGameControlStorageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as MockGameControlState;
    if (
      typeof parsed.anchorMs !== "number" ||
      typeof parsed.offsetSeconds !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function updateMockGameControl(offsetSeconds: number) {
  if (typeof window === "undefined") return;

  const nextState: MockGameControlState = {
    anchorMs: Date.now(),
    offsetSeconds,
  };

  window.localStorage.setItem(
    mockGameControlStorageKey,
    JSON.stringify(nextState)
  );
  window.dispatchEvent(new CustomEvent(mockGameControlEvent));
}

export function getCurrentMockGameSnapshot() {
  return getMockGameSnapshot(getSharedMatchSecond());
}

export function getMockPredictionState(
  snapshot: Pick<MockGameSnapshot, "elapsedSecond" | "cycleStartMs">
): MockPredictionState {
  const activeEventIndex = scoreEvents.findIndex(
    (event) => event.at > snapshot.elapsedSecond
  );

  const activeRound = activeEventIndex === -1 ? null : activeEventIndex;
  const closesInSeconds =
    activeRound === null
      ? null
      : Math.max(0, scoreEvents[activeRound].at - snapshot.elapsedSecond);

  const resolvedRounds = scoreEvents
    .filter((event) => event.at <= snapshot.elapsedSecond)
    .map((event, index) => ({
      round: index,
      result: event.shotType,
      scorer: teams[event.team],
      points: event.points,
      resolvedAtSecond: event.at,
      resolvedAtMs: snapshot.cycleStartMs + event.at * 1000,
    }));

  return {
    activeRound,
    closesInSeconds,
    resolvedRounds,
  };
}

export function resetMockGame() {
  updateMockGameControl(0);
}

export function jumpToMockGameLastQuarter() {
  updateMockGameControl(fourthQuarterStartSecond);
}

export function subscribeToMockGameFeed(
  onUpdate: (snapshot: MockGameSnapshot) => void
) {
  const emitSnapshot = () => {
    onUpdate(getCurrentMockGameSnapshot());
  };

  emitSnapshot();
  const intervalId = window.setInterval(() => {
    emitSnapshot();
  }, 1000);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === mockGameControlStorageKey) {
      emitSnapshot();
    }
  };

  const handleControlUpdate = () => {
    emitSnapshot();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(mockGameControlEvent, handleControlUpdate);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(mockGameControlEvent, handleControlUpdate);
  };
}
