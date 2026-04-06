import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, ShoppingBag, ArrowLeft } from "lucide-react";
import CheckoutHeader from "../components/header/CheckoutHeader";
import Footer from "../components/footer/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { db } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";

interface PaymentVerification {
  success: boolean;
  paymentStatus: string;
  customerEmail: string;
  amountTotal: number;
}

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items } = useCart();
  const [verification, setVerification] = useState<PaymentVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ordersSavedRef = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('Sessão de pagamento não encontrada');
      setLoading(false);
      return;
    }

    // Prevent duplicate order creation
    if (ordersSavedRef.current) {
      setLoading(false);
      return;
    }

    // Check if orders already saved for this session
    const savedSessionKey = `orders_saved_${sessionId}`;
    if (sessionStorage.getItem(savedSessionKey)) {
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/checkout/verify/${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
          setVerification(data);
          
          // Get cart items from localStorage before they're cleared
          const cartItemsStr = localStorage.getItem('vuro_cart_items');
          const cartItems = cartItemsStr ? JSON.parse(cartItemsStr) : items;
          
          // Save ONE order with all items
          if (cartItems.length > 0 && !ordersSavedRef.current) {
            ordersSavedRef.current = true;
            sessionStorage.setItem(savedSessionKey, 'true');
            
            // Calculate total
            const totalAmount = cartItems.reduce((sum: number, item: any) => 
              sum + Math.round(item.price * item.quantity * 100), 0);
            
            // Create items array for the order
            const orderItems = cartItems.map((item: any) => ({
              productId: item.productId,
              name: item.name,
              image: item.image,
              size: item.size || "Único",
              price: Math.round(item.price * 100),
              quantity: item.quantity
            }));
            
            // Pull any saved checkout info from localStorage
            let checkoutInfo: any = {};
            try {
              const saved = localStorage.getItem('vuro_checkout_info');
              if (saved) checkoutInfo = JSON.parse(saved);
            } catch {}

            try {
              // Save email so "Meus Pedidos" can find this order
              const orderEmail = user?.email || data.customerEmail;
              if (orderEmail) localStorage.setItem("vuro_checkout_email", orderEmail);

              await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user?.uid || null,
                  userEmail: orderEmail,
                  firstName: checkoutInfo.firstName || '',
                  lastName: checkoutInfo.lastName || '',
                  phone: checkoutInfo.phone || '',
                  shippingAddress: checkoutInfo.address || '',
                  city: checkoutInfo.city || '',
                  postalCode: checkoutInfo.postalCode || '',
                  items: orderItems,
                  totalAmount: totalAmount,
                  status: "card_pending",
                  paymentMethod: "card",
                  stripeSessionId: sessionId
                })
              });

              // Notify admin
              const customerName = `${checkoutInfo.firstName || ''} ${checkoutInfo.lastName || ''}`.trim() || data.customerEmail;
              const totalBRL = (totalAmount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              try {
                const notifRef = push(ref(db, "admin_notifications"));
                await set(notifRef, {
                  type: "new_order",
                  title: "💳 Novo pedido no Cartão!",
                  message: `${customerName} — ${totalBRL} — via Cartão`,
                  createdAt: Date.now(),
                  read: false
                });
              } catch {}
            } catch (err) {
              console.error('Error saving order:', err);
            }
          }
          
        } else {
          setError('Pagamento não foi concluído');
        }
      } catch (err) {
        setError('Erro ao verificar pagamento');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />
      
      <main className="pt-12 pb-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          {loading ? (
            <div className="py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Verificando pagamento...</p>
            </div>
          ) : error ? (
            <div className="py-24">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-foreground mb-4">
                Erro no Pagamento
              </h1>
              <p className="text-muted-foreground mb-8">{error}</p>
              <Button 
                onClick={() => navigate('/checkout')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-black uppercase tracking-[0.2em]"
                data-testid="button-try-again"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : verification?.success ? (
            <div className="py-24">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-foreground mb-4">
                Pedido Concluído!
              </h1>
              <p className="text-muted-foreground mb-2">
                Obrigado pela sua compra!
              </p>
              <p className="text-muted-foreground mb-8">
                Enviamos um e-mail de confirmação para <strong>{verification.customerEmail}</strong>
              </p>
              
              <div className="bg-muted/20 p-6 rounded-none mb-8">
                <p className="text-lg font-medium text-foreground">
                  Total Pago: {verification.amountTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-continue-shopping"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Continuar Comprando
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
