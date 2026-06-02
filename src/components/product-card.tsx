import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-card-soft transition-shadow hover:shadow-elegant"
    >
      <div className="relative aspect-square overflow-hidden bg-primary-gradient">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl">🥤</div>
        )}
        <div className="absolute right-1.5 top-1.5 rounded-full bg-background/90 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-primary backdrop-blur sm:right-2 sm:top-2 sm:px-2 sm:text-[10px]">
          {product.category}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3">
        <div className="flex-1">
          <h3 className="line-clamp-2 font-display text-[13px] font-semibold leading-tight sm:text-sm">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
              {product.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">a partir de</div>
            <div className="font-display text-base font-bold text-primary sm:text-lg">{brl(product.price)}</div>
          </div>
          <Button
            size="icon"
            onClick={handleAdd}
            className={`h-9 w-9 shrink-0 rounded-full shadow-md transition-all ${justAdded ? "bg-success text-white hover:bg-success" : ""}`}
            aria-label="Adicionar"
          >
            {justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
