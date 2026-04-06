import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Package, 
  Heart, 
  Bell, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  User,
  RotateCcw,
  MessageCircle,
  Instagram,
  Facebook,
  MapPin,
  Shield
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";

const More = () => {
  const { user, logout } = useAuth();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    const fetchOrderCount = async () => {
      const checkoutEmail = localStorage.getItem("vuro_checkout_email");
      const emailToCheck = user?.email || checkoutEmail;
      if (!emailToCheck) return;
      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(emailToCheck)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrderCount(data.filter((o: any) => o.status !== "pix_pending" && o.status !== "card_pending" && o.status !== "cancelled").length);
        }
      } catch {}
    };
    fetchOrderCount();
  }, [user]);

  const accountItems = [
    { icon: Package, label: "Meus Pedidos", desc: "Acompanhe suas entregas", href: "/meus-pedidos", badge: orderCount > 0 ? orderCount : null },
    { icon: Heart, label: "Favoritos", desc: "Produtos salvos", href: "/favoritos", badge: null },
    { icon: RotateCcw, label: "Reembolsos", desc: "Solicitar devolução", href: "/reembolso", badge: null },
    { icon: MessageCircle, label: "Mensagens", desc: "Fale com o suporte", href: "/chat", badge: null },
  ];

  const settingsItems = [
    { icon: Bell, label: "Notificações", href: "/notificacoes" },
    { icon: Settings, label: "Configurações", href: "/configuracoes" },
    { icon: HelpCircle, label: "Central de Ajuda", href: "/about/customer-care" },
    { icon: Shield, label: "Política de Privacidade", href: "/privacy-policy" },
  ];

  const socials = [
    {
      icon: Instagram,
      label: "Instagram",
      handle: "@vuro.br",
      href: "https://www.instagram.com/vuro.br?igsh=dzZoMGYxMDczdTg5",
      bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
      text: "text-white",
    },
    {
      icon: SiTiktok,
      label: "TikTok",
      handle: "@vuro.store.br",
      href: "https://www.tiktok.com/@vuro.store.br",
      bg: "bg-black",
      text: "text-white",
    },
    {
      icon: Facebook,
      label: "Facebook",
      handle: "VURO",
      href: "https://www.facebook.com/share/1N44qt3Wtb/",
      bg: "bg-blue-600",
      text: "text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-black text-white px-5 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #EAB308 0%, transparent 60%)" }} />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <span className="text-2xl font-black tracking-tighter italic">
              <span className="text-white">V</span><span className="text-yellow-400">uro</span>
            </span>
            <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">Minha Conta</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-lg">
              <User size={30} className="text-black" />
            </div>
            <div className="flex-1 min-w-0">
              {user ? (
                <>
                  <p className="font-bold text-lg leading-tight capitalize">
                    {user.displayName || user.email?.split("@")[0]}
                  </p>
                  <p className="text-sm text-gray-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-xs bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-full">
                    Membro VURO
                  </span>
                </>
              ) : (
                <>
                  <p className="font-bold text-lg">Visitante</p>
                  <p className="text-sm text-gray-400">Faça login para ver mais</p>
                </>
              )}
            </div>
          </div>

          {!user && (
            <Button
              asChild
              className="w-full mt-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-full h-12 text-base"
            >
              <Link to="/auth">ENTRAR OU CRIAR CONTA</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-3">
        {/* Minha Conta */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase">Minha Conta</h2>
          </div>
          {accountItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
              data-testid={`menu-${item.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
                <item.icon size={20} className="text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              {item.badge ? (
                <span className="bg-yellow-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight size={18} className="text-gray-300 shrink-0" />
              )}
            </Link>
          ))}
        </div>

        {/* Siga a VURO */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase">Siga a VURO</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 active:scale-95 transition-transform"
                data-testid={`social-${s.label.toLowerCase()}`}
              >
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon size={20} className={s.text} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.handle}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </a>
            ))}
          </div>
        </div>

        {/* Configurações */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase">Configurações</h2>
          </div>
          {settingsItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
              data-testid={`menu-settings-${item.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <item.icon size={18} className="text-gray-500" />
              </div>
              <span className="flex-1 font-semibold text-gray-800 text-sm">{item.label}</span>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        {user && (
          <button
            onClick={() => logout()}
            className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 active:bg-red-50 transition-colors"
            data-testid="button-logout"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut size={18} className="text-red-500" />
            </div>
            <span className="font-semibold text-red-500 text-sm">Sair da conta</span>
          </button>
        )}

        {/* Footer info */}
        <div className="flex flex-col items-center gap-1 pt-2 pb-2">
          <span className="text-2xl font-black tracking-tighter italic">
            <span className="text-gray-800">V</span><span className="text-yellow-500">uro</span>
          </span>
          <p className="text-xs text-gray-400">Streetwear premium para quem vive o estilo</p>
          <p className="text-xs text-gray-300 mt-1">v1.0 © 2025 VURO</p>
        </div>
      </div>
    </div>
  );
};

export default More;
