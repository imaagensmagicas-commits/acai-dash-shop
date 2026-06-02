import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, TrendingUp, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { brl } from "@/lib/format";
import { motion } from "framer-motion";

export function Dashboard() {
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
      
      const ordersSafe = orders ?? [];
      const itemsSafe = items ?? [];

      const todayOrders = ordersSafe.filter((o) => new Date(o.created_at) >= today);
      const monthOrders = ordersSafe.filter((o) => new Date(o.created_at) >= monthStart);
      
      const todaySales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
      const totalRevenue = ordersSafe.reduce((s, o) => s + Number(o.total), 0);
      const active = ordersSafe.filter((o) => !["finalizado", "cancelado"].includes(o.status)).length;

      const productCounts: Record<string, number> = {};
      itemsSafe.forEach((i) => {
        productCounts[i.product_name] = (productCounts[i.product_name] || 0) + i.quantity;
      });
      const topProducts = Object.entries(productCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return { total: ordersSafe.length, todaySales, todayCount: todayOrders.length, active, monthCount: monthOrders.length, totalRevenue, topProducts };
    },
    refetchInterval: 5000
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Resumo completo da sua operação em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-primary border-primary animate-pulse font-medium bg-primary/5 px-3 py-1">
            Tempo Real Ativo
          </Badge>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pedidos hoje" value={data?.todayCount ?? 0} icon={ShoppingBag} delay={0} />
        <StatCard label="Vendas hoje" value={brl(data?.todaySales ?? 0)} icon={TrendingUp} delay={0.1} />
        <StatCard label="Pedidos ativos" value={data?.active ?? 0} icon={Package} delay={0.2} />
        <StatCard label="Total no mês" value={data?.monthCount ?? 0} icon={ShoppingBag} delay={0.3} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-elegant border-none bg-white">
            <CardHeader><CardTitle className="text-lg">Produtos mais vendidos (Top 5)</CardTitle></CardHeader>
            <CardContent className="h-[300px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topProducts || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748b', fontWeight: 600 }}
                  />
                  <YAxis 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748b', fontWeight: 600 }}
                  />
                  <ChartTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="url(#colorPurple)" 
                    radius={[8, 8, 0, 0]} 
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <defs>
                    <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-elegant border-none bg-primary-gradient text-white overflow-hidden relative h-full">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={120} />
            </div>
            <CardHeader><CardTitle className="text-white">Resumo Financeiro</CardTitle></CardHeader>
            <CardContent className="flex flex-col justify-center items-center h-full min-h-[240px] relative z-10 pb-8">
              <div className="text-xs uppercase opacity-70 tracking-[0.2em] font-medium">Faturamento Total</div>
              <div className="text-5xl font-bold mt-2 tracking-tight">{brl(data?.totalRevenue || 0)}</div>
              <div className="mt-10 grid grid-cols-2 gap-4 w-full">
                <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-[10px] uppercase opacity-70 tracking-widest font-bold">Ticket Médio</div>
                  <div className="text-lg font-bold mt-1">{brl((data?.totalRevenue || 0) / (data?.total || 1))}</div>
                </div>
                <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-[10px] uppercase opacity-70 tracking-widest font-bold">Total Pedidos</div>
                  <div className="text-lg font-bold mt-1">{data?.total || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-card-soft border-none bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Ranking de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {(data?.topProducts || []).map((product: any, i: number) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                      #{i + 1}
                    </div>
                    <span className="font-bold text-slate-700">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">{product.value} vendas</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-medium">Quantidade total</div>
                    </div>
                  </div>
                </div>
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  Nenhum dado de vendas ainda.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card-soft border-none bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Dicas de Gestão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                🚀 <strong>Dica:</strong> Seus combos estão vendendo bem? Considere criar novos para aumentar o ticket médio.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                📱 <strong>Dica:</strong> Mantenha seu WhatsApp atualizado nas configurações para facilitar o contato dos clientes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 100, damping: 20 }}
    >
      <Card className="shadow-card-soft border-none hover:shadow-elegant transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{label}</CardTitle>
          <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary-gradient group-hover:text-white transition-colors duration-300">
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-3xl font-black tracking-tight text-slate-800"
          >
            {value}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
