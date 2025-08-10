import { useState } from "react";

export default function TokenBalance({ userId, currentBalance }) {
  const [amount, setAmount] = useState("");

  const handleBuyTokens = async () => {
    if (amount <= 0) {
      alert("Введите положительное число");
      return;
    }

    const response = await fetch("/api/tokens/credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        amount: parseInt(amount),
        description: "Пополнение вручную"
      })
    });

    const data = await response.json();
    if (response.ok) {
      alert(`Баланс обновлен: +${amount} токенов`);
    } else {
      alert("Ошибка пополнения: " + data.error);
    }
  };

  return (
    <div>
      <h2>Текущий баланс: {currentBalance} токенов</h2>
      <input
        type="number"
        placeholder="Введите количество токенов"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleBuyTokens}>Пополнить баланс</button>
    </div>
  );
}
