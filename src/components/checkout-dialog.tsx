import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShoppingBag, User, MapPin, Check, ChevronLeft, ChevronRight, MessageSquare, Home, Trash2, Plus, Minus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

type Step = "review" | "details" | "summary" | "success";

export function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { items, total, clear, setQty, remove } = useCart();
  const [step, setStep] = useState<Step>("review");
  const [type, setType] = useState<"entrega" | "retirada">("entrega");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Configurable delivery fee
  const deliveryFee = type === "entrega" ? 5 : 0;
  const finalTotal = total + deliveryFee;

  const reset = () => {
    setName("");
    setPhone("");
    setAddress("");
    setNotes("");
    setType("entrega");
    setStep("review");
    setOrderId("");
  };

  const nextStep = () => {
    if (step === "review") {
      if (items.length === 0) return toast.error("Seu carrinho está vazio");
      setStep("details");
    } else if (step === "details") {
      if (!name.trim() || !phone.trim()) return toast.error("Preencha nome e WhatsApp");
      if (type === "entrega" && !address.trim()) return toast.error("Informe o endereço de entrega");
      setStep("summary");
    }
  };

  const prevStep = () => {
    if (step === "details") setStep("review");
    else if (step === "summary") setStep("details");
  };

  const submit = async () => {
    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_name: name.trim(),
          whatsapp: phone.trim(),
          address: type === "entrega" ? address.trim() : null,
          notes: notes.trim() || null,
          delivery_type: type,
          items_preview: items.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity
          })),
          total: finalTotal,
        })
        .select("id, sequential_id")
        .single();
      
      if (error) throw error;

      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          unit_price: i.price,
          quantity: i.quantity,
        })),
      );
      if (itemsErr) throw itemsErr;

      setOrderId(`LA-${String(order.sequential_id || order.id.slice(0, 4)).padStart(4, '0')}`);
      setStep("success");
      clear();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const message = `Olá! Acabei de fazer o pedido ${orderId} no site.`;
    window.open(`https://wa.me/5588999999999?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-xl overflow-hidden p-0 sm:rounded-2xl">
        <div className="flex flex-col h-[90vh] sm:h-auto max-h-[90vh]">
          {/* Header */}
          <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">Finalizar Pedido</h3>
              {step !== "success" && (
                <p className="text-sm text-muted-foreground">
                  {step === "review" && "Revise seus itens"}
                  {step === "details" && "Seus dados de contato"}
                  {step === "summary" && "Confira tudo antes de enviar"}
                </p>
              )}
            </div>
            {step !== "success" && (
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      (i === 1 && step === "review") ||
                      (i === 2 && step === "details") ||
                      (i === 3 && step === "summary")
                        ? "bg-primary"
                        : i < (step === "review" ? 1 : step === "details" ? 2 : 3)
                        ? "bg-primary/40"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {step === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {items.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <ShoppingBag className="mx-auto h-12 w-12 opacity-20 mb-3" />
                      <p>Sua sacola está vazia</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 py-3">
                          <div className="h-14 w-14 rounded-lg bg-accent overflow-hidden">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xl">🥤</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                            <p className="text-primary font-bold">{brl(item.price * item.quantity)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-muted rounded-full p-1">
                              <button
                                onClick={() => setQty(item.id, item.quantity - 1)}
                                className="h-7 w-7 rounded-full hover:bg-background flex items-center justify-center transition"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                              <button
                                onClick={() => setQty(item.id, item.quantity + 1)}
                                className="h-7 w-7 rounded-full hover:bg-background flex items-center justify-center transition"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => remove(item.id)}
                              className="p-2 text-muted-foreground hover:text-destructive transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold text-lg">{brl(total)}</span>
                  </div>
                </motion.div>
              )}

              {step === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                    <button
                      type="button"
                      onClick={() => setType("entrega")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
                        type === "entrega" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      <MapPin className="h-4 w-4" /> Entrega
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("retirada")}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
                        type === "retirada" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      <Home className="h-4 w-4" /> Retirada
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" /> Nome completo
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João Silva"
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" /> WhatsApp
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="rounded-xl h-12"
                      />
                    </div>
                    {type === "entrega" && (
                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" /> Endereço completo
                        </Label>
                        <Textarea
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Rua, número, bairro e ponto de referência"
                          className="rounded-xl resize-none"
                          rows={3}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações (opcional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Sem cebola, tirar troco para R$ 50..."
                        className="rounded-xl resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "summary" && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border p-4 bg-muted/20 space-y-3">
                    <h4 className="font-bold flex items-center gap-2">
                      <Check className="h-4 w-4 text-success" /> Resumo dos Dados
                    </h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Cliente:</span> {name}</p>
                      <p><span className="text-muted-foreground">Contato:</span> {phone}</p>
                      <p><span className="text-muted-foreground">Tipo:</span> {type === 'entrega' ? 'Entrega' : 'Retirada'}</p>
                      {type === 'entrega' && <p><span className="text-muted-foreground">Endereço:</span> {address}</p>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold">Produtos</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                          <span className="font-medium">{brl(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{brl(total)}</span>
                    </div>
                    {type === 'entrega' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de entrega</span>
                        <span>{brl(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-display font-bold text-lg">Total Final</span>
                      <span className="font-display font-bold text-2xl text-primary">{brl(finalTotal)}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-10 text-center"
                >
                  <div className="h-20 w-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h3 className="font-display text-3xl font-bold mb-2">Pedido Recebido!</h3>
                  <p className="text-muted-foreground mb-6">
                    Seu pedido foi registrado com sucesso sob o ID <span className="font-bold text-foreground">{orderId}</span>.
                  </p>
                  
                  <div className="w-full space-y-3">
                    <Button 
                      onClick={openWhatsApp}
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white h-14 rounded-xl text-lg font-bold gap-2"
                    >
                      <MessageSquare className="h-5 w-5" /> Falar no WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                      className="w-full h-14 rounded-xl text-lg font-bold"
                    >
                      Voltar ao Cardápio
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {step !== "success" && (
            <div className="border-t p-6 bg-muted/10">
              <div className="flex gap-3">
                {step !== "review" && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={loading}
                    className="h-14 px-6 rounded-xl"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                {step !== "summary" ? (
                  <Button
                    onClick={nextStep}
                    className="flex-1 bg-primary-gradient h-14 rounded-xl text-lg font-bold gap-2"
                  >
                    Próximo passo <ChevronRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    onClick={submit}
                    disabled={loading}
                    className="flex-1 bg-primary-gradient h-14 rounded-xl text-lg font-bold gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>Confirmar Pedido • {brl(finalTotal)}</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
