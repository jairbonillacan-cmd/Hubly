import { NextResponse } from "next/server";
import { deliver, type BotDelivery } from "@/lib/chat-bot-delivery";
import { createSupabaseServer } from "@/lib/supabase/server";

/** Avisa a los bots de un mensaje o de un clic en sus botones. Los permisos los decide la base de datos. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { messageId?: unknown; buttonId?: unknown } | null;
  if (typeof body?.messageId !== "string") return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const buttonId = typeof body.buttonId === "string" ? body.buttonId.slice(0, 40) : undefined;

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("chat_bot_deliveries", {
    target_message: body.messageId,
    ...(buttonId ? { button_id: buttonId } : {}),
  });
  if (error) {
    if (error.message.includes("forbidden")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.json({ error: "delivery_failed" }, { status: 500 });
  }
  const results = await Promise.all(((data ?? []) as BotDelivery[]).map(deliver));
  if (buttonId && results.some((ok) => !ok)) return NextResponse.json({ error: "El bot no respondió" }, { status: 502 });
  return NextResponse.json({ delivered: results.filter(Boolean).length });
}
