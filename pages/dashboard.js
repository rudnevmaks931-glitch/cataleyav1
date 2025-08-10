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
      setTokens(0); // пока тест
      setLoading(false);
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAddTokens = () => {
    setTokens(tokens + 100);
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <h2 style={{ color: "#00F5FF" }}>Загрузка...</h2>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚀 Cataleya Dashboard</h1>
        <p style={styles.userInfo}><strong>Email:</strong> {user.email}</p>
        <p style={styles.userInfo}><strong>Баланс токенов:</strong> {tokens}</p>

        <div style={styles.buttonGroup}>
          <button style={styles.primaryButton} onClick={handleAddTokens}>
            + Пополнить токены
          </button>
          <button style={styles.secondaryButton} onClick={handleLogout}>
            Выйти
          </button>
        </div>

        <div style={styles.modules}>
          <h2 style={styles.subTitle}>📦 Модули:</h2>
          <a href="/chat" style={styles.moduleLink}>💬 Чат-бот</a>
          <span style={styles.moduleDisabled}>🖼 Генератор изображений (скоро)</span>
          <span style={styles.moduleDisabled}>🎥 Генератор видео (скоро)</span>
          <span style={styles.moduleDisabled}>📄 Анализ документов (скоро)</span>
          <span style={styles.moduleDisabled}>🎙 AI-конвертер (скоро)</span>
          <span style={styles.moduleDisabled}>🌐 AI-переводчик (скоро)</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #0a0a0a, #1b1b1b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  card: {
    background: "rgba(25, 25, 25, 0.85)",
    borderRadius: "20px",
    padding: "30px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 0 25px rgba(0, 255, 255, 0.3)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(0, 255, 255, 0.15)",
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    color: "#00F5FF",
    marginBottom: "15px",
    textAlign: "center",
  },
  subTitle: {
    fontSize: "20px",
    color: "#A0F0E8",
    marginTop: "20px",
    marginBottom: "10px",
  },
  userInfo: {
    color: "#EAEAEA",
    marginBottom: "8px",
    fontSize: "16px",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "15px",
  },
  primaryButton: {
    background: "linear-gradient(90deg, #00F5FF, #00FFA3)",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  },
  secondaryButton: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(0,255,255,0.4)",
    padding: "10px 18px",
    borderRadius: "10px",
    color: "#00F5FF",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  },
  modules: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "20px",
  },
  moduleLink: {
    color: "#00FFA3",
    textDecoration: "none",
    fontWeight: "bold",
    background: "rgba(0, 255, 163, 0.1)",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(0,255,163,0.3)",
  },
  moduleDisabled: {
    color: "rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.05)",
    padding: "8px 12px",
    borderRadius: "8px",
  },
  loadingScreen: {
    background: "#000",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }
};

      </div>
    </div>
  );
}
