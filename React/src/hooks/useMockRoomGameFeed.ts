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
  matchId: MockMatchId;
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

// ---------------------------------------------------------------------------
// Match A — full Lakers vs Warriors game (4 quarters).
// ---------------------------------------------------------------------------

// Stretches the whole match timeline (and therefore the gap between
// prediction rounds / score messages). Higher = more time between points.
const FULL_TIME_SCALE = 3;

const fullTimeline: TimelineSegment[] = [
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

const fullBaseScoreEvents: ScoreEvent[] = [
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

// ---------------------------------------------------------------------------
// Match B — short clutch stretch (video 0:30 → 0:57, ~27s).
// Lakers in front 94–85; Warriors hit a triple, Lakers answer at the line
// off a foul. Final: Lakers 96 – Warriors 88.
// ---------------------------------------------------------------------------

const SHORT_TIME_SCALE = 2;

const shortBaseScore = { warriors: 85, lakers: 94 };

const shortTimeline: TimelineSegment[] = [
  {
    kind: "quarter",
    quarter: 4,
    duration: 11,
    clockStart: 27,
    clockEnd: 16,
    statusLabel: "Live",
    detail: null,
  },
  {
    kind: "quarter",
    quarter: 4,
    duration: 5,
    clockStart: 16,
    clockEnd: 16,
    statusLabel: "Clock Stopped",
    detail: "Shooting foul — two at the line.",
  },
  {
    kind: "quarter",
    quarter: 4,
    duration: 11,
    clockStart: 16,
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

const shortBaseScoreEvents: ScoreEvent[] = [
  {
    at: 8,
    team: "warriors",
    points: 3,
    shotType: "Triple",
    text: "Warriors splash a deep triple to pull within two.",
  },
  {
    at: 18,
    team: "lakers",
    points: 2,
    shotType: "Foul",
    text: "Lakers knock down both free throws after the foul.",
  },
];

// ---------------------------------------------------------------------------
// Match registry + derived config builder.
// ---------------------------------------------------------------------------

export type MockMatchId = "full" | "short";

type MatchDefinition = {
  id: MockMatchId;
  label: string;
  timeScale: number;
  baseScore: { warriors: number; lakers: number };
  timeline: TimelineSegment[];
  baseScoreEvents: ScoreEvent[];
};

type MatchConfig = {
  id: MockMatchId;
  label: string;
  timeScale: number;
  baseScore: { warriors: number; lakers: number };
  scoreEvents: ScoreEvent[];
  resolvedTimeline: ResolvedSegment[];
  finalPlayableSecond: number;
  fourthQuarterStartSecond: number;
  matchCycleSeconds: number;
};

const finalStateHoldSeconds = 45;

function buildMatchConfig(definition: MatchDefinition): MatchConfig {
  const { timeScale } = definition;

  // Scale every event timestamp so messages land further apart in real time.
  const scoreEvents = definition.baseScoreEvents.map((event) => ({
    ...event,
    at: event.at * timeScale,
  }));

  const resolvedTimeline = definition.timeline.reduce<ResolvedSegment[]>(
    (segments, segment) => {
      const previousEnd =
        segments.length === 0 ? 0 : segments[segments.length - 1].endAt;

      segments.push({
        ...segment,
        startAt: previousEnd,
        endAt: previousEnd + segment.duration * timeScale,
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

  return {
    id: definition.id,
    label: definition.label,
    timeScale,
    baseScore: definition.baseScore,
    scoreEvents,
    resolvedTimeline,
    finalPlayableSecond,
    fourthQuarterStartSecond,
    matchCycleSeconds: finalPlayableSecond + finalStateHoldSeconds,
  };
}

const matchConfigs: Record<MockMatchId, MatchConfig> = {
  full: buildMatchConfig({
    id: "full",
    label: "Full Game",
    timeScale: FULL_TIME_SCALE,
    baseScore: { warriors: 0, lakers: 0 },
    timeline: fullTimeline,
    baseScoreEvents: fullBaseScoreEvents,
  }),
  short: buildMatchConfig({
    id: "short",
    label: "Clutch (27s)",
    timeScale: SHORT_TIME_SCALE,
    baseScore: shortBaseScore,
    timeline: shortTimeline,
    baseScoreEvents: shortBaseScoreEvents,
  }),
};

const defaultMatchId: MockMatchId = "full";

// Fixed absolute epoch used when a room has not taken manual control yet
// (mock_anchor_ms is null). Because it is a constant, every device computes
// the same free-running clock with no dependence on local wall-clock offset.
const sharedMatchEpochMs = Date.UTC(2026, 0, 1, 0, 0, 0);

// Serializable control state persisted per-room in Supabase. The whole live
// game is a pure function of this control + the current time, so any device
// holding the same control renders the same match and clock.
export type MockGameControl = {
  matchId: MockMatchId;
  anchorMs: number | null;
  offsetSeconds: number;
};

// The app runs a single shared mock match: the short "clutch" stretch.
export const ACTIVE_MOCK_MATCH_ID: MockMatchId = "short";

export const DEFAULT_MOCK_CONTROL: MockGameControl = {
  matchId: ACTIVE_MOCK_MATCH_ID,
  anchorMs: null,
  offsetSeconds: 0,
};

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

function resolveSegment(config: MatchConfig, second: number) {
  return (
    config.resolvedTimeline.find(
      (segment) => second >= segment.startAt && second < segment.endAt
    ) ?? config.resolvedTimeline[config.resolvedTimeline.length - 1]
  );
}

function resolveClock(
  config: MatchConfig,
  segment: ResolvedSegment,
  second: number
) {
  if (segment.kind === "final") return "0:00";

  const offset = Math.max(0, second - segment.startAt) / config.timeScale;
  const remaining = Math.max(
    segment.clockEnd,
    segment.clockStart - Math.floor(offset)
  );
  return formatClock(remaining);
}

function resolveScore(config: MatchConfig, second: number) {
  return config.scoreEvents.reduce(
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
    { warriors: config.baseScore.warriors, lakers: config.baseScore.lakers }
  );
}

function buildMomentLabel(config: MatchConfig, at: number) {
  const segment = resolveSegment(config, at);
  const quarterLabel = formatQuarterLabel(segment);

  if (segment.kind === "final") return "Final";
  return `${quarterLabel} ${resolveClock(config, segment, at)}`;
}

function resolveHighlights(
  config: MatchConfig,
  second: number
): MockGameHighlight[] {
  return config.scoreEvents
    .filter((event) => event.at <= second)
    .slice(-5)
    .reverse()
    .map((event) => ({
      time: buildMomentLabel(config, event.at),
      text: event.text,
    }));
}

function getCycleContext(control: MockGameControl, nowMs: number) {
  const config = matchConfigs[control.matchId] ?? matchConfigs[defaultMatchId];
  const anchorMs = control.anchorMs ?? sharedMatchEpochMs;
  const offsetSeconds = control.offsetSeconds ?? 0;
  const elapsedMs = nowMs - anchorMs + offsetSeconds * 1000;
  const cycleDurationMs = config.matchCycleSeconds * 1000;
  const normalizedMs =
    ((elapsedMs % cycleDurationMs) + cycleDurationMs) % cycleDurationMs;

  return {
    config,
    cycleStartMs: nowMs - normalizedMs,
    second: Math.min(
      Math.floor(normalizedMs / 1000),
      config.finalPlayableSecond
    ),
  };
}

// Pure: the whole live game derives from the (room-synced) control + the
// current time. Two devices holding the same control render the same game.
export function computeMockGameSnapshot(
  control: MockGameControl,
  nowMs: number = Date.now()
): MockGameSnapshot {
  const { config, cycleStartMs, second } = getCycleContext(control, nowMs);
  const segment = resolveSegment(config, second);
  const score = resolveScore(config, second);

  return {
    leftTeam: teams.warriors,
    rightTeam: teams.lakers,
    leftScore: score.warriors,
    rightScore: score.lakers,
    quarterLabel: formatQuarterLabel(segment),
    clock: resolveClock(config, segment, second),
    statusLabel: segment.statusLabel,
    detail: segment.detail,
    highlights: resolveHighlights(config, second),
    elapsedSecond: second,
    cycleStartMs,
    matchId: config.id,
  };
}

export function getMockPredictionState(
  snapshot: Pick<MockGameSnapshot, "elapsedSecond" | "cycleStartMs" | "matchId">
): MockPredictionState {
  const config = matchConfigs[snapshot.matchId] ?? matchConfigs[defaultMatchId];
  const activeEventIndex = config.scoreEvents.findIndex(
    (event) => event.at > snapshot.elapsedSecond
  );

  const activeRound = activeEventIndex === -1 ? null : activeEventIndex;
  const closesInSeconds =
    activeRound === null
      ? null
      : Math.max(0, config.scoreEvents[activeRound].at - snapshot.elapsedSecond);

  const resolvedRounds = config.scoreEvents
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
