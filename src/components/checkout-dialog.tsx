import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { items, total, clear } = useCart();
  const [type, setType] = useState<"entrega" | "retirada">("entrega");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setName(""); setPhone(""); setAddress(""); setNotes(""); setType("entrega"); setDone(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!name.trim() || !phone.trim()) return toast.error("Preencha nome e telefone");
    if (type === "entrega" && !address.trim()) return toast.error("Informe o endereço de entrega");

    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          customer_name: name.trim(),
          phone: phone.trim(),
          address: type === "entrega" ? address.trim() : null,
          notes: notes.trim() || null,
          delivery_type: type,
          total,
        })
        .select("id")
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

      setDone(true);
      clear();
      setTimeout(() => {
        onOpenChange(false);
        reset();
      }, 2500);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-md">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <h3 className="font-display text-2xl font-bold">Pedido recebido!</h3>
            <p className="text-sm text-muted-foreground">Em breve entraremos em contato. Obrigado!</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Finalizar pedido</DialogTitle>
              <DialogDescription>Total: <span className="font-semibold text-primary">{brl(total)}</span></DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("entrega")}
                  className={`rounded-xl border-2 p-3 text-sm font-medium transition ${type === "entrega" ? "border-primary bg-accent text-primary" : "border-border"}`}
                >
                  🛵 Entrega
                </button>
                <button
                  type="button"
                  onClick={() => setType("retirada")}
                  className={`rounded-xl border-2 p-3 text-sm font-medium transition ${type === "retirada" ? "border-primary bg-accent text-primary" : "border-border"}`}
                >
                  🏪 Retirada
                </button>
              </div>
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
              </div>
              <div>
                <Label htmlFor="phone">WhatsApp</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="(00) 00000-0000" required />
              </div>
              {type === "entrega" && (
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} required />
                </div>
              )}
              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} rows={2} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary-gradient" size="lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirmar pedido • ${brl(total)}`}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
