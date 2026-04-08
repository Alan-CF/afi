import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";
import { submitAnswer, type FanaticAnswer } from "../lib/fanaticApi";

type Riddle = {
  sort_order: number;
  riddle: string;
};

type TriesInfo = {
  remaining_tries_today: number;
  remaining_tries_game: number;
  next_try_date?: Date;
};

type BestTry = {
  best_score: number;
  highest_similarity: number;
};

type FanaticGameStatus = "active" | "no-game";

type UseFanaticHookOptions = {
  enabled?: boolean;
};

export function useFanaticGame() {
  const [status, setStatus] = useState<FanaticGameStatus>("active");
  const [nextGameDate, setNextGameDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNextGameDate = async () => {
    const { data, error } = await supabase.rpc("fanatic_time_next_game_date");
    console.log("Next game date response:", { data, error });
    if (error) throw error;

    const nextGame = data?.[0]?.next_game;
    return nextGame ? new Date(nextGame) : null;
  };

  const fetchGame = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("fanatic_get_current_game");

      if (error) throw error;

      if (!data || data.length === 0) {
        const upcomingGameDate = await fetchNextGameDate();

        setNextGameDate(upcomingGameDate);
        setStatus("no-game");
        setError(null);
        return;
      }

      setNextGameDate(null);
      setStatus("active");
      setError(null);
    } catch (err) {
      console.error("Error in useFanaticGame hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch fanatic game"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGame();
  }, []);

  return {
    status,
    nextGameDate,
    loading,
    error,
    refreshGame: fetchGame,
  };
}

export function useFanaticRiddles(options?: UseFanaticHookOptions) {
  const enabled = options?.enabled ?? true;
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchRiddles = async () => {
    if (!enabled) {
      setRiddles([]);
      setCategory(null);
      setError(null);
      setLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("fanatic_get_current_game");

      if (error) throw error;

      setRiddles(
        (data ?? []).map((row: any) => ({
          sort_order: row.sort_order,
          riddle: row.riddle,
        })),
      );
      setCategory(data?.[0]?.game_category ?? null);
      setError(null);
    } catch (err) {
      console.error("Error in useFanaticRiddles hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch riddles"),
      );
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchRiddles();
  }, [enabled]);

  return {
    riddles,
    category,
    loading,
    hasLoadedOnce,
    error,
    refreshRiddles: fetchRiddles,
  };
}

export function useSubmitFanaticAnswer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const answer = async (answer: string): Promise<FanaticAnswer | undefined> => {
    try {
      setLoading(true);
      setError(null);

      const data = await submitAnswer(answer);

      return data;
    } catch (err) {
      const submitError =
        err instanceof Error ? err : new Error("Failed to submit answer");

      console.error("Error in useSubmitAnswer hook:", submitError);
      setError(submitError);
      throw submitError;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    answer,
  };
}

export function useFanaticTries(options?: UseFanaticHookOptions) {
  const enabled = options?.enabled ?? true;
  const [triesInfo, setTriesInfo] = useState<TriesInfo | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchTriesInfo = async () => {
    if (!enabled) {
      setTriesInfo(null);
      setError(null);
      setLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("fanatic_remaining_game_tries", {
        pprofileid: (await getSession())?.user?.id,
      });

      if (error) throw error;

      const triesData = data?.[0];
      setTriesInfo(
        triesData
          ? {
              remaining_tries_today: triesData.remaining_tries_today,
              remaining_tries_game: triesData.remaining_tries_game,
              next_try_date: triesData.next_attempt_date
                ? new Date(triesData.next_attempt_date)
                : undefined,
            }
          : null,
      );

      setError(null);
    } catch (err) {
      console.error("Error in useFanaticTries hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch tries info"),
      );
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchTriesInfo();
  }, [enabled]);

  return {
    triesInfo,
    loading,
    hasLoadedOnce,
    error,
    refreshTriesInfo: fetchTriesInfo,
  };
}

export function useFanaticBestTry(options?: UseFanaticHookOptions) {
  const enabled = options?.enabled ?? true;
  const [bestTry, setBestTry] = useState<BestTry | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchBestTry = async () => {
    if (!enabled) {
      setBestTry(null);
      setError(null);
      setLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("fanatic_best_try", {
        pprofileid: (await getSession())?.user?.id,
      });

      if (error) throw error;

      const bestTryData = data?.[0];
      setBestTry(
        bestTryData
          ? {
              best_score: bestTryData.best_score,
              highest_similarity: Math.round(bestTryData.highest_similarity * 100),
            }
          : null,
      );

      setError(null);
    } catch (err) {
      console.error("Error in useFanaticBestTry hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch best try"),
      );
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchBestTry();
  }, [enabled]);

  return {
    bestTry,
    loading,
    hasLoadedOnce,
    error,
    refreshBestTry: fetchBestTry,
  };
}

export function useFanaticNextRiddleDate(options?: UseFanaticHookOptions) {
  const enabled = options?.enabled ?? true;
  const [nextRiddleDate, setNextRiddleDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchNextRiddleDate = async () => {
    if (!enabled) {
      setNextRiddleDate(null);
      setError(null);
      setLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("fanatic_next_riddle_date");

      if (error) throw error;

      setNextRiddleDate(typeof data === "string" ? new Date(data) : null);

      setError(null);
    } catch (err) {
      console.error("Error in useFanaticNextRiddleDate hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch next riddle date"),
      );
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchNextRiddleDate();
  }, [enabled]);

  return {
    nextRiddleDate,
    loading,
    hasLoadedOnce,
    error,
    refreshNextRiddleDate: fetchNextRiddleDate,
  };
}
