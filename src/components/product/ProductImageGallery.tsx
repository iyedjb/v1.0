import { useState, useRef, useEffect } from "react";
import { Product } from "@/hooks/use-products";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  product?: Product;
}

const ProductImageGallery = ({ product }: ProductImageGalleryProps) => {
  const productImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image 
      ? [product.image] 
      : ["/src/assets/hero-sneaker.jpg"];

  const [activeImage, setActiveImage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevImageRef = useRef(product?.image);

  const nextImage = () => setActiveImage((prev) => (prev + 1) % productImages.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + productImages.length) % productImages.length);

  useEffect(() => {
    if (prevImageRef.current !== product?.image) {
      setActiveImage(0);
      prevImageRef.current = product?.image;
    }
  }, [product?.image]);

  useEffect(() => {
    if (scrollRef.current) {
      const activeThumb = scrollRef.current.children[activeImage] as HTMLElement;
      if (activeThumb) {
        scrollRef.current.scrollTo({
          left: activeThumb.offsetLeft - 20,
          behavior: 'smooth'
        });
      }
    }
  }, [activeImage]);

  if (!product) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full">
        <div className="relative aspect-square bg-white overflow-hidden group touch-pan-y rounded-2xl border border-black/5">
          <img
            src={productImages[activeImage]}
            alt={product.name}
            loading="eager"
            decoding="async"
            className="w-full h-full object-contain p-4"
          />
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
          
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 lg:hidden">
            {productImages.map((_, i) => (
              <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === activeImage ? "bg-yellow-500 w-4" : "bg-black/20")} />
            ))}
          </div>

          {productImages.length > 1 && (
            <div className="hidden lg:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={prevImage} className="w-10 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center text-black hover:bg-yellow-500 hover:text-white transition-colors border border-black/5">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextImage} className="w-10 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center text-black hover:bg-yellow-500 hover:text-white transition-colors border border-black/5">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {productImages.length > 1 && (
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1"
        >
          {productImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-xl border-2 transition-all duration-300 overflow-hidden bg-white",
                activeImage === index ? "border-yellow-500 scale-105 shadow-md" : "border-black/5 hover:border-black/20"
              )}
            >
              <img
                src={img}
                alt={`${product.name} view ${index + 1}`}
                className="w-full h-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
