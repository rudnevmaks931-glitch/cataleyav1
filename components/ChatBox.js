// components/ChatBox.js
import { useState, useEffect, useRef } from "react";

export default function ChatBox({ user, initialSystem = "You are Cataleya, an expert AI assistant." }) {
  const [input, setInput] = useState(""); // Состояние для ввода текста
  const [messages, setMessages] = useState([{ role: "system", content: initialSystem }]); // Сообщения в чате
  const [loading, setLoading] = useState(false); // Индикатор загрузки
  const ref = useRef();

  // Прокручиваем чат вниз, когда новые сообщения добавляются
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  // Функция отправки сообщения
  async function send() {
    if (!input.trim()) return; // Если поле ввода пустое, не отправляем

    // Добавляем сообщение пользователя в список сообщений
    const userMsg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput(""); // Очищаем поле ввода
    setLoading(true); // Включаем индикатор загрузки

    // Проверяем, что user.id существует
    if (!user || !user.id) {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка: не найден ID пользователя." }]);
      setLoading(false);
      return;
    }

    // Проверяем, что сообщения не пустые
    if (!next || next.length === 0) {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка: нет сообщений для отправки." }]);
      setLoading(false);
      return;
    }

    try {
      // Отправляем запрос на сервер
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, messages: next })
      });

      // Обработка ответа от сервера
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Ошибка: ${data.error || 'server'}` }]);
      }
    } catch (err) {
      // Обработка сетевой ошибки
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка сети. Попробуйте позже." }]);
    }

    setLoading(false); // Выключаем индикатор загрузки
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
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="Введите сообщение..."
        />
        <button
          onClick={send}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          disabled={loading}
        >
          {loading ? "Отправка..." : "Отправить"}
        </button>
      </div>
    </div>
  );
}

