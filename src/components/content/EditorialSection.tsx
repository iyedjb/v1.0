import lifestyleStreet from "@/assets/lifestyle-street.jpg";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const EditorialSection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 max-w-[630px]">
          <span className="text-primary text-xs font-semibold tracking-widest uppercase">Nossa História</span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            FEITO PARA AS RUAS
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            A VURO nasceu do asfalto. Nós não apenas vendemos tênis — nós fazemos a curadoria da cultura. 
            Cada par em nosso estoque conta uma história, representa um momento, carrega o peso da autenticidade 
            que as ruas exigem.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            De lançamentos limitados a clássicos atemporais, trazemos o que realmente importa. 
            Sem falsificações, sem concessões, apenas a pura cultura sneaker.
          </p>
          <Link 
            to="/about/our-story" 
            className="inline-flex items-center gap-2 text-primary font-semibold uppercase tracking-wider text-sm hover:gap-4 transition-all"
          >
            <span>Saiba Mais</span>
            <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="order-first md:order-last">
          <div className="w-full aspect-square overflow-hidden">
            <img 
              src={lifestyleStreet} 
              alt="Street style sneakers" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialSection;