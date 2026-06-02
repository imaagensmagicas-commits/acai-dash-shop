import { LayoutDashboard, ShoppingBag, Package, Settings, LogOut, ChevronRight, Menu, Link as LinkIcon } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export function AdminSidebar({ currentTab, setTab }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Pedidos", icon: ShoppingBag },
    { id: "products", label: "Produtos", icon: Package },
    { id: "store-link", label: "Link da Loja", icon: LinkIcon },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    setTab(tabId);
    setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-gradient text-primary-foreground font-display font-bold shadow-lg">KL</div>
          <div>
            <div className="font-display font-bold leading-tight text-sidebar-foreground">Painel Admin</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">KL Açaí</div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={currentTab === item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-6 transition-all",
                      currentTab === item.id 
                        ? "bg-primary-gradient text-white shadow-md scale-[1.02]" 
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {currentTab === item.id && <ChevronRight className="ml-auto h-4 w-4" />}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-6 text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sair da conta</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
