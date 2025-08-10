import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      // Здесь будет запрос к базе для получения токенов
      // Пока ставим тестовое значение
      setTokens(0);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAddTokens = () => {
    // Тут позже будет логика пополнения через оплату
    setTokens(tokens + 100);
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div style={{ maxWidth: "800px", margin: "50px auto", textAlign: "center" }}>
      <h1>Личный кабинет</h1>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Баланс токенов:</strong> {tokens}</p>

      <button onClick={handleAddTokens} style={{ margin: "10px", padding: "8px 16px" }}>
        Пополнить токены (тест)
      </button>
      <button onClick={handleLogout} style={{ margin: "10px", padding: "8px 16px" }}>
        Выйти
      </button>

      <div style={{ marginTop: "30px" }}>
        <h2>Доступные модули:</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li><a href="/chat">💬 Чат-бот</a></li>
          <li style={{ opacity: 0.5 }}>🖼 Генератор изображений (скоро)</li>
          <li style={{ opacity: 0.5 }}>🎥 Генератор видео (скоро)</li>
          <li style={{ opacity: 0.5 }}>📄 Анализ документов (скоро)</li>
          <li style={{ opacity: 0.5 }}>🎙 Аудио/видео конвертер (скоро)</li>
          <li style={{ opacity: 0.5 }}>🌐 AI-переводчик (скоро)</li>
        </ul>
      </div>
    </div>
  );
}

      </div>
    </div>
  );
}
