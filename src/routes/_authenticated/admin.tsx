import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Package, ShoppingBag, TrendingUp, Plus, Edit3, Trash2, Loader2, ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { brl, statusLabels, categoryLabels } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — KL Açaí" }, { name: "robots", content: "noindex" }] }),
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
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
    })();
  }, []);

  if (isAdmin === null) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <div className="max-w-sm rounded-2xl bg-card p-7 text-center shadow-elegant">
          <h2 className="font-display text-xl font-bold">Acesso restrito</h2>
          <Button onClick={async () => { await supabase.from("user_roles").insert({ user_id: userId, role: "admin" }); window.location.reload(); }} className="mt-4 w-full bg-primary-gradient">
            Tornar esta conta admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar currentTab={currentTab} setTab={setCurrentTab} />
      <SidebarInset className="min-h-screen bg-surface p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
          {currentTab === "dashboard" && <Dashboard />}
          {currentTab === "orders" && <OrdersPanel />}
          {currentTab === "products" && <ProductsPanel />}
        </motion.div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ data: orders }, { data: items }] = await Promise.all([
        supabase.from("orders").select("id,total,status,created_at"),
        supabase.from("order_items").select("product_name,quantity"),
      ]);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayOrders = (orders ?? []).filter((o) => new Date(o.created_at) >= today);
      const todaySales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
      const active = (orders ?? []).filter((o) => !["finalizado", "cancelado"].includes(o.status)).length;
      return { total: orders?.length ?? 0, todaySales, todayCount: todayOrders.length, active };
    },
    refetchInterval: 5000
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos hoje" value={data?.todayCount ?? 0} icon={ShoppingBag} />
        <StatCard label="Vendas hoje" value={brl(data?.todaySales ?? 0)} icon={TrendingUp} />
        <StatCard label="Pedidos ativos" value={data?.active ?? 0} icon={Package} />
        <StatCard label="Total geral" value={data?.total ?? 0} icon={ShoppingBag} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <Card className="shadow-card-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function OrdersPanel() {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 3000
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Pedidos</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((o: any) => (
          <Card key={o.id} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedOrder(o)}>
            <CardHeader>
              <div className="flex justify-between">
                <span className="font-mono text-sm font-bold text-primary">{o.order_number}</span>
                <Badge variant={o.status === "novo" ? "default" : "secondary"}>{statusLabels[o.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-semibold">{o.customer_name}</div>
              <div className="text-sm text-muted-foreground">{brl(Number(o.total))}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Detalhes do pedido #{selectedOrder?.order_number}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div><Label>Cliente</Label><div>{selectedOrder.customer_name}</div></div>
              <Button onClick={() => window.print()} className="w-full gap-2 no-print"><Printer className="h-4 w-4" /> Imprimir Cozinha</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductsPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("name");
      return data ?? [];
    },
  });

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = editing.id
      ? await supabase.from("products").update(editing).eq("id", editing.id)
      : await supabase.from("products").insert(editing);
    if (error) return toast.error(error.message);
    toast.success("Salvo com sucesso!");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold">Produtos</h1>
        <Button onClick={() => setEditing({ name: "", price: 0, category: "300ml", active: true })} className="bg-primary-gradient">
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <div className="rounded-2xl bg-card border shadow-sm p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3">Nome</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-b">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{brl(Number(p.price))}</td>
                <td className="p-3 flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Edit3 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("products").delete().eq("id", p.id); qc.invalidateQueries({ queryKey: ["admin-products"] }); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
          <form onSubmit={saveProduct} className="space-y-4">
            <Input placeholder="Nome" value={editing?.name ?? ""} onChange={(e) => setEditing({...editing, name: e.target.value})} required />
            <Input type="number" placeholder="Preço" value={editing?.price ?? 0} onChange={(e) => setEditing({...editing, price: Number(e.target.value)})} required />
            <Select value={editing?.category} onValueChange={(v) => setEditing({...editing, category: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="300ml">300ml</SelectItem>
                <SelectItem value="500ml">500ml</SelectItem>
                <SelectItem value="especial">Especial</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="submit" className="bg-primary-gradient">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
