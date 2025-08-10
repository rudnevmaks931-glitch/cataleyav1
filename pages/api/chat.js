import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message, user_id } = req.body;

    // Проверяем баланс токенов
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("token_balance")
      .eq("id", user_id)
      .single();

    if (profileError || profile.token_balance <= 0) {
      return res.status(400).json({
        error: "Недостаточно токенов. Пополните баланс.",
      });
    }

    try {
      // Запрос к ChatGPT API
      const openaiResponse = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          prompt: message,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      const data = await openaiResponse.json();
      const reply = data.choices[0]?.text || "Ошибка при обработке запроса.";

      // Возвращаем ответ
      res.status(200).json({ reply });

      // Уменьшаем токены на 1 за каждое использование
      await supabase
        .from("profiles")
        .update({ token_balance: profile.token_balance - 1 })
        .eq("id", user_id);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Произошла ошибка при обработке запроса." });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}

}
