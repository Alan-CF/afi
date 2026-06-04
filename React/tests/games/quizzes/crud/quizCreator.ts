import { supabase } from '../../../shared/helpers/supabaseClient';

interface Question {
  id: number;
  question_order: number;
}
interface Result {
  id: number;
  priority: number;
}
interface Option {
  id: number;
  question_id: number;
  option_order: number;
}

async function insertQuiz(): Promise<number> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      title: '[TEST] Quiz Functionality Test',
      description:
        'This is a test quiz used to verify that the quiz flow works end to end. Not intended for real users.',
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error(`Quiz insert failed: ${error?.message}`);
    throw new Error(`Quiz insert failed: ${error?.message}`);
  }

  return data.id;
}

async function insertQuestions(quizId: number): Promise<Question[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert([
      {
        quiz_id: quizId,
        question_text:
          '[Q1] This is test question 1 — select any option to continue',
        question_order: 1,
      },
      {
        quiz_id: quizId,
        question_text:
          '[Q2] This is test question 2 — each option maps to a result',
        question_order: 2,
      },
      {
        quiz_id: quizId,
        question_text:
          '[Q3] This is test question 3 — last question before result shows',
        question_order: 3,
      },
    ])
    .select('id, question_order');

  if (error || !data) {
    console.error(`Questions insert failed: ${error?.message}`);
    throw new Error(`Questions insert failed: ${error?.message}`);
  }
  const sorted = data.sort((a, b) => a.question_order - b.question_order);
  return sorted;
}

async function insertResults(quizId: number): Promise<Result[]> {
  const { data, error } = await supabase
    .from('quiz_results')
    .insert([
      {
        quiz_id: quizId,
        title: '[RESULT A] Test Result Alpha',
        subtitle: 'Triggered by options 1',
        description:
          'You selected mostly Option 1 answers. Result A is working correctly.',
        priority: 1,
      },
      {
        quiz_id: quizId,
        title: '[RESULT B] Test Result Beta',
        subtitle: 'Triggered by options 2',
        description:
          'You selected mostly Option 2 answers. Result B is working correctly.',
        priority: 2,
      },
      {
        quiz_id: quizId,
        title: '[RESULT C] Test Result Gamma',
        subtitle: 'Triggered by options 3 & 4',
        description:
          'You selected mostly Options 3 or 4. Result C is working correctly.',
        priority: 3,
      },
    ])
    .select('id, priority');

  if (error || !data) {
    console.error(`Results insert failed: ${error?.message}`);
    throw new Error(`Results insert failed: ${error?.message}`);
  }
  const sorted = data.sort((a, b) => a.priority - b.priority);
  return sorted;
}

async function insertOptions(questions: Question[]): Promise<Option[]> {
  const [q1, q2, q3] = questions;

  const { data, error } = await supabase
    .from('quiz_options')
    .insert([
      // Q1
      {
        question_id: q1.id,
        option_text: '[Q1-A] Option that leans toward Result A',
        option_order: 1,
      },
      {
        question_id: q1.id,
        option_text: '[Q1-B] Option that leans toward Result B',
        option_order: 2,
      },
      {
        question_id: q1.id,
        option_text: '[Q1-C] Option that leans toward Result C',
        option_order: 3,
      },
      {
        question_id: q1.id,
        option_text: '[Q1-D] Neutral option — spreads across all results',
        option_order: 4,
      },
      // Q2
      {
        question_id: q2.id,
        option_text: '[Q2-A] Option that leans toward Result A',
        option_order: 1,
      },
      {
        question_id: q2.id,
        option_text: '[Q2-B] Option that leans toward Result B',
        option_order: 2,
      },
      {
        question_id: q2.id,
        option_text: '[Q2-C] Option that leans toward Result C',
        option_order: 3,
      },
      {
        question_id: q2.id,
        option_text: '[Q2-D] Neutral option — spreads across all results',
        option_order: 4,
      },
      // Q3
      {
        question_id: q3.id,
        option_text: '[Q3-A] Option that leans toward Result A',
        option_order: 1,
      },
      {
        question_id: q3.id,
        option_text: '[Q3-B] Option that leans toward Result B',
        option_order: 2,
      },
      {
        question_id: q3.id,
        option_text: '[Q3-C] Option that leans toward Result C',
        option_order: 3,
      },
      {
        question_id: q3.id,
        option_text: '[Q3-D] Neutral option — spreads across all results',
        option_order: 4,
      },
    ])
    .select('id, question_id, option_order');

  if (error || !data) {
    console.error(`Options insert failed: ${error?.message}`);
    throw new Error(`Options insert failed: ${error?.message}`);
  }
  return data;
}

