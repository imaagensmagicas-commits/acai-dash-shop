import { useState, useEffect } from "react";
import { User, Mail, Shield, Camera, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";

export function ProfilePanel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const profileData = {
        ...values,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = profile?.id 
        ? await supabase.from("profiles").update(profileData).eq("id", profile.id)
        : await supabase.from("profiles").insert([profileData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Perfil atualizado com sucesso!");
    },
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateProfileMutation.mutate({
      display_name: formData.get("display_name") as string,
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      updateProfileMutation.mutate({ avatar_url: publicUrl });
    } catch (error) {
      toast.error("Erro ao fazer upload da imagem");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações de acesso e perfil.</p>
      </div>

      <div className="grid gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-card-soft border-none bg-white">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Como você aparece no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <User className="h-10 w-10 text-slate-300" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                      <Camera className="h-6 w-6" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{profile?.display_name || "Administrador"}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {user?.email}
                    </p>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                      <Shield className="h-3 w-3" /> Admin
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Nome de Exibição</Label>
                    <Input id="display_name" name="display_name" defaultValue={profile?.display_name || ""} className="rounded-xl border-slate-100 bg-slate-50" />
                  </div>
                  <div className="space-y-2 opacity-50">
                    <Label htmlFor="email">E-mail (Não alterável)</Label>
                    <Input id="email" value={user?.email || ""} disabled className="rounded-xl border-slate-100 bg-slate-50" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending} className="bg-primary-gradient rounded-xl px-8 font-bold">
                    {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-card-soft border-none bg-white">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
              <CardDescription>Ações irreversíveis na sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="rounded-xl font-bold gap-2"
              >
                <LogOut className="h-4 w-4" /> Sair do Sistema
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
