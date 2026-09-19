import { NextResponse } from "next/server";
import {
  getModelByModelId,
  getActiveModels,
  createRequestLog,
  updateRequestLog,
} from "@/lib/db";
import {
  proxyCompletion,
  proxyStreamingCompletion,
  estimateTokens,
  ChatCompletionRequest,
} from "@/lib/proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// List available models in OpenAI-compatible format
export async function GET() {
  try {
    const models = getActiveModels();
    return NextResponse.json({
      object: "list",
      data: models.map((m) => ({
        id: m.model_id,
        object: "model",
        created: Math.floor(new Date(m.created_at).getTime() / 1000),
        owned_by: m.provider_name,
        permission: [],
        root: m.model_id,
        parent: null,
      })),
    });
  } catch (error) {
    console.error("Failed to list models:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let logId: string | null = null;
  const startTime = Date.now();

  try {
    const body: ChatCompletionRequest = await request.json();

    if (!body.model || !body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: { message: "model and messages are required", type: "invalid_request_error" } },
        { status: 400 }
      );
    }

    // Resolve the model
    const model = getModelByModelId(body.model);
    if (!model) {
      return NextResponse.json(
        { error: { message: `Model '${body.model}' not found`, type: "invalid_request_error" } },
        { status: 404 }
      );
    }

    // Create request log
    const log = createRequestLog({
      model_id: model.id,
      provider_id: model.provider_id,
      status: "pending",
      input_tokens: 0,
      output_tokens: 0,
      latency_ms: 0,
      error_message: "",
    });
    logId = log.id;

    // Estimate input tokens
    const inputText = body.messages.map((m) => m.content || "").join(" ");
    const inputTokens = estimateTokens(inputText);

    if (body.stream) {
      // Streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of proxyStreamingCompletion(model, body)) {
              controller.enqueue(new TextEncoder().encode(chunk));
            }
            const latency = Date.now() - startTime;
            updateRequestLog(logId!, {
              status: "success",
              input_tokens: inputTokens,
              latency_ms: latency,
            });
          } catch (error) {
            const latency = Date.now() - startTime;
            const errMsg = error instanceof Error ? error.message : "Unknown error";
            updateRequestLog(logId!, {
              status: "error",
              input_tokens: inputTokens,
              latency_ms: latency,
              error_message: errMsg,
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const response = await proxyCompletion(model, body);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      updateRequestLog(logId, {
        status: "error",
        input_tokens: inputTokens,
        latency_ms: latency,
        error_message: `Provider error (${response.status}): ${errorText}`,
      });
      return NextResponse.json(
        { error: { message: `Upstream provider error: ${errorText}`, type: "upstream_error" } },
        { status: response.status }
      );
    }

    const result = await response.json();

    updateRequestLog(logId, {
      status: "success",
      input_tokens: result.usage?.prompt_tokens || inputTokens,
      output_tokens: result.usage?.completion_tokens || 0,
      latency_ms: latency,
    });

    return NextResponse.json(result);
  } catch (error) {
    const latency = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    if (logId) {
      updateRequestLog(logId, {
        status: "error",
        latency_ms: latency,
        error_message: errMsg,
      });
    }

    console.error("Chat completion error:", error);
    return NextResponse.json(
      { error: { message: errMsg, type: "server_error" } },
      { status: 500 }
    );
  }
}
