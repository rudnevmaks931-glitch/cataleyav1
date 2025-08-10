// pages/dashboard.js
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

/**
 * Cataleya Dashboard (restored + enhancements)
 * - Left & Right collapsible sidebars with neon SVG icons
 * - Narrow icon strips when collapsed (mobile friendly)
 * - Central workspace expands when sidebars collapsed
 * - Preserves all previous functionality (profiles, providers, settings, chat, tokens)
 *
 * Uses existing project styles: .glass, .btn-neon, .input, .text-neon etc.
 */

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "docs", label: "Docs" },
  { id: "audio", label: "Audio" }
];

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

  // chat
  const [chatMessages, setChatMessages] = useState([]); // chat area
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef(null);

  // sidebar collapse state
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

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

      const { data: p, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", usr.id)
        .single();

      if (error || !p) {
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

  // refresh profile after changes
  async function refreshProfile() {
    if (!user) return;
    const { data: p, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!error && p) {
      setProfile(p);
      setSelectedProvider(p.selected_model ?? null);
      setSettings(p.settings ?? {});
    }
  }

  async function saveSettingsToProfile(providerId, newSettings) {
    if (!user) return;
    setSavingSettings(true);
    try {
      const payload = { selected_model: providerId, settings: newSettings };
      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) {
        console.error("Failed to save profile settings:", error);
        alert("Ошибка при сохранении настроек: " + error.message);
      } else {
        await refreshProfile();
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети при сохранении.");
    } finally {
      setSavingSettings(false);
    }
  }

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
        await refreshProfile();
        alert("Баланс обновлён: +" + amount + " токенов");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети при пополнении");
    }
  }

  function onSelectProvider(providerId) {
    const [tabKey] = providerId.split(":");
    const providerDefaults = PROVIDERS[tabKey]?.defaults ?? {};
    const curSettings = (profile && profile.selected_model === providerId && profile.settings) ? profile.settings : providerDefaults;
    saveSettingsToProfile(providerId, curSettings);
  }

  function updateSettingField(key, value, autosave = false) {
    const newSettings = { ...(settings || {}), [key]: value };
    setSettings(newSettings);
    if (autosave) {
      saveSettingsToProfile(selectedProvider, newSettings);
    }
  }

  // autoscroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      try {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight + 200;
      } catch {}
    }
  }, [chatMessages]);

  async function sendChat() {
    if (!chatInput.trim()) return;
    const balance = profile?.token_balance ?? 0;
    if (balance <= 0) {
      alert("Недостаточно токенов. Пополните баланс.");
      return;
    }

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
        await refreshProfile();
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: `⚠️ Сетевая ошибка: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Toggle functions for sidebars
  function toggleLeft() {
    setLeftCollapsed(!leftCollapsed);
  }
  function toggleRight() {
    setRightCollapsed(!rightCollapsed);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <div className="text-center">
          <div className="animate-pulse text-neon text-2xl">Загрузка Dashboard...</div>
        </div>
      </div>
    );
  }

  // SVG icon components (neon style)
  const Icon = {
    Chat: ({ className = "w-5 h-5" }) => (
      <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    User: ({ className = "w-5 h-5" }) => (
      <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Cog: ({ className = "w-5 h-5" }) => (
      <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.27 16.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.27 2.27A2 2 0 1 1 7.1 0l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 0.88V1a2 2 0 1 1 4 0v.12c.11.57.46 1.09 1 1.51.54.41 1.2.56 1.82.33l.06-.06A2 2 0 1 1 21.73 7.1l-.06.06a1.65 1.65 0 0 0-.33 1.82c.22.62.07 1.28-.33 1.82-.42.54-.95.89-1.51 1V15a2 2 0 1 1-4 0v-.12c-.11-.57-.46-1.09-1-1.51z" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round" opacity="0.0"/>
      </svg>
    ),
    Token: ({ className = "w-5 h-5" }) => (
      <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  };

  // classes for neon icons (uses CSS variable --neon if present)
  const neonIconClass = "text-neon hover:scale-110 transition-transform duration-200";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#040404] to-[#080808] text-white relative">
      {/* Left edge toggle button (fixed) */}
      <button
        onClick={toggleLeft}
        aria-label={leftCollapsed ? "Expand left" : "Collapse left"}
        className="fixed left-2 top-1/2 z-50 transform -translate-y-1/2 bg-transparent p-2 rounded-md hover:scale-105 transition"
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-md" style={{ boxShadow: "0 6px 20px rgba(0,255,174,0.08)" }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-neon">
            {leftCollapsed ? (
              <path d="M8 5l8 7-8 7V5z" fill="currentColor"/>
            ) : (
              <path d="M16 5L8 12l8 7V5z" fill="currentColor"/>
            )}
          </svg>
        </div>
      </button>

      {/* Right edge toggle button (fixed) */}
      <button
        onClick={toggleRight}
        aria-label={rightCollapsed ? "Expand right" : "Collapse right"}
        className="fixed right-2 top-1/2 z-50 transform -translate-y-1/2 bg-transparent p-2 rounded-md hover:scale-105 transition"
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-md" style={{ boxShadow: "0 6px 20px rgba(0,255,174,0.08)" }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-neon">
            {rightCollapsed ? (
              <path d="M16 5l-8 7 8 7V5z" fill="currentColor"/>
            ) : (
              <path d="M8 5l8 7-8 7V5z" fill="currentColor"/>
            )}
          </svg>
        </div>
      </button>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Left sidebar */}
        <aside className={`col-span-12 lg:col-span-3 transition-all duration-300 ${leftCollapsed ? 'w-16 lg:w-16' : 'w-full lg:w-auto'}`}>

          <div className={`flex ${leftCollapsed ? 'justify-center' : ''}`}>
            <div className={`${leftCollapsed ? 'w-16' : 'w-full'} ${leftCollapsed ? '' : 'glass'} rounded-xl overflow-hidden`}>
              {/* Collapsed narrow icon column */}
              {leftCollapsed ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <button onClick={() => setActiveTab('chat')} className="p-2 rounded-md hover:scale-110 transition" title="Chat">
                    <span className={`${neonIconClass}`}><Icon.Chat /></span>
                  </button>
                  <button onClick={() => setActiveTab('profile')} className="p-2 rounded-md hover:scale-110 transition" title="Profile">
                    <span className={`${neonIconClass}`}><Icon.User /></span>
                  </button>
                  <button onClick={() => setActiveTab('image')} className="p-2 rounded-md hover:scale-110 transition" title="Images">
                    <span className={`${neonIconClass}`}><Icon.Token /></span>
                  </button>
                </div>
              ) : (
                <div className="bg-gray-900/60 glass p-5 rounded-xl border border-emerald-500/6">
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
                      <button onClick={handleBuyTokensPrompt} className="w-full mt-2 btn-neon text-white">Пополнить</button>
                    </li>

                    <li className="pt-4 border-t border-white/5">
                      <nav className="flex flex-col gap-2 text-sm">
                        <a className="text-[var(--text)]">📌 Профиль</a>
                        <a className="text-[var(--text)]">⭐ Подписка</a>
                        <a className="text-[var(--text)]">⚡ Токены</a>
                        <a className="text-[var(--text)]">📝 Лента запросов</a>
                        <a className="text-[var(--text)]">🤝 Партнёрская программа</a>
                        <button onClick={handleLogout} className="mt-2 px-3 py-2 rounded-md border border-white/6 text-sm text-white">Выход</button>
                      </nav>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main content - central column grows when sidebars collapsed */}
        <section className={`col-span-12 lg:col-span-${leftCollapsed || rightCollapsed ? '12' : '6'} transition-all duration-300`}>
          {/* Providers & settings (kept full width inside central area) */}
          <div className="space-y-6">
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
                      <div className="font-semibold text-white">{p.name}</div>
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

            <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Настройки — {activeTab}</div>
                <div className="text-sm text-muted">Provider: <span className="text-neon ml-2">{profile?.selected_model ?? "—"}</span></div>
              </div>

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
                <button onClick={() => { setSettings(profile?.settings ?? {}); }} className="px-3 py-2 rounded-md border border-white/6 text-white">Reset</button>
              </div>
            </div>

            {/* Tariff & Tokens */}
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
                  <button onClick={handleBuyTokensPrompt} className="btn-neon text-white">Buy tokens</button>
                </div>
              </div>
            </div>

            {/* Chat (main) */}
            <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
              <div className="text-sm text-muted mb-2">Chat (powered by OpenAI)</div>
              <div ref={chatScrollRef} className="h-72 lg:h-96 overflow-y-auto space-y-3 p-3 bg-neutral-950 rounded-md">
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
          </div>
        </section>

        {/* Right sidebar */}
        <aside className={`col-span-12 lg:col-span-3 transition-all duration-300 ${rightCollapsed ? 'w-16 lg:w-16' : 'w-full lg:w-auto'}`}>
          <div className={`flex ${rightCollapsed ? 'justify-center' : ''}`}>
            <div className={`${rightCollapsed ? 'w-16' : 'w-full'} ${rightCollapsed ? '' : 'glass'} rounded-xl overflow-hidden`}>
              {rightCollapsed ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <button onClick={() => alert('History (soon)')} className="p-2 rounded-md hover:scale-110 transition" title="History">
                    <span className={neonIconClass}><Icon.Token /></span>
                  </button>
                  <button onClick={() => alert('Export (soon)')} className="p-2 rounded-md hover:scale-110 transition" title="Export">
                    <span className={neonIconClass}><Icon.Cog /></span>
                  </button>
                  <button onClick={() => alert('Support')} className="p-2 rounded-md hover:scale-110 transition" title="Support">
                    <span className={neonIconClass}><Icon.User /></span>
                  </button>
                </div>
              ) : (
                <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6">
                  <div className="text-sm text-muted">Quick actions</div>
                  <div className="mt-3 flex flex-col gap-2">
                    <button onClick={()=>alert("Запросы истории (скоро)")} className="px-3 py-2 rounded-md border border-white/6 text-left text-white">История запросов</button>
                    <button onClick={()=>alert("Экспорт данных (скоро)")} className="px-3 py-2 rounded-md border border-white/6 text-left text-white">Экспорт</button>
                    <button onClick={()=>alert("Настройки безопасности (скоро)")} className="px-3 py-2 rounded-md border border-white/6 text-left text-white">Безопасность</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Support card */}
          {!rightCollapsed && (
            <div className="bg-gray-900/60 glass p-4 rounded-xl border border-emerald-500/6 mt-4">
              <div className="text-sm text-muted">Поддержка</div>
              <div className="mt-3 text-sm">
                Вопросы по интеграции — <a href="mailto:you@cataleya.app" className="text-neon">you@cataleya.app</a>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}


