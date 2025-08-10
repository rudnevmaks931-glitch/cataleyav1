// components/ChatBox.js
import { useState } from "react";

export default function ChatBox({ user, initialSystem = "You are Cataleya, an expert AI assistant." }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "system", content: initialSystem }]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input };
    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, messages: nextMessages })
    });
    const data = await res.json();
    if (res.ok) {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } else {
      alert(data.error || "Ошибка API");
    }
    setLoading(false);
  }

  return (
    <div className="p-4 glass rounded-md min-h-[420px] flex flex-col">
      <div className="flex-1 overflow-auto mb-4 space-y-3">
        {messages.filter(m => m.role !== "system").map((m, idx) => (
          <div key={idx} className={`p-3 rounded-md max-w-[80%] ${m.role === "user" ? "ml-auto bg-[#071918]" : "bg-[#021012]"}`}>
            <div className="text-sm">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 p-3 rounded-md bg-transparent border border-neutral-800"
          placeholder="Напиши сообщение..."
        />
        <button onClick={send} disabled={loading} className="neon-btn">
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
