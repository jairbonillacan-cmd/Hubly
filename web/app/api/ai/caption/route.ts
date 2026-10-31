import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { backendEnabled } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { buildCaptionSystemPrompt, type CaptionBrandContext } from "@/lib/ai-caption";

const MAX_BRIEF_CHARS = 2000;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }
  // La clave gasta dinero: solo miembros que pueden editar, o desarrollo local en modo demo.
  if (backendEnabled) {
    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    const { data: rows } = await supabase.from("agency_members").select("role").eq("user_id", auth.user.id);
    if (!rows?.some((r) => r.role !== "viewer")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    brief?: string;
    network?: string;
    format?: string;
    brand?: CaptionBrandContext;
  } | null;
  const brief = body?.brief?.trim();
  if (!brief) return NextResponse.json({ error: "brief_required" }, { status: 400 });
  if (brief.length > MAX_BRIEF_CHARS) return NextResponse.json({ error: "brief_too_long" }, { status: 400 });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: buildCaptionSystemPrompt(body?.brand, body?.network, body?.format),
      messages: [{ role: "user", content: brief }],
    } as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "refused" }, { status: 422 });
    }
    const caption = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    if (!caption) return NextResponse.json({ error: "empty" }, { status: 502 });
    return NextResponse.json({ caption });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: "failed" }, { status: 502 });
    }
    throw err;
  }
}
