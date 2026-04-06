import logoNike from "@/assets/logo-nike.webp";
import logoAdidas from "@/assets/logo-adidas.webp";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FiftyFiftySection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/category/nike" className="group block relative overflow-hidden bg-black">
          <div className="w-full aspect-square overflow-hidden bg-black flex items-center justify-center p-0">
            <img 
              src={logoNike} 
              alt="Nike collection" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">Marca</span>
            <h3 className="text-3xl font-bold text-white mt-1 flex items-center gap-2">
              NIKE
              <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
          </div>
        </Link>

        <Link to="/category/adidas" className="group block relative overflow-hidden bg-black">
          <div className="w-full aspect-square overflow-hidden bg-black flex items-center justify-center p-0">
            <img 
              src={logoAdidas} 
              alt="Adidas collection" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-primary text-xs font-semibold tracking-widest uppercase">Marca</span>
            <h3 className="text-3xl font-bold text-white mt-1 flex items-center gap-2">
              ADIDAS
              <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default FiftyFiftySection;