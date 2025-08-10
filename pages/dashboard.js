// pages/dashboard.js
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const session = supabase.auth.session();
    if (!session) {
      router.push("/");
    } else {
      setUser(session.user);
      fetchProfile(session.user.id);
    }
  }, []);

  async function fetchProfile(userId) {
    let { data, error } = await supabase
      .from("profiles")
      .select("tokens")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Ошибка при загрузке профиля:", error);
    } else {
      setTokens(data.tokens || 0);
    }
  }

  async function handleSend() {
    if (!message.trim()) return;

    // Добавляем сообщение пользователя в чат
    setChat((prev) => [...prev, { sender: "user", text: message }]);

    // Очистка инпута
    const currentMessage = message;
    setMessage("");

    // Заглушка ответа AI (пока нет оплаты OpenAI API)
    setTimeout(() => {
      setChat((prev) => [
        ...prev,
        { sender: "ai", text: `🤖 Ответ на: "${currentMessage}"` },
      ]);
    }, 1000);
  }

  async function handleBuyTokens() {
    alert("💳 Здесь будет подключена оплата (Stripe или YooKassa)");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-6">
      {/* Верхняя панель */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-400">CATALeya</h1>
        <nav className="flex gap-6">
          <button
            onClick={() => router.push("/")}
            className="hover:text-emerald-400"
          >
            Home
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="hover:text-emerald-400"
          >
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Контент */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Чат */}
        <div className="col-span-2 bg-gray-900/70 p-4 rounded-2xl shadow-xl border border-emerald-500/20">
          <div className="h-[400px] overflow-y-auto space-y-4 p-2">
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white self-end ml-auto"
                    : "bg-gray-700 text-emerald-300"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="flex mt-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напиши запрос для Cataleya..."
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-l-lg border border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSend}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-r-lg"
            >
              Send
            </button>
          </div>
        </div>

        {/* Аккаунт */}
        <div className="bg-gray-900/70 p-4 rounded-2xl shadow-xl border border-emerald-500/20">
          <h2 className="text-xl font-bold mb-4">Аккаунт</h2>
          <p className="text-gray-400">Email</p>
          <p className="mb-2">{user?.email}</p>
          <p className="text-gray-400">Баланс токенов</p>
          <p className="text-emerald-400 font-bold text-2xl mb-4">{tokens}</p>
          <button
            onClick={handleBuyTokens}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg mb-4"
          >
            Buy tokens
          </button>

          <h3 className="text-lg font-semibold mb-2">Модули</h3>
          <ul className="space-y-1">
            <li>💬 Chat — доступен</li>
            <li>🖼 Image gen — скоро</li>
            <li>🎥 Video gen — скоро</li>
            <li>📄 Docs analyzer — скоро</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

