import { Package, Clock, CheckCircle, Truck, ChevronLeft, ChevronDown, ChevronUp, MapPin, Box, RotateCcw, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

interface OrderItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items?: OrderItem[];
  totalAmount?: number;
  productName?: string;
  productImage?: string;
  size?: string;
  price?: number;
  amount?: number;
  quantity?: number;
  status: string;
  createdAt: number;
  estimatedDelivery?: string;
  trackingCode?: string;
  deliveryDate?: string;
  refundRequested?: boolean;
  refundStatus?: string;
  refundReason?: string;
  paymentMethod?: string;
}

// Helper functions
const getOrderItems = (order: Order): OrderItem[] => {
  if (order.items && order.items.length > 0) {
    return order.items;
  }
  return [{
    productId: order.id,
    name: order.productName || "Produto",
    image: order.productImage || "",
    size: order.size || "Único",
    price: order.price || order.amount || 0,
    quantity: order.quantity || 1
  }];
};

const getOrderTotal = (order: Order): number => {
  if (order.totalAmount) return order.totalAmount;
  if (order.amount) return order.amount;
  if (order.price) return order.price * (order.quantity || 1);
  return 0;
};

const MeusPedidos = () => {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundModal, setRefundModal] = useState<{ open: boolean; orderId: string | null }>({ open: false, orderId: null });
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const refundReasons = [
    "Nao gostei do produto",
    "Produto diferente da foto",
    "Tamanho errado",
    "Produto com defeito",
    "Chegou danificado",
    "Nao era o que eu esperava",
    "Outro motivo"
  ];

  const fetchOrders = async () => {
    const checkoutEmail = localStorage.getItem("vuro_checkout_email");
    const userEmail = user?.email || checkoutEmail;
    
    if (!userEmail) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      setOrders(Array.isArray(data)
        ? data
            .filter((o: Order) => o.status !== "pix_pending" && o.status !== "card_pending" && o.status !== "cancelled")
            .sort((a: Order, b: Order) => b.createdAt - a.createdAt)
        : []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!refundModal.orderId || !refundReason) {
      toast({ title: "Erro", description: "Selecione um motivo para o reembolso", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const order = orders.find(o => o.id === refundModal.orderId);
      if (!order) throw new Error("Pedido nao encontrado");

      const orderItems = getOrderItems(order);
      const orderTotal = getOrderTotal(order);
      
      await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundModal.orderId,
          userId: user?.uid,
          userEmail: user?.email || localStorage.getItem("vuro_checkout_email"),
          items: orderItems,
          productName: orderItems.map(i => i.name).join(", "),
          productImage: orderItems[0]?.image || "",
          size: orderItems.map(i => i.size).join(", "),
          amount: orderTotal,
          reason: refundReason
        })
      });

      await fetch(`/api/orders/${refundModal.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundRequested: true,
          refundStatus: "pending",
          refundReason: refundReason
        })
      });

      toast({ title: "Solicitacao enviada", description: "Seu pedido de reembolso foi enviado. Aguarde a analise." });
      setRefundModal({ open: false, orderId: null });
      setRefundReason("");
      fetchOrders();
    } catch (error) {
      console.error("Refund error:", error);
      toast({ title: "Erro", description: "Nao foi possivel enviar a solicitacao", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 15s to pick up admin status changes
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "Aguardando",
      confirmed: "Confirmado",
      shipped: "Enviado",
      transit: "Em transito",
      delivered: "Entregue"
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "delivered": return <CheckCircle size={18} className="text-green-500" />;
      case "transit": 
      case "shipped": return <Truck size={18} className="text-blue-500" />;
      default: return <Clock size={18} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "delivered": return "bg-green-100 text-green-700 border-green-200";
      case "transit": 
      case "shipped": return "bg-blue-100 text-blue-700 border-blue-200";
      case "confirmed": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const getTrackingSteps = (status: string) => {
    const allSteps = [
      { status: "Pedido confirmado", icon: Box, key: "confirmed" },
      { status: "Enviado para transportadora", icon: Package, key: "shipped" },
      { status: "Em transito", icon: Truck, key: "transit" },
      { status: "Entregue", icon: CheckCircle, key: "delivered" },
    ];
    
    const statusOrder = ["pending", "confirmed", "shipped", "transit", "delivered"];
    const currentIndex = statusOrder.indexOf(status);
    
    return allSteps.map((step, idx) => ({
      ...step,
      completed: currentIndex >= idx + 1
    }));
  };

  const getEstimatedDelivery = (createdAt: number, status: string, deliveryDate?: string) => {
    if (status === "delivered") return null;
    if (deliveryDate) return deliveryDate;
    const estimatedDate = new Date(createdAt + 5 * 24 * 60 * 60 * 1000);
    return estimatedDate.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/mais" className="p-1">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold">Meus Pedidos</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => {
            const orderItems = getOrderItems(order);
            const orderTotal = getOrderTotal(order);
            return (
            <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400">Pedido #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm font-bold text-yellow-600">
                    R$ {(orderTotal / 100).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">Tam: {item.size} | Qtd: {item.quantity}x</p>
                        <p className="text-xs text-gray-400">
                          {(item.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`mt-4 p-3 rounded-lg border ${getStatusColor(order.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="font-bold text-sm">{getStatusText(order.status)}</span>
                    </div>
                    {order.status !== "delivered" && getEstimatedDelivery(order.createdAt, order.status, order.deliveryDate) && (
                      <span className="text-xs font-medium">
                        Chega dia {getEstimatedDelivery(order.createdAt, order.status, order.deliveryDate)}
                      </span>
                    )}
                  </div>
                  {order.status !== "delivered" && getEstimatedDelivery(order.createdAt, order.status, order.deliveryDate) && (
                    <p className="text-xs mt-1 opacity-80">
                      Previsão: {getEstimatedDelivery(order.createdAt, order.status, order.deliveryDate)}
                    </p>
                  )}
                  {order.status === "delivered" && (
                    <p className="text-xs mt-1 opacity-80">
                      Entregue com sucesso
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600 font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors border"
                  >
                    {expandedOrder === order.id ? (
                      <>Ocultar rastreio <ChevronUp size={16} /></>
                    ) : (
                      <>Ver rastreio <ChevronDown size={16} /></>
                    )}
                  </button>
                  
                  {order.refundRequested ? (
                    <div className={`flex items-center gap-1 text-sm font-medium py-2 px-4 rounded-lg ${
                      order.refundStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      order.refundStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      <RotateCcw size={14} />
                      {order.refundStatus === 'approved' ? 'Aprovado' :
                       order.refundStatus === 'rejected' ? 'Negado' : 'Em analise'}
                    </div>
                  ) : order.status !== "cancelled" && order.status !== "pending" ? (
                    <button 
                      onClick={() => setRefundModal({ open: true, orderId: order.id })}
                      className="flex items-center justify-center gap-1 text-sm text-red-600 font-medium py-2 px-4 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    >
                      <RotateCcw size={16} />
                      Reembolso
                    </button>
                  ) : null}
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="border-t bg-gray-50 p-4">
                  {order.trackingCode && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-1">
                        <Truck size={12} /> Codigo de Rastreio
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-lg font-bold text-blue-800">{order.trackingCode}</p>
                        <a 
                          href={`https://www.linkcorreios.com.br/?id=${order.trackingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium"
                          data-testid={`link-track-${order.id}`}
                        >
                          Rastrear
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Historico de rastreio
                  </h4>
                  <div className="space-y-0">
                    {getTrackingSteps(order.status).map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            step.completed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            <step.icon size={14} />
                          </div>
                          {idx < 3 && (
                            <div className={`w-0.5 h-8 ${
                              step.completed ? 'bg-green-300' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className={`font-medium text-sm ${
                            step.completed ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.status}
                          </p>
                          <p className="text-xs text-gray-500">
                            {step.completed ? "Concluido" : "Aguardando"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );})
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium text-gray-600">Nenhum pedido ainda</p>
            <p className="text-sm text-gray-400 mb-4">Quando voce comprar, seus pedidos aparecerao aqui</p>
            <Link to="/" className="text-yellow-600 font-bold text-sm">
              VER PRODUTOS
            </Link>
          </div>
        )}
      </div>
      
      {refundModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg">Solicitar Reembolso</h2>
              <button 
                onClick={() => { setRefundModal({ open: false, orderId: null }); setRefundReason(""); }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Por que voce quer devolver este produto?
              </p>
              
              <div className="space-y-2">
                {refundReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setRefundReason(reason)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      refundReason === reason 
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-800' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{reason}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleRefundRequest}
                  disabled={!refundReason || submitting}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Enviando..." : "Confirmar Solicitacao"}
                </button>
                <button
                  onClick={() => { setRefundModal({ open: false, orderId: null }); setRefundReason(""); }}
                  className="w-full py-3 text-gray-600 font-medium"
                >
                  Cancelar
                </button>
              </div>
              
              <p className="text-xs text-gray-400 text-center mt-4">
                Apos a solicitacao, nossa equipe analisara seu pedido em ate 3 dias uteis.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default MeusPedidos;
