export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const statusLabels: Record<string, string> = {
  novo: "Novo",
  preparando: "Preparando",
  saiu_entrega: "Saiu para entrega",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const categoryLabels: Record<string, string> = {
  "300ml": "300ml",
  "500ml": "500ml",
  especial: "Especial",
};
