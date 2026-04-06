import { Truck, CheckCircle, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/header/Header";
import BottomNav from "@/components/BottomNav";

const FreteGratis = () => {
  const benefits = [
    { icon: Truck, title: "Entrega Garantida", desc: "Receba em 7 a 15 dias úteis" },
    { icon: MapPin, title: "Todo o Brasil", desc: "Enviamos para qualquer lugar" },
    { icon: Clock, title: "Rastreamento", desc: "Acompanhe seu pedido em tempo real" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-24">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 md:p-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2">FRETE GRÁTIS</h1>
            <p className="text-white/80 text-lg">Em compras acima de R$ 300</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {benefits.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 text-center shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon size={24} className="text-green-600" />
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-4">Como funciona?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Compre acima de R$ 300</p>
                  <p className="text-sm text-gray-500">Some os produtos no carrinho até atingir o valor mínimo</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Frete zerado automaticamente</p>
                  <p className="text-sm text-gray-500">O desconto é aplicado no checkout</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">Receba em casa</p>
                  <p className="text-sm text-gray-500">Entrega em todo o Brasil</p>
                </div>
              </div>
            </div>
          </div>

          <Link 
            to="/category/sneakers" 
            className="block w-full bg-green-500 text-white text-center font-bold py-4 rounded-xl hover:bg-green-600 transition-colors"
          >
            COMEÇAR A COMPRAR
          </Link>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default FreteGratis;
