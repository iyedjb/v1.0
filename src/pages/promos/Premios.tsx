import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Gift, Star, Award } from "lucide-react";

export default function PremiosPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Gift className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Prêmios VURO</h1>
          <p className="text-xl text-gray-400 max-w-2xl">Acumule pontos em cada compra e troque por sneakers exclusivos, descontos e acesso antecipado a drops.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-12">
            {[
              { icon: Star, title: "Nível Bronze", desc: "5% cashback em pontos" },
              { icon: Award, title: "Nível Prata", desc: "10% cashback + Frete Grátis" },
              { icon: Gift, title: "Nível Ouro", desc: "Acesso antecipado a Drops Raros" },
            ].map((card, i) => (
              <div key={i} className="bg-black border border-yellow-400/20 p-8 rounded-2xl hover:border-yellow-400 transition-colors">
                <card.icon className="w-8 h-8 text-yellow-400 mb-4" />
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
