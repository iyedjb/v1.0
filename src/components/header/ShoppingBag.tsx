import { X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";

interface ShoppingBagProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[]; 
  updateQuantity: (id: string | number, quantity: number, size?: string, color?: string) => void;
  onViewFavorites?: () => void;
}

const ShoppingBag = ({ isOpen, onClose, cartItems, updateQuantity, onViewFavorites }: ShoppingBagProps) => {
  const { removeFromCart } = useStore();

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => {
    const priceStr = String(item.price).replace(/[^\d,.]/g, '').replace(',', '.');
    const price = parseFloat(priceStr);
    return isNaN(price) ? sum : sum + (price * item.quantity);
  }, 0);

  return (
    <div className="fixed inset-0 z-[150] h-screen">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm h-screen"
        onClick={onClose}
      />
      
      <div className="absolute right-0 top-0 h-screen w-full max-w-[400px] bg-white border-l border-black/10 animate-in slide-in-from-right duration-300 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-black/10 text-black">
          <h2 className="text-xl font-black uppercase tracking-tighter">Sua Sacola</h2>
          <button
            onClick={onClose}
            className="p-2 text-black/50 hover:text-black transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar text-black">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <p className="text-black/20 text-xs font-bold uppercase tracking-[0.2em] text-center">
                Sua sacola está vazia
              </p>
              <Button variant="outline" onClick={onClose} className="border-black/10 text-[10px] font-bold uppercase tracking-widest h-10">
                Começar a Comprar
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {cartItems.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-4 group">
                  <div className="w-24 h-24 bg-black/5 border border-black/10 overflow-hidden shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest truncate">{item.brand}</p>
                      <h3 className="text-sm font-black text-black uppercase truncate tracking-tight">{item.name}</h3>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                      className="text-black/20 hover:text-red-500 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.selectedSize && (
                      <span className="text-[10px] font-bold text-black/40 border border-black/5 px-2 py-0.5 bg-black/5">
                        T: {item.selectedSize}
                      </span>
                    )}
                    {item.selectedColor && (
                      <span className="text-[10px] font-bold text-black/40 border border-black/5 px-2 py-0.5 bg-black/5">
                        C: {item.selectedColor}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-yellow-500 p-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center bg-black/10 border-2 border-black">
                      <button 
                        onClick={() => updateQuantity(item.id, (Number(item.quantity) || 1) - 1, item.selectedSize, item.selectedColor)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-black/20 text-black font-black"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-sm font-black text-black">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, (Number(item.quantity) || 1) + 1, item.selectedSize, item.selectedColor)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-black/20 text-black font-black"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-lg font-black text-black drop-shadow-sm">
                      {typeof item.price === 'number' 
                        ? item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : item.price}
                    </p>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-black/10 bg-black/[0.02] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">Subtotal</span>
              <span className="text-xl font-black text-black">
                {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            
            <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">
              Frete e impostos calculados no checkout
            </p>
            
            <div className="grid gap-3 pt-2">
              <Button 
                asChild 
                className="w-full h-16 bg-yellow-500 hover:bg-black text-white font-black uppercase tracking-[0.3em] rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black transition-all hover:-translate-y-1 active:translate-y-0"
                onClick={onClose}
              >
                <Link to="/checkout" className="flex items-center justify-center gap-3">
                  Finalizar Compra
                  <ArrowRight size={20} />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-16 border-4 border-black text-black hover:bg-yellow-500 font-black uppercase tracking-[0.3em] rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 active:translate-y-0"
                onClick={onClose}
              >
                Continuar Comprando
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingBag;
