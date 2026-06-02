import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { LogOut, Package, ShoppingBag, TrendingUp, Plus, Edit3, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { brl, statusLabels, categoryLabels } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — KL Açaí" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Order = {
  id: string; customer_name: string; phone: string; address: string | null;
  notes: string | null; delivery_type: string; status: string; total: number;
  created_at: string;
};
type OrderItem = { id: string; order_id: string; product_name: string; unit_price: number; quantity: number };
type Product = { id: string; name: string; description: string | null; price: number; category: string; image_url: string | null; active: boolean };

const STATUS_FLOW = ["novo", "preparando", "saiu_entrega", "finalizado"] as const;
const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  preparando: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  saiu_entrega: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  finalizado: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelado: "bg-red-500/10 text-red-700 dark:text-red-300",
};

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string>("");

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
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-orders"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-products"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const promote = async () => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) return toast.error(error.message);
    toast.success("Você agora é admin!");
    setIsAdmin(true);
  };

  if (isAdmin === null) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <div className="max-w-sm rounded-2xl bg-card p-7 text-center shadow-elegant">
          <h2 className="font-display text-xl font-bold">Acesso restrito</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não tem permissão de administrador.
          </p>
          <Button onClick={promote} className="mt-4 w-full bg-primary-gradient">
            Tornar esta conta admin
          </Button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Use isto apenas para a primeira conta. Depois, gerencie papéis no backend.
          </p>
          <Button variant="ghost" onClick={logout} className="mt-2 w-full">Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-gradient text-primary-foreground font-display font-bold">KL</div>
            <div>
              <div className="font-display font-bold leading-tight">Painel Admin</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">KL Açaí</div>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard"><TrendingUp className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingBag className="mr-2 h-4 w-4" />Pedidos</TabsTrigger>
            <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" />Produtos</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><Dashboard /></TabsContent>
          <TabsContent value="orders"><OrdersPanel /></TabsContent>
          <TabsContent value="products"><ProductsPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
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
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayOrders = (orders ?? []).filter((o) => new Date(o.created_at) >= today);
      const todaySales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
      const productCounts = new Map<string, number>();
      (items ?? []).forEach((i) => productCounts.set(i.product_name, (productCounts.get(i.product_name) ?? 0) + i.quantity));
      const top = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const active = (orders ?? []).filter((o) => !["finalizado", "cancelado"].includes(o.status)).length;
      return { totalOrders: orders?.length ?? 0, todaySales, todayCount: todayOrders.length, active, top };
    },
  });

  const cards = [
    { label: "Pedidos hoje", value: data?.todayCount ?? 0, icon: ShoppingBag, accent: "from-primary to-accent" },
    { label: "Vendas hoje", value: brl(data?.todaySales ?? 0), icon: TrendingUp, accent: "from-gold to-amber-400" },
    { label: "Pedidos ativos", value: data?.active ?? 0, icon: Package, accent: "from-purple-500 to-pink-500" },
    { label: "Total geral", value: data?.totalOrders ?? 0, icon: TrendingUp, accent: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-card p-5 shadow-card-soft">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${c.accent} text-white`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-display text-2xl font-bold">{c.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-card-soft">
        <h3 className="mb-4 font-display text-lg font-semibold">Mais vendidos</h3>
        {!data?.top.length ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
        ) : (
          <ul className="space-y-2">
            {data.top.map(([name, qty], i) => (
              <li key={name} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                <span className="flex-1 text-sm">{name}</span>
                <span className="text-sm font-semibold">{qty}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OrdersPanel() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });
  const { data: itemsByOrder = {} } = useQuery({
    queryKey: ["admin-order-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*");
      if (error) throw error;
      const map: Record<string, OrderItem[]> = {};
      (data as OrderItem[]).forEach((i) => { (map[i.order_id] ??= []).push(i); });
      return map;
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const nextStatus = (s: string) => {
    const i = STATUS_FLOW.indexOf(s as any);
    return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
  };

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!orders.length) return <p className="py-20 text-center text-muted-foreground">Sem pedidos ainda.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence initial={false}>
        {orders.map((o) => {
          const next = nextStatus(o.status);
          return (
            <motion.div key={o.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </div>
                <Badge className={STATUS_COLORS[o.status] ?? ""}>{statusLabels[o.status]}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {o.delivery_type === "entrega" ? `🛵 ${o.address}` : "🏪 Retirada no local"}
                {o.notes && <div className="mt-1 italic">"{o.notes}"</div>}
              </div>
              <ul className="space-y-1 border-t border-dashed pt-2 text-sm">
                {(itemsByOrder[o.id] ?? []).map((i) => (
                  <li key={i.id} className="flex justify-between gap-2">
                    <span>{i.quantity}× {i.product_name}</span>
                    <span className="text-muted-foreground">{brl(i.unit_price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t pt-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
                  <div className="font-display text-lg font-bold text-primary">{brl(Number(o.total))}</div>
                </div>
                <div className="flex gap-1">
                  {next && (
                    <Button size="sm" onClick={() => setStatus(o.id, next)} className="bg-primary-gradient">
                      → {statusLabels[next]}
                    </Button>
                  )}
                  {o.status !== "cancelado" && o.status !== "finalizado" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(o.id, "cancelado")}>Cancelar</Button>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ProductsPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("category").order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const save = async () => {
    if (!editing?.name || editing.price === undefined || !editing.category) return toast.error("Preencha nome, preço e categoria");
    const payload = {
      name: editing.name, description: editing.description ?? null,
      price: Number(editing.price), category: editing.category as any,
      image_url: editing.image_url ?? null, active: editing.active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Remover produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const toggle = async (p: Product) => {
    await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ active: true, category: "300ml" })} className="bg-primary-gradient gap-2">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-card-soft">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Produto</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Status</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="line-clamp-1 text-xs text-muted-foreground">{p.description}</div>}
                  </td>
                  <td className="p-3"><Badge variant="outline">{categoryLabels[p.category]}</Badge></td>
                  <td className="p-3 font-semibold">{brl(Number(p.price))}</td>
                  <td className="p-3">
                    <button onClick={() => toggle(p)} className={`rounded-full px-2 py-0.5 text-xs ${p.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {p.active ? "Ativo" : "Oculto"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Edit3 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) })} /></div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300ml">300ml</SelectItem>
                      <SelectItem value="500ml">500ml</SelectItem>
                      <SelectItem value="especial">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>URL da imagem (opcional)</Label><Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} className="bg-primary-gradient">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
