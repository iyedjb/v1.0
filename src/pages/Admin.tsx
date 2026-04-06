import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { cn, formatPriceFromCents } from "@/lib/utils";
import { useProducts, clearProductsCache } from "@/hooks/use-products";
import { ref, push, set, onValue, remove, update } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  Users,
  BarChart3,
  TrendingUp,
  Wallet,
  Image as ImageIcon,
  Tag,
  Eye,
  ShoppingBag,
  ChevronRight,
  Home,
  Settings,
  LogOut,
  Menu,
  Bell,
  Filter,
  MoreVertical,
  Check,
  XCircle,
  Zap,
  Star,
  Clock,
  DollarSign,
  Truck,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, AlertTriangle, Activity, UserCircle, CreditCard, Percent } from "lucide-react";

const ADMIN_EMAILS = ["louayjbara2025@gmail.com", "sassisawsen2024@gmail.com"];
const BRANDS = [
  "Nike",
  "Adidas",
  "New Balance",
  "Jordan",
  "Yeezy",
  "Puma",
  "Reebok",
  "Mizuno",
  "Oakley",
];
const CATEGORIES = [
  { value: "nike", label: "Nike" },
  { value: "adidas", label: "Adidas" },
  { value: "new-balance", label: "New Balance" },
  { value: "puma", label: "Puma" },
  { value: "mizuno", label: "Mizuno" },
  { value: "oakley", label: "Oakley" },
  { value: "sneakers", label: "Outros Tênis" },
  { value: "apparel", label: "Vestuário" },
  { value: "accessories", label: "Acessórios" },
  { value: "limited", label: "Limited Edition" },
];

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  active: boolean;
  createdAt: number;
}

interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

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
  status: "pix_pending" | "card_pending" | "pending" | "confirmed" | "shipped" | "transit" | "delivered" | "cancelled";
  createdAt: number;
  estimatedDelivery?: string;
  trackingCode?: string;
  deliveryDate?: string;
  color?: string;
  colorName?: string;
  quantity?: number;
  shippingAddress?: string | ShippingAddress;
  stripeSessionId?: string;
  paymentMethod?: string;
}

interface GroupedOrder {
  sessionId: string;
  userEmail: string;
  userId: string | null;
  status: "pix_pending" | "card_pending" | "pending" | "confirmed" | "shipped" | "transit" | "delivered" | "cancelled";
  createdAt: number;
  totalAmount: number;
  items: Order[];
  trackingCode?: string;
  deliveryDate?: string;
}

interface Refund {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  productName: string;
  productImage: string;
  size: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  processedAt?: number;
  adminNote?: string;
}

type TabType =
  | "dashboard"
  | "products"
  | "add"
  | "offers"
  | "orders"
  | "refunds"
  | "customers"
  | "settings";

