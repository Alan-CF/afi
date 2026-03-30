import { useEffect, useState } from "react";
import { supabase } from '../lib/supabaseClient';
import { getSession } from '../lib/auth'
import { submitAnswer } from "../lib/fanaticApi";
type Riddle = {
  sort_order: number;
  riddle: string;
};

type TriesInfo = {
  remaining_tries_today: number;
  remaining_tries_game: number;
  next_try_date?: Date;
}

type BestTry = {
  best_score: number;
  highest_similarity: number;
}

export function useFanaticRiddles() {
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRiddles = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc("fanatic_get_current_game");
      
      if (error) throw error;

      setRiddles(
        data?.map((row: any) => ({
          sort_order: row.sort_order,
          riddle: row.riddle,
        })) ?? []
      );
      setCategory(data?.[0]?.game_category ?? null);

      setError(null);
    } catch (err) {
      console.error("Error in useFanatic hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch riddles"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiddles();
  }, []);

  return {
    riddles,
    category,
    loading,
    error,
    refreshRiddles: fetchRiddles,
  };
}

export function useSubmitFanaticAnswer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const answer = async (answer: string) => {
    try {
      setLoading(true);

      const data = await submitAnswer(answer);

      setError(null);
      return data;
    } catch (err) {
      console.error("Error in useSubmitAnswer hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to submit answer"),
      );
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

export function useFanaticTries() {
  const [triesInfo, setTriesInfo] = useState<TriesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTriesInfo = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('fanatic_remaining_game_tries', {
        pprofileid: (await getSession())?.user?.id
      });

      if (error) throw error;

      const triesData = data?.[0];
      setTriesInfo(triesData ? {
        remaining_tries_today: triesData.remaining_tries_today,
        remaining_tries_game: triesData.remaining_tries_game,
        next_try_date: triesData.next_attempt_date ? new Date(triesData.next_attempt_date) : undefined
      } : null);

      setError(null);
    } catch (err) {
      console.error("Error in useFanaticTries hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch tries info"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriesInfo();
  }, []);

  return {
    triesInfo,
    loading,
    error,
    refreshTriesInfo: fetchTriesInfo,
  };
}

export function useFanaticBestTry() {
  const [bestTry, setBestTry] = useState<BestTry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBestTry = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('fanatic_best_try', {
        pprofileid: (await getSession())?.user?.id
      });

      if (error) throw error;

      const bestTryData = data?.[0];
      setBestTry(bestTryData ? {
        best_score: bestTryData.best_score,
        highest_similarity: Math.round(bestTryData.highest_similarity * 100)
      } : null);

      setError(null);
    } catch (err) {
      console.error("Error in useFanaticBestTry hook:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch best try"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBestTry();
  }, []);

  return {
    bestTry,
    loading,
    error,
    refreshBestTry: fetchBestTry,
  };
}

export function useFanaticNextRiddleDate() {
  const [nextRiddleDate, setNextRiddleDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNextRiddleDate = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('fanatic_next_riddle_date');

      console.log("Fetched next riddle date data:", data, "error:", error);
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
    }
  };

  useEffect(() => {
    fetchNextRiddleDate();
  }, []);

  return {
    nextRiddleDate,
    loading,
    error,
    refreshNextRiddleDate: fetchNextRiddleDate,
  };
}
  
