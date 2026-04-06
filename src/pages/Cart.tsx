import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Lock, Pencil, X, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/header/Header";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/use-products";
import { formatPriceFromCents } from "@/lib/utils";

interface ProductDetails {
  sizes: string[];
  colors: string[];
}

const Cart = () => {
  const { items, updateQuantity, removeItem, updateItem, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSize, setEditSize] = useState<string>("");
  const [editColor, setEditColor] = useState<string>("");
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const [storeSettings, setStoreSettings] = useState<{ freeShipping: boolean; standardShippingCost: number }>({ freeShipping: false, standardShippingCost: 2000 });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s) setStoreSettings({ freeShipping: !!s.freeShipping, standardShippingCost: s.standardShippingCost ?? 2000 });
    }).catch(() => {});
  }, []);

  const allItemsFreeShipping = items.length > 0 && items.every(item => {
    if (item.freeShipping) return true;
    const product = products.find(p => String(p.id) === String(item.productId));
    return !!product?.freeShipping;
  });
  const isShippingFree = storeSettings.freeShipping || allItemsFreeShipping;
  const shippingCents = isShippingFree ? 0 : storeSettings.standardShippingCost;

  const finalPrice = totalPrice;
  const total = finalPrice + shippingCents;

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate("/checkout");
    }
  };

  const openEdit = async (item: typeof items[0]) => {
    setEditingId(item.id);
    setEditSize(item.size);
    setEditColor(item.color || "");
    setProductDetails(null);
    setLoadingProduct(true);
    try {
      const res = await fetch(`/api/products/${item.productId}`);
      if (res.ok) {
        const data = await res.json();
        setProductDetails({ sizes: data.sizes || [], colors: data.colors || [] });
      }
    } catch {}
    setLoadingProduct(false);
  };

  const closeEdit = () => {
    setEditingId(null);
    setProductDetails(null);
  };

  const saveEdit = (id: string) => {
    updateItem(id, { size: editSize, color: editColor || undefined });
    closeEdit();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center py-8 px-4 pb-24">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShoppingBag className="w-9 h-9 text-gray-300" />
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-1">Carrinho vazio</h1>
            <p className="text-sm text-gray-400 mb-6">Adicione produtos para continuar</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#FACC15] text-black font-bold text-sm px-6 py-3 rounded-2xl"
              data-testid="button-continue-shopping"
            >
              Explorar Produtos
              <ArrowRight size={15} />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Header />
      <main className="flex-grow px-3 py-4 pb-36 md:pb-12">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center justify-between mb-3 px-1">
            <h1 className="text-lg font-black text-gray-900">Meu Carrinho</h1>
            <span className="text-sm text-gray-400 font-medium">{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-3">
            {items.map((item, idx) => (
              <div
                key={`${item.id}-${item.size}`}
                className={`${idx < items.length - 1 ? "border-b border-gray-50" : ""}`}
                data-testid={`cart-item-${item.id}`}
              >
                {/* Main item row */}
                <div className="flex gap-3 p-4">
                  <div className="w-[72px] h-[72px] bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-[#FACC15] uppercase tracking-widest mb-0.5">{item.brand}</p>
                        <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.size && (
                            <p className="text-xs text-gray-400">
                              Tam: <span className="font-bold text-gray-600">{item.size}</span>
                            </p>
                          )}
                          {item.color && (
                            <p className="text-xs text-gray-400">
                              Cor: <span className="font-bold text-gray-600">{item.color}</span>
                            </p>
                          )}
                          <button
                            onClick={() => editingId === item.id ? closeEdit() : openEdit(item)}
                            className="flex items-center gap-1 text-[10px] font-bold text-[#FACC15] uppercase tracking-wide"
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Pencil size={10} />
                            Editar
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <p className="font-black text-gray-900 text-base">{formatPriceFromCents(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>

                {/* Inline edit panel */}
                {editingId === item.id && (
                  <div className="mx-4 mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    {loadingProduct ? (
                      <div className="flex items-center justify-center py-3">
                        <div className="w-5 h-5 border-2 border-[#FACC15] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Size picker */}
                        {productDetails && productDetails.sizes.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tamanho</p>
                            <div className="flex flex-wrap gap-1.5">
                              {productDetails.sizes.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setEditSize(s)}
                                  className={`h-8 px-3 rounded-lg text-xs font-bold border transition-all ${
                                    editSize === s
                                      ? "bg-[#FACC15] border-[#FACC15] text-black"
                                      : "bg-white border-gray-200 text-gray-600"
                                  }`}
                                  data-testid={`edit-size-${s}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Color picker */}
                        {productDetails && productDetails.colors.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cor</p>
                            <div className="flex flex-wrap gap-1.5">
                              {productDetails.colors.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setEditColor(c)}
                                  className={`h-8 px-3 rounded-lg text-xs font-bold border transition-all ${
                                    editColor === c
                                      ? "bg-gray-900 border-gray-900 text-white"
                                      : "bg-white border-gray-200 text-gray-600"
                                  }`}
                                  data-testid={`edit-color-${c}`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="flex-1 h-9 bg-[#FACC15] text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
                            data-testid={`button-save-edit-${item.id}`}
                          >
                            <Check size={13} />
                            Salvar
                          </button>
                          <button
                            onClick={closeEdit}
                            className="h-9 px-3 border-2 border-gray-200 text-gray-500 font-bold text-xs rounded-xl flex items-center justify-center"
                            data-testid={`button-cancel-edit-${item.id}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Produtos ({totalItems})</span>
              <span>{formatPriceFromCents(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Frete</span>
              <span className={isShippingFree ? "text-green-600 font-bold" : "text-gray-700"}>
                {isShippingFree ? "Grátis 🎉" : formatPriceFromCents(shippingCents)}
              </span>
            </div>
            <div className="flex justify-between font-black text-gray-900 text-lg pt-2 border-t border-gray-50">
              <span>Total</span>
              <span>{formatPriceFromCents(total)}</span>
            </div>
          </div>

          <div className="space-y-2 md:hidden">
            <button
              onClick={handleCheckout}
              className="w-full h-14 bg-[#FACC15] text-black font-black text-sm uppercase tracking-wide rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-100 active:scale-[0.98] transition-all"
              data-testid="button-go-to-checkout"
            >
              <Lock size={15} />
              Finalizar Compra
              <ArrowRight size={15} />
            </button>
            <Link
              to="/"
              className="w-full h-11 border-2 border-gray-200 text-gray-500 font-semibold text-sm rounded-2xl flex items-center justify-center transition-all hover:border-gray-400"
              data-testid="button-continue-shopping"
            >
              Continuar Comprando
            </Link>
          </div>

          <div className="hidden md:space-y-2 md:block">
            <button
              onClick={handleCheckout}
              className="w-full h-14 bg-[#FACC15] text-black font-black text-sm uppercase tracking-wide rounded-2xl flex items-center justify-center gap-2"
              data-testid="button-go-to-checkout-desktop"
            >
              <Lock size={15} />
              Finalizar Compra
              <ArrowRight size={15} />
            </button>
            <Link
              to="/"
              className="w-full h-11 border-2 border-gray-200 text-gray-500 font-semibold text-sm rounded-2xl flex items-center justify-center"
              data-testid="button-continue-shopping-desktop"
            >
              Continuar Comprando
            </Link>
          </div>

        </div>
      </main>

      {/* Mobile sticky checkout bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,10px)+6px)] z-50">
        <button
          onClick={handleCheckout}
          className="w-full h-14 bg-[#FACC15] text-black font-black text-sm uppercase tracking-wide rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-100 active:scale-[0.98] transition-all"
          data-testid="button-go-to-checkout-mobile"
        >
          <Lock size={15} />
          Finalizar Compra • {formatPriceFromCents(total)}
        </button>
      </div>
    </div>
  );
};

export default Cart;
