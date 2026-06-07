import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: Request) {
  const supabase = getClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const body = await request.json();
  const subscription = body.subscription;
  if (!subscription?.endpoint) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });

  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: subscription.endpoint,
    store_id: body.storeId || "demo-store",
    user_id: body.userId || null,
    subscription,
    active: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
