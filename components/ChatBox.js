import { useState, useRef, useEffect } from "react";

export default function ChatBox({ user, initialSystem = "You are Cataleya, an expert AI assistant." }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "system", content: initialSystem }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    // автопрокрутка вниз при добавлении сообщений
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input };
    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, messages: nextMessages })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Ошибка: ${data.error || 'server error'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка сети. Попробуйте позже." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 glass rounded-md min-h-[420px] flex flex-col">
      <div className="flex-1 overflow-auto mb-4 space-y-4" ref={scrollRef}>
        {messages.filter(m => m.role !== "system").map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div key={idx} className={`max-w-[86%] p-3 rounded-lg ${isUser ? 'ml-auto msg-user' : 'mr-auto msg-assistant'}`}>
              <div className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 items-center">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input flex-1"
          placeholder="Напиши запрос для Cataleya..."
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button onClick={send} disabled={loading} className="neon-btn" aria-label="Send message">
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
