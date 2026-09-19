import { ModelWithProvider } from "./db";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason: string | null;
  }[];
}

function buildProviderUrl(provider: ModelWithProvider): string {
  const base = provider.base_url.replace(/\/+$/, "");
  // Standard OpenAI-compatible endpoint
  return `${base}/v1/chat/completions`;
}

function buildHeaders(provider: ModelWithProvider): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (provider.api_key) {
    headers["Authorization"] = `Bearer ${provider.api_key}`;
  }
  return headers;
}

export async function proxyCompletion(
  model: ModelWithProvider,
  request: ChatCompletionRequest
): Promise<Response> {
  const url = buildProviderUrl(model);
  const headers = buildHeaders(model);

  const body = {
    ...request,
    model: model.model_id,
  };

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export async function* proxyStreamingCompletion(
  model: ModelWithProvider,
  request: ChatCompletionRequest
): AsyncGenerator<string, void, unknown> {
  const response = await proxyCompletion(model, { ...request, stream: true });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Provider error (${response.status}): ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          yield "data: [DONE]\n\n";
          return;
        }
        yield `data: ${data}\n\n`;
      }
    }
  }
}

export function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}
