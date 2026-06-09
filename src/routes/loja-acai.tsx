import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Truck, Clock, MapPin, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { CartSheet } from "@/components/cart-sheet";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/loja-acai")({
  head: () => ({
    meta: [
      { title: "KL Açaí — Açaí premium na garrafinha" },
      { name: "description", content: "Peça seu açaí na garrafinha 300ml ou 500ml. Entrega rápida e sabor cremoso." },
    ],
  }),
  component: Home,
});

function Home() {
  const [cat, setCat] = useState("all");

  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("slug", "loja")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return [{ id: "all", name: "Todos" }, ...data];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = cat === "all" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="min-h-screen bg-background">
      {storeSettings?.primary_color && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${storeSettings.primary_color};
          }
        ` }} />
      )}
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground min-h-[85vh] flex items-center">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl animate-float" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 py-12 md:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md border border-white/10 mb-6">
              <Sparkles className="h-4 w-4 text-gold" /> 
              <span className="text-white/90">Açaí cremoso premium</span>
            </div>
            
            <h1 className="font-display text-5xl font-bold leading-[1.1] md:text-7xl lg:text-8xl tracking-tight">
              Açaí na <br />
              <span className="text-white">garrafinha,</span> <br />
              <span className="text-gold">do seu jeito.</span>
            </h1>
            
            <p className="mt-8 max-w-lg text-lg md:text-xl text-white/70 leading-relaxed font-sans">
              Escolha o tamanho, monte com seus sabores favoritos e receba em minutos. Ou retire no local.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-2xl h-14 px-8 text-base font-bold bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-xl transition-all hover:scale-105 active:scale-95">
                <a href="#cardapio">Ver cardápio</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl h-14 px-8 text-base font-bold bg-white/5 border-white/20 hover:bg-white/10 text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
                <a href="#como-funciona">Como funciona</a>
              </Button>
            </div>
            
            <div className="mt-16 flex flex-wrap gap-8 text-sm font-medium text-white/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/5 border border-white/10">
                  <Truck className="h-4 w-4 text-gold" />
                </div>
                <span>Entrega rápida</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/5 border border-white/10">
                  <Clock className="h-4 w-4 text-gold" />
                </div>
                <span>Pronto em 15min</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/5 border border-white/10">
                  <Sparkles className="h-4 w-4 text-gold" />
                </div>
                <span>Sabores ilimitados</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cardápio */}
      <section id="cardapio" className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Cardápio</h2>
            <p className="mt-1 text-muted-foreground">Escolha o tamanho e o sabor</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c: any) => (
              <button
                key={c.id || c.name}
                onClick={() => setCat(c.name === "Todos" ? "all" : c.name)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  (cat === "all" && c.name === "Todos") || cat === c.name
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">Nenhum produto nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/5 bg-[#1A0B2E] py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-3">
              {storeSettings?.logo_url ? (
                <img src="/logo.jpeg" alt={storeSettings.name} className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/10" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#A855F7] text-white font-display font-bold">
                  {storeSettings?.name?.substring(0, 2).toUpperCase() || "KL"}
                </div>
              )}
              <div className="text-left leading-tight">
                <div className="font-display text-xl font-bold text-white tracking-tight">{storeSettings?.name || "KL Açaí"}</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">PREMIUM</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-white/60 max-w-sm text-sm">
                O melhor açaí na garrafinha da região. Qualidade premium e sabor inigualável em cada gota.
              </p>
              {storeSettings?.instagram_url && (
                <a 
                  href={storeSettings.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/80 hover:text-gold transition-colors font-bold text-lg"
                >
                  <Instagram className="h-6 w-6" />
                  @kl_acai2026
                </a>
              )}
            </div>

            <div className="pt-8 border-t border-white/5 w-full text-xs text-white/40">
              <p>© {new Date().getFullYear()} {storeSettings?.name || "KL Açaí"}. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>

      <CartSheet />
      
      {/* Floating WhatsApp Button */}
      {storeSettings?.whatsapp_number && (
        <a 
          href={`https://wa.me/${storeSettings.whatsapp_number.replace(/\D/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-110 active:scale-95"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
