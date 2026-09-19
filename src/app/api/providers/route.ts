import { NextResponse } from "next/server";
import { getAllProviders, createProvider } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const providers = getAllProviders();
    return NextResponse.json(providers);
  } catch (error) {
    console.error("Failed to fetch providers:", error);
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, base_url, api_key, provider_type } = body;

    if (!name || !base_url) {
      return NextResponse.json({ error: "name and base_url are required" }, { status: 400 });
    }

    const provider = createProvider({
      name,
      base_url,
      api_key: api_key || "",
      provider_type: provider_type || "openai",
      is_active: 1,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error("Failed to create provider:", error);
    return NextResponse.json({ error: "Failed to create provider" }, { status: 500 });
  }
}
