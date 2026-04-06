import ProductGrid from "@/components/category/ProductGrid";
import { useProducts } from "@/hooks/use-products";
import Navigation from "@/components/header/Navigation";
import Footer from "@/components/footer/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { useState, useEffect } from "react";

const HERO_SLIDES = [
  {
    image: "/products/-OjEgPGO__RssGL7t8Bn_0.jpg",
    brand: "Nike",
    name: "Zoom Pegasus Trail",
    tag: "DESTAQUE",
    slug: "nike",
  },
  {
    image: "/products/-OipXnbKJFChe86kZaK0_main.jpg",
    brand: "Adidas",
    name: "Run Falcon",
    tag: "NOVO",
    slug: "adidas",
  },
  {
    image: "/products/-Oipb_hESBQBA4dkelY3_main.jpg",
    brand: "Adidas",
    name: "Superstar",
    tag: "EM ALTA",
    slug: "adidas",
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const slide = HERO_SLIDES[current];

  useEffect(() => {
    const t = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % HERO_SLIDES.length);
        setAnimating(false);
      }, 300);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative bg-[#0a0a0a] rounded-2xl overflow-hidden min-h-[220px] md:min-h-[420px]">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_80%,rgba(250,204,21,0.18),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(250,204,21,0.06),transparent_50%)]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-[#FACC15]/60 via-[#FACC15]/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-48 h-px bg-gradient-to-r from-[#FACC15]/20 to-transparent" />

      {/* Shoe image — visible on all sizes, right side absolute */}
      <div className="absolute right-0 top-0 bottom-0 w-[52%] md:w-[46%] lg:w-[42%] pointer-events-none">
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(250,204,21,0.12),transparent_65%)]" />
        <img
          key={current}
          src={slide.image}
          alt={slide.name}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-400 ${animating ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'}`}
        />
        <div className="absolute top-3 right-3 z-20 bg-[#FACC15] text-black text-[9px] font-black px-2.5 py-1 rounded-full tracking-wide">
          {slide.tag}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 md:px-12 lg:px-16 py-7 md:py-0 flex items-center min-h-[220px] md:min-h-[420px]">
        <div className="max-w-[54%] md:max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-[#FACC15]/10 border border-[#FACC15]/25 text-[#FACC15] px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-5">
            <Zap size={8} fill="#FACC15" />
            Nova Coleção 2026
          </div>
          <h1 className="text-white text-[clamp(1.75rem,7.5vw,5rem)] md:text-7xl font-black leading-[0.88] mb-3 md:mb-5 tracking-tight">
            SNEAKERS<br />
            <span className="text-[#FACC15]">EXCLUSIVOS</span>
          </h1>
          <p className="text-white/40 text-[10px] md:text-base mb-5 md:mb-8 leading-relaxed font-light hidden sm:block">
            Os melhores tênis do Brasil com<br className="hidden md:inline" /> garantia de autenticidade.
          </p>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <Link
              to="/category/sneakers"
              className="inline-flex items-center gap-1.5 bg-[#FACC15] text-black text-[11px] md:text-sm font-black px-4 md:px-8 py-2 md:py-4 rounded-full hover-elevate"
              data-testid="link-ver-colecao"
            >
              Ver Coleção
              <ArrowRight size={12} />
            </Link>
            <Link
              to="/category/sneakers"
              className="inline-flex items-center gap-1.5 bg-white/8 border border-white/12 text-white text-[11px] md:text-sm font-semibold px-4 md:px-7 py-2 md:py-4 rounded-full hover:bg-white/12 transition-all"
              data-testid="link-ofertas"
            >
              Ver Ofertas
            </Link>
          </div>

          <div className="flex items-center gap-4 md:gap-6 mt-5 md:mt-9">
            {[["45+", "Modelos"], ["100%", "Autênticos"], ["7–15", "Dias úteis"]].map(([val, label], i, arr) => (
              <div key={label} className="flex items-center gap-4 md:gap-6">
                <div>
                  <p className="text-white font-black text-sm md:text-2xl leading-none">{val}</p>
                  <p className="text-white/25 text-[8px] md:text-[9px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-6 bg-white/10" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 z-20 flex items-center gap-1.5">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-200 ${i === current ? 'w-5 h-1.5 bg-[#FACC15]' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
};


const BrandCards = () => {
  const brands = [
    { name: "Nike", slug: "nike" },
    { name: "Adidas", slug: "adidas" },
    { name: "Jordan", slug: "jordan" },
    { name: "New Balance", slug: "new-balance" },
    { name: "Puma", slug: "puma" },
    { name: "Vans", slug: "vans" },
    { name: "Mizuno", slug: "mizuno" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 md:grid md:grid-cols-7 md:gap-2">
      {brands.map((brand) => (
        <Link
          key={brand.slug}
          to={`/category/${brand.slug}`}
          className="group bg-white border border-gray-100 hover:border-[#FACC15]/70 hover:shadow-[0_2px_12px_rgba(250,204,21,0.12)] rounded-xl px-3 py-3.5 flex flex-col justify-center items-center text-center transition-all duration-200 flex-shrink-0 min-w-[88px] md:min-w-0 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
          data-testid={`link-brand-${brand.slug}`}
        >
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FACC15] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center rounded-b-xl" />
          <h3 className="text-[#0a0a0a] text-[11px] font-black leading-tight whitespace-nowrap tracking-tight group-hover:text-[#0a0a0a] transition-colors">{brand.name}</h3>
        </Link>
      ))}
    </div>
  );
};



const SectionHeader = ({ title, subtitle, link }: { title: string; subtitle?: string; link?: string }) => (
  <div className="flex items-end justify-between mb-5 md:mb-6">
    <div>
      <div className="flex items-center gap-2.5 mb-0.5">
        <div className="w-1 h-5 bg-[#FACC15] rounded-full" />
        <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
      </div>
      {subtitle && <p className="text-[11px] text-gray-400 mt-1 font-normal ml-3.5">{subtitle}</p>}
    </div>
    {link && (
      <Link
        to={link}
        className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors flex-shrink-0 ml-4 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-full"
        data-testid="link-ver-todos"
      >
        Ver todos <ArrowRight size={12} />
      </Link>
    )}
  </div>
);

const Index = () => {
  const { products, loading } = useProducts();

  const featuredProducts = [...products]
    .filter(p => !p.sold)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return Number(b.price) - Number(a.price);
    });

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation />
      <main className="max-w-[1440px] mx-auto pb-28">
        <div className="px-3 md:px-6 lg:px-8 pt-3 md:pt-6 space-y-2.5 md:space-y-3">
          <HeroBanner />
        </div>

        <div className="px-3 md:px-6 lg:px-8 pt-8 md:pt-12">
          <SectionHeader
            title="Destaques"
            subtitle="Os tênis mais procurados desta semana"
            link="/category/sneakers"
          />
          <ProductGrid products={featuredProducts} loading={loading} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
