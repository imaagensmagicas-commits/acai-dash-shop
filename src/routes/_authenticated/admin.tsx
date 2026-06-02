import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Package, ShoppingBag, TrendingUp, Plus, Edit3, Trash2, Loader2, ArrowLeft, Printer, Settings as SettingsIcon } from "lucide-react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

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

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          toast.info("Novo pedido recebido!", {
            description: `Pedido ${payload.new.order_number} de ${payload.new.customer_name}`,
            action: {
              label: "Ver pedido",
              onClick: () => setCurrentTab("orders")
            }
          });
          // Play a subtle sound if possible or just visual feedback
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const todayOrders = (orders ?? []).filter((o) => new Date(o.created_at) >= today);
      const monthOrders = (orders ?? []).filter((o) => new Date(o.created_at) >= monthStart);
      const todaySales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
      const totalRevenue = (orders ?? []).reduce((s, o) => s + Number(o.total), 0);
      const active = (orders ?? []).filter((o) => !["finalizado", "cancelado"].includes(o.status)).length;

      // Top products ranking
      const productCounts: Record<string, number> = {};
      (items ?? []).forEach((i) => {
        productCounts[i.product_name] = (productCounts[i.product_name] || 0) + i.quantity;
      });
      const topProducts = Object.entries(productCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return { total: orders?.length ?? 0, todaySales, todayCount: todayOrders.length, active, monthCount: monthOrders.length, totalRevenue, topProducts };
    },
    refetchInterval: 5000
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <Badge variant="outline" className="text-primary border-primary">Tempo Real Ativo</Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pedidos hoje" value={data?.todayCount ?? 0} icon={ShoppingBag} />
        <StatCard label="Vendas hoje" value={brl(data?.todaySales ?? 0)} icon={TrendingUp} />
        <StatCard label="Pedidos ativos" value={data?.active ?? 0} icon={Package} />
        <StatCard label="Total no mês" value={data?.monthCount ?? 0} icon={ShoppingBag} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card-soft">
          <CardHeader><CardTitle>Produtos mais vendidos (Top 5)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topProducts || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card-soft bg-primary-gradient text-white">
          <CardHeader><CardTitle className="text-white">Resumo Financeiro</CardTitle></CardHeader>
          <CardContent className="flex flex-col justify-center items-center h-[240px]">
            <div className="text-sm uppercase opacity-80 tracking-widest">Faturamento Total</div>
            <div className="text-5xl font-bold mt-2">{brl(data?.totalRevenue || 0)}</div>
            <div className="mt-8 grid grid-cols-2 gap-8 w-full">
              <div className="text-center">
                <div className="text-xs opacity-70">Ticket Médio</div>
                <div className="text-xl font-bold">{brl((data?.totalRevenue || 0) / (data?.total || 1))}</div>
              </div>
              <div className="text-center">
                <div className="text-xs opacity-70">Conversão</div>
                <div className="text-xl font-bold">100%</div>
              </div>
            </div>
          </CardContent>
        </Card>
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

  const updateStatus = async (id: string, status: any) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Status atualizado para ${statusLabels[status]}`);
    setSelectedOrder(null);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Pedidos em Tempo Real</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((o: any) => (
          <Card key={o.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-l-4" style={{ borderLeftColor: o.status === 'novo' ? '#7c3aed' : '#cbd5e1' }} onClick={() => setSelectedOrder(o)}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded">{o.order_number}</span>
                <Badge className={o.status === 'novo' ? 'bg-primary' : ''}>{statusLabels[o.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{o.customer_name}</div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                {o.delivery_type === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-xl font-bold text-primary">{brl(Number(o.total))}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Pedido <span className="text-primary font-mono">{selectedOrder?.order_number}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Cliente</Label>
                  <div className="font-semibold text-lg">{selectedOrder.customer_name}</div>
                  <a href={`https://wa.me/${selectedOrder.whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-success text-sm flex items-center gap-1 hover:underline">
                    WhatsApp: {selectedOrder.whatsapp}
                  </a>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Data/Hora</Label>
                  <div>{new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
              </div>

              {selectedOrder.delivery_type === 'entrega' && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Endereço de Entrega</Label>
                  <div className="bg-surface p-3 rounded-lg border italic">{selectedOrder.address}</div>
                </div>
              )}

              <div className="border rounded-xl overflow-hidden">
                <div className="bg-muted px-4 py-2 text-xs font-bold uppercase">Itens do Pedido</div>
                <div className="p-4 space-y-2">
                  {(selectedOrder.items_preview || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                      <span className="text-muted-foreground">{brl(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{brl(Number(selectedOrder.total))}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 no-print">
                <Button variant="outline" onClick={() => updateStatus(selectedOrder.id, 'preparando')}>⚙️ Preparando</Button>
                <Button variant="outline" onClick={() => updateStatus(selectedOrder.id, 'saiu_entrega')}>🛵 Saiu p/ Entrega</Button>
                <Button className="col-span-2 bg-success hover:bg-success/90" onClick={() => updateStatus(selectedOrder.id, 'finalizado')}>✅ Finalizar Pedido</Button>
                <Button variant="ghost" className="col-span-2 text-destructive" onClick={() => updateStatus(selectedOrder.id, 'cancelado')}>❌ Cancelar Pedido</Button>
              </div>

              <Button onClick={() => window.print()} variant="secondary" className="w-full gap-2 no-print">
                <Printer className="h-4 w-4" /> Imprimir p/ Cozinha
              </Button>

              {/* Print Only View */}
              <div className="print-only fixed inset-0 bg-white p-8 space-y-4">
                <h1 className="text-2xl font-bold border-b pb-2">KL AÇAÍ - PEDIDO #{selectedOrder.order_number}</h1>
                <div className="grid grid-cols-2 text-sm">
                  <div><strong>Cliente:</strong> {selectedOrder.customer_name}</div>
                  <div><strong>Tipo:</strong> {selectedOrder.delivery_type.toUpperCase()}</div>
                </div>
                {selectedOrder.address && <div><strong>Endereço:</strong> {selectedOrder.address}</div>}
                <div className="border-y py-4 my-4">
                  {(selectedOrder.items_preview || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{brl(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right text-xl font-bold">TOTAL: {brl(Number(selectedOrder.total))}</div>
              </div>
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
