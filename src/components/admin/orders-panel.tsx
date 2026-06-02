import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, Phone, MapPin, Clock, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { brl, statusLabels } from "@/lib/format";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

type OrderStatus = 'novo' | 'preparando' | 'saiu_entrega' | 'finalizado' | 'cancelado';

export function OrdersPanel() {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 3000
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Status atualizado para ${statusLabels[status]}`);
    setSelectedOrder(null);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const filteredOrders = orders.filter((o: any) => {
    const matchesStatus = filterStatus === 'todos' || o.status === filterStatus;
    const matchesSearch = o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo': return 'bg-primary text-white';
      case 'preparando': return 'bg-amber-500 text-white';
      case 'saiu_entrega': return 'bg-blue-500 text-white';
      case 'finalizado': return 'bg-success text-white';
      case 'cancelado': return 'bg-destructive text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">Monitore e atualize os pedidos em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar pedido ou cliente..." 
              className="pl-10 w-full md:w-[300px] rounded-xl border-none shadow-sm focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {(['todos', 'novo', 'preparando', 'saiu_entrega', 'finalizado', 'cancelado'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(status)}
            className={cn(
              "rounded-full px-4 h-9 font-medium transition-all",
              filterStatus === status ? "bg-primary-gradient border-none shadow-md" : "hover:bg-primary/5"
            )}
          >
            {status === 'todos' ? 'Todos' : statusLabels[status]}
            {status !== 'todos' && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-[10px] h-4 min-w-[16px] p-0 flex items-center justify-center">
                {orders.filter((o: any) => o.status === status).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((o: any) => (
              <motion.div
                layout
                key={o.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Card 
                  className={cn(
                    "group cursor-pointer hover:shadow-elegant transition-all duration-300 border-none relative overflow-hidden h-full flex flex-col",
                    o.status === 'novo' ? "ring-2 ring-primary ring-offset-2" : "bg-white"
                  )}
                  onClick={() => setSelectedOrder(o)}
                >
                  <CardHeader className="pb-3 border-b border-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full uppercase tracking-tighter">
                          {o.order_number}
                        </span>
                        <div className="text-lg font-bold mt-1 group-hover:text-primary transition-colors">{o.customer_name}</div>
                      </div>
                      <Badge className={cn("rounded-full font-medium px-3 py-0.5 text-[10px] uppercase tracking-wider shadow-sm", getStatusColor(o.status))}>
                        {statusLabels[o.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-grow flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <div className={cn("p-1.5 rounded-lg", o.delivery_type === 'entrega' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>
                          {o.delivery_type === 'entrega' ? <Clock className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        </div>
                        {o.delivery_type === 'entrega' ? 'Entrega em domicílio' : 'Retirada na loja'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
                          <Clock className="h-3 w-3" />
                        </div>
                        Há {formatTimeAgo(new Date(o.created_at))}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                      <div className="text-2xl font-black text-primary tracking-tight">{brl(Number(o.total))}</div>
                      <Button variant="ghost" size="sm" className="rounded-full text-xs font-bold bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all">
                        Detalhes
                      </Button>
                    </div>
                  </CardContent>
                  
                  {o.status === 'novo' && (
                    <motion.div 
                      className="absolute top-0 right-0 p-1"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredOrders.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
            <ShoppingBag className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">Nenhum pedido encontrado.</p>
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-[2rem] border-none shadow-elegant p-0 overflow-hidden bg-white">
          {selectedOrder && (
            <div className="flex flex-col h-full max-h-[90vh]">
              <div className="p-8 bg-primary-gradient text-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-2 font-mono">
                      {selectedOrder.order_number}
                    </Badge>
                    <h2 className="text-3xl font-black tracking-tight">{selectedOrder.customer_name}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-70 uppercase tracking-widest font-bold mb-1">Status Atual</div>
                    <Badge className={cn("rounded-full border-none px-4 py-1 font-bold shadow-lg", getStatusColor(selectedOrder.status))}>
                      {statusLabels[selectedOrder.status]}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <a href={`https://wa.me/${selectedOrder.whatsapp.replace(/\D/g, '')}`} target="_blank" className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center gap-2 text-sm font-bold backdrop-blur-sm">
                    <Phone className="h-4 w-4" /> WhatsApp
                  </a>
                  <div className="text-xs opacity-70">
                    <div className="font-bold">{new Date(selectedOrder.created_at).toLocaleDateString()}</div>
                    <div>{new Date(selectedOrder.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Tipo de Pedido</Label>
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <div className="p-2 rounded-xl bg-slate-100">
                        {selectedOrder.delivery_type === 'entrega' ? <Clock className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      </div>
                      {selectedOrder.delivery_type === 'entrega' ? 'Delivery' : 'Retirada'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Pagamento</Label>
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <div className="p-2 rounded-xl bg-slate-100">
                        <Badge variant="outline" className="border-slate-200">PIX/Dinheiro</Badge>
                      </div>
                      Pagar na Entrega
                    </div>
                  </div>
                </div>

                {selectedOrder.delivery_type === 'entrega' && (
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Endereço de Entrega</Label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm font-medium text-slate-600 italic leading-relaxed">
                        {selectedOrder.address}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Itens do Pedido</Label>
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-50">
                      {(selectedOrder.items_preview || []).map((item: any, i: number) => (
                        <div key={i} className="px-6 py-4 flex justify-between items-center bg-white group hover:bg-slate-50 transition-colors">
                          <div className="flex gap-4 items-center">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-primary">
                              {item.quantity}x
                            </div>
                            <span className="font-bold text-slate-700">{item.name}</span>
                          </div>
                          <span className="text-sm font-black text-slate-400">{brl(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-slate-50 flex justify-between items-center border-t border-slate-100">
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total do Pedido</span>
                      <span className="text-3xl font-black text-primary tracking-tight">{brl(Number(selectedOrder.total))}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 no-print">
                  <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Ações Rápidas</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="rounded-2xl h-14 font-bold border-2 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all"
                      onClick={() => updateStatus(selectedOrder.id, 'preparando')}
                    >
                      ⚙️ Preparar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-2xl h-14 font-bold border-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all"
                      onClick={() => updateStatus(selectedOrder.id, 'saiu_entrega')}
                    >
                      🛵 Despachar
                    </Button>
                    <Button 
                      className="col-span-2 rounded-2xl h-16 font-black text-lg bg-success hover:bg-success/90 shadow-lg shadow-success/20 transition-all"
                      onClick={() => updateStatus(selectedOrder.id, 'finalizado')}
                    >
                      ✅ Finalizar Pedido
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="col-span-2 rounded-2xl h-12 font-bold text-destructive hover:bg-destructive/10"
                      onClick={() => updateStatus(selectedOrder.id, 'cancelado')}
                    >
                      ❌ Cancelar
                    </Button>
                  </div>
                </div>

                <Button onClick={() => window.print()} variant="secondary" className="w-full h-14 rounded-2xl gap-3 font-bold no-print bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                  <Printer className="h-5 w-5" /> Imprimir para Cozinha
                </Button>
              </div>

              {/* Print Only View */}
              <div className="print-only fixed inset-0 bg-white p-12 space-y-8 text-black">
                <div className="text-center space-y-2 border-b-2 border-black pb-8">
                  <h1 className="text-4xl font-black tracking-tighter">KL AÇAÍ</h1>
                  <p className="text-sm font-bold uppercase tracking-[0.3em]">Comprovante de Pedido</p>
                  <div className="mt-4 text-6xl font-black">#{selectedOrder.order_number}</div>
                </div>
                
                <div className="grid grid-cols-2 text-lg border-b border-black pb-8">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">Cliente</div>
                      <div className="font-black text-2xl uppercase">{selectedOrder.customer_name}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">Telefone</div>
                      <div className="font-bold">{selectedOrder.whatsapp}</div>
                    </div>
                  </div>
                  <div className="space-y-4 text-right">
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">Data e Hora</div>
                      <div className="font-bold">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">Tipo</div>
                      <Badge className="bg-black text-white px-4 py-1 text-lg font-black">{selectedOrder.delivery_type.toUpperCase()}</Badge>
                    </div>
                  </div>
                </div>

                {selectedOrder.address && (
                  <div className="border-b border-black pb-8">
                    <div className="text-xs font-bold uppercase text-slate-500 mb-2">Endereço de Entrega</div>
                    <div className="text-2xl font-black italic leading-tight uppercase">{selectedOrder.address}</div>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                   <div className="text-xs font-bold uppercase text-slate-500">Itens</div>
                  {(selectedOrder.items_preview || []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-2xl font-bold">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{brl(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-4 border-black pt-8 flex justify-between items-center mt-12">
                  <div className="text-xl font-bold uppercase tracking-widest">Total Geral</div>
                  <div className="text-5xl font-black">{brl(Number(selectedOrder.total))}</div>
                </div>

                <div className="text-center pt-20">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-30">Obrigado pela preferência!</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " anos";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " meses";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " dias";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min";
  return Math.floor(seconds) + " seg";
}
