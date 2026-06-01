import { test, expect } from '@playwright/test';
import { supabase } from '../helpers/supabaseClient';
import { createMockProduct, deleteMockProduct } from './crud/MockProduct';

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
  const productData = await createMockProduct();

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

  await deleteMockProduct();
}
