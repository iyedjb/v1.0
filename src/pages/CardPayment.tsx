import { useState, useEffect, useRef } from "react";
import { Check, CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  price: number;
  quantity: number;
}

const CardPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);
  const hasSaved = useRef(false);
  
  const paymentData = location.state as {
    cardLast4: string;
    cardBrand: string;
    total: number;
    customerName: string;
    customerEmail: string;
    items: CartItem[];
  } | null;

  const saveOrder = async () => {
    if (hasSaved.current || !paymentData?.items || paymentData.items.length === 0) {
      return;
    }
    
    hasSaved.current = true;
    
    try {
      for (const item of paymentData.items) {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.uid || null,
            userEmail: paymentData.customerEmail,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            size: item.size,
            price: item.price,
            quantity: item.quantity,
            amount: item.price * item.quantity,
            status: "card_pending",
            paymentMethod: "card",
            cardBrand: paymentData.cardBrand,
            cardLast4: paymentData.cardLast4
          })
        });
        if (!response.ok) {
          throw new Error('Failed to save order');
        }
      }

      localStorage.setItem("vuro_checkout_email", paymentData.customerEmail);
      setOrderSaved(true);
    } catch (error) {
      console.error("Error saving order:", error);
      hasSaved.current = false;
      toast({ title: "Erro", description: "Erro ao salvar pedido. Tente novamente.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!paymentData) {
      navigate("/checkout");
      return;
    }

    const timer = setTimeout(async () => {
      setIsProcessing(false);
      setIsSuccess(true);
      await saveOrder();
    }, 3000);

    return () => clearTimeout(timer);
  }, [paymentData, navigate]);

  if (!paymentData) {
    return null;
  }

  const handleGoToOrders = () => {
    navigate("/meus-pedidos");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="p-4 border-b border-zinc-800">
        <Link to="/checkout" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {isProcessing ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
                <Loader2 size={40} className="text-yellow-500 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Processando pagamento...</h2>
              <p className="text-zinc-400">Aguarde enquanto confirmamos seu pagamento</p>
              
              <div className="mt-8 p-4 bg-zinc-900 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard size={24} className="text-zinc-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">{paymentData.cardBrand}</p>
                    <p className="text-sm text-zinc-500">**** **** **** {paymentData.cardLast4}</p>
                  </div>
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total</span>
                    <span className="text-yellow-500 font-bold">
                      R$ {(paymentData.total / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Pagamento Confirmado!</h2>
              <p className="text-zinc-400 mb-6">Seu pedido foi confirmado com sucesso</p>
              
              <div className="p-4 bg-zinc-900 rounded-xl mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard size={24} className="text-green-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{paymentData.cardBrand}</p>
                    <p className="text-sm text-zinc-500">**** **** **** {paymentData.cardLast4}</p>
                  </div>
                </div>
                <div className="border-t border-zinc-800 pt-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total pago</span>
                    <span className="text-green-500 font-bold">
                      R$ {(paymentData.total / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGoToOrders}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-12 rounded-xl"
                data-testid="button-go-to-orders"
              >
                Ver Meus Pedidos
              </Button>
              
              <Link to="/" className="block mt-4 text-zinc-400 hover:text-white text-sm">
                Continuar comprando
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CardPayment;
