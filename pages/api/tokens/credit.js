// pages/api/tokens/credit.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Проверка на наличие всех необходимых данных
    const { user_id, amount, description } = req.body;
    if (!user_id || !amount || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Проверка на корректность значения amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    // Начало транзакции для атомарных операций
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert([{ user_id, amount, description }]);

    if (transactionError) {
      return res.status(500).json({ error: `Error inserting transaction: ${transactionError.message}` });
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
      return res.status(500).json({ error: `Error updating balance: ${updateError.message}` });
    }

    // Возвращаем данные обновленного пользователя
    return res.status(200).json({ data: updatedUser });
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}

