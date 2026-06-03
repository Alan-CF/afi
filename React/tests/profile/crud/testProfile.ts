import { supabase } from '../../helpers/supabaseClient';

export async function getTestProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'tester')
    .maybeSingle();

  if (error) {
    console.error('Error fetching test profile:', error);
    throw error;
  }

  if (!data?.id) {
    console.error('Test profile not found');
    throw new Error('Test profile not found');
  }

  return data.id;
}

export async function resetProfile(id: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      username: 'tester',
      fanatic_coins: 0,
      avatar_url: null,
      caption: null,
      name: 'Tester',
      streak: 0,
      selected_frame_id: null,
      role: 'user',
    })
    .eq('id', id);

  if (error) {
    console.error('Error resetting test profile:', error);
    throw error;
  }
}
