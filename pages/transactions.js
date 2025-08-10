import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function fetchTransactions() {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", supabase.auth.user().id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setTransactions(data);
      }
    }

    fetchTransactions();
  }, []);

  return (
    <div>
      <h1>История транзакций</h1>
      <ul>
        {transactions.map((txn) => (
          <li key={txn.id}>
            {txn.amount} токенов - {txn.description} ({new Date(txn.created_at).toLocaleString()})
          </li>
        ))}
      </ul>
    </div>
  );
}
