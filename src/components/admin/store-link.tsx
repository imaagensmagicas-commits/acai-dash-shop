import { useState, useEffect } from "react";
import { Link, Copy, ExternalLink, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

export function StoreLinkSection() {
  const [storeUrl, setStoreUrl] = useState("");

  useEffect(() => {
    setStoreUrl(`${window.location.origin}/loja`);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success("Link copiado com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Link da Loja</h1>
        <p className="text-muted-foreground">Compartilhe este link com seus clientes para que eles possam acessar seu catálogo.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="h-full shadow-card-soft border-none bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-primary" />
                URL de Acesso
              </CardTitle>
              <CardDescription>O endereço digital da sua loja.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 font-mono text-sm break-all">
                {storeUrl}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={copyToClipboard} variant="outline" className="rounded-xl gap-2 border-slate-200">
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </Button>
                <Button asChild className="rounded-xl gap-2 bg-primary-gradient border-none">
                  <a href="/loja" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Abrir Loja
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full shadow-card-soft border-none bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                QR Code
              </CardTitle>
              <CardDescription>Imprima ou mostre para acesso rápido.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-b-2xl">
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                {storeUrl && (
                  <QRCodeSVG 
                    value={storeUrl} 
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Aponte a câmera do celular para abrir a loja instantaneamente.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
