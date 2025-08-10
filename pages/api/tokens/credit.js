import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { user_id, amount, description } = req.body;

    // Добавление записи о транзакции
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        { user_id, amount, description }
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Обновление баланса пользователя
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({ token_balance: supabase.raw('token_balance + ?', [amount]) })
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

