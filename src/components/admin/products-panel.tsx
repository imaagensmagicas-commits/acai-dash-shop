import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit3, Trash2, Search, Package, Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 365 * 10; // 10 years

async function uploadProductImage(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: "image/webp",
  });
  const ext = "webp";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(path, compressed, { contentType: "image/webp", upsert: false });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data) throw error ?? new Error("Falha ao gerar URL");
  return data.signedUrl;
}

function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/product-images\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function ProductsPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("name");
      return data ?? [];
    },
  });

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: editing.name,
      price: Number(editing.price),
      category: editing.category,
      description: editing.description,
      image_url: editing.image_url,
      active: editing.active ?? true
    };

    const { error } = editing.id
      ? await supabase.from("products").update(productData).eq("id", editing.id)
      : await supabase.from("products").insert([productData]);

    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Produto atualizado!" : "Produto criado!");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("products").update({ active: !currentStatus }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto removido!");
    setIsDeleting(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Cardápio</h1>
          <p className="text-muted-foreground">Gerencie seus produtos, preços e disponibilidade.</p>
        </div>
        <Button 
          onClick={() => setEditing({ name: "", price: 0, category: "300ml", active: true, description: "", image_url: "" })} 
          className="bg-primary-gradient rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar no cardápio..." 
          className="pl-10 rounded-xl border-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {filteredProducts.map((p: any) => (
            <motion.div
              layout
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="overflow-hidden border-none shadow-card-soft group hover:shadow-elegant transition-all duration-300">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={40} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge className={p.active ? "bg-success" : "bg-slate-400"}>
                      {p.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 line-clamp-1">{p.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{p.category}</p>
                    </div>
                    <div className="text-lg font-black text-primary">{brl(Number(p.price))}</div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setEditing(p)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsDeleting(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground">{p.active ? 'VISÍVEL' : 'OCULTO'}</span>
                      <Switch 
                        checked={p.active} 
                        onCheckedChange={() => toggleVisibility(p.id, p.active)}
                        className="scale-75 data-[state=checked]:bg-success"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <Package className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 font-medium">Nenhum produto cadastrado.</p>
        </div>
      )}

      {/* Product Edit/Create Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-elegant">
          <div className="p-6 bg-primary-gradient text-white">
            <DialogTitle className="text-2xl font-black">{editing?.id ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription className="text-white/70">Preencha as informações do item no cardápio.</DialogDescription>
          </div>
          
          <form onSubmit={saveProduct} className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Nome do Produto</Label>
              <Input 
                placeholder="Ex: Açaí 500ml com Morango" 
                value={editing?.name ?? ""} 
                onChange={(e) => setEditing({...editing, name: e.target.value})} 
                className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Preço (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={editing?.price ?? 0} 
                  onChange={(e) => setEditing({...editing, price: e.target.value})} 
                  className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Categoria</Label>
                <Select value={editing?.category} onValueChange={(v) => setEditing({...editing, category: v})}>
                  <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300ml">300ml</SelectItem>
                    <SelectItem value="500ml">500ml</SelectItem>
                    <SelectItem value="especial">Especial / Sabores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">URL da Imagem</Label>
              <Input 
                placeholder="https://..." 
                value={editing?.image_url ?? ""} 
                onChange={(e) => setEditing({...editing, image_url: e.target.value})} 
                className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Descrição (Opcional)</Label>
              <Textarea 
                placeholder="Descreva o que vem no produto..." 
                value={editing?.description ?? ""} 
                onChange={(e) => setEditing({...editing, description: e.target.value})} 
                className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all min-h-[100px]"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <div className="text-sm font-bold">Produto Ativo</div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium">Visível para clientes</div>
              </div>
              <Switch 
                checked={editing?.active ?? true} 
                onCheckedChange={(v) => setEditing({...editing, active: v})}
                className="data-[state=checked]:bg-success"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" className="bg-primary-gradient rounded-xl font-bold px-8 shadow-lg shadow-primary/20">Salvar Produto</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-8 border-none shadow-elegant text-center">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Trash2 size={32} />
          </div>
          <DialogTitle className="text-xl font-black mb-2">Remover Produto?</DialogTitle>
          <p className="text-muted-foreground text-sm mb-8">Esta ação não pode ser desfeita. O produto será removido permanentemente do cardápio.</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl font-bold" onClick={() => isDeleting && deleteProduct(isDeleting)}>Sim, Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
