import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Ticket, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CuponsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const coupons = [
    { code: "VURO10", discount: "10%", subtitle: "OFF", desc: "Primeira compra", color: "text-orange-500" },
    { code: "PRIMEIRA30", discount: "30%", subtitle: "OFF", desc: "Primeira compra", color: "text-red-500" },
    { code: "SNEAKERHEAD", discount: "R$50", subtitle: "OFF", desc: "Compras acima de R$500", color: "text-blue-400" },
    { code: "FRETEVURO", discount: "Frete", subtitle: "Grátis", desc: "Sem valor mínimo", color: "text-green-500" },
    { code: "FRETE300", discount: "Frete", subtitle: "Grátis", desc: "Sem valor mínimo", color: "text-green-500" },
    { code: "ENVIOGRAT", discount: "Frete", subtitle: "Grátis", desc: "Sem valor mínimo", color: "text-green-500" },
    { code: "FRETELIVRE", discount: "Frete", subtitle: "Grátis", desc: "Sem valor mínimo", color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Seus Cupons</h1>
          <p className="text-xl text-gray-400 max-w-2xl">Use os códigos abaixo no checkout para garantir o melhor preço.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-12">
            {coupons.map((coupon, i) => (
              <div key={i} className="bg-gray-900 p-6 rounded-2xl flex flex-col space-y-3">
                <div className="flex flex-col">
                  <span className={`text-3xl font-black ${coupon.color}`}>{coupon.discount}</span>
                  <span className={`text-xl font-black ${coupon.color}`}>{coupon.subtitle}</span>
                </div>
                <p className="text-gray-500 text-sm">{coupon.desc}</p>
                <div className="bg-gray-800 px-4 py-3 rounded-lg flex items-center justify-between mt-auto">
                  <code className="text-sm font-bold text-white">{coupon.code}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => copyToClipboard(coupon.code)}
                    className="h-8 w-8 hover:bg-gray-700"
                  >
                    {copied === coupon.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
