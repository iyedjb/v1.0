import { Home, Grid3X3, ShoppingBag, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import vegaAvatar from "@assets/image_1775422346160.png";

const BottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  const hiddenPaths = ["/auth", "/checkout", "/product/"];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) return null;

  const isAccountActive = location.pathname === "/profile" || location.pathname === "/auth";

  const openVega = () => window.dispatchEvent(new CustomEvent("open-vega"));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-screen-lg mx-auto px-2 md:px-6 py-2.5 pb-[calc(env(safe-area-inset-bottom,10px)+6px)]">
          <div className="flex items-center justify-around">

            {/* Início */}
            <Link
              to="/"
              className="flex flex-col items-center gap-1 min-w-[60px]"
              data-testid="bottomnav-início"
            >
              <div className={`p-2.5 rounded-xl transition-all ${location.pathname === "/" ? "bg-[#FACC15]" : "hover:bg-gray-100"}`}>
                <Home size={20} className={location.pathname === "/" ? "text-black" : "text-gray-400"} strokeWidth={location.pathname === "/" ? 2.5 : 1.5} />
              </div>
              <span className={`text-[9px] font-bold tracking-widest ${location.pathname === "/" ? "text-[#0a0a0a]" : "text-gray-400"}`}>INÍCIO</span>
            </Link>

            {/* Explorar */}
            <Link
              to="/category/all"
              className="flex flex-col items-center gap-1 min-w-[60px]"
              data-testid="bottomnav-explorar"
            >
              <div className={`p-2.5 rounded-xl transition-all ${location.pathname === "/category/all" ? "bg-[#FACC15]" : "hover:bg-gray-100"}`}>
                <Grid3X3 size={20} className={location.pathname === "/category/all" ? "text-black" : "text-gray-400"} strokeWidth={location.pathname === "/category/all" ? 2.5 : 1.5} />
              </div>
              <span className={`text-[9px] font-bold tracking-widest ${location.pathname === "/category/all" ? "text-[#0a0a0a]" : "text-gray-400"}`}>EXPLORAR</span>
            </Link>

            {/* Vega — center FAB */}
            <div className="flex flex-col items-center gap-1 min-w-[60px] relative">
              <button
                onClick={openVega}
                className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg border-2 border-[#FACC15] -mt-7 active:scale-95 transition-transform"
                data-testid="bottomnav-vega"
                aria-label="Abrir Vega"
              >
                <img src={vegaAvatar} alt="Vega" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-[#FACC15] text-black text-[8px] font-black tracking-widest text-center leading-none py-[3px]">
                  IA
                </span>
              </button>
              <span className="text-[9px] font-bold tracking-widest text-gray-400 -mt-0.5">VEGA</span>
            </div>

            {/* Carrinho */}
            <Link
              to="/carrinho"
              className="flex flex-col items-center gap-1 min-w-[60px]"
              data-testid="bottomnav-carrinho"
            >
              <div className="relative">
                <div className="bg-[#FACC15] p-2.5 rounded-xl shadow-sm">
                  <ShoppingBag size={20} className="text-black" strokeWidth={2} />
                </div>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold tracking-widest text-gray-700">CARRINHO</span>
            </Link>

            {/* Conta */}
            <Link
              to={user ? "/profile" : "/auth"}
              className="flex flex-col items-center gap-1 min-w-[60px]"
              data-testid="bottomnav-conta"
            >
              {user ? (
                <div className={`rounded-full p-0.5 ${isAccountActive ? "ring-2 ring-[#0a0a0a]" : ""}`}>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user.photoURL || ""} className="object-cover" />
                    <AvatarFallback className="bg-[#0a0a0a] text-white text-xs font-bold">
                      {user.email?.substring(0, 2).toUpperCase() || "VU"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div className={`p-2.5 rounded-xl transition-all ${isAccountActive ? "bg-[#0a0a0a]" : "hover:bg-gray-100"}`}>
                  <User size={20} className={isAccountActive ? "text-white" : "text-gray-400"} strokeWidth={1.5} />
                </div>
              )}
              <span className={`text-[9px] font-bold tracking-widest ${isAccountActive ? "text-[#0a0a0a]" : "text-gray-400"}`}>CONTA</span>
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
