import { useState, useEffect } from "react";
import { Settings, Store, Bell, Store as StoreIcon, Smartphone, Camera, Instagram } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: storeSettings, isLoading } = useQuery({
    queryKey: ["store-settings-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("slug", "loja")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data, error } = await supabase
        .from("store_settings")
        .update(values)
        .eq("slug", "loja")
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Nenhuma linha foi atualizada. Verifique se sua conta tem permissão de admin.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings-admin"] });
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao salvar configurações");
      console.error(error);
    }
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const values = {
      name: formData.get("name") as string,
      whatsapp_number: formData.get("whatsapp") as string,
      opening_time: formData.get("opening_time") as string,
      closing_time: formData.get("closing_time") as string,
      address: formData.get("address") as string,
      delivery_fee: Number(formData.get("delivery_fee")),
      primary_color: formData.get("primary_color") as string,
      instagram_url: formData.get("instagram_url") as string,
    };
    updateMutation.mutate(values);
  };

  const toggleStoreStatus = () => {
    if (!storeSettings) return;
    updateMutation.mutate({ is_open: !storeSettings.is_open });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storeSettings) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      updateMutation.mutate({ logo_url: publicUrl });
    } catch (error) {
      toast.error("Erro ao fazer upload da logo");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Carregando configurações...</div>;

  return (
    <div className="space-y-6 max-w-4xl pb-20">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie o perfil da sua loja e preferências do sistema.</p>
      </div>

      <form onSubmit={handleSave} className="grid gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-card-soft border-none bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <StoreIcon size={20} />
                </div>
                <div>
                  <CardTitle>Perfil da Loja</CardTitle>
                  <CardDescription>Informações básicas que aparecem no site.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Logo da Loja</Label>
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                      {storeSettings?.logo_url ? (
                        <img src="/logo.jpeg" alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <StoreIcon className="h-8 w-8 text-slate-300" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                      <Camera className="h-6 w-6" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                    </label>
                  </div>
                  {isUploading && <span className="text-[10px] animate-pulse">Enviando...</span>}
                </div>

                <div className="flex-1 grid md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Nome da Loja</Label>
                    <Input id="name" name="name" defaultValue={storeSettings?.name || ""} className="rounded-xl border-slate-100 bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Telefone WhatsApp</Label>
                    <Input id="whatsapp" name="whatsapp" defaultValue={storeSettings?.whatsapp_number || ""} className="rounded-xl border-slate-100 bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Link do Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="instagram_url" name="instagram_url" defaultValue={storeSettings?.instagram_url || ""} className="rounded-xl border-slate-100 bg-slate-50 pl-10" placeholder="https://www.instagram.com/seu-perfil" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Endereço da Loja</Label>
                  <Input id="address" name="address" defaultValue={storeSettings?.address || ""} className="rounded-xl border-slate-100 bg-slate-50" placeholder="Rua Exemplo, 123 - Centro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_fee" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Taxa de Entrega (R$)</Label>
                  <Input id="delivery_fee" name="delivery_fee" type="number" step="0.01" defaultValue={storeSettings?.delivery_fee || 0} className="rounded-xl border-slate-100 bg-slate-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Horário de Funcionamento e Cor Principal</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">Abre</span>
                    <Input name="opening_time" defaultValue={storeSettings?.opening_time || ""} className="rounded-xl border-slate-100 bg-slate-50 pl-14" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">Fecha</span>
                    <Input name="closing_time" defaultValue={storeSettings?.closing_time || ""} className="rounded-xl border-slate-100 bg-slate-50 pl-14" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">Cor</span>
                    <Input name="primary_color" type="color" defaultValue={storeSettings?.primary_color || "#7c3aed"} className="rounded-xl border-slate-100 bg-slate-50 pl-14 h-10 p-1" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("h-4 w-4 rounded-full", storeSettings?.is_open ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                  <div>
                    <div className="font-bold text-slate-800">Status da Loja: {storeSettings?.is_open ? 'ABERTA' : 'FECHADA'}</div>
                    <div className="text-[10px] uppercase font-medium text-muted-foreground">Controla se os clientes podem fazer pedidos agora</div>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant={storeSettings?.is_open ? "destructive" : "default"} 
                  size="sm" 
                  onClick={toggleStoreStatus}
                  className="rounded-full font-bold px-6"
                >
                  {storeSettings?.is_open ? "Fechar Loja" : "Abrir Loja"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-card-soft border-none bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Bell size={20} />
                </div>
                <div>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>Configure como você quer ser avisado sobre novos pedidos.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-2">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold">Alertas Sonoros</div>
                  <div className="text-xs text-muted-foreground">Tocar um som quando chegar um novo pedido</div>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
              <div className="flex items-center justify-between p-2 border-t border-slate-50 pt-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold">Notificações no Navegador</div>
                  <div className="text-xs text-muted-foreground">Mostrar pop-up mesmo com a aba em segundo plano</div>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={updateMutation.isPending} className="bg-primary-gradient px-12 h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            {updateMutation.isPending ? "Salvando..." : "Salvar Todas as Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
