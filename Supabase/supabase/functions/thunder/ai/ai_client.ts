export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  name?: string;
};

type ChatCompletionsCreateParams = {
  model: string;
  messages: ChatMessage[];
  tools?: unknown[];
};

type ChatCompletionsCreateResponse = {
  choices: Array<{
    message: ChatMessage;
  }>;
};

const base_url = "https://dashscope-us.aliyuncs.com/compatible-mode/v1";

async function create_chat_completion(
  params: ChatCompletionsCreateParams,
): Promise<ChatCompletionsCreateResponse> {
  const api_key = Deno.env.get("LLM_API_KEY");
  if (!api_key) {
    throw new Error("LLM_API_KEY not found.");
  }

  const response = await fetch(`${base_url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM request failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message;

  if (!message || message.role !== "assistant") {
    throw new Error("LLM response did not include an assistant message.");
  }

  const normalized_message: ChatMessage = {
    role: "assistant",
    content: typeof message.content === "string" ? message.content : "",
    tool_calls: Array.isArray(message.tool_calls)
      ? message.tool_calls as ToolCall[]
      : undefined,
  };

  return {
    choices: [{ message: normalized_message }],
  };
}

export const client = {
  chat: {
    completions: {
      create: create_chat_completion,
    },
  },
};
