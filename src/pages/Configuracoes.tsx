import { Settings, ChevronLeft, ChevronRight, Bell, Moon, Globe, Shield, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";

const Configuracoes = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const settings = [
    { 
      section: "Preferências",
      items: [
        { icon: Bell, label: "Notificações push", toggle: true, value: notifications, onChange: setNotifications },
        { icon: Moon, label: "Modo escuro", toggle: true, value: darkMode, onChange: setDarkMode },
        { icon: Globe, label: "Idioma", value: "Português (BR)", link: true },
      ]
    },
    { 
      section: "Segurança",
      items: [
        { icon: Shield, label: "Alterar senha", link: true },
        { icon: Smartphone, label: "Verificação em 2 etapas", link: true },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/mais" className="p-1">
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold">Configurações</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {settings.map((group, idx) => (
          <div key={idx}>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {group.section}
            </h2>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              {group.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b last:border-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <item.icon size={20} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    {item.value && typeof item.value === 'string' && (
                      <p className="text-xs text-gray-500">{item.value}</p>
                    )}
                  </div>
                  {item.toggle ? (
                    <Switch 
                      checked={item.value as boolean} 
                      onCheckedChange={item.onChange}
                    />
                  ) : item.link ? (
                    <ChevronRight size={20} className="text-gray-400" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4">
          <p className="text-center text-xs text-gray-400">
            VURO v1.0.0
          </p>
          <p className="text-center text-xs text-gray-400 mt-1">
            Feito com amor no Brasil
          </p>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Configuracoes;
