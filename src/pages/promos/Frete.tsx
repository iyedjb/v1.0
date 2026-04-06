import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Truck, ShieldCheck, Clock } from "lucide-react";

export default function FretePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Frete Grátis VURO</h1>
          <p className="text-xl text-gray-400 max-w-2xl">Compre acima de R$300 e receba seus produtos com frete por nossa conta em todo o Brasil.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-12">
            {[
              { icon: Clock, title: "Entrega Rápida", desc: "Processamento em até 24h" },
              { icon: ShieldCheck, title: "Seguro Total", desc: "Sua compra protegida até a entrega" },
              { icon: Truck, title: "Rastreio Live", desc: "Acompanhe cada passo do seu pedido" },
            ].map((card, i) => (
              <div key={i} className="bg-black border border-emerald-500/20 p-8 rounded-2xl hover:border-emerald-500 transition-colors">
                <card.icon className="w-8 h-8 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                <p className="text-gray-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
