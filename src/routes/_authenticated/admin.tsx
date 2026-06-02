import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Dashboard } from "@/components/admin/dashboard";
import { OrdersPanel } from "@/components/admin/orders-panel";
import { ProductsPanel } from "@/components/admin/products-panel";
import { SettingsPanel } from "@/components/admin/settings-panel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ 
    meta: [
      { title: "Painel Administrativo — KL Açaí" }, 
      { name: "robots", content: "noindex" }
    ] 
  }),
  component: AdminPage,
});

function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [currentTab, setCurrentTab] = useState("dashboard");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
        
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    })();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new;
          toast.info("📦 Novo pedido recebido!", {
            description: `Pedido ${newOrder.order_number || newOrder.id.slice(0, 4)} de ${newOrder.customer_name}`,
            action: {
              label: "Ver pedido",
              onClick: () => setCurrentTab("orders")
            },
            duration: 10000,
          });
          
          // Sound notification
          try {
            const audio = new Audio('https://actions.google.com/sounds/v1/notifications/piece_of_cake.ogg');
            audio.play();
          } catch (e) {
            console.error("Audio playback error", e);
          }
        }
      )
      .subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, []);

  if (isAdmin === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium animate-pulse">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center p-4 bg-surface">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-[2.5rem] bg-white p-10 text-center shadow-elegant border border-slate-100"
        >
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
            <Shield className="h-10 w-10" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-800">Acesso Restrito</h2>
          <p className="text-muted-foreground mt-2 mb-8">
            Você não tem permissão para acessar esta área. Se você é o proprietário, clique no botão abaixo para ativar seu acesso.
          </p>
          <Button 
            onClick={async () => { 
              await supabase.from("user_roles").insert({ user_id: userId, role: "admin" }); 
              window.location.reload(); 
            }} 
            className="w-full h-14 rounded-2xl bg-primary-gradient font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            Tornar esta conta admin
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar currentTab={currentTab} setTab={setCurrentTab} />
      <SidebarInset className="min-h-screen bg-surface">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <motion.div 
            key={currentTab}
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full"
          >
            {currentTab === "dashboard" && <Dashboard />}
            {currentTab === "orders" && <OrdersPanel />}
            {currentTab === "products" && <ProductsPanel />}
            {currentTab === "settings" && <SettingsPanel />}
          </motion.div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Simple shield icon for the non-admin view
function Shield({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
