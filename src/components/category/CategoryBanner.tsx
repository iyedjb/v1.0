import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&q=70",
    tag: "DROP EXCLUSIVO",
    title: "ESTILO",
    titleHighlight: "URBANO",
    subtitle: "ATÉ 50% OFF",
    description: "Confira a nova coleção de sneakers premium com design exclusivo.",
    cta: "VER OFERTAS",
    overlay: "bg-black/60",
    theme: "dark"
  },
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    tag: "NOVA ERA",
    title: "NOVA",
    titleHighlight: "ERA",
    subtitle: "STREETWEAR",
    description: "O futuro da moda urbana chegou. Descubra a nova era do estilo.",
    cta: "VER MAIS",
    overlay: "bg-black/50",
    theme: "dark"
  },
  {
    image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=70",
    tag: "THE VAULT",
    title: "THE",
    titleHighlight: "VAULT",
    subtitle: "EXCLUSIVOS",
    description: "Acesso antecipado aos modelos mais raros do mercado mundial.",
    cta: "ENTRAR AGORA",
    overlay: "bg-black/70",
    theme: "dark"
  }
];

const CategoryBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="w-full mb-16">
      <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[85vh] overflow-hidden group">
        {/* Urban Texture Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-10 mix-blend-multiply">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-110 invisible'}`}
          >
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover transition-transform duration-[10000ms] ease-linear transform scale-110 group-hover:scale-125"
            />
            <div className={`absolute inset-0 transition-colors duration-1000 ${slide.overlay}`}></div>
            
            <div className="absolute inset-0 flex items-center px-6 md:px-16 lg:px-24 z-20">
              <div className="w-full max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                <div className={`space-y-6 md:space-y-10 transition-all duration-700 delay-300 max-w-4xl ${index === currentSlide ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
                  <div className="flex flex-col gap-4 md:gap-8">
                    <span className={`${slide.theme === 'dark' ? 'bg-yellow-500 text-black' : 'bg-black text-white'} text-xs md:text-base font-black uppercase tracking-[0.6em] px-6 py-2.5 w-fit border-2 border-current shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}>
                      {slide.tag}
                    </span>
                    <h2 className={`text-5xl sm:text-7xl md:text-9xl lg:text-[10rem] font-black uppercase tracking-tighter leading-[0.8] transition-all duration-700 ${slide.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      {slide.title} <br /> 
                      <span className="text-yellow-500 italic drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] md:drop-shadow-[12px_12px_0px_rgba(0,0,0,1)]">
                        {slide.titleHighlight}
                      </span>
                    </h2>
                    <h3 className={`text-2xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight opacity-90 italic ${slide.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      {slide.subtitle}
                    </h3>
                  </div>
                  
                  <div className="pt-6 flex items-center gap-8">
                    <Link 
                      to="/category/all" 
                      className={`inline-flex items-center gap-6 px-12 py-8 md:px-20 md:py-12 font-black text-base md:text-3xl uppercase tracking-[0.3em] transition-all border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 active:translate-y-0 group/btn ${
                        slide.theme === 'dark' ? 'bg-white text-black hover:bg-yellow-500' : 'bg-black text-white hover:bg-yellow-500 hover:text-black'
                      }`}
                    >
                      {slide.cta}
                      <ArrowRight size={40} className="group-hover/btn:translate-x-6 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Dynamic Controls */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
          <button onClick={prevSlide} className="text-white/40 hover:text-yellow-500 transition-colors hidden md:block"><ChevronLeft size={48} /></button>
          <div className="flex gap-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-4 rounded-full transition-all duration-500 border-2 border-black ${
                  index === currentSlide 
                  ? 'bg-yellow-500 w-20 md:w-32 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-white/30 hover:bg-white w-4'
                }`}
              />
            ))}
          </div>
          <button onClick={nextSlide} className="text-white/40 hover:text-yellow-500 transition-colors hidden md:block"><ChevronRight size={48} /></button>
        </div>
      </div>
    </section>
  );
};

export default CategoryBanner;
