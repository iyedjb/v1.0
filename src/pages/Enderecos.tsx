import { MapPin, ChevronLeft, Plus, Edit, Trash2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { db } from "@/lib/firebase";
import { ref, onValue, push, set, remove, update } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  cep: string;
  country: string;
  name?: string;
  phone?: string;
  isDefault?: boolean;
}

const Enderecos = () => {
  const [showForm, setShowForm] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    label: "",
    cep: "",
    street: "",
    city: "",
  });

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    const addressesRef = ref(db, `addresses/${user.uid}`);
    const unsubscribe = onValue(addressesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const addressList = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          id: key,
        }));
        setAddresses(addressList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      } else {
        setAddresses([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveAddress = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Faça login para salvar endereços", variant: "destructive" });
      return;
    }
    if (!formData.street || !formData.city || !formData.cep) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      const addressesRef = ref(db, `addresses/${user.uid}`);
      const newAddressRef = push(addressesRef);
      await set(newAddressRef, {
        label: formData.label || "Endereço",
        street: formData.street,
        city: formData.city,
        cep: formData.cep,
        country: "Brasil",
        createdAt: Date.now(),
        isDefault: addresses.length === 0
      });
      toast({ title: "Sucesso", description: "Endereço salvo!" });
      setFormData({ label: "", cep: "", street: "", city: "" });
      setShowForm(false);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar endereço", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await remove(ref(db, `addresses/${user.uid}/${id}`));
      toast({ title: "Sucesso", description: "Endereço removido!" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao remover", variant: "destructive" });
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      for (const addr of addresses) {
        await update(ref(db, `addresses/${user.uid}/${addr.id}`), { isDefault: addr.id === id });
      }
      toast({ title: "Sucesso", description: "Endereço padrão atualizado!" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link to="/mais" className="p-1">
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-lg font-bold">Endereços</h1>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="p-2 bg-yellow-500 rounded-full"
          >
            <Plus size={20} className="text-black" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {showForm && (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold">Novo Endereço</h3>
            <Input 
              placeholder="Nome (ex: Casa, Trabalho)" 
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              className="h-11 rounded-lg" 
            />
            <Input 
              placeholder="CEP" 
              value={formData.cep}
              onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
              className="h-11 rounded-lg" 
            />
            <Input 
              placeholder="Rua, número e complemento" 
              value={formData.street}
              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              className="h-11 rounded-lg" 
            />
            <Input 
              placeholder="Cidade" 
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="h-11 rounded-lg" 
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-lg"
                onClick={() => { setShowForm(false); setFormData({ label: "", cep: "", street: "", city: "" }); }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveAddress}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg"
              >
                Salvar
              </Button>
            </div>
          </div>
        )}

        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{addr.label}</p>
                  {addr.isDefault && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{addr.street}</p>
                <p className="text-sm text-gray-600">{addr.city} - {addr.country}</p>
                <p className="text-xs text-gray-400 mt-1">CEP: {addr.cep}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              {!addr.isDefault && (
                <button 
                  onClick={() => handleSetDefault(addr.id)}
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                >
                  <Check size={14} /> Definir padrão
                </button>
              )}
              <button 
                onClick={() => handleDelete(addr.id)}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && !showForm && (
          <div className="bg-white rounded-xl p-8 text-center">
            <MapPin size={48} className="mx-auto mb-4 text-yellow-500" />
            <p className="font-medium text-gray-600">Nenhum endereço cadastrado</p>
            <p className="text-sm text-gray-400">Seus endereços serão salvos automaticamente ao finalizar uma compra</p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Enderecos;
