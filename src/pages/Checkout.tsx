import { useState, useMemo, useEffect } from "react";
import { Minus, Plus, CreditCard, Trash2, Lock, ChevronLeft, Package, Zap, Shield, Clock, X, ChevronDown, Copy, CheckCheck, QrCode, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CheckoutHeader from "../components/header/CheckoutHeader";
import Footer from "../components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { ref, push, set, get } from "firebase/database";
import { SiVisa, SiMastercard, SiGooglepay, SiApplepay, SiPix } from "react-icons/si";
import { formatPriceFromCents } from "@/lib/utils";

const Checkout = () => {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storeSettings, setStoreSettings] = useState<{freeShipping: boolean, standardShippingCost: number, expressShippingCost: number, overnightShippingCost: number}>({
    freeShipping: false, standardShippingCost: 2500, expressShippingCost: 1500, overnightShippingCost: 3500
  });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => {
      if (s && typeof s === 'object' && !Array.isArray(s)) setStoreSettings(prev => ({ ...prev, ...s }));
    }).catch(() => {});
  }, []);

  const [customerDetails, setCustomerDetails] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    phone: ""
  });
  const [shippingAddress, setShippingAddress] = useState({
    address: "",
    number: "",
    complement: "",
    city: "",
    postalCode: "",
    country: "Brasil"
  });
  const [hasSeparateBilling, setHasSeparateBilling] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Brasil"
  });
  const [shippingOption, setShippingOption] = useState("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [cpf, setCpf] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");
  const [pixData, setPixData] = useState<{pixCode: string, qrCodeImage: string, orderId: string} | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [pixError, setPixError] = useState(false);
  const [copiedPixKey, setCopiedPixKey] = useState(false);
  const MANUAL_PIX_KEY = 'Vuro.com.br@gmail.com';

  useEffect(() => {
    const loadSavedAddress = async () => {
      if (!user?.uid) return;
      try {
        const addressRef = ref(db, `users/${user.uid}/address`);
        const snapshot = await get(addressRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const fullAddress = [
            data.logradouro,
            data.bairro
          ].filter(Boolean).join(", ");
          
          setShippingAddress({
            address: fullAddress,
            number: data.numero || "",
            complement: data.complemento || "",
            city: `${data.cidade}${data.estado ? ` - ${data.estado}` : ""}`,
            postalCode: data.cep || "",
            country: "Brasil"
          });
          
          toast({
            title: "Endereco carregado",
            description: "Usamos seu endereco salvo do perfil.",
          });
        }
      } catch (error) {
        console.error("Error loading saved address:", error);
      }
    };
    
    loadSavedAddress();
  }, [user?.uid]);

  const subtotal = totalPrice;

  const getShippingCost = () => {
    switch (shippingOption) {
      case "express":
        return storeSettings.expressShippingCost;
      case "overnight":
        return storeSettings.overnightShippingCost;
      default:
        return storeSettings.freeShipping ? 0 : storeSettings.standardShippingCost;
    }
  };
  
  const baseShipping = getShippingCost();
  const shipping = baseShipping;
  const cardFee = paymentMethod === "card" ? Math.round(subtotal * 0.03) : 0;
  const total = subtotal + shipping + cardFee;


  const handleCustomerDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
  };

  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique o CEP digitado.", variant: "destructive" });
        return;
      }
      
      setShippingAddress(prev => ({
        ...prev,
        address: `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ""}`,
        city: `${data.localidade} - ${data.uf}`,
        country: "Brasil"
      }));
      
      toast({ title: "Endereço encontrado!", description: `${data.logradouro}, ${data.localidade}` });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleShippingAddressChange = (field: string, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    
    if (field === "postalCode") {
      const cleanCep = value.replace(/\D/g, "");
      if (cleanCep.length === 8) {
        fetchAddressByCep(cleanCep);
      }
    }
  };

  const handleBillingDetailsChange = (field: string, value: string) => {
    setBillingDetails(prev => ({ ...prev, [field]: value }));
  };

  const formatCpf = (value: string) => {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  };

  const handleGeneratePix = async () => {
    if (!customerDetails.email || !customerDetails.email.includes('@')) {
      toast({ title: "Erro", description: "Preencha o email antes de gerar o PIX.", variant: "destructive" });
      return;
    }
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      toast({ title: "Erro", description: "Preencha seu CPF (11 dígitos) para gerar o PIX.", variant: "destructive" });
      return;
    }
    if (!shippingAddress.address || shippingAddress.address.trim().length < 3) {
      toast({ title: "Erro", description: "Preencha o endereço de entrega.", variant: "destructive" });
      return;
    }
    if (!shippingAddress.number || shippingAddress.number.trim().length < 1) {
      toast({ title: "Erro", description: "Preencha o número da casa/apartamento.", variant: "destructive" });
      return;
    }
    if (!shippingAddress.city || shippingAddress.city.trim().length < 2) {
      toast({ title: "Erro", description: "Preencha a cidade.", variant: "destructive" });
      return;
    }
    if (!shippingAddress.postalCode || shippingAddress.postalCode.trim().length < 5) {
      toast({ title: "Erro", description: "Preencha o CEP.", variant: "destructive" });
      return;
    }

    setIsGeneratingPix(true);
    setPixData(null);
    try {
      // 1. Generate PIX QR code
      const pixResponse = await fetch('/api/pagbank/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: total,
          customerName: `${customerDetails.firstName} ${customerDetails.lastName}`.trim() || 'Cliente',
          customerEmail: customerDetails.email,
          customerCpf: cpfClean
        })
      });
      const pixResult = await pixResponse.json();
      if (!pixResponse.ok) throw new Error(pixResult.error || 'Erro ao gerar PIX');

      // 2. Save order with pix_pending status
      const orderItems = items.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        size: item.size,
        color: item.color || '',
        price: item.price,
        quantity: item.quantity
      }));
      const orderData = {
        userId: user?.uid || '',
        userEmail: customerDetails.email,
        customerName: `${customerDetails.firstName} ${customerDetails.lastName}`.trim() || 'Cliente',
        items: orderItems,
        totalAmount: total,
        shippingOption,
        paymentMethod: 'pix',
        pixOrderId: pixResult.orderId,
        status: 'pix_pending',
        shippingInfo: {
          firstName: customerDetails.firstName,
          lastName: customerDetails.lastName,
          address: shippingAddress.address,
          number: shippingAddress.number,
          complement: shippingAddress.complement,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: customerDetails.phone
        }
      };
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      // Notify admin (non-blocking)
      try {
        const notifRef = push(ref(db, "admin_notifications"));
        set(notifRef, {
          type: "new_order",
          title: "🛍️ Novo pedido PIX!",
          message: `${orderData.customerName} — ${formatPriceFromCents(total)} — via PIX`,
          createdAt: Date.now(),
          read: false
        });
      } catch {}

      // 3. Save checkout email so "Meus Pedidos" can find this order
      localStorage.setItem("vuro_checkout_email", customerDetails.email);

      // 4. Show QR code inline and navigate to PIX page
      setPixData({
        pixCode: pixResult.pixCode,
        qrCodeImage: pixResult.qrCodeImage,
        orderId: pixResult.orderId
      });
      setIsGeneratingPix(false);
      clearCart();

      // Navigate to dedicated PIX page
      navigate('/checkout/pix', {
        state: {
          pixCode: pixResult.pixCode,
          qrCodeImage: pixResult.qrCodeImage,
          orderId: pixResult.orderId,
          total,
          items: orderItems,
          customerName: orderData.customerName
        }
      });
    } catch (error: any) {
      console.error('PIX error:', error);
      setPixError(true);
      setIsGeneratingPix(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.pixCode) return;
    navigator.clipboard.writeText(pixData.pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCompleteOrder = async () => {
    if (items.length === 0) return;
    
    // Validate required fields
    if (!customerDetails.email || !customerDetails.email.includes('@')) {
      toast({ title: "Erro", description: "Por favor, preencha um email válido.", variant: "destructive" });
      return;
    }
    if (!shippingAddress.address || shippingAddress.address.trim().length < 3) {
      toast({ title: "Erro", description: "Por favor, preencha o endereço.", variant: "destructive" });
      return;
    }
    if (!shippingAddress.number || shippingAddress.number.trim().length < 1) {
      toast({ title: "Erro", description: "Por favor, preencha o número da casa/apartamento.", variant: "destructive" });
      return;
    }
    if (!shippingAddress.city || shippingAddress.city.trim().length < 2) {
      toast({ title: "Erro", description: "Por favor, preencha a cidade.", variant: "destructive" });
      return;
    }
    if (!shippingAddress.postalCode || shippingAddress.postalCode.trim().length < 5) {
      toast({ title: "Erro", description: "Por favor, preencha o CEP.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Save address to user's account if logged in (non-blocking — don't let Firebase failure stop checkout)
      if (user) {
        try {
          const addressesRef = ref(db, `addresses/${user.uid}`);
          const newAddressRef = push(addressesRef);
          await Promise.race([
            set(newAddressRef, {
              label: "Endereço de Entrega",
              street: shippingAddress.address,
              number: shippingAddress.number,
              complement: shippingAddress.complement,
              city: shippingAddress.city,
              cep: shippingAddress.postalCode,
              country: shippingAddress.country,
              name: `${customerDetails.firstName} ${customerDetails.lastName}`.trim(),
              phone: customerDetails.phone,
              createdAt: Date.now(),
              isDefault: true
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 3000))
          ]);
        } catch {
          // Firebase unavailable — continue to payment anyway
        }
      }

      // Card payment - use Stripe Checkout
      const response = await fetch('/api/checkout/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(item => ({
              productId: item.productId,
              size: item.size,
              color: item.color || '',
              quantity: item.quantity
            })),
            customerEmail: customerDetails.email,
            shippingOption: shippingOption,
            isFirstPurchase: false,
            shippingInfo: {
              firstName: customerDetails.firstName,
              lastName: customerDetails.lastName,
              address: shippingAddress.address,
              number: shippingAddress.number,
              complement: shippingAddress.complement,
              city: shippingAddress.city,
              postalCode: shippingAddress.postalCode,
              country: shippingAddress.country
            }
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar sessão de pagamento');
        }

        // Save cart items and customer info to localStorage before redirecting
        localStorage.setItem('vuro_cart_items', JSON.stringify(items));
        localStorage.setItem('vuro_checkout_info', JSON.stringify({
          firstName: customerDetails.firstName,
          lastName: customerDetails.lastName,
          phone: customerDetails.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
        }));
        
        // Redirect to Stripe Checkout
        if (data.url) {
          // If running inside an iframe (e.g. Replit preview), open in new tab
          if (window !== window.top) {
            window.open(data.url, '_blank');
          } else {
            window.location.href = data.url;
          }
        } else {
          throw new Error('URL de pagamento não recebida');
        }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setIsProcessing(false);
      toast({
        title: "Erro no Checkout",
        description: error.message || "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />

      {/* Mobile order summary accordion */}
      <div className="lg:hidden bg-zinc-950 border-b border-zinc-800">
        <button
          onClick={() => setShowMobileSummary(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5"
          data-testid="button-mobile-order-summary"
        >
          <div className="flex items-center gap-2">
            <Package size={14} className="text-yellow-400" />
            <span className="text-sm font-semibold text-white">
              {items.length} {items.length === 1 ? "item" : "itens"} no pedido
            </span>
            <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${showMobileSummary ? "rotate-180" : ""}`} />
          </div>
          <span className="text-base font-black text-yellow-400">{formatPriceFromCents(total)}</span>
        </button>
        {showMobileSummary && (
          <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
            {items.map(item => (
              <div key={item.id} className="flex gap-3 pt-3">
                <div className="w-14 h-14 bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white line-clamp-1">{item.name}</p>
                  {item.size && <p className="text-[11px] text-zinc-500">Tam: {item.size}</p>}
                  <p className="text-xs font-black text-yellow-400 mt-1">{formatPriceFromCents(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Frete</span>
                <span>{shipping === 0 ? "Grátis" : formatPriceFromCents(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-zinc-800">
                <span>Total</span>
                <span className="text-yellow-400">{formatPriceFromCents(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="pt-0 sm:pt-6 pb-24 sm:pb-12">
        <div className="max-w-7xl mx-auto px-0 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 sm:gap-8">
            
            {/* Resumo do Pedido - Hidden on mobile */}
            <div className="hidden lg:block lg:col-span-1 lg:order-2">
              <div className="bg-muted/20 p-4 sm:p-8 rounded-lg sticky top-6">
                <h2 className="text-base sm:text-lg font-light text-foreground mb-4 sm:mb-6">Resumo do Pedido</h2>
                
                <div className="space-y-4 sm:space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 sm:gap-4">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-light text-foreground">{item.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.size && (
                            <p className="text-xs text-muted-foreground">Tam: {item.size}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0 rounded-lg border-muted-foreground/20"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium text-foreground min-w-[2ch] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0 rounded-lg border-muted-foreground/20"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-foreground font-medium">
                          {formatPriceFromCents(Number(item.price) * (Number(item.quantity) || 0))}
                        </span>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (

                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Sua sacola está vazia</p>
                      <Button asChild variant="outline" className="rounded-lg w-full">
                        <a href="/">Continuar Comprando</a>
                      </Button>
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <>
                  <div className="border-t border-muted-foreground/20 mt-4 pt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">
                        {formatPriceFromCents(subtotal)}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frete ({shippingOption === 'standard' ? 'Padrão' : shippingOption === 'express' ? 'Expresso' : 'Amanhã'})</span>
                        <span className="text-foreground">
                          {formatPriceFromCents(shipping)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-muted-foreground/10">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground text-xl">
                        {formatPriceFromCents(total)}
                      </span>
                    </div>
                  </div>

                  </>
                )}
              </div>
            </div>

            {/* Coluna Esquerda - Formulários */}
            <div className="lg:col-span-2 lg:order-1 space-y-0 sm:space-y-6">

              {/* STEP 1 — Dados Pessoais */}
              <div className="bg-background sm:bg-muted/20 sm:rounded-xl px-4 sm:px-8 py-6 sm:py-8 border-b sm:border-b-0 border-border/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-black">1</span>
                  </div>
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Dados Pessoais</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      E-mail *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => handleCustomerDetailsChange("email", e.target.value)}
                      className="mt-2 rounded-xl h-12 text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Nome *
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={customerDetails.firstName}
                        onChange={(e) => handleCustomerDetailsChange("firstName", e.target.value)}
                        className="mt-2 rounded-xl h-12 text-sm"
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Sobrenome *
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={customerDetails.lastName}
                        onChange={(e) => handleCustomerDetailsChange("lastName", e.target.value)}
                        className="mt-2 rounded-xl h-12 text-sm"
                        placeholder="Sobrenome"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerDetails.phone}
                        onChange={(e) => handleCustomerDetailsChange("phone", e.target.value)}
                        className="mt-2 rounded-xl h-12 text-sm"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        CPF <span className="text-[#32BCAD] normal-case font-normal">(PIX)</span>
                      </Label>
                      <Input
                        id="cpf"
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(formatCpf(e.target.value))}
                        className="mt-2 rounded-xl h-12 text-sm"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        data-testid="input-cpf"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2 — Endereço */}
              <div className="bg-background sm:bg-muted/20 sm:rounded-xl px-4 sm:px-8 py-6 sm:py-8 border-b sm:border-b-0 border-border/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-black">2</span>
                  </div>
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Endereço de Entrega</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shippingAddress" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Endereço *
                    </Label>
                    <Input
                      id="shippingAddress"
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => handleShippingAddressChange("address", e.target.value)}
                      className="mt-2 rounded-xl h-12 text-sm"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="shippingNumber" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Número *
                      </Label>
                      <Input
                        id="shippingNumber"
                        type="text"
                        value={shippingAddress.number}
                        onChange={(e) => handleShippingAddressChange("number", e.target.value)}
                        className="mt-2 rounded-xl h-12 text-sm"
                        placeholder="123, Apto 4B..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingComplement" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Complemento
                      </Label>
                      <Input
                        id="shippingComplement"
                        type="text"
                        value={shippingAddress.complement}
                        onChange={(e) => handleShippingAddressChange("complement", e.target.value)}
                        className="mt-2 rounded-xl h-12 text-sm"
                        placeholder="Bloco, empresa..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="shippingPostalCode" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        CEP * {isLoadingCep && <span className="text-yellow-500 normal-case font-normal text-[10px] ml-1">Buscando...</span>}
                      </Label>
                      <Input
                        id="shippingPostalCode"
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => handleShippingAddressChange("postalCode", e.target.value)}
                        className="mt-2 rounded-xl h-12 text-sm"
                        placeholder="00000-000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shippingCity" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Cidade *
                      </Label>
                      <Input
                        id="shippingCity"
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => handleShippingAddressChange("city", e.target.value)}
                        className="mt-2 rounded-xl h-12 text-sm"
                        placeholder="Cidade"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="shippingCountry" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      País *
                    </Label>
                    <Input
                      id="shippingCountry"
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) => handleShippingAddressChange("country", e.target.value)}
                      className="mt-2 rounded-xl h-12 text-sm"
                      placeholder="Brasil"
                    />
                  </div>
                </div>

                  <div className="mt-4 pt-4 border-t border-border/30">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="separateBilling"
                        checked={hasSeparateBilling}
                        onCheckedChange={(checked) => setHasSeparateBilling(checked === true)}
                      />
                      <Label 
                        htmlFor="separateBilling" 
                        className="text-sm font-light text-foreground cursor-pointer"
                      >
                        Endereço de cobrança diferente
                      </Label>
                    </div>
                  </div>

                  {hasSeparateBilling && (
                    <div className="space-y-6 pt-4">
                      <h3 className="text-base font-light text-foreground">Detalhes de Cobrança</h3>
                      <div>
                        <Label htmlFor="billingEmail" className="text-sm font-light text-foreground">
                          E-mail *
                        </Label>
                        <Input
                          id="billingEmail"
                          type="email"
                          value={billingDetails.email}
                          onChange={(e) => handleBillingDetailsChange("email", e.target.value)}
                          className="mt-2 rounded-lg"
                          placeholder="E-mail de cobrança"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingFirstName" className="text-sm font-light text-foreground">
                            Nome *
                          </Label>
                          <Input
                            id="billingFirstName"
                            type="text"
                            value={billingDetails.firstName}
                            onChange={(e) => handleBillingDetailsChange("firstName", e.target.value)}
                            className="mt-2 rounded-lg"
                            placeholder="Nome"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingLastName" className="text-sm font-light text-foreground">
                            Sobrenome *
                          </Label>
                          <Input
                            id="billingLastName"
                            type="text"
                            value={billingDetails.lastName}
                            onChange={(e) => handleBillingDetailsChange("lastName", e.target.value)}
                            className="mt-2 rounded-lg"
                            placeholder="Sobrenome"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="billingPhone" className="text-sm font-light text-foreground">
                          Telefone
                        </Label>
                        <Input
                          id="billingPhone"
                          type="tel"
                          value={billingDetails.phone}
                          onChange={(e) => handleBillingDetailsChange("phone", e.target.value)}
                          className="mt-2 rounded-lg"
                          placeholder="Telefone de cobrança"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingAddress" className="text-sm font-light text-foreground">
                          Endereço *
                        </Label>
                        <Input
                          id="billingAddress"
                          type="text"
                          value={billingDetails.address}
                          onChange={(e) => handleBillingDetailsChange("address", e.target.value)}
                          className="mt-2 rounded-lg"
                          placeholder="Rua, número e complemento"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingCity" className="text-sm font-light text-foreground">
                            Cidade *
                          </Label>
                          <Input
                            id="billingCity"
                            type="text"
                            value={billingDetails.city}
                            onChange={(e) => handleBillingDetailsChange("city", e.target.value)}
                            className="mt-2 rounded-lg"
                            placeholder="Cidade"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingPostalCode" className="text-sm font-light text-foreground">
                            CEP *
                          </Label>
                          <Input
                            id="billingPostalCode"
                            type="text"
                            value={billingDetails.postalCode}
                            onChange={(e) => handleBillingDetailsChange("postalCode", e.target.value)}
                            className="mt-2 rounded-lg"
                            placeholder="00000-000"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="billingCountry" className="text-sm font-light text-foreground">
                          País *
                        </Label>
                        <Input
                          id="billingCountry"
                          type="text"
                          value={billingDetails.country}
                          onChange={(e) => handleBillingDetailsChange("country", e.target.value)}
                          className="mt-2 rounded-lg"
                          placeholder="País"
                        />
                      </div>
                    </div>
                  )}
              </div>

              {/* STEP 3 — Pagamento */}
              <div className="bg-background sm:bg-muted/20 sm:rounded-xl px-4 sm:px-8 py-6 sm:py-8 space-y-4 sm:space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-black">3</span>
                  </div>
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Resumo e Pagamento</h2>
                </div>


                <div className="rounded-xl border border-border/40 overflow-hidden">
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatPriceFromCents(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span className="text-foreground">{shipping === 0 ? "Grátis" : formatPriceFromCents(shipping)}</span>
                    </div>
                    {paymentMethod === "card" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          Taxa cartão <span className="text-[10px] bg-yellow-400/15 text-yellow-500 font-bold px-1.5 py-0.5 rounded">3%</span>
                        </span>
                        <span className="text-yellow-500 font-semibold">+{formatPriceFromCents(cardFee)}</span>
                      </div>
                    )}
                    {paymentMethod === "pix" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          Taxa PIX <span className="text-[10px] bg-[#32BCAD]/15 text-[#32BCAD] font-bold px-1.5 py-0.5 rounded">0%</span>
                        </span>
                        <span className="text-[#32BCAD] font-semibold">Grátis</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center bg-foreground px-4 py-3">
                    <span className="text-sm font-bold text-background uppercase tracking-wider">Total</span>
                    <span className="text-xl font-black text-yellow-400">{formatPriceFromCents(total)}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2">Forma de pagamento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Card Tab */}
                    <button
                      onClick={() => setPaymentMethod("card")}
                      data-testid="tab-payment-card"
                      className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                        paymentMethod === "card"
                          ? "border-yellow-400 bg-yellow-400/10"
                          : "border-border/40 bg-muted/20 hover:border-border"
                      }`}
                    >
                      {paymentMethod === "card" && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                          <span className="text-[8px] font-black text-black">✓</span>
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <div className="bg-white rounded px-1 py-0.5 h-5 flex items-center">
                          <SiVisa className="h-3 w-auto text-[#1A1F71]" />
                        </div>
                        <div className="bg-white rounded px-1 py-0.5 h-5 flex items-center">
                          <SiMastercard className="h-3 w-3 text-[#EB001B]" />
                        </div>
                        <div className="bg-white rounded px-1 py-0.5 h-5 flex items-center">
                          <SiGooglepay className="h-3 w-auto text-[#4285F4]" />
                        </div>
                        <div className="bg-white rounded px-1 py-0.5 h-5 flex items-center">
                          <SiApplepay className="h-3 w-auto text-black" />
                        </div>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-wide ${paymentMethod === "card" ? "text-yellow-500" : "text-muted-foreground"}`}>
                        Cartão
                      </span>
                      <span className="text-[9px] font-bold text-yellow-600/70 bg-yellow-400/10 px-1.5 py-0.5 rounded-full -mt-1">+ 3% taxa</span>
                    </button>

                    {/* PIX Tab */}
                    <button
                      onClick={() => setPaymentMethod("pix")}
                      data-testid="tab-payment-pix"
                      className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                        paymentMethod === "pix"
                          ? "border-[#32BCAD] bg-[#32BCAD]/10"
                          : "border-border/40 bg-muted/20 hover:border-border"
                      }`}
                    >
                      {paymentMethod === "pix" && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#32BCAD] flex items-center justify-center">
                          <span className="text-[8px] font-black text-white">✓</span>
                        </span>
                      )}
                      <div className="bg-white rounded px-2 py-0.5 h-5 flex items-center gap-1">
                        <SiPix className="h-3 w-3 text-[#32BCAD]" />
                        <span className="text-[8px] font-black text-[#32BCAD] tracking-wide">PIX</span>
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-wide ${paymentMethod === "pix" ? "text-[#32BCAD]" : "text-muted-foreground"}`}>
                        PIX
                      </span>
                      <span className="text-[9px] font-bold text-[#32BCAD]/80 bg-[#32BCAD]/10 px-1.5 py-0.5 rounded-full -mt-1">Sem taxa</span>
                    </button>
                  </div>
                </div>

                {/* Card Payment Panel */}
                {paymentMethod === "card" && (
                  <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-yellow-500" />
                      <p className="text-sm font-black text-foreground uppercase tracking-wide">Cartão de crédito</p>
                    </div>
                    <p className="text-muted-foreground text-[11px]">Visa, Mastercard, Elo, Amex, Google Pay e Apple Pay. Até 12x. Processado com segurança pelo Stripe.</p>
                    <div className="hidden sm:block">
                      <Button
                        onClick={handleCompleteOrder}
                        disabled={isProcessing || items.length === 0}
                        className="w-full rounded-xl h-14 text-base bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="button-card-payment"
                      >
                        <CreditCard className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{isProcessing ? "Redirecionando..." : `PAGAR • ${formatPriceFromCents(total)}`}</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <p className="text-[10px] text-muted-foreground">Pagamento 100% seguro e criptografado via Stripe</p>
                    </div>
                  </div>
                )}

                {/* PIX Payment Panel */}
                {paymentMethod === "pix" && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                    <div className="px-4 pt-4 pb-4 space-y-3">

                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SiPix className="h-4 w-4 text-[#32BCAD]" />
                          <p className="text-sm font-black text-gray-800 tracking-wide uppercase">Pagar com <span className="text-[#32BCAD]">PIX</span></p>
                        </div>
                        <span className="text-xs font-black text-[#32BCAD] bg-[#32BCAD]/10 border border-[#32BCAD]/20 px-2 py-0.5 rounded-full">{formatPriceFromCents(total)}</span>
                      </div>

                      {/* Benefits */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {["Aprovação imediata", "Sem taxa adicional", "QR Code válido por 24h"].map(b => (
                          <span key={b} className="flex items-center gap-1 text-[10px] text-gray-500">
                            <span className="w-3.5 h-3.5 rounded-full bg-[#32BCAD]/20 text-[#32BCAD] flex items-center justify-center text-[8px] font-black">✓</span>
                            {b}
                          </span>
                        ))}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100" />

                      {pixError ? (
                        /* Error fallback — show manual key */
                        <div className="space-y-2">
                          <p className="text-gray-500 text-[11px]">Copie a chave e envie o valor exato pelo seu banco:</p>
                          <div className="flex gap-2 items-center">
                            <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 text-[12px] text-gray-700 font-mono truncate">
                              {MANUAL_PIX_KEY}
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(MANUAL_PIX_KEY); setCopiedPixKey(true); setTimeout(() => setCopiedPixKey(false), 3000); }} data-testid="button-copy-pix-key"
                              className="flex items-center gap-1 px-3 py-2.5 bg-[#32BCAD] hover:bg-[#28a59a] rounded-lg text-white text-xs font-black transition-all whitespace-nowrap">
                              {copiedPixKey ? <><CheckCheck className="h-3.5 w-3.5" /> Copiado!</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                            </button>
                          </div>
                          <p className="text-gray-400 text-[10px]">Chave tipo: E-mail</p>
                          <button onClick={() => { setPixError(false); handleGeneratePix(); }} className="text-[#32BCAD] text-[10px] hover:underline">
                            Tentar gerar QR Code novamente
                          </button>
                        </div>
                      ) : pixData ? (
                        /* QR Code generated */
                        <div className="flex flex-col items-center gap-3">
                          <div className="bg-white rounded-2xl p-3 shadow-md border border-gray-100">
                            {pixData.qrCodeImage
                              ? <img src={pixData.qrCodeImage} alt="QR Code PIX" className="w-44 h-44" />
                              : <div className="w-44 h-44 flex items-center justify-center text-gray-400 text-xs text-center">QR Code indisponível</div>
                            }
                          </div>
                          <div className="text-center">
                            <p className="text-[#32BCAD] text-xs font-black uppercase tracking-wide">Escaneie com o app do banco</p>
                            <p className="text-gray-500 text-[10px] mt-0.5">O valor {formatPriceFromCents(total)} já está preenchido</p>
                          </div>
                          <div className="w-full">
                            <p className="text-gray-400 text-[10px] mb-1.5">ou copie o código PIX copia e cola:</p>
                            <div className="flex gap-2">
                              <div className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-500 truncate font-mono">
                                {pixData.pixCode?.slice(0, 38)}...
                              </div>
                              <button onClick={handleCopyPix} data-testid="button-copy-pix"
                                className="flex items-center gap-1 px-3 py-2 bg-[#32BCAD] hover:bg-[#28a59a] rounded-lg text-white text-xs font-black transition-all whitespace-nowrap">
                                {copiedPix ? <><CheckCheck className="h-3.5 w-3.5" /> Copiado!</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                              </button>
                            </div>
                          </div>
                          <button onClick={() => setPixData(null)} className="text-gray-400 text-[10px] hover:text-gray-600 transition-colors">
                            Gerar novo código
                          </button>
                        </div>
                      ) : (
                        /* Info state — show how it works */
                        <div className="space-y-2">
                          <p className="text-gray-500 text-[11px] leading-relaxed">
                            Clique em <span className="text-[#32BCAD] font-bold">Gerar QR Code</span> para confirmar o pedido e receber o código PIX para pagamento.
                          </p>
                          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                            <div className="bg-[#32BCAD]/15 rounded-lg p-2 flex-shrink-0">
                              <QrCode className="h-5 w-5 text-[#32BCAD]" />
                            </div>
                            <div>
                              <p className="text-gray-800 text-xs font-bold">Chave PIX</p>
                              <p className="text-gray-500 text-[11px] font-mono truncate">{MANUAL_PIX_KEY}</p>
                            </div>
                          </div>
                          {/* Desktop-only generate button */}
                          <div className="hidden sm:block pt-1">
                            <button onClick={handleGeneratePix} disabled={isGeneratingPix} data-testid="button-generate-pix"
                              className="w-full flex items-center justify-center gap-2 rounded-xl h-12 bg-[#32BCAD] hover:bg-[#28a59a] disabled:opacity-60 text-white text-sm font-black transition-all">
                              {isGeneratingPix
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando QR Code...</>
                                : <><QrCode className="h-4 w-4" /> GERAR QR CODE • {formatPriceFromCents(total)}</>
                              }
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </main>

      {/* Sticky mobile pay button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border/40 px-4 py-3">
        {paymentMethod === "card" ? (
          <>
            <button
              onClick={handleCompleteOrder}
              disabled={isProcessing || items.length === 0}
              data-testid="button-card-payment-mobile"
              className="w-full flex items-center justify-center gap-2 rounded-xl h-14 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black text-sm uppercase tracking-wide transition-all"
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{isProcessing ? "Redirecionando..." : `PAGAR COM CARTÃO • ${formatPriceFromCents(total)}`}</span>
            </button>
            <div className="flex items-center gap-1.5 justify-center mt-2">
              <Lock className="h-3 w-3 text-green-600" />
              <p className="text-[10px] text-muted-foreground">Pagamento 100% seguro via Stripe</p>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={pixData ? undefined : handleGeneratePix}
              disabled={isGeneratingPix}
              data-testid="button-pix-payment-mobile"
              className="w-full flex items-center justify-center gap-2 rounded-xl h-14 bg-[#32BCAD] hover:bg-[#28a59a] disabled:opacity-60 text-white font-black text-sm uppercase tracking-wide transition-all"
            >
              {isGeneratingPix
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando QR Code...</>
                : pixData
                  ? <><QrCode className="w-5 h-5" /> QR CODE GERADO — ESCANEIE</>
                  : <><QrCode className="w-5 h-5" /> GERAR QR CODE PIX • {formatPriceFromCents(total)}</>
              }
            </button>
            <div className="flex items-center gap-1.5 justify-center mt-2">
              <SiPix className="h-3 w-3 text-[#32BCAD]" />
              <p className="text-[10px] text-muted-foreground">Aprovação imediata via PIX</p>
            </div>
          </>
        )}
      </div>

      <Footer />

    </div>
  );
};

export default Checkout;