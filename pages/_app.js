// pages/_app.js
import "../styles/globals.css";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

function MyApp({ Component, pageProps }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });

      return () => subscription?.unsubscribe();
    }
    init();
  }, []);

  return <Component {...pageProps} session={session} />;
}

export default MyApp;
