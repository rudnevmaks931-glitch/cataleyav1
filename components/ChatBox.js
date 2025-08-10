// components/ChatBox.js
import { useState, useEffect, useRef } from "react";

export default function ChatBox({ user, initialSystem = "You are Cataleya, an expert AI assistant." }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "system", content: initialSystem }]);
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, messages: next })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Ошибка: ${data.error || 'server'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка сети. Попробуйте позже." }]);
    }
    setLoading(false);
  }

  return (
    <div className="p-4 glass rounded-md min-h-[420px] flex flex-col">
      <div ref={ref} className="flex-1 overflow-auto mb-4 space-y-4">
        {messages.filter(m => m.role !== "system").map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} className={`max-w-[86%] p-3 rounded-lg ${isUser ? 'ml-auto msg-user' : 'mr-auto msg-assistant'}`}>
              <div className="text-sm whitespace-pre-wrap">{m.content}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 items-center">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input flex-1 resize-none h-12 rounded-md"
          placeholder="Напиши запрос для Cataleya..."
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button onClick={send} disabled={loading} className="btn-neon">
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
