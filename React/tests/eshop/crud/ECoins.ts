import { supabase } from '../../shared/helpers/supabaseClient';

export async function setECoins(amount: number) {
  const { error } = await supabase
    .from('profiles')
    .update({ e_coins: amount })
    .eq('username', 'tester');

  if (error) {
    console.error('Error setting e-coins:', error);
    throw new Error(`Failed to set e-coins: ${error.message}`);
  }
}
