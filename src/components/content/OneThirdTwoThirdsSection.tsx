import logoNewbalance from "@/assets/logo-nb.webp";
import collectionDisplay from "@/assets/collection-display.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const OneThirdTwoThirdsSection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link to="/category/new-balance" className="lg:col-span-1 group block relative overflow-hidden bg-white border border-black/5">
          <div className="w-full h-[500px] lg:h-[800px] overflow-hidden bg-white flex items-center justify-center p-0">
            <img 
              src={logoNewbalance} 
              alt="New Balance collection" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-white/80 to-transparent">
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">Marca</span>
            <h3 className="text-3xl font-bold text-black mt-1 flex items-center gap-2">
              NEW BALANCE
              <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
          </div>
        </Link>

        <Link to="/category/all" className="lg:col-span-2 group block relative overflow-hidden">
          <div className="w-full h-[500px] lg:h-[800px] overflow-hidden bg-card">
            <img 
              src={collectionDisplay} 
              alt="Full sneaker collection" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-background via-background/80 to-transparent">
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">O Cofre</span>
            <h3 className="text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4 uppercase">
              EXPLORE A COLEÇÃO
            </h3>
            <p className="text-muted-foreground mb-4 max-w-lg">
              De achados raros a itens essenciais do dia a dia. Curadoria de peso para a cultura.
            </p>
            <span className="inline-flex items-center gap-2 text-primary font-semibold uppercase tracking-wider text-sm group-hover:gap-4 transition-all">
              Comprar Tudo
              <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default OneThirdTwoThirdsSection;