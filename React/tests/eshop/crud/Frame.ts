import { supabase } from '../../shared/helpers/supabaseClient';

export async function revertFramePurchases() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'tester')
    .single();

  if (!profile?.id) {
    throw new Error('Profile not found for tester');
  }

  const { error } = await supabase
    .from('owned_frames')
    .delete()
    .eq('profile_id', profile.id);

  if (error) {
    console.log('delete owned frames error:', error);
    throw new Error(`DB teardown failed: ${error.message}`);
  }
}

export async function revertFrameSelection() {
  const { error } = await supabase
    .from('profiles')
    .update({ selected_frame_id: null })
    .eq('username', 'tester');

  if (error) {
    console.error('Error clearing selected frame:', error);
    throw new Error(`Failed to clear selected frame: ${error.message}`);
  }
}
