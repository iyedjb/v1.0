import { CreditCard, ChevronLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Pagamentos = () => {
  const paymentMethods = [
    { icon: CreditCard, label: "Cartão de Crédito", desc: "Até 12x sem juros" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/mais" className="p-1">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-lg font-bold">Pagamentos</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Meus Cartões</h2>
          <div className="bg-white rounded-xl p-6 text-center">
            <CreditCard size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-600">Nenhum cartão salvo</p>
            <p className="text-sm text-gray-400 mt-1">Seus cartões serão salvos automaticamente após uma compra</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Métodos Aceitos</h2>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            {paymentMethods.map((method, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 border-b last:border-0">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <method.icon size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">{method.label}</p>
                  <p className="text-xs text-gray-500">{method.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-sm font-medium text-yellow-800">Seus dados estão seguros</p>
          <p className="text-xs text-yellow-600 mt-1">Todas as transações são criptografadas e processadas com segurança pelo Stripe.</p>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Pagamentos;