const Admin = () => {
  const { products: firebaseProducts, loading: productsLoading } =
    useProducts() as { products: any[]; loading: boolean };
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const { toast } = useToast();
  const { logout, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<
    { color: string; sizes: string; image: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [securityVerified, setSecurityVerified] = useState(false);

  const fetchLocalProducts = async () => {
    try {
      clearProductsCache();
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setLocalProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch local products:", error);
    }
  };

  useEffect(() => {
    fetchLocalProducts();
  }, []);

  const productsMap = new Map<string, any>();
  [...localProducts, ...firebaseProducts].forEach((p) => {
    if (!productsMap.has(String(p.id))) {
      productsMap.set(String(p.id), p);
    }
  });
  const products = Array.from(productsMap.values());

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    setSecurityVerified(true);

    const logAccess = async () => {
      try {
        const logsRef = ref(db, "admin_access_logs");
        const newLogRef = push(logsRef);
        await set(newLogRef, {
          email: user.email,
          timestamp: Date.now(),
          action: "login",
          userAgent: navigator.userAgent,
          date: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to log admin access:", error);
      }
    };
    logAccess();
  }, [authLoading, isAdmin, navigate, toast, user]);

  useEffect(() => {
    if (!isAdmin) return;
    const logsRef = ref(db, "admin_access_logs");
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsList = Object.entries(data)
          .map(([key, value]: [string, any]) => ({ ...value, id: key }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20);
        setAccessLogs(logsList);
      }
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    discount: "",
  });
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [storeSettings, setStoreSettings] = useState({ freeShipping: false, standardShippingCost: 2500, expressShippingCost: 1500, overnightShippingCost: 3500 });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s && typeof s === 'object' && !Array.isArray(s)) setStoreSettings(prev => ({ ...prev, ...s }));
    }).catch(() => {});
  }, []);

  const saveStoreSettings = async (updated: typeof storeSettings) => {
    setSavingSettings(true);
    try {
      await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      setStoreSettings(updated);
      toast({ title: 'Configurações salvas!' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };
  
  // Get order total amount (handles both old and new format)
  const getOrderTotal = (order: Order): number => {
    if (order.totalAmount) {
      return order.totalAmount;
    }
    if (order.amount) {
      return order.amount;
    }
    if (order.price) {
      return order.price * (order.quantity || 1);
    }
    return 0;
  };

  // Get order items (handles both old and new format)
  const getOrderItems = (order: Order): OrderItem[] => {
    if (order.items && order.items.length > 0) {
      return order.items;
    }
    // Old format - single item
    return [{
      productId: order.id,
      name: order.productName || "Produto",
      image: order.productImage || "",
      size: order.size || "Único",
      price: order.price || order.amount || 0,
      quantity: order.quantity || 1
    }];
  };

  // Each order is now a single entry (no grouping needed)
  const displayOrders = React.useMemo(() => {
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  }, [orders]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readOrderIds, setReadOrderIds] = useState<Set<string>>(new Set());

  // Polling-based new order detection (independent of Firebase)
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstOrderLoad = useRef(true);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // Derive notifications directly from orders (no Firebase dependency)
  const notifications = React.useMemo(() => {
    return orders
      .filter((o) => ["pix_pending", "card_pending", "pending"].includes(o.status))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((o) => {
        const name = o.customerName || o.userEmail?.split("@")[0] || "Cliente";
        const total = ((o.totalAmount || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        let title = "";
        let message = "";
        if (o.status === "pix_pending") {
          title = "💛 PIX aguardando confirmação";
          message = `${name} — ${total}`;
        } else if (o.status === "card_pending") {
          title = "💳 Cartão aguardando confirmação";
          message = `${name} — ${total}`;
        } else {
          title = "📦 Pedido aguardando envio";
          message = `${name} — ${total}`;
        }
        return { id: o.id, title, message, createdAt: o.createdAt, status: o.status, type: "new_order", read: readOrderIds.has(o.id) };
      });
  }, [orders, readOrderIds]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markNotificationAsRead = (notificationId: string) => {
    setReadOrderIds((prev) => new Set([...prev, notificationId]));
  };

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadOrderIds((prev) => new Set([...prev, ...allIds]));
  };

  const fetchRefunds = async () => {
    try {
      const response = await fetch("/api/refunds");
      const data = await response.json();
      setRefunds(
        Array.isArray(data)
          ? data.sort((a: Refund, b: Refund) => b.createdAt - a.createdAt)
          : [],
      );
    } catch (error) {
      console.error("Error fetching refunds:", error);
    }
  };

  useEffect(() => {
    fetchRefunds();
    const interval = setInterval(fetchRefunds, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefundAction = async (
    refundId: string,
    orderId: string,
    userId: string,
    action: "approved" | "rejected",
  ) => {
    try {
      if (action === "approved") {
        // Trigger real Stripe refund
        const stripeRes = await fetch(`/api/refunds/${refundId}/stripe-refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const stripeData = await stripeRes.json();
        if (!stripeRes.ok) {
          toast({
            title: "Erro ao processar reembolso",
            description: stripeData.error || "Tente novamente ou acesse dashboard.stripe.com",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Reembolso Processado no Stripe",
          description: `Reembolso enviado ao cliente. ID: ${stripeData.stripeRefundId}`,
        });
      } else {
        // Just mark as rejected
        await fetch(`/api/refunds/${refundId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected", processedAt: Date.now() }),
        });
        await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refundStatus: "rejected" }),
        });
        toast({
          title: "Reembolso Negado",
          description: "O status foi atualizado.",
        });
      }
      fetchRefunds();
    } catch (error) {
      console.error("Error processing refund:", error);
      toast({
        title: "Erro",
        description: "Nao foi possivel processar o reembolso",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const offersRef = ref(db, "offers");
    const unsubscribe = onValue(offersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const offersList = Object.entries(data).map(
          ([key, value]: [string, any]) => ({
            ...value,
            id: key,
          }),
        );
        setOffers(offersList);
      } else {
        setOffers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      if (!Array.isArray(data)) return;

      const sorted = data.sort((a: Order, b: Order) => b.createdAt - a.createdAt);
      setOrders(sorted);

      if (isFirstOrderLoad.current) {
        // On first load, seed known IDs silently
        data.forEach((o: Order) => knownOrderIdsRef.current.add(o.id));
        isFirstOrderLoad.current = false;
      } else {
        // Detect brand-new orders that require attention
        const newPending = data.filter(
          (o: Order) =>
            !knownOrderIdsRef.current.has(o.id) &&
            (o.status === "pix_pending" || o.status === "card_pending")
        );
        newPending.forEach((o: Order) => {
          knownOrderIdsRef.current.add(o.id);
          const isPix = o.status === "pix_pending";
          const totalBRL = ((o.totalAmount || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          playNotificationSound();
          toast({
            title: isPix ? "🟡 Novo Pedido PIX!" : "💳 Novo Pedido no Cartão!",
            description: `${o.userEmail} — ${totalBRL} — aguardando confirmação`,
            duration: 8000,
          });
          // Browser notification if permitted
          if (Notification.permission === "granted") {
            new Notification(isPix ? "Novo Pedido PIX!" : "Novo Pedido no Cartão!", {
              body: `${o.userEmail} — ${totalBRL}`,
            });
          }
        });
        // Also mark any other new orders as known
        data.forEach((o: Order) => knownOrderIdsRef.current.add(o.id));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (orders.length === 0) {
      setAnalytics((prev) => ({
        ...prev,
        salesCount: 0,
        revenue: 0,
        salesTrend: null,
        revenueTrend: null,
      }));
      return;
    }

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

    const activeOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "pix_pending" && o.status !== "card_pending");

    const thisWeekOrders = activeOrders.filter((o) => o.createdAt >= oneWeekAgo);
    const lastWeekOrders = activeOrders.filter(
      (o) => o.createdAt >= twoWeeksAgo && o.createdAt < oneWeekAgo
    );

    const thisWeekRevenue = thisWeekOrders.reduce(
      (acc, o) => acc + getOrderTotal(o),
      0
    );
    const lastWeekRevenue = lastWeekOrders.reduce(
      (acc, o) => acc + getOrderTotal(o),
      0
    );

    const salesTrend =
      lastWeekOrders.length > 0
        ? Math.round(
            ((thisWeekOrders.length - lastWeekOrders.length) /
              lastWeekOrders.length) *
              100
          )
        : null;
    const revenueTrend =
      lastWeekRevenue > 0
        ? Math.round(
            ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
          )
        : null;

    const totalRevenue = activeOrders.reduce((acc, order) => {
      return acc + getOrderTotal(order);
    }, 0);

    setAnalytics((prev) => ({
      ...prev,
      salesCount: activeOrders.length,
      revenue: totalRevenue,
      salesTrend,
      revenueTrend,
    }));
  }, [orders]);

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.title || !offerForm.discount) {
      toast({
        title: "Erro",
        description: "Preencha título e desconto.",
        variant: "destructive",
      });
      return;
    }
    try {
      if (editingOfferId) {
        await update(ref(db, `offers/${editingOfferId}`), {
          ...offerForm,
          updatedAt: Date.now(),
        });
        toast({ title: "Sucesso", description: "Oferta atualizada!" });
      } else {
        const offersRef = ref(db, "offers");
        const newOfferRef = push(offersRef);
        await set(newOfferRef, {
          ...offerForm,
          active: true,
          createdAt: Date.now(),
        });
        toast({ title: "Sucesso", description: "Oferta criada!" });
      }
      setOfferForm({ title: "", description: "", discount: "" });
      setEditingOfferId(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar oferta.",
        variant: "destructive",
      });
    }
  };

  const toggleOfferActive = async (offer: Offer) => {
    try {
      await update(ref(db, `offers/${offer.id}`), { active: !offer.active });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar.",
        variant: "destructive",
      });
    }
  };

  const deleteOffer = async (id: string) => {
    if (window.confirm("Excluir esta oferta?")) {
      try {
        await remove(ref(db, `offers/${id}`));
        toast({ title: "Sucesso", description: "Oferta removida!" });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao excluir.",
          variant: "destructive",
        });
      }
    }
  };

  const editOffer = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setOfferForm({
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
    });
  };

  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [deliveryDateInput, setDeliveryDateInput] = useState("");
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(
    null,
  );
  const [trackingCodeInput, setTrackingCodeInput] = useState("");

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, updatedAt: Date.now() }),
      });
      toast({ title: "Sucesso", description: "Status do pedido atualizado!" });
      fetchOrders();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar pedido.",
        variant: "destructive",
      });
    }
  };

  const updateTrackingCode = async (orderId: string) => {
    if (!trackingCodeInput.trim()) {
      toast({
        title: "Erro",
        description: "Digite um codigo de rastreio.",
        variant: "destructive",
      });
      return;
    }
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingCode: trackingCodeInput.trim(),
          updatedAt: Date.now(),
        }),
      });
      toast({ title: "Sucesso", description: "Codigo de rastreio salvo!" });
      setEditingTrackingId(null);
      setTrackingCodeInput("");
      fetchOrders();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar codigo.",
        variant: "destructive",
      });
    }
  };

  const updateDeliveryDate = async (orderId: string) => {
    if (!deliveryDateInput.trim()) {
      toast({ title: "Erro", description: "Digite a data de entrega.", variant: "destructive" });
      return;
    }
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryDate: deliveryDateInput.trim(), updatedAt: Date.now() }),
      });
      toast({ title: "Sucesso", description: "Data de entrega salva!" });
      setEditingDeliveryId(null);
      setDeliveryDateInput("");
      fetchOrders();
    } catch {
      toast({ title: "Erro", description: "Falha ao salvar data.", variant: "destructive" });
    }
  };

  const getOrderStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pix_pending: "Aguard. PIX",
      card_pending: "Aguard. Cartão",
      pending: "Pendente",
      confirmed: "Confirmado",
      shipped: "Enviado",
      transit: "Em trânsito",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pix_pending: "bg-yellow-100 text-yellow-800",
      card_pending: "bg-purple-100 text-purple-800",
      pending: "bg-amber-100 text-amber-700",
      confirmed: "bg-blue-100 text-blue-700",
      shipped: "bg-violet-100 text-violet-700",
      transit: "bg-orange-100 text-orange-700",
      delivered: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-600";
  };

  const addVariant = () => {
    setVariants([...variants, { color: "", sizes: "", image: "" }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: "color" | "sizes" | "image",
    value: string,
  ) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleVariantImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({
          title: "Imagem muito grande",
          description: "Máximo 1MB por imagem.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateVariant(index, "image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    price: "",
    material: "",
    dimensions: "",
    weight: "",
    editorsNotes: "",
    description: "",
    productDetails: "",
    careCleaning: "",
    category: "nike",
    sizes: "",
    availableSizes: "",
    colors: "",
    freeShipping: false,
  });
  const [images, setImages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [analytics, setAnalytics] = useState({
    visits: 0,
    salesCount: 0,
    revenue: 0,
    chartData: [] as any[],
    visitsTrend: null as number | null,
    salesTrend: null as number | null,
    revenueTrend: null as number | null,
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (p.brand?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesBrand =
      brandFilter === "all" ||
      (p.brand?.toLowerCase() || "") === brandFilter.toLowerCase();
    return matchesSearch && matchesBrand;
  });

  const customerData = React.useMemo(() => {
    const map: Record<string, { email: string; orders: number; totalSpent: number; lastOrder: number }> = {};
    orders.filter((o) => o.status !== "cancelled" && o.status !== "pix_pending" && o.status !== "card_pending").forEach((o) => {
      const email = o.userEmail || "desconhecido";
      if (!map[email]) {
        map[email] = { email, orders: 0, totalSpent: 0, lastOrder: 0 };
      }
      map[email].orders++;
      map[email].totalSpent += getOrderTotal(o);
      if (o.createdAt > map[email].lastOrder) map[email].lastOrder = o.createdAt;
    });
    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const topBrands = React.useMemo(() => {
    const map: Record<string, { brand: string; revenue: number; count: number }> = {};
    orders.filter((o) => o.status !== "cancelled" && o.status !== "pix_pending" && o.status !== "card_pending").forEach((o) => {
      const items = getOrderItems(o);
      items.forEach((item) => {
        const prod = products.find((p) => String(p.id) === String(item.productId));
        const brand = prod?.brand || "Outros";
        if (!map[brand]) map[brand] = { brand, revenue: 0, count: 0 };
        map[brand].revenue += item.price * item.quantity;
        map[brand].count += item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders, products]);

  useEffect(() => {
    const visitsRef = ref(db, "analytics/visits");
    const unsubscribeVisits = onValue(visitsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const visits = Object.values(data) as any[];
        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

        const thisWeekVisits = visits.filter(
          (v: any) => v.timestamp >= oneWeekAgo,
        ).length;
        const lastWeekVisits = visits.filter(
          (v: any) => v.timestamp >= twoWeeksAgo && v.timestamp < oneWeekAgo,
        ).length;
        const visitsTrend =
          lastWeekVisits > 0
            ? Math.round(
                ((thisWeekVisits - lastWeekVisits) / lastWeekVisits) * 100,
              )
            : null;

        const grouped = visits.reduce((acc: any, curr: any) => {
          const timestamp = curr.timestamp;
          if (!timestamp) return acc;
          const date = new Date(timestamp).toLocaleDateString("pt-BR");
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(grouped)
          .map(([name, visits]) => ({
            name,
            visits: Number(visits),
          }))
          .sort((a, b) => {
            const [dayA, monthA, yearA] = a.name.split("/").map(Number);
            const [dayB, monthB, yearB] = b.name.split("/").map(Number);
            return (
              new Date(yearA, monthA - 1, dayA).getTime() -
              new Date(yearB, monthB - 1, dayB).getTime()
            );
          })
          .slice(-7);

        setAnalytics((prev) => ({
          ...prev,
          visits: visits.length,
          visitsTrend,
          chartData,
        }));
      }
    });

    return () => {
      unsubscribeVisits();
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatPrice = (value: string) => {
    if (value.startsWith("R$")) return value;
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    const formattedValue = (Number(numericValue) / 100).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      },
    );
    return formattedValue;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, price: numericValue }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filesToProcess = Array.from(files);
      filesToProcess.forEach((file) => {
        if (file.size > 1024 * 1024) {
          toast({
            title: "Imagem muito grande",
            description: `A imagem ${file.name} é maior que 1MB e foi ignorada.`,
            variant: "destructive",
          });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (product: any) => {
    setEditingId(String(product.id));
    const rawPrice = String(product.price || "").replace(/[^\d]/g, "");
    setFormData({
      name: product.name || "",
      brand: product.brand || "",
      price: rawPrice,
      material: product.material || "",
      dimensions: product.dimensions || "",
      weight: product.weight || "",
      editorsNotes: product.editorsNotes || "",
      description: product.description || "",
      productDetails: product.productDetails || "",
      careCleaning: product.careCleaning || "",
      category: product.category || "sneakers",
      sizes: Array.isArray(product.sizes)
        ? product.sizes.join(", ")
        : String(product.sizes || ""),
      availableSizes: Array.isArray(product.availableSizes)
        ? product.availableSizes.join(", ")
        : String(product.availableSizes || ""),
      colors: Array.isArray(product.colors)
        ? product.colors.join(", ")
        : String(product.colors || ""),
      freeShipping: !!product.freeShipping,
    });

    const productVariants = (product.variants || []).map((v: any) => ({
      color: v.color || "",
      sizes: Array.isArray(v.sizes) ? v.sizes.join(", ") : v.sizes || "",
      image: v.image || "",
    }));

    const productImages = Array.isArray(product.images)
      ? product.images
      : product.image
        ? [product.image]
        : [];
    setImages(productImages);
    setVariants(productVariants);
    setActiveTab("add");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete");
        await fetchLocalProducts();
        toast({
          title: "Sucesso",
          description: "Produto removido com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao remover produto.",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      brand: "",
      price: "",
      material: "",
      dimensions: "",
      weight: "",
      editorsNotes: "",
      description: "",
      productDetails: "",
      careCleaning: "",
      category: "sneakers",
      sizes: "",
      availableSizes: "",
      colors: "",
      freeShipping: false,
    });
    setVariants([]);
    setImages([]);
    const fileInput = document.getElementById("images") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0 && variants.every((v) => !v.image)) {
      toast({
        title: "Erro",
        description: "Por favor, adicione pelo menos uma imagem.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const priceInCents = Number(formData.price);

      const productData = {
        ...formData,
        price: priceInCents,
        priceInCents: priceInCents,
        sizes: formData.sizes
          ? formData.sizes.split(",").map((s) => s.trim())
          : [],
        availableSizes: formData.availableSizes
          ? formData.availableSizes.split(",").map((s) => s.trim())
          : [],
        colors: [
          ...variants.map((v) => v.color.trim()),
          ...(formData.colors
            ? formData.colors
                .split(",")
                .map((c) => c.trim())
                .filter(
                  (c) =>
                    c &&
                    !variants.some(
                      (v) => v.color.trim().toLowerCase() === c.toLowerCase(),
                    ),
                )
            : []),
        ],
        variants: variants
          .map((v) => ({
            color: v.color.trim(),
            sizes:
              typeof v.sizes === "string"
                ? v.sizes
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : v.sizes,
            image: v.image,
          }))
          .filter((v) => v.color),
        image: images[0] || variants.find((v) => v.image)?.image || "",
        images: images,
        updatedAt: Date.now(),
      };

      if (editingId) {
        const response = await fetch(`/api/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        if (!response.ok) throw new Error("Failed to update");
        clearProductsCache();
        await fetchLocalProducts();
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso!",
        });
      } else {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...productData,
            createdAt: Date.now(),
            isNew: true,
          }),
        });
        if (!response.ok) throw new Error("Failed to create");
        clearProductsCache();
        await fetchLocalProducts();
        toast({ title: "Sucesso", description: "Produto criado com sucesso!" });
      }

      resetForm();
      setActiveTab("products");
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar produto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const syncAllProductColors = async () => {
    if (!products || products.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum produto encontrado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let updated = 0;

      for (const product of products) {
        const productVariants = (product.variants || []) as Array<{
          color: string;
          sizes: string[];
          image?: string;
        }>;
        const existingColors = product.colors || [];

        // Combine variant colors with existing colors (avoid duplicates)
        const variantColorNames = productVariants.map((v) =>
          v.color.toLowerCase().trim(),
        );
        const newColors = [
          ...productVariants.map((v) => v.color.trim()),
          ...existingColors.filter(
            (c: string) => !variantColorNames.includes(c.toLowerCase().trim()),
          ),
        ];

        // Only update if colors changed
        if (
          JSON.stringify(newColors.sort()) !==
          JSON.stringify((product.colors || []).sort())
        ) {
          await fetch(`/api/products/${product.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ colors: newColors, updatedAt: Date.now() }),
          });
          updated++;
        }
      }

      await fetchLocalProducts();
      toast({
        title: "Sucesso",
        description: `${updated} produto(s) sincronizado(s) com sucesso!`,
      });
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Erro",
        description: "Falha ao sincronizar produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: BarChart3 },
    { id: "products" as TabType, label: "Produtos", icon: Package },
    {
      id: "add" as TabType,
      label: editingId ? "Editar" : "Adicionar",
      icon: Plus,
    },
    { id: "orders" as TabType, label: "Pedidos", icon: ShoppingBag, badge: orders.filter((o) => o.status === "pending" || o.status === "pix_pending" || o.status === "card_pending").length },
    {
      id: "refunds" as TabType,
      label: "Reembolsos",
      icon: RotateCcw,
      badge: refunds.filter((r) => r.status === "pending").length,
    },
    { id: "customers" as TabType, label: "Clientes", icon: Users },
    { id: "offers" as TabType, label: "Ofertas", icon: Tag },
    { id: "settings" as TabType, label: "Segurança", icon: Shield },
  ];

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color: string;
  }) => (
    <div className={cn("rounded-2xl p-5 md:p-6", color)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-black text-white mt-1">
            {value}
          </p>
          {trend && (
            <p className="text-xs text-white/80 mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> {trend}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (authLoading || !securityVerified) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Verificando Segurança
          </h1>
          <p className="text-gray-400">
            Validando credenciais de administrador...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-60 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <span className="text-black font-black text-sm">V</span>
            </div>
            <div>
              <h1 className="font-black text-[15px] tracking-wide leading-none">VURO</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left",
                activeTab === item.id
                  ? "bg-yellow-400 text-slate-900 font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )}
            >
              <item.icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-2.5 border-t border-white/8 space-y-0.5">
          <Link
            to="/"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Home size={16} />
            Ver Loja
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen overflow-auto">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <Menu size={20} />
              </button>
              <h2 className="font-semibold text-[15px] text-slate-800 hidden sm:block">
                {activeTab === "add" && editingId
                  ? "Editar Produto"
                  : menuItems.find((m) => m.id === activeTab)?.label ||
                    "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[11px] font-medium">
                <Shield size={11} />
                <span>Acesso Seguro</span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-slate-100 rounded-lg relative text-slate-500 hover:text-slate-700 transition-colors"
                  data-testid="button-notifications"
                >
                  <Bell size={18} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-[400px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-slate-800">Notificações</h3>
                      {unreadNotificationsCount > 0 && (
                        <button onClick={markAllNotificationsAsRead} className="text-xs text-yellow-600 hover:underline font-medium">
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">Nenhuma notificação</div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => markNotificationAsRead(notification.id)}
                            className={cn(
                              "px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors",
                              !notification.read && "bg-yellow-50",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", notification.type === "new_order" ? "bg-emerald-100" : "bg-blue-100")}>
                                {notification.type === "new_order" ? (
                                  <ShoppingBag size={13} className="text-emerald-600" />
                                ) : (
                                  <Bell size={13} className="text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-slate-800">{notification.title}</p>
                                <p className="text-xs text-slate-500 truncate">{notification.message}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(notification.createdAt).toLocaleString("pt-BR")}</p>
                              </div>
                              {!notification.read && <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0 mt-1.5" />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                  <span className="text-yellow-400 font-bold text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-[12px] font-medium text-slate-700 truncate max-w-[140px]">
                    {user?.email}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">Admin Verificado</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  title="Receita Total"
                  value={`R$ ${(analytics.revenue / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  icon={DollarSign}
                  trend={
                    analytics.revenueTrend !== null
                      ? `${analytics.revenueTrend >= 0 ? "+" : ""}${analytics.revenueTrend}% esta semana`
                      : undefined
                  }
                  color="bg-gradient-to-br from-green-500 to-green-600"
                />
                <StatCard
                  title="Vendas"
                  value={analytics.salesCount}
                  icon={ShoppingBag}
                  trend={
                    analytics.salesTrend !== null
                      ? `${analytics.salesTrend >= 0 ? "+" : ""}${analytics.salesTrend}% esta semana`
                      : undefined
                  }
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                  title="Visitantes"
                  value={analytics.visits}
                  icon={Eye}
                  trend={
                    analytics.visitsTrend !== null
                      ? `${analytics.visitsTrend >= 0 ? "+" : ""}${analytics.visitsTrend}% esta semana`
                      : undefined
                  }
                  color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatCard
                  title="Produtos"
                  value={products?.length || 0}
                  icon={Package}
                  color="bg-gradient-to-br from-yellow-500 to-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {[
                  { label: "PIX Pendente", status: "pix_pending", dot: "bg-yellow-400", text: "text-yellow-700", num: "text-yellow-800" },
                  { label: "Cartão Pendente", status: "card_pending", dot: "bg-purple-400", text: "text-purple-700", num: "text-purple-800" },
                  { label: "Pendentes", status: "pending", dot: "bg-amber-400", text: "text-amber-600", num: "text-amber-700" },
                  { label: "Confirmados", status: "confirmed", dot: "bg-blue-400", text: "text-blue-600", num: "text-blue-700" },
                  { label: "Enviados", status: "shipped", dot: "bg-violet-400", text: "text-violet-600", num: "text-violet-700" },
                  { label: "Em trânsito", status: "transit", dot: "bg-orange-400", text: "text-orange-600", num: "text-orange-700" },
                  { label: "Entregues", status: "delivered", dot: "bg-emerald-400", text: "text-emerald-600", num: "text-emerald-700" },
                ].map(({ label, status, dot, text, num }) => (
                  <div
                    key={status}
                    onClick={() => setActiveTab("orders")}
                    className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className={`text-[11px] font-semibold ${text}`}>{label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${num}`}>
                      {orders.filter((o) => o.status === status).length}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[14px] font-semibold text-slate-800">
                      Visitas dos Últimos 7 Dias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] md:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.chartData}>
                          <defs>
                            <linearGradient
                              id="colorVisits"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#eab308"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#eab308"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#e2e8f0" />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#e2e8f0" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "10px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="visits"
                            stroke="#eab308"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorVisits)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[14px] font-semibold text-slate-800">
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Novo Produto", sub: "Adicionar ao catálogo", icon: Plus, iconBg: "bg-yellow-100", iconColor: "text-yellow-700", action: () => setActiveTab("add"), disabled: false },
                      { label: "Nova Oferta", sub: "Criar promoção", icon: Tag, iconBg: "bg-emerald-100", iconColor: "text-emerald-700", action: () => setActiveTab("offers"), disabled: false },
                      { label: "Ver Produtos", sub: "Gerenciar estoque", icon: Package, iconBg: "bg-blue-100", iconColor: "text-blue-700", action: () => setActiveTab("products"), disabled: false },
                      { label: "Sincronizar Cores", sub: "Atualizar todos produtos", icon: Zap, iconBg: "bg-violet-100", iconColor: "text-violet-700", action: syncAllProductColors, disabled: loading },
                    ].map(({ label, sub, icon: Icon, iconBg, iconColor, action, disabled }) => (
                      <button
                        key={label}
                        onClick={action}
                        disabled={disabled}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 group border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={16} className={iconColor} />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-[13px] text-slate-800">{label}</p>
                            <p className="text-[11px] text-slate-500">{sub}</p>
                          </div>
                        </div>
                        <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold text-slate-800">
                    Últimas Vendas
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("orders")}
                  >
                    Ver todos <ChevronRight size={16} />
                  </Button>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhuma venda ainda</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center gap-3 py-3 hover:bg-slate-50 px-1 rounded-lg transition-colors">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                            {order.productImage ? (
                              <img src={order.productImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-slate-400 font-bold text-sm">V</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[13px] text-slate-800 truncate">{order.productName || "Produto"}</p>
                            <p className="text-[11px] text-slate-500 truncate">{order.userEmail}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-[13px] text-emerald-600">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(getOrderTotal(order) / 100)}
                            </p>
                            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", getOrderStatusColor(order.status))}>
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold text-slate-800">
                    Produtos Recentes
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("products")}
                  >
                    Ver todos <ChevronRight size={16} />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-50">
                    {products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center gap-3 py-3 hover:bg-slate-50 px-1 rounded-lg transition-colors">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          {product.image && (
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[13px] text-slate-800 truncate">{product.name}</p>
                          <p className="text-[11px] text-slate-500">{product.brand}</p>
                        </div>
                        <p className="font-semibold text-[13px] text-slate-800">{formatPriceFromCents(Number(product.price) || 0)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-[14px] font-semibold text-slate-800">Top Marcas por Receita</CardTitle>
                    <TrendingUp size={16} className="text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    {topBrands.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">Sem dados ainda</p>
                    ) : (
                      <div className="space-y-3">
                        {topBrands.map((b, i) => {
                          const maxRev = topBrands[0]?.revenue || 1;
                          const pct = Math.round((b.revenue / maxRev) * 100);
                          return (
                            <div key={b.brand} className="space-y-1.5">
                              <div className="flex items-center justify-between text-[13px]">
                                <span className="font-medium text-slate-700 flex items-center gap-2">
                                  <span className="text-slate-400 text-[11px] w-4">#{i + 1}</span>
                                  {b.brand}
                                </span>
                                <span className="font-semibold text-emerald-600">{formatPriceFromCents(b.revenue)}</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-[10px] text-slate-400">{b.count} unid. vendidas</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border border-slate-200 shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-[14px] font-semibold text-slate-800">Resumo de Clientes</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("customers")}>
                      Ver todos <ChevronRight size={16} />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[13px] text-slate-500">Total de clientes</span>
                        <span className="font-semibold text-slate-800">{customerData.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[13px] text-slate-500">Ticket médio</span>
                        <span className="font-semibold text-emerald-600">
                          {customerData.length > 0
                            ? formatPriceFromCents(Math.round(customerData.reduce((s, c) => s + c.totalSpent, 0) / customerData.reduce((s, c) => s + c.orders, 0)))
                            : "R$ 0,00"}
                        </span>
                      </div>
                      {customerData.slice(0, 3).map((c) => (
                        <div key={c.email} className="flex items-center gap-3 py-2.5 hover:bg-slate-50 px-1 rounded-lg transition-colors">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-600 font-bold text-sm">{c.email.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-slate-800 truncate">{c.email}</p>
                            <p className="text-[11px] text-slate-500">{c.orders} pedido(s)</p>
                          </div>
                          <p className="font-semibold text-[13px] text-emerald-600">{formatPriceFromCents(c.totalSpent)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-gray-200 rounded-xl"
                  />
                </div>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="h-11 rounded-xl w-full sm:w-[180px]">
                    <Filter size={15} className="mr-1 text-gray-400" />
                    <SelectValue placeholder="Filtrar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as marcas</SelectItem>
                    {BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    resetForm();
                    setActiveTab("add");
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-11 px-6 rounded-xl"
                >
                  <Plus size={18} className="mr-2" /> Novo Produto
                </Button>
              </div>

              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left text-xs font-bold text-gray-800 uppercase tracking-wide tracking-wider px-4 py-3">
                          Produto
                        </th>
                        <th className="text-left text-xs font-bold text-gray-800 uppercase tracking-wide tracking-wider px-4 py-3 hidden md:table-cell">
                          Categoria
                        </th>
                        <th className="text-left text-xs font-bold text-gray-800 uppercase tracking-wide tracking-wider px-4 py-3">
                          Preço
                        </th>
                        <th className="text-left text-xs font-bold text-gray-800 uppercase tracking-wide tracking-wider px-4 py-3 hidden sm:table-cell">
                          Status
                        </th>
                        <th className="text-right text-xs font-bold text-gray-800 uppercase tracking-wide tracking-wider px-4 py-3">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.image && (
                                  <img
                                    src={product.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate max-w-[150px] md:max-w-[250px]">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {product.brand}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-lg capitalize">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-sm">
                              {formatPriceFromCents(Number(product.price) || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {product.isNew ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                                <Zap size={12} /> Novo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
                                <Check size={12} /> Ativo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(String(product.id))}
                                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProducts.length === 0 && (
                  <div className="p-12 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Nenhum produto encontrado</p>
                    <p className="text-sm">Tente buscar com outros termos</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === "add" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">
                  {editingId ? "Editar Produto" : "Novo Produto"}
                </CardTitle>
                {editingId && (
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X size={16} className="mr-2" /> Cancelar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Nome do Produto
                      </p>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Marca
                      </p>
                      <Select
                        value={formData.brand}
                        onValueChange={(v) => handleSelectChange("brand", v)}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANDS.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Preço
                      </p>
                      <Input
                        value={formatPrice(formData.price)}
                        onChange={handlePriceChange}
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Categoria
                      </p>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => handleSelectChange("category", v)}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        Imagens do Produto
                      </p>
                      <span className="text-xs text-gray-400">
                        {images.length} imagem(ns)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-20 h-20 rounded-xl overflow-hidden group"
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <X size={20} className="text-white" />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition-colors">
                        <Plus size={24} className="text-gray-400" />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        Variantes de Cor
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addVariant}
                        className="rounded-lg"
                      >
                        <Plus size={14} className="mr-1" /> Adicionar
                      </Button>
                    </div>
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-4 bg-gray-50 rounded-xl items-start"
                      >
                        <div className="w-16">
                          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-yellow-500 overflow-hidden">
                            {variant.image ? (
                              <img
                                src={variant.image}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={20} className="text-gray-400" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleVariantImageChange(index, e)
                              }
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Cor (ex: Vermelho/Preto)"
                            value={variant.color}
                            onChange={(e) =>
                              updateVariant(index, "color", e.target.value)
                            }
                            className="h-10 rounded-lg"
                          />
                          <Input
                            placeholder="Tamanhos (38, 39, 40, 41)"
                            value={variant.sizes}
                            onChange={(e) =>
                              updateVariant(index, "sizes", e.target.value)
                            }
                            className="h-10 rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Tamanhos (separados por vírgula)
                      </p>
                      <Input
                        name="sizes"
                        value={formData.sizes}
                        onChange={handleInputChange}
                        placeholder="38, 39, 40, 41, 42"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Cores (separadas por vírgula)
                      </p>
                      <Input
                        name="colors"
                        value={formData.colors}
                        onChange={handleInputChange}
                        placeholder="Preto, Branco, Vermelho"
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">
                      Descrição
                    </p>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className="rounded-xl min-h-[150px]"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Switch
                      checked={formData.freeShipping}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          freeShipping: checked,
                        }))
                      }
                    />
                    <div>
                      <p className="font-medium text-sm">Frete Grátis</p>
                      <p className="text-xs text-gray-500">
                        Ativar frete grátis para este produto
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 pb-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-14 rounded-xl text-base"
                    >
                      {loading
                        ? "Salvando..."
                        : editingId
                          ? "Atualizar Produto"
                          : "Criar Produto"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "refunds" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Reembolsos</h2>
                  <p className="text-sm text-gray-500">
                    {refunds.filter((r) => r.status === "pending").length}{" "}
                    pendente(s) de {refunds.length} total
                  </p>
                </div>
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <RotateCcw size={20} />
                    Solicitações de Reembolso
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {refunds.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <RotateCcw
                        size={48}
                        className="mx-auto mb-4 opacity-30"
                      />
                      <p className="font-medium">Nenhum reembolso solicitado</p>
                      <p className="text-sm">
                        As solicitações dos clientes aparecerão aqui
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {refunds.map((refund) => (
                        <div
                          key={refund.id}
                          className="p-5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col lg:flex-row gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              {refund.productImage ? (
                                <img
                                  src={refund.productImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package
                                    size={24}
                                    className="text-gray-300"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-base">
                                      {refund.productName || "Produto"}
                                    </p>
                                    <span
                                      className={cn(
                                        "text-xs font-medium px-2 py-1 rounded-full",
                                        refund.status === "approved"
                                          ? "bg-green-100 text-green-700"
                                          : refund.status === "rejected"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700",
                                      )}
                                    >
                                      {refund.status === "approved"
                                        ? "Aprovado"
                                        : refund.status === "rejected"
                                          ? "Negado"
                                          : "Pendente"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Tamanho: {refund.size || "-"}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Pedido #
                                    {refund.orderId.slice(-8).toUpperCase()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-red-600">
                                    R${" "}
                                    {(
                                      (refund.amount || 0) / 100
                                    ).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(
                                      refund.createdAt,
                                    ).toLocaleDateString("pt-BR")}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 font-medium mb-1">
                                  Motivo:
                                </p>
                                <p className="text-sm text-gray-700">
                                  {refund.reason}
                                </p>
                              </div>

                              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                <Users size={14} />
                                <span>{refund.userEmail}</span>
                              </div>

                              {refund.status === "pending" && (
                                <div className="mt-4 flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleRefundAction(
                                        refund.id,
                                        refund.orderId,
                                        refund.userId,
                                        "approved",
                                      )
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    <Check size={16} />
                                    Aprovar
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRefundAction(
                                        refund.id,
                                        refund.orderId,
                                        refund.userId,
                                        "rejected",
                                      )
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    <XCircle size={16} />
                                    Negar
                                  </button>
                                </div>
                              )}

                              {refund.processedAt && (
                                <p className="mt-3 text-xs text-gray-400">
                                  Processado em{" "}
                                  {new Date(
                                    refund.processedAt,
                                  ).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "offers" && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-bold">
                    {editingOfferId ? "Editar Oferta" : "Nova Oferta"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleOfferSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                          Título
                        </Label>
                        <Input
                          value={offerForm.title}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder="Ex: Black Friday"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                          Desconto
                        </Label>
                        <Input
                          value={offerForm.discount}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              discount: e.target.value,
                            }))
                          }
                          placeholder="Ex: 50%"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                          Descrição
                        </Label>
                        <Input
                          value={offerForm.description}
                          onChange={(e) =>
                            setOfferForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Ex: Em todos os tênis"
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl"
                      >
                        {editingOfferId ? "Atualizar" : "Criar Oferta"}
                      </Button>
                      {editingOfferId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingOfferId(null);
                            setOfferForm({
                              title: "",
                              description: "",
                              discount: "",
                            });
                          }}
                          className="rounded-xl"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-bold">
                    Ofertas Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {offers.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Tag size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Nenhuma oferta criada</p>
                      <p className="text-sm">Crie sua primeira oferta acima</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {offers.map((offer) => (
                        <div
                          key={offer.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center font-bold",
                                offer.active
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-400",
                              )}
                            >
                              {offer.discount}
                            </div>
                            <div>
                              <p className="font-medium">{offer.title}</p>
                              <p className="text-sm text-gray-500">
                                {offer.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={offer.active}
                              onCheckedChange={() => toggleOfferActive(offer)}
                            />
                            <button
                              onClick={() => editOffer(offer)}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteOffer(offer.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pedidos</h2>
                  <p className="text-sm text-gray-500">
                    {displayOrders.length} pedido(s) no total
                  </p>
                </div>
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShoppingBag size={20} />
                    Detalhes dos Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {orders.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <ShoppingBag
                        size={48}
                        className="mx-auto mb-4 opacity-30"
                      />
                      <p className="font-medium">Nenhum pedido ainda</p>
                      <p className="text-sm mb-4">
                        Os pedidos dos clientes aparecerão aqui
                      </p>
                      <button
                        onClick={async () => {
                          const sampleOrders = [
                            {
                              userId: "demo_user_1",
                              userEmail: "joao.silva@gmail.com",
                              productName: "Nike Air Jordan 1 High OG",
                              productImage:
                                "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400",
                              size: "42",
                              color: "#E53935",
                              colorName: "Vermelho",
                              price: 129900,
                              amount: 129900,
                              quantity: 1,
                              status: "confirmed",
                              createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
                              shippingAddress:
                                "Rua das Flores, 123 - São Paulo, SP",
                            },
                            {
                              userId: "demo_user_2",
                              userEmail: "maria.santos@hotmail.com",
                              productName: "Adidas Yeezy Boost 350 V2",
                              productImage:
                                "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400",
                              size: "39",
                              color: "#212121",
                              colorName: "Preto",
                              price: 189900,
                              amount: 189900,
                              quantity: 1,
                              status: "shipped",
                              createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
                              shippingAddress:
                                "Av. Paulista, 1000 - São Paulo, SP",
                            },
                            {
                              userId: "demo_user_3",
                              userEmail: "pedro.oliveira@outlook.com",
                              productName: "New Balance 550",
                              productImage:
                                "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400",
                              size: "44",
                              color: "#FFFFFF",
                              colorName: "Branco",
                              price: 89900,
                              amount: 89900,
                              quantity: 2,
                              status: "pending",
                              createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
                              shippingAddress:
                                "Rua Augusta, 500 - São Paulo, SP",
                            },
                          ];

                          for (const order of sampleOrders) {
                            const ordersRef = ref(db, "orders");
                            const newOrderRef = push(ordersRef);
                            await set(newOrderRef, order);
                          }
                          toast({
                            title: "Sucesso",
                            description: "Pedidos de exemplo adicionados!",
                          });
                        }}
                        className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                      >
                        Adicionar Pedidos de Exemplo
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {displayOrders.map((order) => {
                        const orderItems = getOrderItems(order);
                        const orderTotal = getOrderTotal(order);
                        return (
                        <div
                          key={order.id}
                          className="p-5 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-base">
                                    Pedido #{order.id.slice(-8).toUpperCase()}
                                  </p>
                                  <span
                                    className={cn(
                                      "text-xs font-medium px-2 py-1 rounded-full",
                                      getOrderStatusColor(order.status),
                                    )}
                                  >
                                    {getOrderStatusLabel(order.status)}
                                  </span>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {orderItems.length} {orderItems.length === 1 ? 'item' : 'itens'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Cliente: {order.userEmail || "N/A"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-green-600">
                                  R${" "}
                                  {(orderTotal / 100).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {orderItems.map((item, idx) => (
                                <div key={idx} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                          e.currentTarget.parentElement!.innerHTML =
                                            '<div class="w-full h-full flex items-center justify-center bg-yellow-100"><span class="text-yellow-600 font-bold text-lg">V</span></div>';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                                        <span className="text-yellow-600 font-bold text-lg">V</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{item.name}</p>
                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                      <span>Tam: {item.size}</span>
                                      <span>Qtd: {item.quantity}x</span>
                                      <span>R$ {(item.price / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  Cliente
                                </p>
                                <p className="text-sm font-medium truncate">
                                  {order.userEmail || "N/A"}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  Total de Itens
                                </p>
                                <p className="text-sm font-bold">
                                  {orderItems.reduce((acc, item) => acc + item.quantity, 0)}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  Pagamento
                                </p>
                                <p className="text-sm font-medium">
                                  {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  Status
                                </p>
                                <p className="text-sm font-medium">
                                  {getOrderStatusLabel(order.status)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t space-y-4">
                            {order.status === "pix_pending" && (
                              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-yellow-700 font-bold text-sm">⏳ Aguardando confirmação de pagamento PIX</span>
                                </div>
                                <p className="text-xs text-yellow-600 mb-3">
                                  Verifique se o pagamento PIX foi recebido na chave <span className="font-mono font-bold">Vuro.com.br@gmail.com</span> antes de confirmar.
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, "pending")}
                                    data-testid={`button-confirm-pix-${order.id}`}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                  >
                                    ✅ Confirmar Pagamento PIX
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      if (!confirm("Cancelar este pedido PIX? O status será alterado para 'cancelado'.")) return;
                                      await fetch(`/api/orders/${order.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "cancelled" }),
                                      });
                                      fetchOrders();
                                    }}
                                    data-testid={`button-cancel-pix-${order.id}`}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    ❌ Cancelar Pedido
                                  </Button>
                                </div>
                              </div>
                            )}
                            {order.status === "card_pending" && (
                              <div className="bg-purple-50 border border-purple-300 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-purple-700 font-bold text-sm">💳 Aguardando confirmação de pagamento no Cartão</span>
                                </div>
                                <p className="text-xs text-purple-600 mb-3">
                                  Verifique o pagamento no painel Stripe antes de confirmar o pedido.
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, "pending")}
                                    data-testid={`button-confirm-card-${order.id}`}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                  >
                                    ✅ Confirmar Pagamento Cartão
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      if (!confirm("Cancelar este pedido de cartão? O status será alterado para 'cancelado'.")) return;
                                      await fetch(`/api/orders/${order.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: "cancelled" }),
                                      });
                                      fetchOrders();
                                    }}
                                    data-testid={`button-cancel-card-${order.id}`}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    ❌ Cancelar Pedido
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium mr-2">
                                Atualizar status:
                              </span>
                              {(
                                [
                                  "pending",
                                  "confirmed",
                                  "shipped",
                                  "transit",
                                  "delivered",
                                ] as const
                              ).map((status) => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={
                                    order.status === status
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() => updateOrderStatus(order.id, status)}
                                  data-testid={`button-status-${status}-${order.id}`}
                                  className={
                                    order.status === status
                                      ? "bg-yellow-500 text-black"
                                      : ""
                                  }
                                >
                                  {getOrderStatusLabel(status)}
                                </Button>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium mr-2 flex items-center gap-1">
                                <Truck size={12} /> Código de rastreio:
                              </span>
                              {order.trackingCode &&
                              editingTrackingId !== order.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-mono bg-green-100 text-green-700 px-3 py-1 rounded-lg">
                                    {order.trackingCode}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    data-testid={`button-edit-tracking-${order.id}`}
                                    onClick={() => {
                                      setEditingTrackingId(order.id);
                                      setTrackingCodeInput(
                                        order.trackingCode || "",
                                      );
                                    }}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                </div>
                              ) : editingTrackingId === order.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={trackingCodeInput}
                                    onChange={(e) =>
                                      setTrackingCodeInput(e.target.value)
                                    }
                                    placeholder="Ex: BR123456789BR"
                                    className="w-48 text-sm font-mono"
                                    data-testid={`input-tracking-${order.id}`}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => updateTrackingCode(order.id)}
                                    data-testid={`button-save-tracking-${order.id}`}
                                  >
                                    Salvar
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingTrackingId(null);
                                      setTrackingCodeInput("");
                                    }}
                                    data-testid={`button-cancel-tracking-${order.id}`}
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingTrackingId(order.id);
                                    setTrackingCodeInput("");
                                  }}
                                  data-testid={`button-add-tracking-${order.id}`}
                                >
                                  <Plus size={12} /> Adicionar
                                </Button>
                              )}
                            </div>

                            {/* Delivery Date */}
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                📅 Previsão de entrega:
                              </span>
                              {order.deliveryDate && editingDeliveryId !== order.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">
                                    Chega dia {order.deliveryDate}
                                  </span>
                                  <Button size="icon" variant="ghost"
                                    onClick={() => { setEditingDeliveryId(order.id); setDeliveryDateInput(order.deliveryDate || ""); }}
                                    data-testid={`button-edit-delivery-${order.id}`}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                </div>
                              ) : editingDeliveryId === order.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={deliveryDateInput}
                                    onChange={(e) => setDeliveryDateInput(e.target.value)}
                                    placeholder="Ex: 10/04"
                                    className="w-28 text-sm"
                                    data-testid={`input-delivery-${order.id}`}
                                  />
                                  <Button size="sm" onClick={() => updateDeliveryDate(order.id)} data-testid={`button-save-delivery-${order.id}`}>
                                    Salvar
                                  </Button>
                                  <Button size="icon" variant="ghost"
                                    onClick={() => { setEditingDeliveryId(null); setDeliveryDateInput(""); }}
                                    data-testid={`button-cancel-delivery-${order.id}`}
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline"
                                  onClick={() => { setEditingDeliveryId(order.id); setDeliveryDateInput(""); }}
                                  data-testid={`button-add-delivery-${order.id}`}
                                >
                                  <Plus size={12} /> Definir data
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );})}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Clientes</h2>
                  <p className="text-sm text-gray-500">{customerData.length} clientes cadastrados</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por email..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Total de Clientes</p>
                  <p className="text-3xl font-black text-blue-700">{customerData.length}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Receita Total</p>
                  <p className="text-3xl font-black text-green-700">
                    {formatPriceFromCents(customerData.reduce((s, c) => s + c.totalSpent, 0))}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                  <p className="text-xs text-yellow-600 font-medium uppercase tracking-wide mb-1">Ticket Médio</p>
                  <p className="text-3xl font-black text-yellow-700">
                    {customerData.length > 0
                      ? formatPriceFromCents(Math.round(customerData.reduce((s, c) => s + c.totalSpent, 0) / customerData.reduce((s, c) => s + c.orders, 0)))
                      : "R$ 0,00"}
                  </p>
                </div>
              </div>

              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-4 py-3">Cliente</th>
                        <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Pedidos</th>
                        <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-4 py-3">Total Gasto</th>
                        <th className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Último Pedido</th>
                        <th className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customerData
                        .filter((c) => c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                        .map((customer, idx) => (
                          <tr key={customer.email} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-yellow-700 font-bold text-sm">
                                    {customer.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate max-w-[180px]">{customer.email}</p>
                                  {idx === 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Top cliente</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="text-sm font-medium">{customer.orders}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-sm text-green-600">{formatPriceFromCents(customer.totalSpent)}</span>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-sm text-gray-500">
                                {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString("pt-BR") : "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setActiveTab("orders");
                                }}
                                className="text-xs text-blue-600 hover:underline font-medium"
                              >
                                Ver pedidos
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {customerData.filter((c) => c.email.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                      <UserCircle size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-medium">Nenhum cliente encontrado</p>
                      <p className="text-sm">Os clientes aparecerão aqui após o primeiro pedido</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Shipping Settings Card */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Truck size={20} className="text-yellow-500" />
                    Configurações de Frete
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">Frete Grátis Global</p>
                      <p className="text-sm text-gray-500">Quando ativo, frete padrão é cobrado gratuitamente de todos os clientes</p>
                    </div>
                    <button
                      onClick={() => saveStoreSettings({ ...storeSettings, freeShipping: !storeSettings.freeShipping })}
                      disabled={savingSettings}
                      className={`relative w-12 h-6 rounded-full transition-colors ${storeSettings.freeShipping ? 'bg-yellow-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${storeSettings.freeShipping ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {!storeSettings.freeShipping && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Frete Padrão (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(storeSettings.standardShippingCost / 100).toFixed(2)}
                          onChange={e => setStoreSettings(prev => ({ ...prev, standardShippingCost: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Frete Expresso (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(storeSettings.expressShippingCost / 100).toFixed(2)}
                          onChange={e => setStoreSettings(prev => ({ ...prev, expressShippingCost: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Entrega Amanhã (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(storeSettings.overnightShippingCost / 100).toFixed(2)}
                          onChange={e => setStoreSettings(prev => ({ ...prev, overnightShippingCost: Math.round(parseFloat(e.target.value || '0') * 100) }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {!storeSettings.freeShipping && (
                    <button
                      onClick={() => saveStoreSettings(storeSettings)}
                      disabled={savingSettings}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingSettings ? 'Salvando...' : 'Salvar Valores de Frete'}
                    </button>
                  )}

                  <div className={`text-sm px-4 py-2 rounded-lg ${storeSettings.freeShipping ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                    Status atual: <strong>{storeSettings.freeShipping ? '🟢 Frete Grátis ativado para todos os clientes' : `🔴 Frete cobrado — Padrão: R$ ${(storeSettings.standardShippingCost / 100).toFixed(2).replace('.', ',')}`}</strong>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Shield size={20} className="text-green-600" />
                      Status de Segurança
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Check size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-green-800">
                            Admin Verificado
                          </p>
                          <p className="text-sm text-green-600">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full font-bold">
                        ATIVO
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          Verificação dupla
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          Ativado
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          Log de acessos
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          Ativado
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          Proteção de rotas
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          Ativado
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          Emails autorizados
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          {ADMIN_EMAILS.length} admins
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Activity size={20} className="text-blue-600" />
                      Registro de Acessos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {accessLogs.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Activity
                          size={40}
                          className="mx-auto mb-3 opacity-30"
                        />
                        <p className="text-sm">Nenhum log de acesso ainda</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                        {accessLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {log.email}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(log.timestamp).toLocaleString(
                                    "pt-BR",
                                  )}
                                </p>
                              </div>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                                Login
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-sm border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={24} className="text-black" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">
                        Dicas de Segurança
                      </h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>- Nunca compartilhe suas credenciais de acesso</li>
                        <li>- Verifique regularmente o registro de acessos</li>
                        <li>- Use senhas fortes e únicas</li>
                        <li>- Faça logout ao terminar de usar o painel</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
