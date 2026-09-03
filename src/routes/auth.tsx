import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TrakoMark } from "@/components/trako/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — TRAKO" },
      {
        name: "description",
        content: "Acesse sua conta TRAKO para gravar trilhas, ver estatísticas e a comunidade.",
      },
      { property: "og:title", content: "Entrar — TRAKO" },
      { property: "og:description", content: "Login e cadastro do app de trilhas off-road TRAKO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthScreen,
});

type Mode = "signin" | "signup" | "recover";

function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "recover">(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  function validate() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Informe um e-mail válido.";
    if (mode !== "recover" && password.length < 6)
      return "A senha precisa ter pelo menos 6 caracteres.";
    if (mode === "signup" && name.trim().length < 2) return "Informe seu nome de piloto.";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validate();
    setError(invalid);
    if (invalid) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        void navigate({ to: "/home", replace: true });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() },
          },
        });
        if (error) throw error;
        if (data.session) void navigate({ to: "/home", replace: true });
        else setSent("confirm");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("recover");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível continuar.";
      setError(
        /invalid login credentials/i.test(msg)
          ? "E-mail ou senha incorretos."
          : /already registered/i.test(msg)
            ? "Este e-mail já tem conta. Faça login."
            : msg,
      );
      toast.error("Falha na autenticação.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Mail className="h-10 w-10 text-primary" />
        <h1 className="font-display text-xl font-bold">Confira seu e-mail</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          {sent === "confirm"
            ? "Enviamos um link de confirmação para " + email + ". Confirme para entrar no TRAKO."
            : "Enviamos um link para redefinir sua senha para " + email + "."}
        </p>
        <Button
          variant="surface"
          onClick={() => {
            setSent(null);
            setMode("signin");
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Button>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-background px-6 py-10">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 pb-8">
          <TrakoMark className="h-16 w-16" />
          <h1 className="font-display text-3xl font-bold tracking-tight">TRAKO</h1>
          <p className="text-xs italic tracking-wide text-muted-foreground">
            Your ride. Your trail.
          </p>
        </div>

        {mode !== "recover" && (
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-surface-2 p-1">
            {(
              [
                ["signin", "Entrar"],
                ["signup", "Criar conta"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setError(null);
                }}
                className={cn(
                  "rounded-lg py-2 text-sm font-semibold transition-colors",
                  mode === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="au-name">Nome do piloto</Label>
              <Input
                id="au-name"
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Como quer ser chamado"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="au-email">E-mail</Label>
            <Input
              id="au-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>

          {mode !== "recover" && (
            <div className="space-y-1.5">
              <Label htmlFor="au-pass">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="au-pass"
                  type={show ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="px-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" variant="action" size="tap" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "recover" ? (
            <button type="button" onClick={() => setMode("signin")} className="underline">
              Voltar ao login
            </button>
          ) : (
            <button type="button" onClick={() => setMode("recover")} className="underline">
              Esqueci minha senha
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
