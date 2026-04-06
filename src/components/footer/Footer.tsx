import { Link } from "react-router-dom";
import { MapPin, Mail, Instagram, Facebook } from "lucide-react";
import { SiTiktok } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-b from-gray-900 to-black text-white pt-16 pb-8 px-4 md:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-5">
              <span className="text-4xl md:text-5xl font-black tracking-tighter italic">
                <span className="text-white">V</span>
                <span className="text-yellow-400">uro</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Sneakers autênticos para a cultura. Sem falsificações, sem concessões.
            </p>
            
            <div className="flex gap-3">
              <a href="https://www.instagram.com/vuro.br?igsh=dzZoMGYxMDczdTg5" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover-elevate">
                <Instagram size={20} />
              </a>
              <a href="https://www.tiktok.com/@vuro.store.br" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover-elevate">
                <SiTiktok size={18} />
              </a>
              <a href="https://www.facebook.com/share/1N44qt3Wtb/" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover-elevate">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-yellow-500">Marcas</h4>
            <ul className="space-y-2">
              <li><Link to="/category/nike" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">Nike</Link></li>
              <li><Link to="/category/adidas" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">Adidas</Link></li>
              <li><Link to="/category/jordan" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">Jordan</Link></li>
              <li><Link to="/category/new-balance" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">New Balance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-yellow-500">Ajuda</h4>
            <ul className="space-y-2">
              <li><Link to="/about/size-guide" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">Guia de Tamanhos</Link></li>
              <li><Link to="/about/our-story" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">Sobre Nós</Link></li>
              <li><Link to="/about/customer-care" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">Devoluções</Link></li>
              <li><Link to="/frete-gratis" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">Frete Grátis</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4 text-yellow-500">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">São Paulo, SP</span>
              </li>

              <li className="flex items-center gap-2">
                <Mail size={14} className="text-yellow-500 flex-shrink-0" />
                <a href="mailto:info@loja.vuro.com.br" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors">info@loja.vuro.com.br</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2026 VURO. Todos os direitos reservados.
          </p>
          <div className="flex gap-8">
            <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-yellow-400 transition-colors">
              Privacidade
            </Link>
            <Link to="/terms-of-service" className="text-sm text-gray-500 hover:text-yellow-400 transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
