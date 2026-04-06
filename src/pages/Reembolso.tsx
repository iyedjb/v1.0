import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Package, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

interface Order {
  id: string;
  productName: string;
  productImage: string;
  size: string;
  price: number;
  amount?: number;
  status: string;
  createdAt: number;
  userEmail: string;
  userId?: string;
}

const Reembolso = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("pedido");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      const checkoutEmail = localStorage.getItem("vuro_checkout_email");
      const emailToCheck = user?.email?.toLowerCase() || checkoutEmail?.toLowerCase();
      
      if (!emailToCheck) return;
      
      try {
        const response = await fetch(`/api/orders?email=${encodeURIComponent(emailToCheck)}`);
        const data = await response.json();
        
        const userOrders = Array.isArray(data) 
          ? data.filter((order: Order) => order.status !== "delivered")
                .sort((a: Order, b: Order) => b.createdAt - a.createdAt)
          : [];
        
        setOrders(userOrders);
        
        if (orderId) {
          const found = userOrders.find((o: Order) => o.id === orderId);
          if (found) setSelectedOrder(found);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    
    fetchOrders();
  }, [user, orderId]);

  const handleSubmit = async () => {
    if (!selectedOrder || !reason.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          userId: user?.uid || "guest",
          userEmail: selectedOrder.userEmail,
          productName: selectedOrder.productName,
          productImage: selectedOrder.productImage,
          size: selectedOrder.size,
          amount: selectedOrder.amount || selectedOrder.price,
          reason: reason.trim()
        })
      });
      
      setSuccess(true);
      toast({ title: "Solicitacao enviada!", description: "Vamos analisar seu pedido de reembolso." });
    } catch (error) {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 pb-24">
        <div className="bg-white border-b p-4 flex items-center gap-3">
          <button onClick={() => navigate("/mais")} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Reembolso</h1>
        </div>
        
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Solicitacao Enviada!</h2>
          <p className="text-gray-500 text-center mb-6">
            Sua solicitacao de reembolso foi enviada com sucesso. 
            Nossa equipe vai analisar e entrar em contato em ate 3 dias uteis.
          </p>
          <Button onClick={() => navigate("/meus-pedidos")} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            Ver Meus Pedidos
          </Button>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white border-b p-4 flex items-center gap-3">
        <button onClick={() => navigate("/mais")} className="p-1">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Solicitar Reembolso</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            Selecione o pedido e descreva o motivo do reembolso. Nossa equipe analisara em ate 3 dias uteis.
          </p>
        </div>

        <div className="bg-white rounded-xl p-4">
          <h3 className="font-bold mb-3">Selecione o pedido</h3>
          {orders.length > 0 ? (
            <div className="space-y-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedOrder?.id === order.id 
                      ? 'border-yellow-500 bg-yellow-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {order.productImage ? (
                      <img src={order.productImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={24} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm line-clamp-1">{order.productName}</p>
                    <p className="text-xs text-gray-500">Tam: {order.size}</p>
                    <p className="text-sm font-bold text-yellow-600">
                      R$ {((order.amount || order.price || 0) / 100).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  {selectedOrder?.id === order.id && (
                    <Check size={20} className="text-yellow-600" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Nenhum pedido elegivel para reembolso</p>
          )}
        </div>

        {selectedOrder && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-bold mb-3">Motivo do reembolso</h3>
            <Textarea
              placeholder="Descreva o motivo pelo qual voce deseja o reembolso..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!selectedOrder || !reason.trim() || loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
        >
          {loading ? "Enviando..." : "Enviar Solicitacao"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Reembolso;
