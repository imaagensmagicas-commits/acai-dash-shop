import { Link } from "@tanstack/react-router";
import { ShoppingBag, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { count, setOpen, isAdding } = useCart();
  
  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("slug", "loja")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/loja" className="flex items-center gap-2">
          {storeSettings?.logo_url ? (
            <img src={storeSettings.logo_url} alt={storeSettings.name} className="h-9 w-9 rounded-xl object-cover shadow-elegant" />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-gradient text-primary-foreground font-display font-bold shadow-elegant">
              {storeSettings?.name?.substring(0, 2).toUpperCase() || "KL"}
            </div>
          )}
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">{storeSettings?.name || "KL Açaí"}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">na garrafinha</div>
          </div>
        </Link>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className={`relative gap-2 border-primary/20 hover:border-primary transition-all ${isAdding ? "scale-110 border-gold shadow-[0_0_15px_rgba(251,191,36,0.3)]" : ""}`}
        >
          <ShoppingBag className={`h-4 w-4 ${isAdding ? "animate-bounce" : ""}`} />
          <span className="hidden sm:inline">Sacola</span>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-gold-foreground shadow-md"
            >
              {count}
            </motion.span>
          )}
        </Button>
      </div>
    </header>
  );
}
