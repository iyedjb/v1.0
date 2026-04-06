import { useState, useEffect } from "react";
import { Bell, ChevronLeft, Package, Tag, Truck, CheckCircle, Clock, RotateCcw, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import { formatPriceFromCents } from "@/lib/utils";

interface Order {
  id: string;
  userEmail: string;
  userId?: string;
  status: string;
  createdAt: number;
  totalAmount?: number;
  amount?: number;
  price?: number;
  quantity?: number;
  productName?: string;
  items?: { name: string; image: string }[];
  paymentMethod?: string;
  trackingCode?: string;
  refundRequested?: boolean;
  refundStatus?: string;
}

interface Notification {
  id: string;
  type: "order" | "promo" | "delivery" | "refund";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
  icon: "package" | "truck" | "check" | "tag" | "rotate" | "clock";
  color: string;
}

const statusLabel: Record<string, string> = {
  pending: "Pagamento pendente",
  paid: "Pagamento confirmado",
  processing: "Em preparação",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refund_requested: "Reembolso solicitado",
  refunded: "Reembolso aprovado",
};

const getIcon = (status: string): Notification["icon"] => {
  if (status === "shipped") return "truck";
  if (status === "delivered") return "check";
  if (status === "refund_requested" || status === "refunded") return "rotate";
  if (status === "pending") return "clock";
  return "package";
};

const getColor = (status: string): string => {
  if (status === "delivered") return "from-green-400 to-green-600";
  if (status === "shipped") return "from-blue-400 to-blue-600";
  if (status === "refund_requested" || status === "refunded") return "from-purple-400 to-pink-500";
  if (status === "cancelled") return "from-red-400 to-red-600";
  return "from-yellow-400 to-orange-500";
};

const IconComponent = ({ icon }: { icon: Notification["icon"] }) => {
  const props = { size: 22, className: "text-white" };
  if (icon === "truck") return <Truck {...props} />;
  if (icon === "check") return <CheckCircle {...props} />;
  if (icon === "rotate") return <RotateCcw {...props} />;
  if (icon === "clock") return <Clock {...props} />;
  if (icon === "tag") return <Tag {...props} />;
  return <Package {...props} />;
};

const getOrderTotal = (order: Order): number => {
  if (order.totalAmount) return order.totalAmount;
  if (order.amount) return order.amount;
  if (order.price) return order.price * (order.quantity || 1);
  return 0;
};

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const promoNotifications: Notification[] = [
  {
    id: "promo-1",
    type: "promo",
    title: "Frete Grátis disponível!",
    message: "Use o cupom FRETEVURO para frete grátis no seu próximo pedido.",
    time: "Hoje",
    read: false,
    link: "/frete-gratis",
    icon: "tag",
    color: "from-yellow-400 to-orange-500",
  },
];

const Notificacoes = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("vuro_notif_read");
    if (stored) setReadIds(new Set(JSON.parse(stored)));
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const emailToCheck =
          user?.email?.toLowerCase() ||
          localStorage.getItem("vuro_checkout_email")?.toLowerCase();

        let orderNotifs: Notification[] = [];

        if (emailToCheck) {
          const res = await fetch(`/api/orders?email=${encodeURIComponent(emailToCheck)}`);
          if (res.ok) {
            const orders: Order[] = await res.json();
            orderNotifs = orders.map((order) => {
              const firstName = order.items?.[0]?.name || order.productName || "seu produto";
              const total = getOrderTotal(order);
              const statusText = statusLabel[order.status] || "Atualização";
              const label = total > 0 ? ` • ${formatPriceFromCents(total)}` : "";
              return {
                id: `order-${order.id}`,
                type: "order" as const,
                title: statusText,
                message: `Pedido de ${firstName}${label}`,
                time: timeAgo(order.createdAt),
                read: false,
                link: "/meus-pedidos",
                icon: getIcon(order.status),
                color: getColor(order.status),
              };
            });
          }
        }

        setNotifications([...orderNotifs, ...promoNotifications]);
      } catch (err) {
        setNotifications(promoNotifications);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const markRead = (id: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    localStorage.setItem("vuro_notif_read", JSON.stringify([...updated]));
  };

  const markAllRead = () => {
    const all = new Set(notifications.map((n) => n.id));
    setReadIds(all);
    localStorage.setItem("vuro_notif_read", JSON.stringify([...all]));
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to={user ? "/profile" : "/"} className="p-1 -ml-1">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="font-black text-lg uppercase tracking-wide leading-tight">Notificações</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">{unreadCount} não lida{unreadCount !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-yellow-600 hover:text-yellow-700 transition-colors"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
          ))
        ) : notifications.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center mt-6">
            <Bell size={40} className="mx-auto mb-3 text-yellow-500" />
            <p className="font-bold text-gray-800 text-lg">Tudo tranquilo por aqui!</p>
            <p className="text-sm text-gray-500 mt-1">Você não tem notificações no momento</p>
            <Link
              to="/category/all"
              className="inline-flex items-center gap-2 mt-5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-sm px-5 py-2.5 rounded-full transition-colors"
            >
              <ShoppingBag size={16} />
              Explorar produtos
            </Link>
          </div>
        ) : (
          <>
            {notifications.map((notif) => {
              const isRead = readIds.has(notif.id);
              const content = (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    isRead
                      ? "bg-gray-50 border-gray-100"
                      : "bg-white border-yellow-200 shadow-sm"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${notif.color} flex items-center justify-center flex-shrink-0 shadow-md`}
                  >
                    <IconComponent icon={notif.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-bold text-sm leading-tight ${isRead ? "text-gray-500" : "text-gray-900"}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    <p className={`text-xs mt-0.5 ${isRead ? "text-gray-400" : "text-gray-600"}`}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              );

              return notif.link ? (
                <Link to={notif.link} key={notif.id} className="block">
                  {content}
                </Link>
              ) : (
                <div key={notif.id}>{content}</div>
              );
            })}

            <p className="text-center text-xs text-gray-400 pt-2">Todas as notificações</p>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notificacoes;
