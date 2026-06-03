import { createMockProduct, deleteMockProduct } from './MockProduct';
import { supabase } from '../../shared/helpers/supabaseClient';

async function createPrice(productId: number) {
  const { data: priceData, error: priceError } = await supabase
    .from('product_pricing')
    .insert({
      product_id: productId,
      price: 99.99,
      discount: 0.1,
    })
    .select()
    .single();
  console.log('insert result:', priceData, priceError);
  if (priceError) throw new Error(`DB setup failed: ${priceError.message}`);
}

export async function createMockPricedProduct() {
  const productData = await createMockProduct();
  const priceData = await createPrice(productData.id);
  return { productData, priceData };
}

async function deletePrice() {
  const { data: product, error: productSelError } = await supabase
    .from('product_catalog')
    .select('id')
    .eq('name', 'Test Product')
    .single();
  console.log('select product:', product, productSelError);
  if (productSelError)
    throw new Error(`DB teardown failed: ${productSelError.message}`);

  const { error: priceError } = await supabase
    .from('product_pricing')
    .delete()
    .eq('product_id', product.id);
  console.log('delete pricing error:', priceError);
  if (priceError) throw new Error(`DB teardown failed: ${priceError.message}`);
}

export async function deleteMockPricedProduct() {
  await deletePrice();
  await deleteMockProduct();
}
