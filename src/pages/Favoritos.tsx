import { Heart, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Favoritos = () => {
  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/mais" className="p-1">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold">Favoritos</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <Heart size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-600">Nenhum favorito ainda</p>
          <p className="text-sm text-gray-400 mb-4">Salve produtos que você gostou</p>
          <Link to="/category/sneakers" className="text-yellow-600 font-bold text-sm">
            EXPLORAR PRODUTOS
          </Link>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Favoritos;
