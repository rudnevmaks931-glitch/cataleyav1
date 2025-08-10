// pages/dashboard.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

/**
 * Cataleya Dashboard
 * - Left sidebar (profile menu)
 * - Top model selector (Chat / Image / Video / Docs / Audio)
 * - Provider selection inside tab + settings
 * - Token/Tariff cards
 * - Chat area below (works with /api/chat)
 *
 * Зависит от: lib/supabaseClient.js (supabase client v2)
 */

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "docs", label: "Docs" },
  { id: "audio", label: "Audio" }
];

// providers and default settings per tab
const PROVIDERS = {
  chat: {
    title: "Chat providers",
    items: [
      { id: "chat:gpt-4o-mini", name: "GPT-4o-mini", desc: "fast, cheap, general" },
      { id: "chat:gpt-4o", name: "GPT-4o", desc: "high-quality responses" }
    ],
    defaults: { temperature: 0.7, max_tokens: 800 }
  },
  image: {
    title: "Image providers",
    items: [
      { id: "image:sdxl", name: "Stable Diffusion XL", desc: "photoreal & stylized" },
      { id: "image:midjourney", name: "MidJourney", desc: "artistic illustrations" },
      { id: "image:replicate", name: "Replicate", desc: "many community models" }
    ],
    defaults: { width: 1024, height: 1024, quality: "high" }
  },
  video: {
    title: "Video providers",
    items: [
      { id: "video:runway", name: "Runway", desc: "video generation & editing" },
      { id: "video:pika", name: "Pika Labs", desc: "fast video drafts" }
    ],
    defaults: { resolution: "720p", duration_sec: 6 }
  },
  docs: {
    title: "Docs/Analyzer",
    items: [{ id: "docs:openai", name: "OpenAI", desc: "text understanding & summarization" }],
    defaults: { max_summary_len: 300 }
  },
  audio: {
    title: "Audio",
    items: [{ id: "audio:whisper", name: "Whisper", desc: "speech-to-text" }],
    defaults: { language: "auto" }
  }
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [activeTab, setActiveTab] = useState("chat");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [settings, setSettings] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);

  const [chatMessages, setChatMessages] = useState([]); // chat area
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // --- load user and profile ---
  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const usr = data?.user ?? null;
      if (!usr) {
        router.push("/login");
        return;
      }
      setUser(usr);

      // fetch profile
      const { data: p, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", usr.id)
        .single();

      if (error || !p) {
        // create profile if not exist
        const initProfile = {
          id: usr.id,
          username: usr.email,
          token_balance: 0,
          selected_model: null,
          settings: {}
        };
        await supabase.from("profiles").insert(initProfile);
        setProfile(initProfile);
        setSelectedProvider(null);
        setSettings({});
      } else {
        setProfile(p);
        setSelectedProvider(p.selected_model ?? null);
        setSettings(p.settings ?? {});
      }
      setLoading(false);
    }
    init();
  }, [router]);

  // --- helper: persist settings to profile ---
  async function saveSettingsToProfile(providerId, newSettings) {
    if (!user) return;
    setSavingSettings(true);
    try {
      const payload = {
        selected_model: providerId,
        settings: newSettings
      };
      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (error) {
        console.error("Failed to save profile settings:", error);
        alert("Ошибка при сохранении настроек: " + error.message);
      } else {
        // refresh profile
        const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(p);
        setSelectedProvider(providerId);
        setSettings(newSettings);
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети при сохранении.");
    } finally {
      setSavingSettings(false);
    }
  }

  // --- Buy tokens (test endpoint) ---
  async function handleBuyTokensPrompt() {
    if (!user) return alert("User not found");
    const amountStr = prompt("Сколько токенов добавить? (например 100)");
    const amount = parseInt(amountStr || "0", 10);
    if (!amount || amount <= 0) return;
    try {
      const res = await fetch("/api/tokens/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount, description: "Manual buy (test)" })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Ошибка пополнения: " + (data.error || JSON.stringify(data)));
      } else {
        // refresh balance
        const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(p);
        alert("Баланс обновлён: +" + amount + " токенов");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети при пополнении");
    }
  }

  // --- selecting provider in UI ---
  function onSelectProvider(providerId) {
    // apply defaults for this tab/provider if no settings exist
    const [tabKey] = providerId.split(":");
    const providerDefaults = PROVIDERS[tabKey]?.defaults ?? {};
    // if current profile.settings has matching provider, use it
    const curSettings = (profile && profile.selected_model === providerId && profile.settings) ? profile.settings : providerDefaults;
    // save to server
    saveSettingsToProfile(providerId, curSettings);
  }

  // --- update a single setting field locally (and optionally save) ---
  function updateSettingField(key, value, autosave = false) {
    const newSettings = { ...(settings || {}), [key]: value };
    setSettings(newSettings);
    if (autosave) {
      saveSettingsToProfile(selectedProvider, newSettings);
    }
  }

  // --- Chat send (uses /api/chat) ---
  async function sendChat() {
    if (!chatInput.trim()) return;
    const messageText = chatInput;
    setChatMessages(prev => [...prev, { role: "user", text: messageText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, user_id: user?.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setChatMessages(prev => [...prev, { role: "assistant", text: `⚠️ Ошибка: ${data.error || JSON.stringify(data)}` }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: `⚠️ Сетевая ошибка: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  // --- logout ---
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // --- simple UI render while loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <div className="text-center">
          <div className="animate-pulse text-neon text-2xl">Загрузка Dashboard...</div>
        </div>
      </div>
    );
  }

  // --- render ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#040404] to-[#080808] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/6">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold text-neon">CATALeya</div>
          <div className="text-sm text-muted hidden md:block">AI hub — Dashboard</div>
        </div>

        {/* Top model tabs */}
        <nav className="flex items-center gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === t.id ? 'bg-emerald-700/40 border border-emerald-500' : 'text-[var(--muted)] hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted hidden sm:block">Tokens: <span className="text-neon font-bold ml-2">{profile?.token_balance ?? 0}</span></div>
          <button onClick={handleBuyTokensPrompt} className="bg-emerald-500 hover:bg-emerald-600 text-black px-3 py-2 rounded-md font-semibold">Buy</button>
          <button onClick={handleLogout} className="px-3 py-2 rounded-md border border-white/10">Logout</button>
        </div>
      </header>

      {/* Body */}
      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar */}
        <aside className="lg:col-span-3 bg-gray-900/60 glass p-5 rounded-xl border border-emerald-500/6">
          <div className="mb-6">
            <div className="text-sm text-muted">Профиль</div>
            <div className="mt-2 font-semibold text-[var(--text)] break-words">{user?.email}</div>
          </div>

          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <div>
                <div className="text-muted">Тариф</div>
                <div className="font-semibold">FREE</div>
              </div>
              <div className="text-sm text-neon font-bold">Free</div>
            </li>

            <li>
              <div className="text-muted">Баланс токенов</div>
              <div className="text-neon font-bold text-xl">{profile?.token_balance ?? 0}</div>
            </li>

            <li>
              <button onClick={handleBuyTokensPrompt} className="w-full mt-2 btn-neon">Пополнить</button>
            </li>

            <li className="pt-4 border-t border-white/5">
              <nav className="flex flex-col gap-2 text-sm">
                <a className="text-[var(--text)]">📌 Профиль</a>
                <a className="text-[var(--text)]">⭐ Подписка</a>
                <a className="text-[var(--text)]">⚡ Токены</a>
                <a className="text-[var(--text)]">📝 Лента запросов</a>
                <a className="text-[var(--text)]">🤝 Партнёрская программа</a>
                <button onClick={handleLogout} className="mt-2 px-3 py-2 rounded-md border border-white/6 text-sm">Выход</button>
              </nav>
            </li>
          </ul>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-6 space-y-6">
          {/* Providers block */}
          <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-muted">Выбранная вкладка</div>
                <div className="font-semibold">{TABS.find(t => t.id === activeTab)?.label}</div>
              </div>
              <div className="text-sm text-muted">Selected: <span className="ml-2 text-neon">{profile?.selected_model ?? "—"}</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(PROVIDERS[activeTab]?.items || []).map(p => (
                <div key={p.id} className={`p-3 rounded-lg border ${profile?.selected_model === p.id ? 'border-emerald-400 bg-emerald-900/10' : 'border-white/5'} flex flex-col justify-between`}>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-muted mt-1">{p.desc}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => onSelectProvider(p.id)}
                      className="px-3 py-1 rounded-md bg-emerald-500 text-black font-semibold"
                    >
                      Select
                    </button>
                    {profile?.selected_model === p.id && <span className="text-sm text-neon font-medium">Selected</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings panel */}
          <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Настройки — {activeTab}</div>
              <div className="text-sm text-muted">Provider: <span className="text-neon ml-2">{profile?.selected_model ?? "—"}</span></div>
            </div>

            {/* dynamic settings for each tab */}
            <div className="space-y-3">
              {activeTab === "chat" && (
                <>
                  <label className="text-sm text-muted">Temperature: <span className="text-neon font-semibold">{settings?.temperature ?? PROVIDERS.chat.defaults.temperature}</span></label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings?.temperature ?? PROVIDERS.chat.defaults.temperature}
                    onChange={(e) => updateSettingField("temperature", parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <label className="text-sm text-muted">Max tokens</label>
                  <input
                    type="number"
                    value={settings?.max_tokens ?? PROVIDERS.chat.defaults.max_tokens}
                    onChange={(e) => updateSettingField("max_tokens", parseInt(e.target.value || "0", 10))}
                    className="input w-36"
                  />
                </>
              )}

              {activeTab === "image" && (
                <>
                  <label className="text-sm text-muted">Размер</label>
                  <div className="flex gap-2">
                    <select value={settings?.size ?? `${PROVIDERS.image.defaults.width}x${PROVIDERS.image.defaults.height}`} onChange={(e) => {
                      const [w,h] = e.target.value.split("x").map(Number);
                      updateSettingField("width", w);
                      updateSettingField("height", h);
                    }} className="input">
                      <option value="512x512">512 × 512</option>
                      <option value="768x768">768 × 768</option>
                      <option value="1024x1024">1024 × 1024</option>
                    </select>
                    <select value={settings?.quality ?? PROVIDERS.image.defaults.quality} onChange={(e) => updateSettingField("quality", e.target.value)} className="input w-36">
                      <option value="draft">Draft (fast)</option>
                      <option value="standard">Standard</option>
                      <option value="high">High quality</option>
                    </select>
                  </div>
                  <label className="text-sm text-muted mt-2">Prompt для превью</label>
                  <input className="input w-full" value={settings?.prompt ?? ""} placeholder="Describe image..." onChange={(e) => updateSettingField("prompt", e.target.value)} />
                </>
              )}

              {activeTab === "video" && (
                <>
                  <label className="text-sm text-muted">Продолжительность (сек)</label>
                  <input type="number" className="input w-36" value={settings?.duration_sec ?? PROVIDERS.video.defaults.duration_sec} onChange={(e) => updateSettingField("duration_sec", parseInt(e.target.value||"0",10))} />
                  <label className="text-sm text-muted mt-2">Resolution</label>
                  <select className="input w-44" value={settings?.resolution ?? PROVIDERS.video.defaults.resolution} onChange={(e)=>updateSettingField("resolution", e.target.value)}>
                    <option>480p</option>
                    <option>720p</option>
                    <option>1080p</option>
                  </select>
                </>
              )}

              {activeTab === "docs" && (
                <>
                  <label className="text-sm text-muted">Max summary length</label>
                  <input type="number" className="input w-36" value={settings?.max_summary_len ?? PROVIDERS.docs.defaults.max_summary_len} onChange={(e)=>updateSettingField("max_summary_len", parseInt(e.target.value||"0",10))} />
                </>
              )}

              {activeTab === "audio" && (
                <>
                  <label className="text-sm text-muted">Language</label>
                  <input className="input w-44" value={settings?.language ?? PROVIDERS.audio.defaults.language} onChange={(e)=>updateSettingField("language", e.target.value)} />
                </>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={() => saveSettingsToProfile(profile?.selected_model ?? null, settings)} className="btn-neon" disabled={savingSettings}>Save settings</button>
              <button onClick={() => { setSettings(profile?.settings ?? {}); }} className="px-3 py-2 rounded-md border border-white/6">Reset</button>
            </div>
          </div>

          {/* Tariff & Promo cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
              <div className="text-sm text-muted">Тариф</div>
              <div className="text-2xl font-bold">FREE</div>
              <div className="text-sm text-muted mt-2">Пробные запросы почти во всех инструментах. Доп. лимиты можно купить.</div>
              <div className="mt-4">
                <button onClick={() => alert("Upgrade flow (Stripe) — в планах")} className="btn-neon">Обновить</button>
              </div>
            </div>

            <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted">Ваши токены</div>
                  <div className="text-3xl font-bold text-neon">{profile?.token_balance ?? 0}</div>
                </div>
                <div className="text-sm text-muted">₽ / $</div>
              </div>
              <div className="mt-4">
                <button onClick={handleBuyTokensPrompt} className="btn-neon">Buy tokens</button>
              </div>
            </div>
          </div>

          {/* Chat area (main) */}
          <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
            <div className="text-sm text-muted mb-2">Chat (powered by OpenAI)</div>
            <div className="h-56 overflow-y-auto space-y-3 p-2 bg-neutral-950 rounded-md">
              {chatMessages.length === 0 && <div className="text-sm text-muted">Нет сообщений — начните диалог</div>}
              {chatMessages.map((m, i) => (
                <div key={i} className={`max-w-[85%] p-2 rounded-md ${m.role === "user" ? "ml-auto bg-emerald-500 text-black" : "bg-neutral-800 text-emerald-200"}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input value={chatInput} onChange={(e)=>setChatInput(e.target.value)} placeholder="Напишите сообщение..." className="flex-1 input" onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); sendChat(); }}} />
              <button onClick={sendChat} className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 rounded-md" disabled={chatLoading}>{chatLoading ? "..." : "Send"}</button>
            </div>
          </div>
        </section>

        {/* Right column */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
            <div className="text-sm text-muted">Quick actions</div>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={()=>alert("Запросы истории (скоро)")} className="px-3 py-2 rounded-md border border-white/6 text-left">История запросов</button>
              <button onClick={()=>alert("Экспорт данных (скоро)")} className="px-3 py-2 rounded-md border border-white/6 text-left">Экспорт</button>
              <button onClick={()=>alert("Настройки безопасности (скоро)")} className="px-3 py-2 rounded-md border border-white/6 text-left">Безопасность</button>
            </div>
          </div>

          <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
            <div className="text-sm text-muted">Поддержка</div>
            <div className="mt-3 text-sm">
              Вопросы по интеграции — <a href="mailto:you@cataleya.app" className="text-neon">you@cataleya.app</a>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );

  // helper inside
  function sendChat() {
    // wrapper to use current chatInput state
    // uses sendChat async declared above
    void (async () => {
      if (!chatInput?.trim()) return;
      const text = chatInput;
      setChatMessages(prev => [...prev, { role: "user", text }]);
      setChatInput("");
      setChatLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, user_id: user?.id })
        });
        const data = await res.json();
        if (!res.ok) {
          setChatMessages(prev => [...prev, { role: "assistant", text: `⚠️ Ошибка: ${data.error || JSON.stringify(data)}` }]);
        } else {
          setChatMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
        }
      } catch (err) {
        setChatMessages(prev => [...prev, { role: "assistant", text: `⚠️ Сетевая ошибка: ${err.message}` }]);
      } finally {
        setChatLoading(false);
      }
    })();
  }
}
