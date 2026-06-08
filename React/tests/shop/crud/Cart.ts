import { supabase } from '../../shared/helpers/supabaseClient';

export async function clearCart() {
  const { data: carts } = await supabase
    .from('shopping_carts')
    .select('id, profiles!inner(username)')
    .eq('profiles.username', 'tester');

  console.log('select carts:', carts);

  if (!carts?.length) return;

  const { error } = await supabase
    .from('shopping_cart_items')
    .delete()
    .in(
      'cart_id',
      carts.map((c) => c.id)
    );

  console.log('delete cart error:', error);
}
