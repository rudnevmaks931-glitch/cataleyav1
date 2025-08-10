// pages/dashboard.js
import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const usr = data?.user ?? null;
      if (!usr) { router.push("/login"); return; }
      setUser({ id: usr.id, email: usr.email });

      const { data: p, error } = await supabase.from("profiles").select("*").eq("id", usr.id).single();
      if (error || !p) {
        await supabase.from("profiles").insert({ id: usr.id, username: usr.email, token_balance: 0 });
        const { data: p2 } = await supabase.from("profiles").select("*").eq("id", usr.id).single();
        setProfile(p2);
      } else {
        setProfile(p);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleBuyTokens = async () => {
    const amountStr = prompt("Сколько токенов добавить? (например: 100)");
    const amount = parseInt(amountStr || "0", 10);
    if (!amount || amount <= 0) return alert("Введите корректное число");
    const res = await fetch("/api/tokens/credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, amount, description: "Manual buy (test)" })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Баланс обновлён");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p);
    } else {
      alert(data.error || "Ошибка при пополнении");
    }
  };

  if (loading) return (
    <div className="min-h-screen p-8">
      <Navbar />
      <div className="mt-8 max-w-5xl mx-auto glass p-8 rounded-xl text-center">Загрузка...</div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-[#040404] to-[#0b0b0b]">
      <Navbar />
      <div className="mt-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatBox user={user} />
        </div>

        <aside className="glass p-6 rounded-lg">
          <div className="mb-6">
            <div className="card-title">Аккаунт</div>
            <div className="small text-muted">Email</div>
            <div className="text-[var(--text)] mt-1 break-all">{user.email}</div>
          </div>

          <div className="mb-6">
            <div className="small text-muted">Баланс токенов</div>
            <div className="text-3xl font-bold text-neon mt-1">{profile?.token_balance ?? 0}</div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={handleBuyTokens} className="btn-neon">Buy tokens</button>
            <button onClick={handleLogout} className="px-4 py-2 rounded-md border border-white/10 text-[var(--text)]">Logout</button>
          </div>

          <div className="mt-8">
            <div className="card-title">Модули</div>
            <ul className="mt-3 space-y-2">
              <li className="text-[var(--text)]">💬 Chat — доступен</li>
              <li className="text-muted">🖼 Image gen — скоро</li>
              <li className="text-muted">🎥 Video gen — скоро</li>
              <li className="text-muted">📄 Docs analyzer — скоро</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
