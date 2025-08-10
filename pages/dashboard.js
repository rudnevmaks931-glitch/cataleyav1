import { useState } from "react";

export default function Dashboard() {
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;

    const currentMessage = message;
    setMessage("");
    setChat((prev) => [...prev, { sender: "user", text: currentMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMessage }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.error) {
        setChat((prev) => [
          ...prev,
          { sender: "ai", text: `⚠️ Ошибка: ${data.error}` },
        ]);
      } else {
        setChat((prev) => [...prev, { sender: "ai", text: data.reply }]);
      }
    } catch (err) {
      setLoading(false);
      setChat((prev) => [
        ...prev,
        { sender: "ai", text: `⚠️ Сетевая ошибка: ${err.message}` },
      ]);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-emerald-400 mb-6">
        CATA<span className="text-white">Leya</span> Dashboard
      </h1>

      {/* Чат */}
      <div className="bg-neutral-900 rounded-2xl shadow-lg p-4 mb-4 max-w-4xl mx-auto border border-emerald-500/30">
        <div className="h-96 overflow-y-auto space-y-3 p-2 bg-neutral-950 rounded-lg">
          {chat.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.sender === "user"
                  ? "bg-emerald-500 text-black self-end ml-auto"
                  : "bg-neutral-800 text-emerald-300"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="text-emerald-400 text-sm animate-pulse">
              CATALEya думает...
            </div>
          )}
        </div>

        {/* Поле ввода */}
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Напиши запрос для CATALEya..."
            className="flex-1 p-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg shadow-md transition disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
