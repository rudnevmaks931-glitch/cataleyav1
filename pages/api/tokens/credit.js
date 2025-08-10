// pages/api/tokens/credit.js
import { serverSupabase } from "../../../lib/serverSupabase";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { user_id, amount = 0, description = "Manual credit" } = req.body;
  if (!user_id || !amount) return res.status(400).json({ error: "Missing user_id or amount" });

  try {
    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("id, token_balance")
      .eq("id", user_id)
      .single();

    if (!profile) return res.status(404).json({ error: "Profile not found" });

    await serverSupabase
      .from("profiles")
      .update({ token_balance: profile.token_balance + amount })
      .eq("id", user_id);

    await serverSupabase.from("transactions").insert({
      user_id,
      amount,
      type: "credit",
      description
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
