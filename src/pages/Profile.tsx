import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import {
  Package,
  Heart,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, favorites: 0 });

  useEffect(() => {
    const checkoutEmail = localStorage.getItem("vuro_checkout_email");
    const emailToCheck = user?.email?.toLowerCase() || checkoutEmail?.toLowerCase();
    if (!emailToCheck) return;
    const ordersRef = ref(db, "orders");
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userOrders = Object.entries(data)
          .map(([key, value]: [string, any]) => ({ ...value, id: key }))
          .filter((order: any) => {
            const orderEmail = order.userEmail?.toLowerCase();
            return orderEmail === emailToCheck || (user && order.userId === user.uid);
          });
        setStats(s => ({ ...s, orders: userOrders.length }));
      }
    });
    return () => unsubscribe();
  }, [user]);

  const username = user?.displayName || user?.email?.split('@')[0] || "Visitante";
  const initials = username.slice(0, 2).toUpperCase();

  const mainItems = [
    { icon: Package, label: "Meus Pedidos", desc: `${stats.orders} compra${stats.orders !== 1 ? 's' : ''}`, href: "/meus-pedidos", accent: true },
    { icon: Heart, label: "Favoritos", desc: "Produtos salvos", href: "/favoritos", accent: true },
    { icon: RotateCcw, label: "Reembolsos", desc: "Solicitar devolução", href: "/reembolso", accent: false },
    { icon: MessageCircle, label: "Mensagens", desc: "Fale com o suporte", href: "/chat", accent: false },
  ];

  const secondaryItems = [
    { icon: Bell, label: "Notificações", href: "/notificacoes" },
    { icon: Settings, label: "Configurações", href: "/configuracoes" },
    { icon: HelpCircle, label: "Ajuda", href: "/about/customer-care" },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col pb-24">
        {/* Hero */}
        <div className="bg-[#0a0a0a] flex-shrink-0 px-5 pt-16 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.12),transparent_60%)]" />
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-full bg-white/8 border border-white/10 flex items-center justify-center mb-5">
              <span className="text-white/30 text-3xl font-black">?</span>
            </div>
            <h1 className="text-white font-black text-3xl leading-tight mb-2">
              Olá, visitante 👋
            </h1>
            <p className="text-white/40 text-sm leading-relaxed">
              Entre na sua conta para acompanhar pedidos, favoritos e muito mais.
            </p>
          </div>
        </div>

        {/* Card over hero */}
        <div className="px-4 -mt-6 space-y-3">
          <button
            onClick={() => navigate("/auth")}
            className="w-full bg-[#FACC15] rounded-2xl p-4 flex items-center justify-between shadow-lg"
            data-testid="button-login"
          >
            <div className="text-left">
              <p className="font-black text-black text-base">Entrar ou criar conta</p>
              <p className="text-black/50 text-xs mt-0.5">Rápido, fácil e seguro</p>
            </div>
            <ArrowRight size={20} className="text-black/60 flex-shrink-0" />
          </button>

          {/* Benefits */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 pt-4 pb-2 border-b border-gray-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vantagens da conta</p>
            </div>
            {[
              { emoji: "📦", label: "Acompanhe seus pedidos", desc: "Status e rastreamento em tempo real" },
              { emoji: "❤️", label: "Salve seus favoritos", desc: "Lista de desejos sempre acessível" },
              { emoji: "↩️", label: "Reembolso fácil", desc: "Solicite trocas sem complicação" },
              { emoji: "🔒", label: "Compra 100% segura", desc: "Seus dados sempre protegidos" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <span className="text-xl flex-shrink-0">{b.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{b.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-28">

      {/* Hero header */}
      <div className="bg-[#0a0a0a] px-5 pt-12 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(250,204,21,0.1),transparent_55%)]" />
        <div className="relative z-10 flex items-center gap-4">
          {/* Avatar */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={username}
              className="w-[72px] h-[72px] rounded-full object-cover ring-[3px] ring-[#FACC15] ring-offset-2 ring-offset-[#0a0a0a] flex-shrink-0"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[#FACC15] flex items-center justify-center ring-[3px] ring-[#FACC15]/30 ring-offset-2 ring-offset-[#0a0a0a] flex-shrink-0">
              <span className="text-black font-black text-2xl">{initials}</span>
            </div>
          )}

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-xl leading-tight truncate">{username}</p>
            <p className="text-white/40 text-xs mt-1 truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">Membro VURO</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-7 flex gap-3">
          <Link to="/meus-pedidos" className="flex-1 bg-white/6 rounded-xl p-3 border border-white/8 hover:bg-white/10 transition-colors">
            <p className="text-[#FACC15] font-black text-2xl leading-none">{stats.orders}</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-semibold">Pedidos</p>
          </Link>
          <Link to="/favoritos" className="flex-1 bg-white/6 rounded-xl p-3 border border-white/8 hover:bg-white/10 transition-colors">
            <p className="text-[#FACC15] font-black text-2xl leading-none">♥</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-semibold">Favoritos</p>
          </Link>
          <Link to="/reembolso" className="flex-1 bg-white/6 rounded-xl p-3 border border-white/8 hover:bg-white/10 transition-colors">
            <p className="text-[#FACC15] font-black text-2xl leading-none">↩</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-semibold">Devoluções</p>
          </Link>
        </div>
      </div>

      {/* Content — pulled over hero */}
      <div className="px-4 -mt-4 space-y-3">

        {/* Main menu card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {mainItems.map((item, i) => (
            <Link
              key={i}
              to={item.href}
              className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors group"
              data-testid={`menu-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.accent ? 'bg-[#FACC15]' : 'bg-gray-100'}`}>
                <item.icon size={17} className={item.accent ? 'text-black' : 'text-gray-500'} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{item.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={15} className="text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Secondary card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {secondaryItems.map((item, i) => (
            <Link
              key={i}
              to={item.href}
              className="flex items-center gap-4 px-4 py-4 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors group"
              data-testid={`menu-settings-${item.label.toLowerCase()}`}
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <item.icon size={17} className="text-gray-500" strokeWidth={2} />
              </div>
              <span className="flex-1 font-medium text-gray-900 text-sm">{item.label}</span>
              <ChevronRight size={15} className="text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="w-full bg-white rounded-2xl flex items-center gap-4 px-4 py-4 shadow-sm active:bg-red-50 transition-colors group"
          data-testid="button-logout"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <LogOut size={17} className="text-red-400" strokeWidth={2} />
          </div>
          <span className="flex-1 font-medium text-red-400 text-sm text-left">Sair da conta</span>
        </button>

        <p className="text-center text-[10px] text-gray-300 font-semibold uppercase tracking-[0.25em] pt-1 pb-3">
          VURO · Sneakers Premium
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
