export type AchievementId =
  | "first-spark"
  | "ten-day-flame"
  | "century-fan"
  | "new-teammate"
  | "squad-builder"
  | "room-rookie"
  | "quiz-debut";

export type AchievementDef = {
  id: AchievementId;
  name: string;
  description: string;
  requirement: string;
  color: string;
  progressTarget: number;
  progressUnit: string;
};

// Computed achievement with real progress
export type Achievement = AchievementDef & {
  progressCurrent: number;
  progressLabel: string;
  unlocked: boolean;
  unlockedAt?: string;
};

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first-spark",
    name: "First Spark",
    description: "You started your fan journey with your first active day.",
    requirement: "Log in and maintain a streak for at least 1 day.",
    color: "bg-[#0f8ee9]",
    progressTarget: 1,
    progressUnit: "day",
  },
  {
    id: "ten-day-flame",
    name: "Ten-Day Flame",
    description: "You kept the energy alive for 10 days in a row.",
    requirement: "Maintain a login streak of 10 consecutive days.",
    color: "bg-[#1d78d6]",
    progressTarget: 10,
    progressUnit: "days",
  },
  {
    id: "century-fan",
    name: "Century Fan",
    description: "A true fan shows up again and again. Reach 100 active days.",
    requirement: "Maintain a login streak of 100 consecutive days.",
    color: "bg-[#315fd4]",
    progressTarget: 100,
    progressUnit: "days",
  },
  {
    id: "new-teammate",
    name: "New Teammate",
    description: "You made your first connection in the AFI community.",
    requirement: "Add or be accepted by at least 1 friend.",
    color: "bg-[#0876dc]",
    progressTarget: 1,
    progressUnit: "friend",
  },
  {
    id: "squad-builder",
    name: "Squad Builder",
    description: "You are building your own fan squad.",
    requirement: "Have at least 10 accepted friends.",
    color: "bg-[#1f4f96]",
    progressTarget: 10,
    progressUnit: "friends",
  },
  {
    id: "room-rookie",
    name: "Room Rookie",
    description: "You created your first space to share the game with others.",
    requirement: "Create your first room.",
    color: "bg-[#0a95bf]",
    progressTarget: 1,
    progressUnit: "room",
  },
  {
    id: "quiz-debut",
    name: "Quiz Debut",
    description: "You joined the challenge and answered your first fan quiz.",
    requirement: "Complete at least 1 quiz.",
    color: "bg-[#4f6fe8]",
    progressTarget: 1,
    progressUnit: "quiz",
  },
];
