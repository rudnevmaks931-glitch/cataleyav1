// pages/api/tokens/credit.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Проверка на наличие всех необходимых данных
    const { user_id, amount, description } = req.body;
    if (!user_id || !amount || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Добавление записи о транзакции
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ user_id, amount, description }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Обновление баланса пользователя
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({
        token_balance: supabase.raw('token_balance + ?', [amount]),
      })
      .eq('id', user_id)
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ data: updatedUser });
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
