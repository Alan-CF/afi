import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  
  const { record } = await req.json()

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('VOYAGE_API_KEY')}`,
    },
    body: JSON.stringify({
      input: [record.product],
      model: 'voyage-3',
    }),
  })

  const json = await response.json()
  const embedding = json.data[0].embedding

  const supabase = createClient(
    Deno.env.get('REMOTE_SUPABASE_URL')!,
    Deno.env.get('REMOTE_SUPABASE_SERVICE_ROLE_KEY')!
  )

  await supabase
  .from('product_catalog')
  .update({ product_embedding: embedding})
  .eq('id', record.id)

  return new Response('ok')
})