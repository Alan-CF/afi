import { supabase } from '../../shared/helpers/supabaseClient';

export async function getHighestPoints() {
  const { data, error } = await supabase
    .from('profiles')
    .select('fanatic_coins')
    .order('fanatic_coins', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching highest points:', error);
    throw error;
  }

  if (!data) return 0;

  return data.fanatic_coins ?? 0;
}

export async function setTestProfilePoints(points: number) {
  const { error } = await supabase
    .from('profiles')
    .update({ fanatic_coins: points })
    .eq('username', 'tester')
    .maybeSingle();

  if (error) {
    console.error('Error setting test profile points:', error);
    throw error;
  }
}
