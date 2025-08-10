import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard({ supabase: sb, session }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await sb.auth.getSession();
      const usr = data?.session?.user ?? null;
      if (!usr) {
        setLoading(false);
        setUser(null);
        return;
      }
      setUser({ id: usr.id, email: usr.email });
      // try to fetch profile
      const { data: p, error } = await sb.from("profiles").select("*").eq("id", usr.id).single();
      if (error) {
        // create profile with initial tokens
        const init = 5;
        await sb.from("profiles").insert({ id: usr.id, username: usr.email, token_balance: init });
        const { data: p2 } = await sb.from("profiles").select("*").eq("id", usr.id).single();
        setProfile(p2);
      } else {
        setProfile(p);
      }
      setLoading(false);
    }
    load();
  }, [sb]);

  if (loading) return <div className="min-h-screen p-8"><Navbar /><div className="mt-8">Loading...</div></div>;

  if (!user) {
    return (
      <div className="min-h-screen p-8">
        <Navbar />
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="glass p-8 rounded-xl">
            <h2 className="text-2xl">Вы не вошли</h2>
            <p className="mt-4">Войдите через Supabase Auth (magic link).</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <Navbar />
      <div className="mt-8 max-w-6xl mx-auto grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ChatBox user={user} />
        </div>
        <aside className="glass p-4 rounded-lg">
          <h3 className="text-lg">Аккаунт</h3>
          <p className="mt-2 text-sm">Email: {user.email}</p>
          <p className="mt-4">Tokens: <span className="text-2xl text-neon">{profile?.token_balance ?? "—"}</span></p>
          <div className="mt-4">
            <button className="neon-btn" onClick={() => alert("Buy tokens: use admin endpoint or integrate Stripe later.")}>Buy tokens</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
