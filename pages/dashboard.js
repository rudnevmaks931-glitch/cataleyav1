import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [activeTab, setActiveTab] = useState("chat");
  const [model, setModel] = useState("gpt-4o-mini");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Загружаем пользователя и токены
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/");
      } else {
        setUser(data.user);
        fetchTokens(data.user.id);
      }
    });
  }, []);

  const fetchTokens = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("tokens")
      .eq("id", userId)
      .single();
    if (!error && data) {
      setTokens(data.tokens);
    }
  };

  // Отправка сообщения в чат
  const sendMessage = async () => {
    if (!input.trim() || loading || tokens <= 0) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, message: userMessage.content }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        fetchTokens(user.id);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Ошибка ответа от ИИ" }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Ошибка запроса" }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Хедер */}
        <header className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-green-400 drop-shadow-lg">Cataleya</h1>
          <div className="bg-gray-800/70 px-4 py-2 rounded-lg text-sm backdrop-blur-lg border border-gray-700">
            💎 Токены: <span className="text-green-400 font-semibold">{tokens}</span>
          </div>
        </header>

        {/* Навигация */}
        <nav className="flex gap-4 mb-6">
          {[
            { key: "chat", label: "💬 Чат" },
            { key: "images", label: "🖼 Генерация изображений" },
            { key: "profile", label: "👤 Профиль" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab.key
                  ? "bg-green-500 text-black"
                  : "bg-gray-800/80 text-white hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Контент */}
        {activeTab === "chat" && (
          <div>
            {/* Выбор модели */}
            <div className="mb-4 flex items-center gap-4">
              <label className="text-gray-300">Модель:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
              >
                <option value="gpt-4o-mini">GPT-4o-mini</option>
                <option value="gpt-4.1">GPT-4.1</option>
              </select>
            </div>

            {/* Чат */}
            <div className="bg-gray-800/70 backdrop-blur-lg rounded-xl shadow-lg p-6 h-[500px] overflow-y-auto space-y-4 border border-gray-700">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center">Начните общение с ИИ</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-green-500 text-black ml-auto"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>

            {/* Ввод */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Введите сообщение..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-green-400 text-white"
              />
              <button
                onClick={sendMessage}
                disabled={loading || tokens <= 0}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition disabled:bg-gray-500"
              >
                {loading ? "..." : "Отправить"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="bg-gray-800/70 p-6 rounded-xl border border-gray-700 text-gray-400">
            Здесь будет генерация изображений
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-gray-800/70 p-6 rounded-xl border border-gray-700 text-gray-400">
            Здесь будет профиль пользователя
          </div>
        )}
      </div>
    </div>
  );
}
