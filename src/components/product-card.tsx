import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { useCart } from "@/lib/cart";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
}

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    add({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20, 
        delay: Math.min(index * 0.03, 0.3) 
      }}
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-card-soft transition-all duration-300 hover:shadow-elegant"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <motion.img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-primary-gradient/10 text-primary/20">
            <ShoppingBag size={48} />
          </div>
        )}
        <div className="absolute right-1.5 top-1.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-primary backdrop-blur sm:right-2 sm:top-2 sm:px-2 sm:text-[10px]">
          {product.category}
        </div>
      </div>
      
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2">
        <div className="flex-1">
          <h3 className="line-clamp-2 font-display text-[14px] font-bold leading-tight text-slate-800 sm:text-base">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground sm:text-xs italic">
              {product.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2 pt-2 mt-auto">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">a partir de</div>
            <div className="font-display text-base font-black text-primary tracking-tight sm:text-lg">{brl(product.price)}</div>
          </div>
          
          <Button
            size="icon"
            onClick={handleAdd}
            className={`h-10 w-10 shrink-0 rounded-full shadow-lg transition-all duration-300 ${
              justAdded ? "bg-success text-white hover:bg-success" : "bg-primary-gradient hover:scale-110"
            }`}
            aria-label="Adicionar"
          >
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Plus className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
