import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { CheckoutDialog } from "./checkout-dialog";

export function CartSheet() {
  const { items, setQty, remove, total, open, setOpen } = useCart();
  const [checkout, setCheckout] = useState(false);
  const { isAdding } = useCart();


  return (
    <>
      <AnimatePresence>
        {!open && items.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary-gradient text-white shadow-elegant transition-all hover:scale-110 active:scale-95"
          >
            <div className="relative">
              <ShoppingBag className="h-7 w-7" />
              <AnimatePresence>
                <motion.span
                  key={items.length}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-black text-primary ring-2 ring-white shadow-lg"
                >
                  {items.length}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <Sheet open={open} onOpenChange={setOpen}>

        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="flex items-center gap-2 font-display">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Sua sacola
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-muted text-3xl">🛍️</div>
                <p>Sua sacola está vazia</p>
              </div>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {items.map((i) => (
                    <motion.li
                      key={i.id}
                      layout
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary-gradient text-2xl">
                        {i.image_url ? (
                          <img src={i.image_url} alt={i.name} className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          "🥤"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{i.name}</p>
                        <p className="text-sm font-semibold text-primary">{brl(i.price * i.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.id, i.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.id, i.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => remove(i.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-4 border-t bg-surface p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{brl(total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold">Total</span>
                  <motion.span 
                    key={total}
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-3xl font-black text-primary tracking-tight"
                  >
                    {brl(total)}
                  </motion.span>
                </div>
              </div>
              <Button
                className="w-full bg-primary-gradient h-14 text-lg font-bold shadow-elegant rounded-xl"
                size="lg"
                onClick={() => {
                  setOpen(false);
                  setCheckout(true);
                }}
              >
                Finalizar Pedido
              </Button>
            </div>
          )}

        </SheetContent>
      </Sheet>
      <CheckoutDialog open={checkout} onOpenChange={setCheckout} />
    </>
  );
}
