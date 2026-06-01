import { supabase } from '../../helpers/supabaseClient';

export async function createMockProduct() {
  const { data: productData, error: productError } = await supabase
    .from('product_catalog')
    .insert({
      name: 'Test Product',
      description: 'This is a test description.',
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      product_details: {
        brand: 'Test',
        'test option': ['option a', 'option b'],
        'test option 2': ['option 1', 'option 2', 'option 3', 'option 4'],
        'description 1': 'specificaton 1',
        'description 2': null,
        'description 3': null,
        'description 4': 'specification 4',
        'description 5': 'specification 5',
      },
      meta_data: {
        category: {
          name: 'Test Category',
          image_url:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        },
        collection: {
          name: 'Test Collection',
          image_url:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        },
        player: {
          name: 'Test Player',
          number: 99,
          position: 'Test Position',
          image_url:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        },
      },
    })
    .select()
    .single();

  console.log('insert result:', productData, productError);
  if (productError) throw new Error(`DB setup failed: ${productError.message}`);

  return productData;
}

export async function deleteMockProduct() {
  const { error: productError } = await supabase
    .from('product_catalog')
    .delete()
    .eq('name', 'Test Product');
  console.log('delete product error:', productError);
  if (productError)
    throw new Error(`DB teardown failed: ${productError.message}`);
}
