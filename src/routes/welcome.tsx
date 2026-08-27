import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPinned, Timer, Trophy } from "lucide-react";
import { TrakoMark } from "@/components/trako/Brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/welcome")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Bem-vindo ao TRAKO" },
      {
        name: "description",
        content: "Crie sua conta TRAKO e comece a registrar suas trilhas off-road.",
      },
      { property: "og:title", content: "Bem-vindo ao TRAKO" },
      { property: "og:description", content: "Crie sua conta e registre sua primeira trilha." },
    ],
  }),
  component: Welcome,
});

/** First access only. Once authenticated the rider never sees this again. */
function Welcome() {
  return (
    <main className="flex h-dvh flex-col justify-between bg-background px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(env(safe-area-inset-top,0px)+3rem)]">
      <div className="flex flex-col items-center gap-3">
        <TrakoMark className="h-20 w-20" />
        <h1 className="font-display text-4xl font-bold">TRAKO</h1>
        <p className="text-sm italic text-muted-foreground">Your ride. Your trail.</p>
      </div>

      <ul className="space-y-3">
        <Feature icon={<MapPinned className="h-5 w-5" />} title="Mapa e trilhas ao seu redor">
          Descubra rotas a partir da sua localização real, em qualquer lugar.
        </Feature>
        <Feature icon={<Timer className="h-5 w-5" />} title="Gravação GPS de verdade">
          Distância, tempo, velocidade, altitude e traçado no mapa.
        </Feature>
        <Feature icon={<Trophy className="h-5 w-5" />} title="Estatísticas suas">
          Tudo começa em zero e cresce com cada trilha que você pilota.
        </Feature>
      </ul>

      <div className="space-y-3">
        <Button asChild variant="action" size="tap" className="w-full">
          <Link to="/auth" search={{ mode: "signup" }}>
            Criar conta
          </Link>
        </Button>
        <Button asChild variant="surface" size="tap" className="w-full">
          <Link to="/auth" search={{ mode: "signin" }}>
            Já tenho uma conta
          </Link>
        </Button>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary">
        {icon}
      </span>
      <div>
        <p className="font-display text-sm font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
