import { test, expect } from '@playwright/test';
import { supabase } from './helpers/supabaseClient';

test('Add item to cart', async ({ page }) => {
  await dbSetup();
  await page.goto('/');
  await page.getByRole('link', { name: 'Shop', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Wear the game beyond the court' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'View all products' }).click();
  await expect(
    page.getByRole('button', { name: 'Test Product' }).first()
  ).toBeVisible();
  await page.getByRole('button', { name: 'Test Product' }).first().click();
  await expect(page.getByText('$99.99')).toBeVisible();
  await page.getByRole('button', { name: 'option b' }).click();
  await page.getByRole('button', { name: 'option 4' }).click();
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(
    page.getByRole('button', { name: 'Added to Cart' })
  ).toBeVisible();
});

test.afterEach(async () => {
  await dbTeardown();
});

async function dbSetup() {
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
          name: 'Jerseys',
          image_url:
            'https://upktcnvztyldwzapbuqq.supabase.co/storage/v1/object/public/products/categories/jersay.jpg',
        },
        collection: {
          name: 'Game Day',
          image_url:
            'https://upktcnvztyldwzapbuqq.supabase.co/storage/v1/object/public/products/collections/game_day.jpg',
        },
      },
    })
    .select()
    .single();

  console.log('insert result:', productData, productError);
  if (productError) throw new Error(`DB setup failed: ${productError.message}`);

  const { data: priceData, error: priceError } = await supabase
    .from('product_pricing')
    .insert({
      product_id: productData.id,
      price: 99.99,
      discount: 0.1,
    })
    .select()
    .single();
  console.log('insert result:', priceData, priceError);
  if (priceError) throw new Error(`DB setup failed: ${priceError.message}`);
}
async function dbTeardown() {
  // 1. Obtener el producto
  const { data: product, error: productSelError } = await supabase
    .from('product_catalog')
    .select('id')
    .eq('name', 'Test Product')
    .single();
  console.log('select product:', product, productSelError);
  if (productSelError)
    throw new Error(`DB teardown failed: ${productSelError.message}`);

  // 2. Obtener el precio del producto
  const { data: pricedProduct, error: pricedProductSelError } = await supabase
    .from('product_pricing')
    .select('id')
    .eq('product_id', product.id)
    .single();
  console.log('select pricing:', pricedProduct, pricedProductSelError);
  if (pricedProductSelError)
    throw new Error(`DB teardown failed: ${pricedProductSelError.message}`);

  // 3. Borrar cart
  const { error: cartError } = await supabase
    .from('shopping_cart_items')
    .delete()
    .eq('priced_product_id', pricedProduct.id);
  console.log('delete cart error:', cartError);
  if (cartError) throw new Error(`DB teardown failed: ${cartError.message}`);

  // 4. Borrar precio
  const { error: priceError } = await supabase
    .from('product_pricing')
    .delete()
    .eq('product_id', product.id);
  console.log('delete pricing error:', priceError);
  if (priceError) throw new Error(`DB teardown failed: ${priceError.message}`);

  // 5. Borrar producto
  const { error: productError } = await supabase
    .from('product_catalog')
    .delete()
    .eq('name', 'Test Product');
  console.log('delete product error:', productError);
  if (productError)
    throw new Error(`DB teardown failed: ${productError.message}`);
}
