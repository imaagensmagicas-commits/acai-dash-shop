import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit3, Trash2, GripVertical, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function CategoriesPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("order_index");
      return data ?? [];
    },
  });

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryData = {
      name: editing.name,
      order_index: editing.order_index ?? categories.length
    };

    const { error } = editing.id
      ? await supabase.from("categories").update(categoryData).eq("id", editing.id)
      : await supabase.from("categories").insert([categoryData]);

    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Categoria atualizada!" : "Categoria criada!");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Categoria removida!");
    setIsDeleting(null);
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Organize seu cardápio em seções.</p>
        </div>
        <Button 
          onClick={() => setEditing({ name: "", order_index: categories.length })} 
          className="bg-primary-gradient rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {categories.map((c: any, index: number) => (
            <motion.div
              layout
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="overflow-hidden border-none shadow-card-soft group hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical className="text-slate-300 cursor-grab" />
                    <div>
                      <h3 className="font-bold text-slate-800">{c.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Ordem: {c.order_index}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setEditing(c)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsDeleting(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {categories.length === 0 && !isLoading && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <Package className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 font-medium">Nenhuma categoria cadastrada.</p>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-elegant">
          <div className="p-6 bg-primary-gradient text-white">
            <DialogTitle className="text-2xl font-black">{editing?.id ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </div>
          
          <form onSubmit={saveCategory} className="p-6 space-y-5 bg-white">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Nome da Categoria</Label>
              <Input 
                placeholder="Ex: 300ml, Adicionais, Combos" 
                value={editing?.name ?? ""} 
                onChange={(e) => setEditing({...editing, name: e.target.value})} 
                className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Posição (Ordem)</Label>
              <Input 
                type="number"
                value={editing?.order_index ?? 0} 
                onChange={(e) => setEditing({...editing, order_index: parseInt(e.target.value)})} 
                className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
                required 
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" className="bg-primary-gradient rounded-xl font-bold px-8 shadow-lg shadow-primary/20">Salvar Categoria</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-8 border-none shadow-elegant text-center">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Trash2 size={32} />
          </div>
          <DialogTitle className="text-xl font-black mb-2">Remover Categoria?</DialogTitle>
          <p className="text-muted-foreground text-sm mb-8">Esta ação removerá apenas a categoria. Os produtos associados precisarão de uma nova categoria.</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl font-bold" onClick={() => isDeleting && deleteCategory(isDeleting)}>Sim, Remover</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
