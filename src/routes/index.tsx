import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { Sparkles, Truck, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { CartSheet } from "@/components/cart-sheet";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KL Açaí — Açaí premium na garrafinha" },
      { name: "description", content: "Peça seu açaí na garrafinha 300ml ou 500ml. Entrega rápida e sabor cremoso." },
    ],
  }),
  component: Home,
});

const categories = [
  { key: "all", label: "Todos" },
  { key: "300ml", label: "300ml" },
  { key: "500ml", label: "500ml" },
  { key: "especial", label: "Especiais" },
];

function Home() {
  const [cat, setCat] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("category")
        .order("price");
      if (error) throw error;
      return data;
    },
  });

  const filtered = cat === "all" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold/30 blur-3xl animate-float" />
          <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
        </div>
        <div className="container relative mx-auto grid gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3 text-gold" /> Açaí cremoso, batido na hora
            </div>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] md:text-6xl">
              O melhor açaí <span className="text-gold">na garrafinha</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-primary-foreground/80">
              Sabores irresistíveis, entrega rápida e aquele sabor que você ama. Peça agora.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gold-gradient text-gold-foreground shadow-glow hover:opacity-95">
                <a href="#cardapio">Ver cardápio</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm text-primary-foreground/80">
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> Entrega rápida</span>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-gold" /> Aberto agora</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Retirada disponível</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative hidden items-center justify-center md:flex"
          >
            <div className="text-[14rem] leading-none animate-float drop-shadow-2xl">🍇</div>
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
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  cat === c.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">Nenhum produto nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t bg-surface py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} KL Açaí. Todos os direitos reservados.</p>
          <Link to="/auth" className="hover:text-primary">Área administrativa</Link>
        </div>
      </footer>

      <CartSheet />
    </div>
  );
}
