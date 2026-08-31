import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrakoMark } from "@/components/trako/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { mode: Mode } => ({
    mode: search["mode"] === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Entrar no TRAKO" },
      { name: "description", content: "Acesse sua conta TRAKO e continue registrando trilhas." },
      { property: "og:title", content: "Entrar no TRAKO" },
      { property: "og:description", content: "Acesse sua conta e registre suas trilhas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthScreen,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function translate(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Este e-mail já tem conta. Faça login.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("password")) return "Senha inválida: use ao menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde um pouco.";
  return message;
}

function AuthScreen() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  const emailError = email && !EMAIL_RE.test(email) ? "E-mail inválido." : null;
  const passError = password && password.length < 6 ? "Mínimo de 6 caracteres." : null;
  const canSubmit = EMAIL_RE.test(email) && password.length >= 6 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate({ to: "/home", replace: true });
        } else {
          toast.success("Conta criada. Confirme seu e-mail para entrar.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home", replace: true });
      }
    } catch (err) {
      const msg = translate(err instanceof Error ? err.message : "Não foi possível continuar.");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    if (!EMAIL_RE.test(email)) {
      setTouched((t) => ({ ...t, email: true }));
      setFormError("Digite seu e-mail para receber o link de recuperação.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Link de recuperação enviado para seu e-mail.");
    } catch (err) {
      toast.error(translate(err instanceof Error ? err.message : "Falha ao enviar o link."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-background px-6 py-10">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="relative mx-auto w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <TrakoMark className="h-16 w-16" />
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">TRAKO</h1>
            <p className="text-xs italic tracking-wide text-muted-foreground">
              Your ride. Your trail.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setFormError(null);
              }}
              className={cn(
                "rounded-full py-2.5 text-sm font-semibold transition-colors",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "signin" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          {mode === "signup" && (
            <Field id="name" label="Nome do piloto" icon={<User className="h-4 w-4" />}>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como te chamam na trilha"
                className="h-12 pl-10"
                autoComplete="name"
              />
            </Field>
          )}

          <Field
            id="email"
            label="E-mail"
            icon={<Mail className="h-4 w-4" />}
            error={touched.email ? emailError : null}
          >
            <Input
              id="email"
              type="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="piloto@trako.app"
              className="h-12 pl-10"
              autoComplete="email"
              aria-invalid={!!(touched.email && emailError)}
            />
          </Field>

          <Field
            id="password"
            label="Senha"
            icon={<Lock className="h-4 w-4" />}
            error={touched.password ? passError : null}
          >
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••"
              className="h-12 pl-10 pr-12"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              aria-invalid={!!(touched.password && passError)}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          {formError && (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            variant="action"
            size="tap"
            className="w-full"
            disabled={!canSubmit}
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" />}
            {busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
          </Button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={forgotPassword}
              disabled={busy}
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Esqueci minha senha
            </button>
          )}
        </form>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Ao continuar você concorda em pilotar com responsabilidade. Sua localização só é usada
          durante as gravações.
        </p>

        <div className="text-center">
          <Link to="/welcome" className="text-xs text-muted-foreground">
            Voltar
          </Link>
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
