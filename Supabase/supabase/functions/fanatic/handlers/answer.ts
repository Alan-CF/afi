import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

export async function answerQuestion(req: Request) {
  const { answer } = await req.json();
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser(
    token,
  );

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  const userId = user.id;

  try {
    const hasTries = await checkRemainingTries(supabase, userId);
    if (!hasTries) {
      return new Response(
        JSON.stringify({ error: "Maximum tries reached. Please wait for the next attempt." }),
        {
          headers: { "Content-Type": "application/json" },
          status: 403,
        },
      );
    }
  } catch (error) {
    const errPrefix = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errPrefix }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }

  const playerEmbedding = await getPlayerEmbedding(answer);

  const gameId = await getActiveGameId(supabase);
  const gameEmbedding = await getGameEmbedding(supabase, gameId);
  const config = await getGameConfig(supabase);

  const { similarity, is_correct, points } = await calculateAnswerScore(
    supabase,
    playerEmbedding,
    gameEmbedding,
    config,
  );

  const answerData = {
    answer,
    game_id: gameId,
    profile_id: userId,
    awarded_points: points,
    similarity_score: similarity,
    is_correct,
  };

  const error = await saveAnswer(supabase, answerData);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify(answerData), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

async function getPlayerEmbedding(answer: string) {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("VOYAGE_API_KEY")}`,
    },
    body: JSON.stringify({
      input: [answer],
      model: "voyage-3",
    }),
  });

  const json = await response.json();
  return json.data[0].embedding;
}

async function getActiveGameId(supabase: SupabaseClient) {
  const { data: gameData } = await supabase.rpc("fanatic_active_game_id");
  return gameData?.[0]?.active_game_id;
}

async function getGameEmbedding(supabase: SupabaseClient, gameId: string) {
  const { data: embeddingData } = await supabase
    .from("fanatic_games")
    .select("answer_embedding")
    .eq("id", gameId);

  return JSON.parse(embeddingData?.[0]?.answer_embedding);
}

async function getGameConfig(supabase: SupabaseClient) {
  const { data: configData } = await supabase
    .from("fanatic_game_config")
    .select("key, value")
    .in("key", [
      "correct_answer_threashold",
      "first_day_mult",
      "mult_decrease_per_day",
      "base_max_point_reward",
    ]);

  return Object.fromEntries(
    configData?.map((item: any) => [item.key, item.value]) ?? [],
  );
}

async function calculateAnswerScore(
  supabase: SupabaseClient,
  playerEmbedding: number[],
  gameEmbedding: number[],
  config: any,
) {
  let similarity = (cosineSimilarity(playerEmbedding, gameEmbedding) + 1) / 2;
  const correctnessThreshold = parseFloat(
    config?.correct_answer_threashold ?? "",
  );

  if (similarity >= correctnessThreshold) {
    similarity = 1;
  }

  const is_correct = similarity === 1;

  const baseMaxPointReward = parseFloat(config?.base_max_point_reward ?? "");
  let points = baseMaxPointReward * similarity;

  const firstDayMult = parseFloat(config?.first_day_mult ?? "");
  const multDecreasePerDay = parseFloat(config?.mult_decrease_per_day ?? "");

  const { data: daysElapsedData } = await supabase.rpc("fanatic_days_elapsed");
  const daysElapsed = daysElapsedData?.[0]?.days_elapsed;

  points *= Math.max(firstDayMult - (daysElapsed * multDecreasePerDay), 1);

  return { similarity, is_correct, points: Math.round(points) };
}

async function saveAnswer(supabase: SupabaseClient, answerData: any) {
  const { error } = await supabase.from("fanatic_answers")
    .insert(answerData);
  return error;
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dotProduct / (magnitudeA * magnitudeB);
}

async function checkRemainingTries(supabase: SupabaseClient, userId: string) {
  const { data: triesData, error: triesError } = await supabase.rpc(
    "fanatic_remaining_game_tries",
    { pprofileid: userId },
  );

  if (triesError) {
    throw new Error("Failed to fetch tries info");
  }

  const triesInfo = triesData?.[0];
  return (triesInfo?.remaining_tries_today ?? 0) > 0;
}
