import "../styles/globals.css";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Получаем сессию (Supabase v2)
    async function init() {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
    }
    init();
  }, []);

  return <Component {...pageProps} supabase={supabase} session={session} />;
}

export default MyApp;
