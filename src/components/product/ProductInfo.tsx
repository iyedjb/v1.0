import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Minus, Plus, Share2, Heart, MessageCircle } from "lucide-react";
import { Product } from "@/hooks/use-products";
import { cn, getDisplayPrice } from "@/lib/utils";
import { useStore } from "@/contexts/StoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChatActions } from "@/hooks/use-chat";

interface ProductInfoProps {
  product?: Product;
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const { addToCart, toggleFavorite, isFavorite } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { startConversation } = useChatActions();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  if (!product) return null;

  const handleAddToCart = () => {
    if (!user) {
      navigate("/auth", { state: { from: location } });
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({ title: "Selecione um tamanho", variant: "destructive" });
      return;
    }
    addToCart(product, quantity, selectedSize || undefined, selectedColor || undefined);
    toast({ 
      title: "Adicionado ao carrinho", 
      description: `${product.name} foi adicionado com sucesso.` 
    });
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate("/auth", { state: { from: location } });
      return;
    }
    
    setIsStartingChat(true);
    try {
      const conversationId = await startConversation(
        String(product.id),
        product.name,
        product.image,
        product.sellerId || "admin",
        product.sellerName || "Vendedor VURO"
      );
      
      if (conversationId) {
        navigate(`/chat?conversation=${conversationId}`);
      }
    } catch (error) {
      toast({ 
        title: "Erro ao iniciar conversa", 
        variant: "destructive" 
      });
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 px-4 lg:px-0">
      <div className="flex justify-between items-center hidden lg:flex">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors">Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-black/10" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/category/all" className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors">Shop</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-black/10" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-yellow-500">{product.brand}</p>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black uppercase tracking-tighter leading-tight mb-3 sm:mb-4">{product.name}</h1>
            <div className="space-y-1.5">
              <p className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">
                R$ {getDisplayPrice(product.price, 0)}
              </p>
              <p className="text-sm sm:text-base text-blue-600 font-medium">Frete: R$20,00</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => toggleFavorite(product.id)}
              className={cn(
                "p-2 border border-black/10 transition-colors",
                isFavorite(product.id) ? "bg-yellow-500 text-white border-yellow-500" : "hover:bg-black/5 text-black"
              )}
            >
              <Heart size={18} fill={isFavorite(product.id) ? "currentColor" : "none"} />
            </button>
            <button className="p-2 border border-black/10 hover:bg-black/5 text-black transition-colors">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8 py-6 sm:py-8 border-y border-black/10">
        {product.colors && product.colors.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-black">Cores</h3>
              {selectedColor && <span className="text-xs sm:text-sm font-bold text-yellow-500 uppercase">{selectedColor}</span>}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black uppercase tracking-widest border transition-all duration-500",
                    selectedColor === color 
                      ? "border-yellow-500 bg-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]" 
                      : "border-black/10 hover:border-black/40 text-black bg-black/5"
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-black">Tamanho</h3>
              <Link to="/about/size-guide" className="text-xs sm:text-sm font-bold text-black/40 hover:text-black underline uppercase">Guia</Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
              {product.sizes.map((size) => {
                let isAvailable = !product.availableSizes || 
                                  product.availableSizes.length === 0 || 
                                  product.availableSizes.includes(size);
                
                // Variantes têm prioridade no estoque
                if (product.variants && product.variants.length > 0 && selectedColor) {
                  const variant = product.variants.find(v => v.color === selectedColor);
                  if (variant) {
                    isAvailable = variant.sizes.includes(size);
                  } else {
                    // Se tem variantes mas a cor selecionada não está nas variantes,
                    // assumimos que não tem estoque específico definido
                    isAvailable = false;
                  }
                }
                
                return (
                  <button
                    key={size}
                    disabled={!isAvailable}
                    onClick={() => isAvailable && setSelectedSize(size)}
                    className={cn(
                      "h-12 flex items-center justify-center text-[11px] font-black border transition-all duration-500",
                      selectedSize === size 
                        ? "border-yellow-500 bg-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]" 
                        : isAvailable
                          ? "border-black/10 hover:border-black/40 text-black bg-black/5"
                          : "border-black/5 bg-black/2 text-black/20 cursor-not-allowed opacity-40"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-black/40">Quantidade</span>
          <div className="flex items-center bg-black/5 border border-black/10">
            <button
              onClick={decrementQuantity}
              className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center text-black/50 hover:text-black transition-colors"
            >
              <Minus size={18} />
            </button>
            <span className="h-12 sm:h-14 flex items-center px-4 sm:px-5 text-sm sm:text-base font-black min-w-[3rem] justify-center border-x border-black/10 text-black">
              {quantity}
            </span>
            <button
              onClick={incrementQuantity}
              className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center text-black/50 hover:text-black transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <Button 
          onClick={handleAddToCart}
          className="w-full h-14 sm:h-16 bg-yellow-500 text-white hover:bg-yellow-600 font-black text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] rounded-none shadow-[0_10px_30px_rgba(234,179,8,0.2)] transition-all hover:-translate-y-1 active:scale-[0.98] active:translate-y-0"
          data-testid="button-add-to-cart"
        >
          {(!selectedSize && product.sizes && product.sizes.length > 0) 
            ? "Selecione o Tamanho" 
            : "Adicionar à Sacola"}
        </Button>

        <Button 
          onClick={handleStartChat}
          disabled={isStartingChat}
          variant="outline"
          className="w-full h-12 sm:h-14 font-black text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-none border-2 border-black/20 hover:border-black hover:bg-black hover:text-white transition-all"
          data-testid="button-chat-seller"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {isStartingChat ? "Iniciando..." : "Falar com Vendedor"}
        </Button>
      </div>
    </div>
  );
};

export default ProductInfo;
