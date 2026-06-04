import { supabase } from '../../../shared/helpers/supabaseClient';

const TEST_QUIZ_TITLE = '[TEST] Quiz Functionality Test';

async function findTestQuiz(): Promise<number> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id')
    .eq('title', TEST_QUIZ_TITLE)
    .single();

  if (error || !data) {
    console.error(`Test quiz not found: ${error?.message}`);
    throw new Error(`Test quiz not found: ${error?.message}`);
  }

  return data.id;
}

async function deleteQuiz(quizId: number): Promise<void> {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);

  if (error) {
    console.error(`Quiz delete failed: ${error.message}`);
    throw new Error(`Quiz delete failed: ${error.message}`);
  }

  // Cascade will automatically delete:
  //   quiz_questions -> quiz_options -> option_result_map
  //                                 -> quiz_attempt_answers
  //   quiz_results   -> option_result_map
  //                  -> quiz_attempts.result_id (SET NULL)
  //   quiz_attempts  -> quiz_attempt_answers
}

export async function deleteTestQuiz() {
  const quizId = await findTestQuiz();
  await deleteQuiz(quizId);
}

deleteTestQuiz().catch((err) => {
  console.error('Seed failed:', err.message);
  throw err;
});