async function insertOptionResultMap(
  options: Option[],
  results: Result[]
): Promise<void> {
  const [resultA, resultB, resultC] = results;

  // Look up an option id by its question id and order position
  const opt = (questionId: number, order: number): number => {
    const found = options.find(
      (o) => o.question_id === questionId && o.option_order === order
    );
    if (!found)
      throw new Error(
        `Option not found: question ${questionId}, order ${order}`
      );
    return found.id;
  };

  const questionIds = [...new Set(options.map((o) => o.question_id))];
  const [q1id, q2id, q3id] = questionIds;

  const { error } = await supabase.from('option_result_map').insert([
    // ── Q1 ──────────────────────────────────────────────
    // Q1-A → strong A, soft B
    { option_id: opt(q1id, 1), result_id: resultA.id, weight: 2 },
    { option_id: opt(q1id, 1), result_id: resultB.id, weight: 1 },
    // Q1-B → strong B, soft A
    { option_id: opt(q1id, 2), result_id: resultB.id, weight: 2 },
    { option_id: opt(q1id, 2), result_id: resultA.id, weight: 1 },
    // Q1-C → strong C, soft B
    { option_id: opt(q1id, 3), result_id: resultC.id, weight: 2 },
    { option_id: opt(q1id, 3), result_id: resultB.id, weight: 1 },
    // Q1-D → neutral spread
    { option_id: opt(q1id, 4), result_id: resultA.id, weight: 1 },
    { option_id: opt(q1id, 4), result_id: resultB.id, weight: 1 },
    { option_id: opt(q1id, 4), result_id: resultC.id, weight: 1 },

    // ── Q2 ──────────────────────────────────────────────
    // Q2-A → strong A, soft B
    { option_id: opt(q2id, 1), result_id: resultA.id, weight: 2 },
    { option_id: opt(q2id, 1), result_id: resultB.id, weight: 1 },
    // Q2-B → strong B, soft A
    { option_id: opt(q2id, 2), result_id: resultB.id, weight: 2 },
    { option_id: opt(q2id, 2), result_id: resultA.id, weight: 1 },
    // Q2-C → strong C, soft B
    { option_id: opt(q2id, 3), result_id: resultC.id, weight: 2 },
    { option_id: opt(q2id, 3), result_id: resultB.id, weight: 1 },
    // Q2-D → neutral spread
    { option_id: opt(q2id, 4), result_id: resultA.id, weight: 1 },
    { option_id: opt(q2id, 4), result_id: resultB.id, weight: 1 },
    { option_id: opt(q2id, 4), result_id: resultC.id, weight: 1 },

    // ── Q3 ──────────────────────────────────────────────
    // Q3-A → strong A, soft B
    { option_id: opt(q3id, 1), result_id: resultA.id, weight: 2 },
    { option_id: opt(q3id, 1), result_id: resultB.id, weight: 1 },
    // Q3-B → strong B, soft A
    { option_id: opt(q3id, 2), result_id: resultB.id, weight: 2 },
    { option_id: opt(q3id, 2), result_id: resultA.id, weight: 1 },
    // Q3-C → strong C, soft B
    { option_id: opt(q3id, 3), result_id: resultC.id, weight: 2 },
    { option_id: opt(q3id, 3), result_id: resultB.id, weight: 1 },
    // Q3-D → neutral spread
    { option_id: opt(q3id, 4), result_id: resultA.id, weight: 1 },
    { option_id: opt(q3id, 4), result_id: resultB.id, weight: 1 },
    { option_id: opt(q3id, 4), result_id: resultC.id, weight: 1 },
  ]);

  if (error) {
    console.error('Option-Result mapping insert failed:', error.message);
    throw new Error(`option_result_map insert failed: ${error.message}`);
  }
}

export async function seedTestQuiz() {
  const quizId = await insertQuiz();
  const questions = await insertQuestions(quizId);
  const results = await insertResults(quizId);
  const options = await insertOptions(questions);
  await insertOptionResultMap(options, results);
}
