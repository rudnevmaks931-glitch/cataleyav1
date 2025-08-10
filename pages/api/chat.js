// pages/api/chat.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "Missing userId or message" });
  }

  // 1. Проверяем баланс токенов
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tokens")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return res.status(500).json({ error: "User not found" });
  }

  if (profile.tokens <= 0) {
    return res.status(403).json({ error: "Not enough tokens" });
  }

  try {
    // 2. Отправляем запрос в OpenAI
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // быстрый и дешевле, можно gpt-4.1
        messages: [{ role: "user", content: message }],
        max_tokens: 500,
      }),
    });

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "Ошибка ответа ИИ";

    // 3. Списываем токен
    await supabase
      .from("profiles")
      .update({ tokens: profile.tokens - 1 })
      .eq("id", userId);

    // 4. Возвращаем ответ
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
