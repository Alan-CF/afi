import { supabase } from './supabaseClient';


export async function submitAnswer(answer: string) {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const { data, error } = await supabase.functions.invoke('fanatic/answer', {
    method: 'POST',
    body: { answer },
    headers,
  });

  if (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }

  return data;
}
