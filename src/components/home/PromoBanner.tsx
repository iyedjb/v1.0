import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, Truck, Ticket, Store, Coins, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const banners = [
  {
    id: 1,
    title: "CUPOM EXCLUSIVO",
    subtitle: "PARA SUA 1ª COMPRA",
    highlight: "Frete Grátis",
    cta: "Cadastre-se",
    ctaLink: "/auth",
    bgColor: "bg-gradient-to-r from-yellow-500 to-amber-400",
    textColor: "text-black",
    badge: "FRETE GRÁTIS",
    badgeIcon: Truck,
    badgeColor: "text-yellow-600",
  },
  {
    id: 2,
    title: "OFERTAS RELÂMPAGO",
    subtitle: "ATÉ 50% OFF",
    highlight: "Só Hoje!",
    cta: "Ver Ofertas",
    ctaLink: "/category/sneakers",
    bgColor: "bg-gradient-to-r from-gray-900 to-gray-800",
    textColor: "text-yellow-400",
    badge: "50% OFF",
    badgeIcon: Ticket,
    badgeColor: "text-yellow-500",
  },
  {
    id: 3,
    title: "LANÇAMENTOS",
    subtitle: "NOVOS MODELOS",
    highlight: "Exclusivos",
    cta: "Confira",
    ctaLink: "/category/new",
    bgColor: "bg-gradient-to-r from-amber-500 to-yellow-400",
    textColor: "text-black",
    badge: "NOVO",
    badgeIcon: Gift,
    badgeColor: "text-amber-600",
  },
];

const quickLinks = [
  { icon: Coins, label: "Moedas", href: "/premios", color: "text-yellow-500", bgColor: "bg-yellow-50" },
  { icon: Gift, label: "Prêmios", href: "/premios", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  { icon: Truck, label: "Frete Grátis", sublabel: "acima de R$300", href: "/frete-gratis", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  { icon: Ticket, label: "Cupons", href: "/cupons", color: "text-yellow-500", bgColor: "bg-yellow-50" },
  { icon: Store, label: "Lojas Oficiais", href: "/category/sneakers", color: "text-yellow-600", bgColor: "bg-yellow-50" },
];

const PromoBanner = () => {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  const banner = banners[currentBanner];
  const BadgeIcon = banner.badgeIcon;

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden shadow-lg group">
        <div className={`${banner.bgColor} p-6 md:p-8 flex items-center justify-between min-h-[180px] md:min-h-[200px] transition-all duration-500`}>
          <div className={`flex-1 ${banner.textColor}`}>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
              {banner.title}
            </h2>
            <h3 className="text-xl md:text-3xl font-black tracking-tight">
              {banner.subtitle}
            </h3>
            <p className="text-lg md:text-xl font-medium mt-1 opacity-80">
              {banner.highlight}
            </p>
            <Button 
              asChild 
              className="mt-4 bg-black hover:bg-gray-800 text-white border-none font-bold"
              data-testid="button-banner-cta"
            >
              <Link to={banner.ctaLink}>{banner.cta}</Link>
            </Button>
          </div>
          
          <div className="hidden md:flex items-center">
            <div className="bg-white rounded-lg p-6 shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-3">
                <BadgeIcon className={`w-12 h-12 ${banner.badgeColor}`} />
                <span className="text-xl font-black text-gray-800">{banner.badge}</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={prevBanner}
          aria-label="Promoção anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid="button-banner-prev"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={nextBanner}
          aria-label="Próxima promoção"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid="button-banner-next"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Navegação do banner">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              role="tab"
              aria-selected={index === currentBanner}
              aria-label={`Ir para promoção ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentBanner ? "bg-white w-4" : "bg-white/50"
              }`}
              data-testid={`button-banner-dot-${index}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-5 gap-2 md:gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              className="flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg hover:bg-yellow-50 transition-colors group"
              data-testid={`link-quick-${link.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className={`p-2 md:p-3 rounded-lg ${link.bgColor} group-hover:bg-yellow-100 transition-colors`}>
                <link.icon className={`w-5 h-5 md:w-6 md:h-6 ${link.color}`} />
              </div>
              <div className="text-center">
                <span className="text-[10px] md:text-xs font-medium text-gray-700 block">
                  {link.label}
                </span>
                {link.sublabel && (
                  <span className="text-[8px] md:text-[10px] text-gray-400 block">
                    {link.sublabel}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
