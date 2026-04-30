import { run_agent } from "./ai/agent.ts";
import { corsHeaders } from "../_shared/cors.ts";

type ChatRequest = {
  message: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: withCorsHeaders() });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Not Found" }, 404);
  }

  try {
    const body = await req.json() as ChatRequest;
    if (!body?.message || typeof body.message !== "string") {
      return jsonResponse({ error: "message is required" }, 400);
    }

    const authorization = req.headers.get("Authorization") ?? "";
    const reply = await run_agent(body.message, authorization);
    return jsonResponse({ reply }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 500);
  }
});

function withCorsHeaders(baseHeaders?: HeadersInit) {
  const headers = new Headers(baseHeaders);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return headers;
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: withCorsHeaders({
      "Content-Type": "application/json",
    }),
  });
}
