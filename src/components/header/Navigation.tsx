import { Search, User, MessageCircle, LogOut, MapPin, Bell, X, Check, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import vuroLogo from "@/assets/vuro-logo.svg";

const Navigation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cepModalOpen, setCepModalOpen] = useState(false);
  const [cep, setCep] = useState("");
  const [savedCep, setSavedCep] = useState<string | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUnread = () => {
      const readRaw = localStorage.getItem("vuro_notif_read");
      const readIds: string[] = readRaw ? JSON.parse(readRaw) : [];
      // We always have at least the promo notification; show badge until read
      if (!readIds.includes("promo-1")) {
        setUnreadNotifs(1);
      } else {
        setUnreadNotifs(0);
      }
    };
    checkUnread();
    window.addEventListener("storage", checkUnread);
    return () => window.removeEventListener("storage", checkUnread);
  }, []);

  const ADMIN_EMAILS = ["louayjbara2025@gmail.com", "info@loja.vuro.com.br"];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(e.target.value));
  };

  const handleSaveCep = () => {
    if (cep.length >= 8) {
      setSavedCep(cep);
      setCepModalOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="relative bg-white border-b border-gray-100 sticky top-0 z-[100] shadow-sm">
      {/* Main bar */}
      <div className="max-w-[1440px] mx-auto flex items-center gap-3 md:gap-5 h-14 md:h-16 px-3 md:px-6 lg:px-10">

        {/* Logo — original colors on white bg */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src={vuroLogo} alt="VURO" className="h-7 md:h-8" />
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 relative flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 md:px-4 h-9 md:h-11 focus-within:border-yellow-400 transition-all min-w-0">
          <Search size={14} className="text-gray-400 mr-2 flex-shrink-0 md:w-4 md:h-4" />
          <input
            type="text"
            placeholder="Buscar tênis..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400 font-normal min-w-0 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
          />
          <button type="submit" className="bg-[#FACC15] hover:bg-yellow-400 text-black w-7 h-7 rounded-full font-bold flex items-center justify-center ml-1.5 transition-all flex-shrink-0 md:w-auto md:h-auto md:px-4 md:py-1.5 md:text-xs md:whitespace-nowrap shadow-sm">
            <Search size={12} className="md:hidden" />
            <span className="hidden md:inline font-bold">Buscar</span>
          </button>
        </form>

        {/* Right icons */}
        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
          <Link
            to="/notificacoes"
            className="relative hidden md:flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-900 hover:bg-yellow-50 transition-all"
            aria-label="Notificações"
            data-testid="button-notifications"
          >
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
            )}
          </Link>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-vega"))}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-900 hover:bg-yellow-50 transition-all"
            aria-label="Assistente Vega"
            data-testid="button-vega"
          >
            <MessageCircle size={18} />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center ml-1">
                  <Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-yellow-300 hover:ring-yellow-400 transition-all">
                    <AvatarImage src={user.photoURL || ""} className="object-cover" />
                    <AvatarFallback className="bg-[#FACC15] text-black text-xs font-bold">
                      {user.email?.substring(0, 2).toUpperCase() || "VU"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-100 p-2 shadow-2xl rounded-2xl mt-1">
                <div className="px-3 py-2 mb-1 bg-yellow-50 rounded-xl border border-yellow-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-600">Logado como</p>
                  <p className="text-sm font-semibold truncate text-gray-800">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                <DropdownMenuItem asChild className="cursor-pointer py-2.5 focus:bg-yellow-50 rounded-xl">
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Minha Conta</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer py-2.5 focus:bg-yellow-50 rounded-xl">
                    <Link to="/admin" className="flex items-center">
                      <Bell className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Painel Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-2.5 text-red-500 focus:bg-red-50 rounded-xl mt-1">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-sm font-medium">Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-900 hover:bg-yellow-50 transition-all ml-1"
            >
              <User size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Secondary bar */}
      <div className="bg-[#111111] border-t border-white/5">
        <div className="max-w-[1440px] mx-auto flex items-center gap-6 h-9 px-3 md:px-6 lg:px-10 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setCepModalOpen(true)}
            className="flex items-center gap-1.5 text-white/40 font-semibold text-xs whitespace-nowrap hover:text-white/70 transition-colors flex-shrink-0"
            data-testid="button-cep-bar"
          >
            <MapPin size={11} />
            <span>{savedCep || "Digite seu CEP"}</span>
            <ChevronRight size={10} />
          </button>

          <div className="w-px h-3.5 bg-white/10 flex-shrink-0" />

          <div className="flex items-center gap-5 md:gap-7">
            {[
              { name: "Nike", slug: "nike" },
              { name: "Adidas", slug: "adidas" },
              { name: "Jordan", slug: "jordan" },
              { name: "New Balance", slug: "new-balance" },
              { name: "Puma", slug: "puma" },
              { name: "Ver mais", slug: "all" },
            ].map((item) => (
              <Link
                key={item.slug}
                to={`/category/${item.slug}`}
                className="text-white/50 font-semibold text-xs whitespace-nowrap hover:text-[#FACC15] transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CEP Modal */}
      {cepModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center px-4"
          onClick={() => setCepModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-gray-900">Informe seu CEP</h3>
              <button onClick={() => setCepModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Veja as opções de entrega disponíveis na sua região</p>
            <div className="flex gap-3">
              <Input
                placeholder="00000-000"
                value={cep}
                onChange={handleCepChange}
                maxLength={9}
                className="h-12 text-base font-medium rounded-xl border-gray-200"
                data-testid="input-cep"
              />
              <Button
                onClick={handleSaveCep}
                disabled={cep.length < 8}
                className="h-12 px-5 bg-[#FACC15] hover:bg-yellow-400 text-black font-bold rounded-xl"
              >
                <Check size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
