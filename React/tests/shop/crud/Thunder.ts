import { supabase } from '../../helpers/supabaseClient';

export async function clearThunderConversation() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'tester')
    .single();

  if (!profile?.id) {
    throw new Error('Profile not found for tester');
  }

  const { error } = await supabase
    .from('thunder_conversations')
    .delete()
    .eq('profile_id', profile.id);

  console.log('delete conversation error:', error);
  if (error) throw new Error(`DB teardown failed: ${error.message}`);
}
