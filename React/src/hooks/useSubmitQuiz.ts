import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useSubmitQuiz() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuiz = async ({
    quiz_id,
    answers,
  }: {
    quiz_id: number;
    answers: { question_id: number; option_id: number }[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("submit_quiz_attempt", {
        p_quiz_id: quiz_id,
        p_answers: answers,
      });

      if (error) throw error;

      return Array.isArray(data) ? data[0] : data;
    } catch (err: any) {
      console.error("submitQuiz error:", err);
      setError(err.message || "Could not submit quiz.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    submitQuiz,
    loading,
    error,
  };
}