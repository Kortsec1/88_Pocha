import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webPush from "web-push";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function setupWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@88pocha.local";
  if (!publicKey || !privateKey) return false;
  webPush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function POST(request: Request) {
  const supabase = getClient();
  if (!supabase || !setupWebPush()) return NextResponse.json({ ok: false }, { status: 200 });

  const body = await request.json();
  const storeId = body.storeId || "demo-store";
  const payload = JSON.stringify({
    title: `88포차 ${body.area || "업데이트"}`,
    body: body.message || "운영 정보가 업데이트됐습니다.",
    url: body.url || "/dashboard",
  });

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, subscription")
    .eq("store_id", storeId)
    .eq("active", true);

  if (error || !data?.length) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  await Promise.all(data.map(async (row) => {
    try {
      await webPush.sendNotification(row.subscription, payload);
      sent += 1;
    } catch {
      await supabase.from("push_subscriptions").update({ active: false, updated_at: new Date().toISOString() }).eq("endpoint", row.endpoint);
    }
  }));

  return NextResponse.json({ ok: true, sent });
}
