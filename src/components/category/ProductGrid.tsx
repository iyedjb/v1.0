import { Link } from "react-router-dom";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayPrice } from "@/lib/utils";

interface ProductGridProps {
  products: any[];
  loading: boolean;
}

const ProductImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="aspect-[4/4.2] overflow-hidden bg-[#F0EFed] relative">
      {!loaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.05] ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/8 to-transparent pointer-events-none" />
    </div>
  );
};

const ProductGrid = ({ products = [], loading }: ProductGridProps) => {
  if (loading) {
    return (
      <section className="w-full max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden">
              <Skeleton className="aspect-[4/4.2] w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {products.length > 0 ? (
          products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group"
              data-testid={`product-card-${product.id}`}
            >
              <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:-translate-y-1 flex flex-col h-full shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100/60 hover:border-[#FACC15]/50">
                <div className="relative overflow-hidden">
                  <ProductImage src={product.image} alt={product.name} />
                  {product.sold && (
                    <div className="absolute inset-0 bg-black/65 flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full">
                        VENDIDO
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 md:p-3.5 flex flex-col flex-1">
                  <p className="text-[9px] md:text-[10px] font-black text-[#FACC15] uppercase tracking-[0.12em] mb-1">
                    {product.brand}
                  </p>
                  <h3 className="text-[11px] md:text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug flex-1 mb-3">
                    {product.name}
                  </h3>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[11px] text-gray-500 font-medium mr-0.5">R$</span>
                      <span className="text-[1.15rem] md:text-[1.25rem] font-black text-gray-900 leading-none">
                        {getDisplayPrice(product.price, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-sm font-semibold text-gray-400 tracking-wider uppercase">
            Nenhum produto encontrado
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
