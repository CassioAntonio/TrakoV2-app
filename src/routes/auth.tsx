import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrakoMark } from "@/components/trako/Brand";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { mode: Mode } => ({
    mode: search["mode"] === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Entrar no TRAKO" },
      {
        name: "description",
        content: "Acesse sua conta TRAKO para gravar trilhas e acompanhar suas estatísticas.",
      },
      { property: "og:title", content: "Entrar no TRAKO" },
      { property: "og:description", content: "Acesse sua conta e registre suas trilhas." },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate({ to: "/home", replace: true });
        else toast.success("Conta criada. Confirme seu e-mail para entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch {
      toast.error("Não foi possível entrar com o Google.");
    }
  };

  return (
    <main className="app-scroll flex min-h-dvh flex-col bg-background px-6 pb-10 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
      <Link
        to="/welcome"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mt-8 flex flex-col items-center gap-2">
        <TrakoMark className="h-16 w-16" />
        <h1 className="font-display text-2xl font-bold">
          {mode === "signup" ? "Criar conta" : "Entrar"}
        </h1>
        <p className="text-xs text-muted-foreground">Suas trilhas, seus números.</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do piloto</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como te chamam nas trilhas"
              className="h-12"
              autoComplete="name"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="h-12"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mínimo 6 caracteres"
            className="h-12"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>

        <Button type="submit" variant="action" size="tap" className="w-full" disabled={busy}>
          {busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="surface" size="tap" className="w-full" onClick={google}>
        Continuar com Google
      </Button>

      <button
        type="button"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        {mode === "signup" ? (
          <>
            Já tem conta? <span className="font-semibold text-primary">Entrar</span>
          </>
        ) : (
          <>
            Novo por aqui? <span className="font-semibold text-primary">Criar conta</span>
          </>
        )}
      </button>
    </main>
  );
}
