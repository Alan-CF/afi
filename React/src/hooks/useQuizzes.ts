import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";

function mapQuizStatus(availableAgainAt?: string | null) {
  if (!availableAgainAt) return "available";
  return new Date(availableAgainAt).getTime() > Date.now() ? "cooldown" : "available";
}

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const profileId = (await getSession())?.user?.id ?? null;
      setIsAuthenticated(!!profileId);

      const { data: quizzesData, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (quizzesError) throw quizzesError;

      if (!quizzesData || quizzesData.length === 0) {
        setQuizzes([]);
        return;
      }

      const quizIds = quizzesData.map((quiz) => quiz.id);

      const { data: questionsCountData, error: questionsCountError } = await supabase
        .from("quiz_questions")
        .select("id, quiz_id");

      if (questionsCountError) throw questionsCountError;

      const questionCountMap = (questionsCountData || []).reduce((acc: any, question: any) => {
        acc[question.quiz_id] = (acc[question.quiz_id] || 0) + 1;
        return acc;
      }, {});

      let attemptsMap: Record<string, any> = {};

      if (profileId) {
        const { data: attemptsData, error: attemptsError } = await supabase
          .from("quiz_attempts")
          .select(`
            id,
            quiz_id,
            result_id,
            completed_at,
            available_again_at,
            quiz_results (
              id,
              title,
              subtitle,
              description,
              image_url
            )
          `)
          .eq("profile_id", profileId)
          .eq("status", "completed")
          .in("quiz_id", quizIds)
          .order("completed_at", { ascending: false });

        if (attemptsError) throw attemptsError;

        for (const attempt of attemptsData || []) {
          if (!attemptsMap[attempt.quiz_id]) {
            attemptsMap[attempt.quiz_id] = attempt;
          }
        }
      }

      const formatted = quizzesData.map((quiz) => {
        const latestAttempt = attemptsMap[quiz.id];
        const availableAgainAt = latestAttempt?.available_again_at
          ? new Date(latestAttempt.available_again_at)
          : null;

        return {
          ...quiz,
          question_count: questionCountMap[quiz.id] || 0,
          available_again_at: availableAgainAt,
          status: mapQuizStatus(latestAttempt?.available_again_at),
          last_result: latestAttempt?.quiz_results
            ? {
                id: latestAttempt.quiz_results.id,
                title: latestAttempt.quiz_results.title,
                subtitle: latestAttempt.quiz_results.subtitle,
                description: latestAttempt.quiz_results.description,
                image_url: latestAttempt.quiz_results.image_url,
              }
            : null,
        };
      });

      setQuizzes(formatted);
    } catch (err: any) {
      setError(err.message || "Could not load quizzes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return {
    quizzes,
    loading,
    error,
    refresh: fetchQuizzes,
    isAuthenticated,
  };
}