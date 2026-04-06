import heroSneaker from "@/assets/hero-sneaker.jpg";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const LargeHero = () => {
  return (
    <section className="w-full mb-8 md:mb-16 relative">
      <div className="w-full aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] overflow-hidden relative">
        <img 
          src={heroSneaker} 
          alt="Featured sneaker collection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 md:bottom-8 md:left-8 md:right-8">
          <span className="text-primary text-xs sm:text-sm font-semibold tracking-widest uppercase mb-1 sm:mb-2 block">
            Lançamento Limitado
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            JORDAN 1 CHICAGO
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/80 mb-4 sm:mb-6 max-w-xl">
            A silhueta mais icônica está de volta. Não perca essa chance.
          </p>
          <Link 
            to="/category/nike"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-primary-hover transition-colors"
          >
            Comprar Agora
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LargeHero;