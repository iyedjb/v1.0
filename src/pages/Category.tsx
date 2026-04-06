import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { useProducts } from "@/hooks/use-products";

const Category = () => {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const { products, loading } = useProducts();
  const [activeFilters, setActiveFilters] = useState<any>({
    minPrice: null,
    maxPrice: null,
    freeShipping: false,
    brand: null
  });

  const filteredProducts = useMemo(() => {
    let result = products;

    // Category/Brand filter from URL
    if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'sneakers') {
      const searchTerm = category.toLowerCase().replace(/-/g, ' ').trim();
      const searchTermNoSpaces = searchTerm.replace(/\s+/g, '');
      
      result = result.filter(p => {
        const brandLower = (p.brand || '').toLowerCase().trim();
        const catLower = (p.category || '').toLowerCase().trim();
        const nameLower = (p.name || '').toLowerCase().trim();
        
        // Flexible matching
        const brandMatch = brandLower.includes(searchTermNoSpaces) || 
                           searchTermNoSpaces.includes(brandLower.replace(/\s+/g, '')) ||
                           brandLower.replace(/\s+/g, '') === searchTermNoSpaces;
        
        const catMatch = catLower.includes(searchTermNoSpaces) || 
                         catLower.replace(/\s+/g, '') === searchTermNoSpaces;
        
        const nameMatch = nameLower.includes(searchTerm) || 
                          nameLower.startsWith(searchTerm) ||
                          nameLower.startsWith(searchTermNoSpaces);
        
        return brandMatch || catMatch || nameMatch;
      });
    }

    // Additional brand filter from sidebar
    if (activeFilters.brand) {
      const brandSearch = activeFilters.brand.toLowerCase().replace(/\s+/g, '');
      result = result.filter(p => {
        const brandLower = (p.brand || '').toLowerCase().replace(/\s+/g, '');
        return brandLower.includes(brandSearch) || brandSearch.includes(brandLower);
      });
    }

    // Free shipping filter (disabled - property not in Product type)
    // if (activeFilters.freeShipping) {
    //   result = result.filter(p => p.freeShipping === true);
    // }

    // Price filters
    if (activeFilters.minPrice !== null) {
      result = result.filter(p => {
        const price = parseFloat(p.price.replace(/[^\d,]/g, '').replace(',', '.'));
        return price >= activeFilters.minPrice;
      });
    }
    if (activeFilters.maxPrice !== null) {
      result = result.filter(p => {
        const price = parseFloat(p.price.replace(/[^\d,]/g, '').replace(',', '.'));
        return price <= activeFilters.maxPrice;
      });
    }

    // Search query
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [products, category, activeFilters, searchParams]);

  const isAllCategory = !category || category.toLowerCase() === 'all';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6">
        <FilterSortBar 
          itemCount={filteredProducts.length}
          onFilterChange={setActiveFilters}
        />
        
        <ProductGrid products={filteredProducts} loading={loading} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Category;