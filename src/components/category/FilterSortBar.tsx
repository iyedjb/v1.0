import { useState } from "react";
import { SlidersHorizontal, ChevronRight, X, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { SiNike, SiAdidas, SiJordan, SiNewbalance, SiPuma, SiReebok, SiFila } from "react-icons/si";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface FilterSortBarProps {
  itemCount: number;
  onFilterChange?: (filters: any) => void;
}

const FilterSortBar = ({ itemCount, onFilterChange }: FilterSortBarProps) => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [freeShipping, setFreeShipping] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const location = useLocation();

  const allBrands = [
    { label: "Todos", href: "/category/all", icon: Grid3X3 },
    { label: "Nike", href: "/category/nike", icon: SiNike },
    { label: "Adidas", href: "/category/adidas", icon: SiAdidas },
    { label: "Jordan", href: "/category/jordan", icon: SiJordan },
    { label: "New Balance", href: "/category/new-balance", icon: SiNewbalance },
    { label: "Puma", href: "/category/puma", icon: SiPuma },
    { label: "Vans", href: "/category/vans", icon: null },
    { label: "Mizuno", href: "/category/mizuno", icon: null },
    { label: "Oakley", href: "/category/oakley", icon: null },
    { label: "Asics", href: "/category/asics", icon: null },
    { label: "Converse", href: "/category/converse", icon: null },
    { label: "Reebok", href: "/category/reebok", icon: SiReebok },
    { label: "Fila", href: "/category/fila", icon: SiFila },
  ];

  const filterBrands = ["Nike", "Adidas", "New Balance", "Puma", "Mizuno", "Oakley", "Vans", "Jordan"];

  const isActiveBrand = (href: string) => {
    return location.pathname === href;
  };

  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        freeShipping,
        brand: selectedBrand
      });
    }
    setOpen(false);
  };

  const handleClearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setFreeShipping(false);
    setSelectedBrand(null);
    if (onFilterChange) {
      onFilterChange({
        minPrice: null,
        maxPrice: null,
        freeShipping: false,
        brand: null
      });
    }
  };

  const activeFiltersCount = [
    selectedBrand,
    minPrice,
    maxPrice,
    freeShipping
  ].filter(Boolean).length;

  return (
    <section className="w-full px-3 md:px-4 mb-2 md:mb-4">
      <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar py-3 md:py-4">
        {allBrands.map((brand) => {
          const IconComponent = brand.icon;
          return (
            <Link
              key={brand.href}
              to={brand.href}
              className={`flex-none flex flex-col items-center gap-1 transition-all group`}
              title={brand.label}
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
                isActiveBrand(brand.href)
                  ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2"
                  : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:scale-105"
              }`}>
                {IconComponent ? (
                  <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <span className="text-[10px] md:text-xs font-black">{brand.label.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className={`text-[9px] md:text-[10px] font-bold transition-all ${
                isActiveBrand(brand.href) ? "text-primary" : "text-gray-500"
              }`}>
                {brand.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 py-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="h-8 md:h-9 rounded-full px-3 md:px-4 border-gray-200 text-[11px] md:text-xs font-bold gap-1.5"
              >
                <SlidersHorizontal size={14} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white border-none">
              <SheetHeader className="p-6 border-b border-gray-100 flex-none">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl font-black uppercase tracking-tight">Filtros</SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <SlidersHorizontal size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700 text-sm">Frete gratis</span>
                        <span className="text-[10px] text-green-600 font-bold uppercase">Acima de R$ 300</span>
                      </div>
                    </div>
                    <Switch checked={freeShipping} onCheckedChange={setFreeShipping} className="data-[state=checked]:bg-green-500" />
                  </div>
                  <Separator className="bg-gray-100" />
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <SlidersHorizontal size={18} />
                      </div>
                      <span className="font-bold text-gray-700 text-sm">Parcelamento sem juros</span>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-black uppercase tracking-tight">Filtrar por Marca</h4>
                  <div className="flex flex-wrap gap-2">
                    {filterBrands.map((brand) => (
                      <Button 
                        key={brand} 
                        variant={selectedBrand === brand ? "default" : "outline"} 
                        className={`rounded-full h-9 px-4 font-bold text-xs ${selectedBrand === brand ? "bg-primary text-primary-foreground" : "border-gray-200 hover:border-primary hover:text-primary hover:bg-primary/5"}`}
                        onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                      >
                        {brand}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-black uppercase tracking-tight">Faixa de Preco</h4>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">MIN</span>
                      <Input 
                        type="number" 
                        placeholder="R$ 0" 
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="h-12 pl-11 bg-gray-50 border-gray-200 rounded-xl font-bold"
                      />
                    </div>
                    <div className="w-3 h-0.5 bg-gray-300"></div>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">MAX</span>
                      <Input 
                        type="number" 
                        placeholder="R$ 999" 
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="h-12 pl-11 bg-gray-50 border-gray-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex items-center gap-3 bg-white flex-none absolute bottom-0 left-0 right-0 z-10">
                <Button variant="outline" className="flex-1 font-bold h-12 rounded-xl" onClick={handleClearFilters}>
                  Limpar
                </Button>
                <Button className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 rounded-xl" onClick={handleApplyFilters}>
                  Ver {itemCount} resultados
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button 
            variant="outline" 
            className={`h-8 md:h-9 rounded-full px-3 md:px-4 border-gray-200 text-[11px] md:text-xs font-bold gap-1.5 ${(minPrice || maxPrice) ? 'bg-primary/10 border-primary text-primary' : ''}`}
            onClick={() => setOpen(true)}
          >
            Preco <ChevronRight size={12} className="rotate-90 opacity-40" />
          </Button>

          {selectedBrand && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[11px] font-bold">
              {selectedBrand}
              <button onClick={() => {
                setSelectedBrand(null);
                if (onFilterChange) {
                  onFilterChange({ minPrice: minPrice ? parseFloat(minPrice) : null, maxPrice: maxPrice ? parseFloat(maxPrice) : null, freeShipping, brand: null });
                }
              }}>
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <p className="text-[9px] md:text-[10px] font-black text-black/40 uppercase tracking-widest flex-none">
          {itemCount} resultados
        </p>
      </div>
    </section>
  );
};

export default FilterSortBar;
