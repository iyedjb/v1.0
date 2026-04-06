import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImageGallery from "../components/product/ProductImageGallery";
import { useProducts, type Product, type ProductVariant } from "@/hooks/use-products";
import { useCart } from "@/contexts/CartContext";
import { getPriceInCents, formatPriceFromCents } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { ShoppingBag, Heart, Share2, ArrowLeft, MessageCircle, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const COLOR_MAP: Record<string, string> = {
  PRETO: "#1a1a1a",
  preto: "#1a1a1a",
  "G.PRETO": "#2d2d2d",
  "PRETOV.PRETO": "#111",
  BRANCO: "#f5f5f5",
  BRACO: "#f5f5f5",
  "L.BRANCO": "#fffef0",
  "P.BRANCO": "#f0f0f0",
  "P.BRACO": "#f0f0f0",
  "AZ.BRANCO": "#e8f0ff",
  BEGE: "#d4b896",
  bege: "#d4b896",
  MARROM: "#7c4a1e",
  CINZA: "#9ca3af",
  cinza: "#9ca3af",
  "AZ.CINZA": "#7b8fa1",
  AZUL: "#2563eb",
  AZIL: "#2563eb",
  "P.AZUL": "#93c5fd",
  ROSA: "#f9a8d4",
  "P.ROSA": "#fce7f3",
  "B.ROSA": "#fbcfe8",
  ROXO: "#7c3aed",
  VERMELHO: "#dc2626",
  vermelho: "#dc2626",
  LARANGA: "#f97316",
  GOLD: "#d4af37",
};

function getColorSwatch(colorName: string): string {
  if (!colorName) return "#ccc";
  const normalized = colorName.toUpperCase().trim();
  return COLOR_MAP[colorName] || COLOR_MAP[normalized] || "#ccc";
}

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useStore();
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<{ freeShipping: boolean; standardShippingCost: number }>({ freeShipping: false, standardShippingCost: 2500 });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s) setStoreSettings({ freeShipping: !!s.freeShipping, standardShippingCost: s.standardShippingCost ?? 2500 });
    }).catch(() => {});
  }, []);

  const product = useMemo(() => products.find(p => String(p.id) === productId), [products, productId]);

  const isProductFavorite = product ? isFavorite(product.id) : false;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name || "VURO", text: `${product?.name}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copiado!" });
      }
    } catch {}
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleFavorite(product.id);
  };

  const handleTalkToVega = () => {
    navigate("/?chat=open");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-lg font-semibold text-gray-500">Produto não encontrado</p>
          <button onClick={() => navigate("/")} className="text-sm underline text-gray-400">Voltar ao início</button>
        </div>
      </div>
    );
  }

  const colors: ProductVariant[] = product.variants && product.variants.length > 0
    ? product.variants
    : (product.colors || []).map(c => ({ color: c, sizes: [], image: undefined }));
  const activeVariant = selectedColorIndex !== null ? colors[selectedColorIndex] : null;
  const selectedColorName = activeVariant?.color || null;
  const availableSizesForColor = (activeVariant?.sizes?.length ? activeVariant.sizes : (product.sizes || [])).filter(Boolean);

  const displayProduct: Product = activeVariant?.image
    ? { ...product, images: [activeVariant.image, ...(product.images?.filter(img => img !== activeVariant.image) || [])] }
    : product;

  const handleAddToCart = () => {
    if (!user) {
      toast({ title: "Faça login para continuar", description: "Você precisa ter uma conta para adicionar ao carrinho." });
      navigate("/auth");
      return;
    }
    if (!selectedSize && availableSizesForColor.length > 0) {
      toast({ title: "Selecione um tamanho", description: "Escolha o seu número antes de continuar." });
      return;
    }
    addItem({
      id: `${product.id}-${selectedSize || "unique"}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: getPriceInCents(product.price),
      image: displayProduct.images?.[0] || "",
      size: selectedSize || "",
      color: selectedColorName || "",
      quantity: 1,
      freeShipping: !!product.freeShipping,
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      toast({ title: "Faça login para continuar", description: "Você precisa ter uma conta para comprar." });
      navigate("/auth");
      return;
    }
    if (!selectedSize && availableSizesForColor.length > 0) {
      toast({ title: "Selecione um tamanho", description: "Escolha o seu número antes de continuar." });
      return;
    }
    addItem({
      id: `${product.id}-${selectedSize || "unique"}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: getPriceInCents(product.price),
      image: displayProduct.images?.[0] || "",
      size: selectedSize || "",
      color: selectedColorName || "",
      quantity: 1,
      freeShipping: !!product.freeShipping,
    });
    navigate("/checkout");
  };

  const priceInCents = getPriceInCents(product.price);
  const priceFormatted = formatPriceFromCents(priceInCents);
  const installmentValue = formatPriceFromCents(Math.round(priceInCents / 12));

  return (
    <div className="min-h-screen bg-white text-black">
      <Header />

      <main className="pb-28 md:pb-12">

        {/* Breadcrumb bar */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-12 flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-black transition-colors text-xs font-medium"
              data-testid="button-back"
            >
              <ArrowLeft size={14} />
              <span>Voltar</span>
            </button>
            <span className="text-gray-200">/</span>
            <span className="text-gray-400 text-xs">{product.brand}</span>
            <span className="text-gray-200">/</span>
            <span className="text-black text-xs font-semibold truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        {/* Main grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 xl:gap-28">

            {/* Left: Image */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ProductImageGallery product={displayProduct} />
            </div>

            {/* Right: Info */}
            <div className="flex flex-col gap-6">

              {/* Brand + Name + Stock */}
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FACC15]">{product.brand}</p>
                </div>
                <h1 className="text-3xl md:text-4xl xl:text-5xl font-black uppercase tracking-tight leading-none mb-5">{product.name}</h1>

                {/* Price block */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{priceFormatted}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    ou <span className="font-bold text-gray-700">12x de {installmentValue}</span> sem juros no cartão
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Color selector */}
              {colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Cor</span>
                    {selectedColorName && (
                      <span className="text-[11px] font-bold text-black uppercase tracking-wider">{selectedColorName}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((variant: any, index: number) => {
                      const isSelected = selectedColorIndex === index;
                      const colorDot = getColorSwatch(variant.color);
                      return (
                        <button
                          key={`${variant.color}-${index}`}
                          onClick={() => { setSelectedColorIndex(index); setSelectedSize(null); }}
                          title={variant.color}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-full border transition-all duration-200",
                            isSelected
                              ? "bg-black text-white border-black shadow-md"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-500 hover:shadow-sm"
                          )}
                          data-testid={`button-color-${index}`}
                        >
                          {variant.image ? (
                            <div className="w-4 h-4 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                              <img src={variant.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/50 shadow-inner"
                              style={{ background: colorDot }}
                            />
                          )}
                          {variant.color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Tamanho</span>
                  <button className="text-[10px] font-semibold text-gray-400 hover:text-black underline underline-offset-2 transition-colors">
                    Guia de medidas
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizesForColor.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "h-11 min-w-[52px] px-3 flex items-center justify-center text-sm font-bold rounded-xl border-2 transition-all duration-150",
                        selectedSize === size
                          ? "bg-black text-white border-black shadow-lg scale-105"
                          : "bg-white text-gray-800 border-gray-200 hover:border-gray-800 hover:shadow-sm"
                      )}
                      data-testid={`button-size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {!selectedSize && availableSizesForColor.length > 0 && (
                  <p className="mt-2.5 text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#FACC15] inline-block" />
                    Selecione um tamanho para continuar
                  </p>
                )}
              </div>

              {/* CTA Buttons — desktop only */}
              <div className="hidden md:flex flex-col gap-2.5">
                <button
                  onClick={handleBuyNow}
                  className="w-full h-14 bg-[#FACC15] hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-[0.15em] rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-yellow-200"
                  data-testid="button-buy-now"
                >
                  Comprar Agora
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  data-testid="button-add-cart"
                >
                  <ShoppingBag size={16} />
                  Adicionar ao Carrinho
                </button>
                <div className="flex gap-2 mt-0.5">
                  <button
                    onClick={handleToggleFavorite}
                    className={cn(
                      "flex-1 h-10 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all",
                      isProductFavorite
                        ? "border-red-200 bg-red-50 text-red-500"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"
                    )}
                    data-testid="button-favorite"
                  >
                    <Heart size={14} className={isProductFavorite ? "fill-current" : ""} />
                    {isProductFavorite ? "Favoritado" : "Favoritar"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-black transition-all"
                    data-testid="button-share"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={handleTalkToVega}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-black transition-all"
                    data-testid="button-talk-eduna"
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>

              {/* Trust badges — horizontal 3-col */}
              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-5">
                {[
                  { icon: RotateCcw, label: "Devolução grátis", sub: "30 dias" },
                  { icon: ShieldCheck, label: "Compra Garantida", sub: "100% seguro" },
                  (storeSettings.freeShipping || product?.freeShipping)
                    ? { icon: Truck, label: "Frete Grátis", sub: "Neste produto!" }
                    : { icon: Truck, label: "Frete Padrão", sub: `R$ ${(storeSettings.standardShippingCost / 100).toFixed(2).replace('.', ',')}` },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-[#FACC15]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-700 leading-tight">{label}</p>
                      <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Mobile sticky buy bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,12px)+6px)]">
        <div className="flex gap-2">
          <button
            onClick={handleToggleFavorite}
            className={cn(
              "w-12 h-12 flex-shrink-0 border-2 rounded-2xl flex items-center justify-center transition-all",
              isProductFavorite ? "border-red-200 bg-red-50 text-red-500" : "border-gray-200 text-gray-400"
            )}
            data-testid="button-favorite-mobile"
          >
            <Heart size={17} className={isProductFavorite ? "fill-current" : ""} />
          </button>

          <button
            onClick={handleAddToCart}
            className="flex-1 h-12 bg-black text-white font-bold text-sm uppercase tracking-wide rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            data-testid="button-add-cart-mobile"
          >
            <ShoppingBag size={16} />
            Carrinho
          </button>

          <button
            onClick={handleBuyNow}
            className="flex-1 h-12 bg-[#FACC15] text-black font-black text-sm uppercase tracking-wide rounded-2xl transition-all active:scale-[0.98]"
            data-testid="button-buy-now-mobile"
          >
            Comprar
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
