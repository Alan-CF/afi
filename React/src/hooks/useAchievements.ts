import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ACHIEVEMENT_DEFS, type Achievement } from "../data/achievements";

function formatDate(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  return formatDateValue(new Date(iso));
}

function formatDateValue(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStreakUnlockDate(streak: number, target: number): string | undefined {
  if (streak < target) return undefined;
  const unlockedDate = new Date();
  unlockedDate.setHours(12, 0, 0, 0);
  unlockedDate.setDate(unlockedDate.getDate() - (streak - target));
  return formatDateValue(unlockedDate);
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const userId = user.id;

      const [
        profileResult,
        acceptedFriendsResult,
        roomsCountResult,
        firstRoomResult,
        quizCountResult,
        firstQuizResult,
      ] = await Promise.all([
        supabase.from("profiles").select("streak").eq("id", userId).single(),

        supabase
          .from("friendships")
          .select("created_at")
          .eq("status", "accepted")
          .or(`requester_profile_id.eq.${userId},receiver_profile_id.eq.${userId}`)
          .order("created_at", { ascending: true }),

        supabase
          .from("rooms")
          .select("*", { count: "exact", head: true })
          .eq("owner_profile_id", userId),

        supabase
          .from("rooms")
          .select("created_at")
          .eq("owner_profile_id", userId)
          .order("created_at", { ascending: true })
          .limit(1),

        supabase
          .from("quiz_attempts")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", userId)
          .eq("status", "completed"),

        supabase
          .from("quiz_attempts")
          .select("completed_at")
          .eq("profile_id", userId)
          .eq("status", "completed")
          .order("completed_at", { ascending: true })
          .limit(1),
      ]);

      const streak = profileResult.data?.streak ?? 0;
      const acceptedFriendDates =
        acceptedFriendsResult.data?.map((friendship) => friendship.created_at) ?? [];
      const friendsCount = acceptedFriendDates.length;
      const firstFriendDate = formatDate(acceptedFriendDates[0]);
      const squadBuilderDate = formatDate(acceptedFriendDates[9]);
      const roomsCount = roomsCountResult.count ?? 0;
      const firstRoomDate = formatDate(firstRoomResult.data?.[0]?.created_at);
      const quizCount = quizCountResult.count ?? 0;
      const firstQuizDate = formatDate(firstQuizResult.data?.[0]?.completed_at);

      const computed: Achievement[] = ACHIEVEMENT_DEFS.map((def) => {
        switch (def.id) {
          case "first-spark":
            return {
              ...def,
              progressCurrent: Math.min(streak, 1),
              progressLabel: `${Math.min(streak, 1)}/1 day`,
              unlocked: streak >= 1,
              unlockedAt: getStreakUnlockDate(streak, 1),
            };
          case "ten-day-flame":
            return {
              ...def,
              progressCurrent: Math.min(streak, 10),
              progressLabel: `${Math.min(streak, 10)}/10 days`,
              unlocked: streak >= 10,
              unlockedAt: getStreakUnlockDate(streak, 10),
            };
          case "century-fan":
            return {
              ...def,
              progressCurrent: Math.min(streak, 100),
              progressLabel: `${Math.min(streak, 100)}/100 days`,
              unlocked: streak >= 100,
              unlockedAt: getStreakUnlockDate(streak, 100),
            };
          case "new-teammate":
            return {
              ...def,
              progressCurrent: Math.min(friendsCount, 1),
              progressLabel: `${Math.min(friendsCount, 1)}/1 friend`,
              unlocked: friendsCount >= 1,
              unlockedAt: friendsCount >= 1 ? firstFriendDate : undefined,
            };
          case "squad-builder":
            return {
              ...def,
              progressCurrent: Math.min(friendsCount, 10),
              progressLabel: `${Math.min(friendsCount, 10)}/10 friends`,
              unlocked: friendsCount >= 10,
              unlockedAt: friendsCount >= 10 ? squadBuilderDate : undefined,
            };
          case "room-rookie":
            return {
              ...def,
              progressCurrent: Math.min(roomsCount, 1),
              progressLabel: `${Math.min(roomsCount, 1)}/1 room`,
              unlocked: roomsCount >= 1,
              unlockedAt: roomsCount >= 1 ? firstRoomDate : undefined,
            };
          case "quiz-debut":
            return {
              ...def,
              progressCurrent: Math.min(quizCount, 1),
              progressLabel: `${Math.min(quizCount, 1)}/1 quiz`,
              unlocked: quizCount >= 1,
              unlockedAt: quizCount >= 1 ? firstQuizDate : undefined,
            };
          default:
            return { ...def, progressCurrent: 0, progressLabel: "", unlocked: false };
        }
      });

      setAchievements(
        computed.sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
      );
      setLoading(false);
    }

    load();
  }, []);

  return { achievements, loading };
}
