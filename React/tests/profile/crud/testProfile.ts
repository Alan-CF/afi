import { supabase } from '../../shared/helpers/supabaseClient';

export type Profile = {
  id: string;
  username: string;
  fanatic_coins: number;
  avatar_url: string | null;
  caption: string | null;
  name: string;
  streak: number;
  selected_frame_id: string | null;
  e_coins: number;
  role: string;
};

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
      e_coins: 0,
      selected_frame_id: null,
      role: 'user',
    })
    .eq('id', id);

  if (error) {
    console.error('Error resetting test profile:', error);
    throw error;
  }
}

export async function setTestProfileData(id: string) {
  const testProfileData = {
    username: 'aaa',
    fanatic_coins: 999,
    avatar_url: null,
    caption: 'bbb',
    name: 'ccc',
    streak: 99,
    selected_frame_id: null,
    e_coins: 9,
    role: 'user',
  } as Profile;

  const { error } = await supabase
    .from('profiles')
    .update(testProfileData)
    .eq('id', id);

  if (error) {
    console.error('Error setting test profile data:', error);
    throw error;
  }

  return testProfileData;
}
