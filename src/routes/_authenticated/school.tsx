import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, Compass, Wrench, Mountain } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Screen, SectionTitle } from "@/components/trako/Screen";

export const Route = createFileRoute("/_authenticated/school")({
  head: () => ({
    meta: [
      { title: "Escola — TRAKO" },
      { name: "description", content: "Fundamentos de pilotagem off-road, segurança e navegação." },
      { property: "og:title", content: "Escola — TRAKO" },
      { property: "og:description", content: "Aprenda técnica, segurança e navegação off-road." },
    ],
  }),
  component: School,
});

interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Conteúdo educativo estático — não gera XP nem estatísticas. */
const LESSONS: Lesson[] = [
  {
    id: "postura",
    title: "Postura em pé",
    description:
      "Joelhos flexionados, cotovelos altos e peso nas pedaleiras. Base para controle em terreno solto.",
    icon: Mountain,
  },
  {
    id: "freio",
    title: "Frenagem no off-road",
    description:
      "Use os dois freios de forma progressiva; no cascalho, o traseiro estabiliza mais que o dianteiro.",
    icon: ShieldCheck,
  },
  {
    id: "navegacao",
    title: "Navegação e GPS",
    description:
      "Grave o percurso desde o início, confira o sinal antes de sair e avise alguém sobre a rota.",
    icon: Compass,
  },
  {
    id: "manutencao",
    title: "Checagem pré-trilha",
    description:
      "Pneus, corrente, óleo, freios e kit de reparo. Cinco minutos que evitam horas de espera.",
    icon: Wrench,
  },
];

function School() {
  return (
    <Screen title="Escola" subtitle="Técnica, segurança e navegação">
      <div className="surface-card flex items-center gap-3 px-4 py-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <GraduationCap className="h-6 w-6" />
        </div>
        <p className="text-xs text-muted-foreground">
          Fundamentos para pilotar melhor e voltar inteiro. Conteúdo de leitura — não altera suas
          estatísticas.
        </p>
      </div>

      <SectionTitle>Fundamentos</SectionTitle>
      <ul className="space-y-3">
        {LESSONS.map((l) => (
          <li key={l.id} className="surface-card flex gap-3 px-4 py-4">
            <l.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold">{l.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
