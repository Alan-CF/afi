import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useQuizQuestions(quizId?: string | null) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) {
      setQuestions([]);
      return;
    }

    let mounted = true;

    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("quiz_questions")
          .select(`
            id,
            quiz_id,
            question_text,
            question_order,
            quiz_options (
              id,
              question_id,
              option_text,
              image_url,
              option_order
            )
          `)
          .eq("quiz_id", quizId)
          .order("question_order", { ascending: true });

        if (error) throw error;

        if (!mounted) return;

        const formatted =
          (data || []).map((question: any) => ({
            id: question.id,
            quiz_id: question.quiz_id,
            question_text: question.question_text,
            question_order: question.question_order,
            options: (question.quiz_options || []).map((option: any) => ({
              id: option.id,
              question_id: option.question_id,
              option_text: option.option_text,
              image_url: option.image_url,
              option_order: option.option_order,
            })),
          })) || [];

        setQuestions(formatted);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Could not load quiz questions.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchQuestions();

    return () => {
      mounted = false;
    };
  }, [quizId]);

  return {
    questions,
    loading,
    error,
  };
}