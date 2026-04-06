import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Link } from "react-router-dom";
import { getDisplayPrice } from "@/lib/utils";
import { Truck } from "lucide-react";

const ProductCarousel = ({ products = [], loading, hideHeader = false }: { products?: any[], loading?: boolean, hideHeader?: boolean }) => {
  if (loading) return <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">Carregando...</div>;
  if (!products.length) return null;

  return (
    <section className="w-full mb-12">
      {!hideHeader && (
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-bold text-[#FACC15] uppercase tracking-widest mb-1">Destaques</p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">MAIS QUENTES</h2>
          </div>
          <Link
            to="/category/all"
            className="text-xs font-semibold text-gray-400 hover:text-gray-900 uppercase tracking-wider transition-colors"
          >
            Ver Todos
          </Link>
        </div>
      )}

      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 pr-3">
              <Link to={`/product/${product.id}`} className="group block">
                <div className="bg-white rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="aspect-square overflow-hidden bg-[#F0EFed]">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-[#FACC15] uppercase tracking-widest mb-1">{product.brand}</p>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 mb-2 leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-base md:text-lg font-black text-gray-900">
                      R$ {getDisplayPrice(product.price, 0)}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <Truck size={9} />
                      Frete gratis acima R$300
                    </p>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default ProductCarousel;
