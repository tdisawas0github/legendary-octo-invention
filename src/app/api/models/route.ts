import { NextResponse } from "next/server";
import { getAllModels, createModel } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = getAllModels();
    return NextResponse.json(models);
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      provider_id,
      model_id,
      display_name,
      description,
      context_length,
      max_output,
      supports_vision,
      supports_tools,
      supports_streaming,
      is_active,
      cost_per_1k_input,
      cost_per_1k_output,
    } = body;

    if (!provider_id || !model_id || !display_name) {
      return NextResponse.json(
        { error: "provider_id, model_id, and display_name are required" },
        { status: 400 }
      );
    }

    const model = createModel({
      provider_id,
      model_id,
      display_name,
      description: description || "",
      context_length: context_length || 4096,
      max_output: max_output || 4096,
      supports_vision: supports_vision ? 1 : 0,
      supports_tools: supports_tools ? 1 : 0,
      supports_streaming: supports_streaming !== false ? 1 : 0,
      is_active: is_active !== false ? 1 : 0,
      cost_per_1k_input: cost_per_1k_input || 0,
      cost_per_1k_output: cost_per_1k_output || 0,
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("Failed to create model:", error);
    return NextResponse.json({ error: "Failed to create model" }, { status: 500 });
  }
}
