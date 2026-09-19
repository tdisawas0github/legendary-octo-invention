import { NextResponse } from "next/server";
import { getModel, updateModel, deleteModel } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const model = getModel(params.id);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    return NextResponse.json(model);
  } catch (error) {
    console.error("Failed to fetch model:", error);
    return NextResponse.json({ error: "Failed to fetch model" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    // Convert boolean fields to integers
    if ("supports_vision" in body) body.supports_vision = body.supports_vision ? 1 : 0;
    if ("supports_tools" in body) body.supports_tools = body.supports_tools ? 1 : 0;
    if ("supports_streaming" in body) body.supports_streaming = body.supports_streaming ? 1 : 0;
    if ("is_active" in body) body.is_active = body.is_active ? 1 : 0;

    const model = updateModel(params.id, body);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    return NextResponse.json(model);
  } catch (error) {
    console.error("Failed to update model:", error);
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = deleteModel(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete model:", error);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
