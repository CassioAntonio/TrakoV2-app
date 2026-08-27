import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrakoMark } from "@/components/trako/Brand";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "TRAKO — Your ride. Your trail." },
      {
        name: "description",
        content:
          "Abra o TRAKO e siga direto para suas trilhas: GPS em tempo real, mapas e estatísticas do piloto.",
      },
      { property: "og:title", content: "TRAKO — Your ride. Your trail." },
      {
        property: "og:description",
        content: "App de trilhas off-road com GPS, mapas e estatísticas reais.",
      },
    ],
  }),
  component: Splash,
});

/** Splash: decides between the app and first access. No marketing, no onboarding replay. */
function Splash() {
  const navigate = useNavigate();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const slowTimer = window.setTimeout(() => setSlow(true), 2500);
    let done = false;
    const go = async () => {
      const { data } = await supabase.auth.getSession();
      if (done) return;
      done = true;
      navigate({ to: data.session ? "/home" : "/welcome", replace: true });
    };
    const t = window.setTimeout(() => void go(), 900);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(slowTimer);
    };
  }, [navigate]);

  return (
    <main className="relative flex h-dvh flex-col items-center justify-center overflow-hidden bg-background">
      <div className="absolute h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col items-center gap-4 animate-rise">
        <div className="relative">
          <span className="absolute inset-0 rounded-3xl bg-primary/30 [animation:trako-pulse_2s_ease-out_infinite]" />
          <TrakoMark className="relative h-24 w-24" />
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight">TRAKO</h1>
        <p className="text-sm italic tracking-wide text-muted-foreground">Your ride. Your trail.</p>
      </div>
      {slow && (
        <p className="absolute bottom-10 text-xs text-muted-foreground">Preparando o GPS…</p>
      )}
    </main>
  );
}
