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
      
      const todayOrders = (orders ?? []).filter((o) => new Date(o.created_at) >= today);
      const monthOrders = (orders ?? []).filter((o) => new Date(o.created_at) >= monthStart);
      const todaySales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
      const totalRevenue = (orders ?? []).reduce((s, o) => s + Number(o.total), 0);
      const active = (orders ?? []).filter((o) => !["finalizado", "cancelado"].includes(o.status)).length;

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
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua operação hoje.</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary animate-pulse font-medium bg-primary/5 px-3 py-1">
          Tempo Real Ativo
        </Badge>
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
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#64748b' }}
                  />
                  <ChartTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="url(#colorPurple)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.4}/>
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
          <Card className="shadow-elegant border-none bg-primary-gradient text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={120} />
            </div>
            <CardHeader><CardTitle className="text-white">Resumo Financeiro</CardTitle></CardHeader>
            <CardContent className="flex flex-col justify-center items-center h-[240px] relative z-10">
              <div className="text-xs uppercase opacity-70 tracking-[0.2em] font-medium">Faturamento Total</div>
              <div className="text-5xl font-bold mt-2 tracking-tight">{brl(data?.totalRevenue || 0)}</div>
              <div className="mt-10 grid grid-cols-2 gap-8 w-full">
                <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-[10px] uppercase opacity-70 tracking-widest font-bold">Ticket Médio</div>
                  <div className="text-lg font-bold mt-1">{brl((data?.totalRevenue || 0) / (data?.total || 1))}</div>
                </div>
                <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="text-[10px] uppercase opacity-70 tracking-widest font-bold">Conversão</div>
                  <div className="text-lg font-bold mt-1">100%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="shadow-card-soft border-none hover:shadow-elegant transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
