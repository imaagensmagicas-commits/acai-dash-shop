import { useState } from "react";
import { Settings, Store, Bell, Shield, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SettingsPanel() {
  const [storeOpen, setStoreOpen] = useState(true);

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie o perfil da sua loja e preferências do sistema.</p>
      </div>

      <div className="grid gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-card-soft border-none bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Store size={20} />
                </div>
                <div>
                  <CardTitle>Perfil da Loja</CardTitle>
                  <CardDescription>Informações básicas que aparecem no site.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Nome da Loja</Label>
                  <Input defaultValue="KL Açaí" className="rounded-xl border-slate-100 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Telefone WhatsApp</Label>
                  <Input defaultValue="(11) 99999-9999" className="rounded-xl border-slate-100 bg-slate-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Horário de Funcionamento</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">Abre</span>
                    <Input defaultValue="10:00" className="rounded-xl border-slate-100 bg-slate-50 pl-14" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">Fecha</span>
                    <Input defaultValue="22:00" className="rounded-xl border-slate-100 bg-slate-50 pl-14" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("h-4 w-4 rounded-full", storeOpen ? "bg-success animate-pulse" : "bg-destructive")} />
                  <div>
                    <div className="font-bold text-slate-800">Status da Loja: {storeOpen ? 'ABERTA' : 'FECHADA'}</div>
                    <div className="text-[10px] uppercase font-medium text-muted-foreground">Controla se os clientes podem fazer pedidos agora</div>
                  </div>
                </div>
                <Button 
                  variant={storeOpen ? "destructive" : "default"} 
                  size="sm" 
                  onClick={() => setStoreOpen(!storeOpen)}
                  className="rounded-full font-bold px-6"
                >
                  {storeOpen ? "Fechar Loja" : "Abrir Loja"}
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
          <Button onClick={handleSave} className="bg-primary-gradient px-12 h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            Salvar Todas as Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
