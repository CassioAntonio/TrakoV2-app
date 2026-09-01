import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RiderAvatar } from "@/components/trako/RiderAvatar";
import { upsertProfile } from "@/services/activities";
import { uploadAvatar } from "@/services/community";
import { DISCIPLINES } from "@/types/trako";
import type { Profile } from "@/types/trako";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  profile: Profile | null | undefined;
  children: React.ReactNode;
}

export function ProfileEditor({ userId, profile, children }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [bike, setBike] = useState(profile?.bike ?? "");
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null);
  const [disciplines, setDisciplines] = useState<string[]>(profile?.disciplines ?? []);

  function toggleDiscipline(id: string) {
    setDisciplines((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadAvatar(userId, file);
      setAvatar(path);
      toast.success("Foto carregada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await upsertProfile({
        id: userId,
        display_name: displayName.trim() || null,
        username: username.trim().toLowerCase() || null,
        bio: bio.trim() || null,
        bike: bike.trim() || null,
        avatar_url: avatar,
        disciplines,
      });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado.");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="px-0">
          <SheetTitle className="font-display">Editar perfil</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-8">
          <div className="flex items-center gap-4">
            <RiderAvatar path={avatar} name={displayName} className="h-20 w-20" />
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void pickPhoto(e.target.files?.[0])}
              />
              <Button
                variant="surface"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                Trocar foto
              </Button>
              <p className="mt-1 text-[11px] text-muted-foreground">JPG ou PNG, até 5 MB.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Nome</Label>
            <Input
              id="pf-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-user">Username</Label>
            <Input
              id="pf-user"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              placeholder="piloto123"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-bio">Bio</Label>
            <Textarea
              id="pf-bio"
              value={bio}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Onde você pilota, o que curte…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-bike">Moto</Label>
            <Input
              id="pf-bike"
              value={bike}
              onChange={(e) => setBike(e.target.value)}
              placeholder="Honda CRF 250F"
            />
          </div>

          <div className="space-y-2">
            <Label>Modalidades</Label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDiscipline(d.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    disciplines.includes(d.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="action"
            size="tap"
            className="w-full"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar perfil
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
