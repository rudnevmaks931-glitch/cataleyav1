// pages/api/chat.js
import { serverSupabase } from "../../lib/serverSupabase";
import { callOpenAIChat } from "../../lib/openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { user_id, messages } = req.body;
  if (!user_id || !messages) return res.status(400).json({ error: "Missing user_id or messages" });

  try {
    // fetch profile
    const { data: profile, error: pErr } = await serverSupabase
      .from("profiles")
      .select("id, token_balance")
      .eq("id", user_id)
      .single();

    if (pErr || !profile) return res.status(404).json({ error: "Profile not found" });

    const cost = parseInt(process.env.NEXT_PUBLIC_CHAT_COST || "1", 10);
    if (profile.token_balance < cost) {
      return res.status(402).json({ error: "Insufficient tokens" });
    }

    const { content, usage, raw } = await callOpenAIChat(messages);

    // deduct tokens
    await serverSupabase
      .from("profiles")
      .update({ token_balance: profile.token_balance - cost })
      .eq("id", user_id);

    // record transaction
    await serverSupabase.from("transactions").insert({
      user_id,
      amount: -cost,
      type: "debit",
      description: "Chat request"
    });

    // record request
    await serverSupabase.from("requests").insert({
      user_id,
      ai_type: "chat",
      input: JSON.stringify(messages),
      output: content,
      cost
    });

    return res.status(200).json({ reply: content, usage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
