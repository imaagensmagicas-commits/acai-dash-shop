import { Link } from "@tanstack/react-router";
import { ShoppingBag, Store, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import loreLogo from "@/assets/lore-acai-logo.jpeg.asset.json";

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
    <header className="sticky top-0 z-50 bg-[#1A0B2E]/80 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link to="/loja" className="flex items-center gap-3">
          <img src={loreLogo.url} alt={storeSettings?.name || "Lore Açaí"} className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/10" />
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-tight text-white">{storeSettings?.name || "Lore Açaí"}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">PREMIUM</div>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {storeSettings?.instagram_url && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-white hover:bg-white/10 rounded-xl"
            >
              <a href={storeSettings.instagram_url} target="_blank" rel="noopener noreferrer" title="@lore_acai">
                <Instagram className="h-5 w-5" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setOpen(true)}
            className="relative gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl px-6 h-11 transition-all"
          >
          <ShoppingBag className="h-5 w-5" />
          <span className="font-bold">Sacola</span>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-[12px] font-black text-gold-foreground shadow-lg border-2 border-[#1A0B2E]"
            >
              {count}
            </motion.span>
          )}
          </Button>
        </div>
      </div>
    </header>
  );
}
